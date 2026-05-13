// features/scouting/Scouting.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../src/lib/supabase";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const SKILLS = [
  { db: "serve",     en: "Serve",     ar: "إرسال",    color: "bg-yellow-600", chartColor: "#ca8a04" },
  { db: "reception", en: "Reception", ar: "استقبال",  color: "bg-blue-600",   chartColor: "#2563eb" },
  { db: "set",       en: "Set",       ar: "إعداد",     color: "bg-purple-600", chartColor: "#9333ea" },
  { db: "attack",    en: "Attack",    ar: "هجوم",     color: "bg-red-600",    chartColor: "#dc2626" },
  { db: "block",     en: "Block",     ar: "صد",       color: "bg-green-600",  chartColor: "#16a34a" },
  { db: "dig",       en: "Dig",       ar: "دفاع",     color: "bg-teal-600",   chartColor: "#0d9488" },
  { db: "free_ball", en: "Free Ball", ar: "كرة حرة",  color: "bg-gray-600",   chartColor: "#4b5563" },
];

const RESULTS = [
  { db: "error",    en: "Error ❌",    ar: "خطأ ❌",      color: "bg-red-600" },
  { db: "negative", en: "Negative ➖", ar: "سلبي ➖",     color: "bg-orange-600" },
  { db: "neutral",  en: "Neutral ○",  ar: "محايد ○",     color: "bg-gray-600" },
  { db: "positive", en: "Positive ➕", ar: "إيجابي ➕",    color: "bg-blue-600" },
  { db: "point",    en: "Point ⭐",    ar: "نقطة ⭐",     color: "bg-green-600" },
];

// Volleyball zones: Net is top. Front row: 4, 3, 2. Back row: 5, 6, 1
const COURT_ZONES = [4, 3, 2, 5, 6, 1];

export default function Scouting() {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";

  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [events, setEvents] = useState([]);

  // Selections
  const [matchId, setMatchId] = useState("");
  const [court, setCourt] = useState({ 1: null, 2: null, 3: null, 4: null, 5: null, 6: null });
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [skill, setSkill] = useState("attack");
  const [result, setResult] = useState("point");
  
  // UI States
  const [rosterZoneOpen, setRosterZoneOpen] = useState(null); // which zone is currently selecting a player
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Initial Load
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [mRes, pRes] = await Promise.all([
          supabase.from("matches").select("id, competition, teams(name)").order("match_date", { ascending: false }).limit(10),
          supabase.from("players").select("id, full_name, jersey_number").order("jersey_number", { ascending: true })
        ]);
        setMatches(mRes.data || []);
        setPlayers(pRes.data || []);
        if (mRes.data?.length > 0) setMatchId(mRes.data[0].id);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    loadData();
  }, []);

  // 2. Load match events
  const loadEvents = useCallback(async () => {
    if (!matchId) return;
    try {
      const { data } = await supabase
        .from("scouting_events")
        .select("*, players(id, full_name, jersey_number)")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });
      setEvents(data || []);
    } catch (err) { console.error(err); }
  }, [matchId]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // 3. Log Event
  const addEvent = async () => {
    if (!matchId || !selectedPlayerId) {
      alert(isAR ? "يجب اختيار مباراة واختيار لاعب من الملعب!" : "Must select match and a player from the court!");
      return;
    }
    setIsSubmitting(true);
    try {
      // Find what zone the player is in
      let zone_from = null;
      for (const [z, pid] of Object.entries(court)) {
        if (pid === selectedPlayerId) zone_from = Number(z);
      }

      const { data, error } = await supabase
        .from("scouting_events")
        .insert({ match_id: matchId, player_id: selectedPlayerId, skill, result, zone_from })
        .select("*, players(id, full_name, jersey_number)")
        .single();
      
      if (error) throw error;
      setEvents((prev) => [...prev, data]);
      // Optional: don't reset selected player to allow rapid multiple inputs for same player, 
      // but standard workflow resets it.
      setSelectedPlayerId(""); 
    } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
  };

  const deleteEvent = async (id) => {
    if (!confirm(t("common_delete") + "?")) return;
    const { error } = await supabase.from("scouting_events").delete().eq("id", id);
    if (!error) setEvents(prev => prev.filter(e => e.id !== id));
  };

  // Assign player to court
  const assignToCourt = (zone, pId) => {
    setCourt(prev => ({ ...prev, [zone]: pId }));
    setRosterZoneOpen(null);
  };

  // Calculations for Score & Charts
  const matchInfo = matches.find(m => m.id === matchId);
  const ourScore = events.filter(e => e.result === "point").length;
  const oppScore = events.filter(e => e.result === "error").length;

  const playerStats = useMemo(() => {
    const stats = {};
    players.forEach(p => {
      stats[p.id] = { ...p, pts: 0, err: 0, att:0, attPts:0, blk:0, blkPts:0, srv:0, srvPts:0, srvErr:0, rec:0, recPos:0, dig:0 };
    });

    events.forEach(e => {
      const p = stats[e.player_id];
      if (!p) return;
      
      if (e.result === "point") p.pts++;
      if (e.result === "error") p.err++;

      if (e.skill === "attack") { p.att++; if (e.result === "point") p.attPts++; }
      if (e.skill === "block")  { p.blk++; if (e.result === "point") p.blkPts++; }
      if (e.skill === "serve")  { p.srv++; if (e.result === "point") p.srvPts++; if(e.result==="error") p.srvErr++; }
      if (e.skill === "reception") { p.rec++; if (["positive","point"].includes(e.result)) p.recPos++; }
      if (e.skill === "dig") { p.dig++; }
    });

    return Object.values(stats)
      .filter(p => p.pts > 0 || p.att > 0 || p.rec > 0 || p.dig > 0 || p.srv > 0)
      .map(p => ({
        ...p,
        attEff: p.att > 0 ? Math.round((p.attPts / p.att) * 100) + "%" : "-",
        recEff: p.rec > 0 ? Math.round((p.recPos / p.rec) * 100) + "%" : "-"
      }))
      .sort((a, b) => b.pts - a.pts);
  }, [events, players]);

  // Chart Data
  const chartData = useMemo(() => {
    const counts = { serve:0, reception:0, set:0, attack:0, block:0, dig:0, free_ball:0 };
    events.forEach(e => { if (counts[e.skill] !== undefined) counts[e.skill]++; });
    return SKILLS.map(s => ({ name: isAR ? s.ar : s.en, count: counts[s.db], fill: s.chartColor }));
  }, [events, isAR]);

  const pointsData = useMemo(() => {
    let att = 0, blk = 0, srv = 0;
    events.forEach(e => {
      if (e.result === "point") {
        if (e.skill === "attack") att++;
        else if (e.skill === "block") blk++;
        else if (e.skill === "serve") srv++;
      }
    });
    return [
      { name: isAR ? "هجوم" : "Attack", value: att, fill: "#dc2626" },
      { name: isAR ? "صد" : "Block",    value: blk, fill: "#16a34a" },
      { name: isAR ? "إرسال" : "Serve", value: srv, fill: "#ca8a04" },
    ];
  }, [events, isAR]);

  const getLabel = (arr, dbVal) => {
    const item = arr.find(x => x.db === dbVal);
    return item ? (isAR ? item.ar : item.en) : dbVal;
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
      
      {/* HEADER & SCOREBOARD */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-black/40 border border-gray-800 p-4 rounded-2xl">
        <div className="w-full lg:w-1/3">
          <select value={matchId} onChange={(e) => setMatchId(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 font-bold focus:border-red-500">
            {matches.map(m => <option key={m.id} value={m.id}>{m.teams?.name} 🆚 Opponent ({m.competition})</option>)}
          </select>
        </div>
        
        <div className="flex items-center gap-8 px-10 py-3 bg-gradient-to-b from-gray-900 to-black rounded-2xl border-2 border-gray-800 shadow-2xl">
          <div className="text-center">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{matchInfo?.teams?.name || "Home"}</h3>
            <span className="text-6xl font-black text-white leading-none">{ourScore}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-black text-gray-600 mb-1">-</span>
            <span className="badge bg-red-900/50 text-red-400 font-bold px-3 py-1 animate-pulse">LIVE</span>
          </div>
          <div className="text-center">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{isAR ? "الخصم" : "Away"}</h3>
            <span className="text-6xl font-black text-red-500 leading-none">{oppScore}</span>
          </div>
        </div>
        <div className="w-full lg:w-1/3 text-end hidden lg:block">
           <h1 className="text-2xl font-black text-white tracking-wide uppercase bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-white">PRO SCOUTING</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT: COURT LINEUP */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="card flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🏐</span> {isAR ? "تشكيل الملعب" : "Court Lineup"}
              </h2>
              <span className="text-xs text-gray-400">{isAR ? "اضغط على مركز لاختيار لاعب" : "Click zone to assign"}</span>
            </div>
            
            <div className="relative w-full aspect-[1/1] max-w-[400px] mx-auto bg-orange-700/80 border-4 border-white shadow-2xl rounded-sm p-2 grid grid-cols-3 grid-rows-2 gap-2">
              <div className="absolute top-[-4px] left-1/2 w-1.5 h-[102%] bg-white transform -translate-x-1/2 z-10 opacity-70" />
              
              {COURT_ZONES.map(z => {
                const pId = court[z];
                const player = players.find(p => p.id === pId);
                const isSelected = selectedPlayerId === pId && pId !== null;
                
                return (
                  <div key={z} className="relative z-20 flex items-center justify-center">
                    {player ? (
                      <button onClick={() => setSelectedPlayerId(pId)} onDoubleClick={() => setRosterZoneOpen(z)}
                        title={isAR ? "نقرة للاختيار، نقرتين للتغيير" : "Click to select, Double click to change"}
                        className={`w-full h-full rounded-lg flex flex-col items-center justify-center transition-all ${
                          isSelected ? "bg-white text-red-600 shadow-[0_0_20px_rgba(255,255,255,0.8)] scale-105 border-4 border-red-500" : "bg-black/60 text-white hover:bg-black/80"
                        }`}>
                        <span className="text-2xl font-black">{player.jersey_number}</span>
                        <span className="text-[10px] font-bold uppercase truncate w-full text-center px-1">{player.full_name.split(" ")[0]}</span>
                        <span className="absolute top-1 left-1 text-[8px] opacity-50 font-bold">Z{z}</span>
                      </button>
                    ) : (
                      <button onClick={() => setRosterZoneOpen(z)}
                        className="w-full h-full rounded-lg bg-white/10 border-2 border-dashed border-white/30 text-white/50 hover:bg-white/20 transition-all flex flex-col items-center justify-center">
                        <span className="text-2xl">+</span>
                        <span className="text-[10px] uppercase font-bold">Zone {z}</span>
                      </button>
                    )}
                    
                    {/* Roster Dropdown Modal for this zone */}
                    {rosterZoneOpen === z && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-2 max-h-48 overflow-y-auto">
                        <div className="text-xs text-gray-400 mb-2 font-bold px-2">{isAR ? "اختر لاعباً" : "Select Player"}</div>
                        {players.map(p => (
                          <button key={p.id} onClick={() => assignToCourt(z, p.id)}
                            className="w-full text-left px-3 py-2 text-sm text-white hover:bg-red-600 rounded-lg flex gap-2">
                            <span className="font-bold text-gray-400 w-5">{p.jersey_number}</span> {p.full_name}
                          </button>
                        ))}
                        <button onClick={() => assignToCourt(z, null)} className="w-full text-center mt-2 pt-2 border-t border-gray-800 text-xs text-red-400 hover:text-red-300">
                          {isAR ? "إخلاء المركز" : "Clear Zone"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex-1 bg-gray-900 border border-gray-800 rounded-xl p-3 overflow-y-auto">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Bench / Roster</h3>
              <div className="flex flex-wrap gap-2">
                {players.filter(p => !Object.values(court).includes(p.id)).map(p => (
                  <div key={p.id} className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
                    #{p.jersey_number} {p.full_name.split(" ")[0]}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CENTER: INPUT PAD */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="card flex-1 flex flex-col border-t-4 border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.1)]">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2">⚡ {isAR ? "الإدخال السريع" : "Quick Action Pad"}</span>
              {selectedPlayerId && (
                <span className="text-xs bg-red-600 text-white px-2 py-1 rounded font-bold animate-pulse">
                  Target: #{players.find(p => p.id === selectedPlayerId)?.jersey_number}
                </span>
              )}
            </h2>

            <div className="grid grid-cols-2 gap-4 flex-1">
              {/* SKILLS */}
              <div className="flex flex-col gap-2">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center mb-1">{isAR ? "المهارة" : "Skill"}</div>
                {SKILLS.map((s) => (
                  <button key={s.db} onClick={() => setSkill(s.db)}
                    className={`flex-1 rounded-xl text-sm font-bold transition-all border-l-4 flex items-center px-3 ${
                      skill === s.db ? `bg-gray-800 text-white border-l-white shadow-lg` : `bg-gray-900/50 text-gray-400 border-l-transparent hover:bg-gray-800 hover:text-white`
                    }`}
                    style={{ borderLeftColor: skill === s.db ? s.chartColor : 'transparent' }}>
                    <span className="w-3 h-3 rounded-full mr-2 rtl:ml-2 rtl:mr-0" style={{ backgroundColor: s.chartColor }}></span>
                    {isAR ? s.ar : s.en}
                  </button>
                ))}
              </div>

              {/* RESULTS */}
              <div className="flex flex-col gap-2">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center mb-1">{isAR ? "التقييم" : "Result"}</div>
                {RESULTS.map((r) => (
                  <button key={r.db} onClick={() => setResult(r.db)}
                    className={`flex-1 rounded-xl text-sm font-bold transition-all flex items-center justify-center ${
                      result === r.db ? `${r.color} text-white shadow-lg scale-[1.02] ring-2 ring-white/30` : "bg-gray-900/50 text-gray-500 hover:bg-gray-800 hover:text-white"
                    }`}>
                    {isAR ? r.ar : r.en}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={addEvent} disabled={isSubmitting || !selectedPlayerId} 
              className="mt-6 w-full py-5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-xl tracking-wider uppercase shadow-[0_10px_20px_rgba(220,38,38,0.4)] disabled:opacity-30 disabled:grayscale transition-all active:scale-95 flex items-center justify-center gap-2">
              {isSubmitting ? "..." : (isAR ? "تأكيد وتسجيل" : "LOG EVENT")}
            </button>
          </div>
        </div>

        {/* RIGHT: LIVE CHARTS & TABLE */}
        <div className="lg:col-span-4 flex flex-col gap-4 h-[600px] lg:h-auto">
          {/* Charts Area */}
          <div className="card h-64 flex items-center justify-center p-2 relative">
            <div className="absolute top-3 left-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{isAR ? "توزيع المهارات" : "Skills Usage"}</div>
            {events.length === 0 ? <span className="text-gray-600 text-sm">{isAR ? "لا توجد بيانات للرسم" : "No data for chart"}</span> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: '#1f2937' }} contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="count" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Event Log */}
          <div className="card flex-1 flex flex-col overflow-hidden">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">{isAR ? "شريط الأحداث المباشر" : "Play by Play Stream"}</h2>
            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
              {[...events].reverse().map((e) => (
                <div key={e.id} className="bg-gray-900 border-l-4 rounded p-2.5 text-sm flex items-center justify-between group hover:bg-gray-800 transition-colors"
                     style={{ borderLeftColor: SKILLS.find(s=>s.db===e.skill)?.chartColor }}>
                  <div>
                    <span className="font-bold text-white">#{e.players?.jersey_number} {e.players?.full_name?.split(" ")[0]}</span>
                    <span className="text-gray-400 text-xs ml-2 rtl:mr-2">{getLabel(SKILLS, e.skill)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${RESULTS.find(r=>r.db===e.result)?.color || "bg-gray-700"} text-white`}>
                      {getLabel(RESULTS, e.result)}
                    </span>
                    <button onClick={() => deleteEvent(e.id)} className="opacity-0 group-hover:opacity-100 text-red-500 text-xs">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FULL WIDTH BOTTOM: DETAILED ANALYTICS TABLE */}
      <div className="card w-full overflow-hidden">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>📊</span> {isAR ? "التحليل الإحصائي الشامل للاعبين" : "Comprehensive Player Statistics"}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wider">
                <th className="p-3 font-semibold">{isAR ? "اللاعب" : "Player"}</th>
                <th className="p-3 font-semibold text-center border-l border-gray-800 text-green-400" title="Points Scored">{isAR ? "نقاط" : "PTS"}</th>
                <th className="p-3 font-semibold text-center text-red-400" title="Errors Committed">{isAR ? "أخطاء" : "ERR"}</th>
                <th className="p-3 font-semibold text-center border-l border-gray-800">{isAR ? "هجوم (كفاءة)" : "ATT %"}</th>
                <th className="p-3 font-semibold text-center">{isAR ? "هجوم (نقاط)" : "ATT PTS"}</th>
                <th className="p-3 font-semibold text-center border-l border-gray-800">{isAR ? "استقبال (جيد)" : "REC %"}</th>
                <th className="p-3 font-semibold text-center border-l border-gray-800">{isAR ? "صد (نقاط)" : "BLK PTS"}</th>
                <th className="p-3 font-semibold text-center border-l border-gray-800">{isAR ? "إرسال (أخطاء)" : "SRV ERR"}</th>
                <th className="p-3 font-semibold text-center border-l border-gray-800">{isAR ? "دفاع" : "DIGS"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {playerStats.length === 0 ? (
                <tr><td colSpan="9" className="p-8 text-center text-gray-500">{isAR ? "لا يوجد بيانات" : "No data available"}</td></tr>
              ) : (
                playerStats.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="p-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-gray-800 text-white font-bold flex items-center justify-center text-xs">{p.jersey_number}</span>
                      <span className="text-white text-sm font-medium">{p.full_name}</span>
                    </td>
                    <td className="p-3 text-center text-green-400 font-bold bg-green-900/10 border-l border-gray-800">{p.pts}</td>
                    <td className="p-3 text-center text-red-400 font-bold bg-red-900/10">{p.err}</td>
                    <td className="p-3 text-center text-gray-300 font-mono text-sm border-l border-gray-800">{p.attEff}</td>
                    <td className="p-3 text-center text-gray-400 text-sm">{p.attPts}/{p.att}</td>
                    <td className="p-3 text-center text-gray-300 font-mono text-sm border-l border-gray-800">{p.recEff}</td>
                    <td className="p-3 text-center text-gray-300 text-sm border-l border-gray-800">{p.blkPts}</td>
                    <td className="p-3 text-center text-orange-400 text-sm border-l border-gray-800">{p.srvErr}</td>
                    <td className="p-3 text-center text-teal-400 text-sm border-l border-gray-800">{p.dig}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
