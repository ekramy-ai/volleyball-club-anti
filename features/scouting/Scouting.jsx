// features/scouting/Scouting.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../src/lib/supabase";

const SKILLS = [
  { db: "serve",     en: "Serve",     ar: "إرسال",    color: "bg-yellow-600" },
  { db: "reception", en: "Reception", ar: "استقبال",  color: "bg-blue-600" },
  { db: "set",       en: "Set",       ar: "إعداد",     color: "bg-purple-600" },
  { db: "attack",    en: "Attack",    ar: "هجوم",     color: "bg-red-600" },
  { db: "block",     en: "Block",     ar: "صد",       color: "bg-green-600" },
  { db: "dig",       en: "Dig",       ar: "دفاع",     color: "bg-teal-600" },
  { db: "free_ball", en: "Free Ball", ar: "كرة حرة",  color: "bg-gray-600" },
];

const RESULTS = [
  { db: "error",    en: "Error ❌",    ar: "خطأ ❌",      color: "bg-red-600", val: -1 },
  { db: "negative", en: "Negative ➖", ar: "سلبي ➖",     color: "bg-orange-600", val: -0.5 },
  { db: "neutral",  en: "Neutral ○",  ar: "محايد ○",     color: "bg-gray-600", val: 0 },
  { db: "positive", en: "Positive ➕", ar: "إيجابي ➕",    color: "bg-blue-600", val: 0.5 },
  { db: "point",    en: "Point ⭐",    ar: "نقطة ⭐",     color: "bg-green-600", val: 1 },
];

export default function Scouting() {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";

  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [events, setEvents] = useState([]);

  const [matchId, setMatchId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [skill, setSkill] = useState("attack");
  const [result, setResult] = useState("point");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Load context data
  useEffect(() => {
    async function loadContext() {
      setLoading(true);
      try {
        const [mRes, pRes] = await Promise.all([
          supabase.from("matches").select("id, competition, teams(name)").order("match_date", { ascending: false }).limit(10),
          supabase.from("players").select("id, full_name, jersey_number").order("jersey_number", { ascending: true })
        ]);
        if (mRes.error) throw mRes.error;
        if (pRes.error) throw pRes.error;
        
        setMatches(mRes.data || []);
        setPlayers(pRes.data || []);
        if (mRes.data?.length > 0) setMatchId(mRes.data[0].id);
      } catch (err) { setError(err.message); } finally { setLoading(false); }
    }
    loadContext();
  }, []);

  // 2. Load events
  const loadEvents = useCallback(async () => {
    if (!matchId) return;
    try {
      const { data, error: err } = await supabase
        .from("scouting_events")
        .select("*, players(id, full_name, jersey_number)")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });
      if (err) throw err;
      setEvents(data || []);
    } catch (err) { console.error(err); }
  }, [matchId]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // 3. Add event
  const addEvent = async () => {
    if (!matchId || !playerId) { alert(isAR ? "اختر المباراة واللاعب أولاً" : "Select match and player first"); return; }
    setIsSubmitting(true);
    try {
      const { data, error: err } = await supabase
        .from("scouting_events")
        .insert({ match_id: matchId, player_id: playerId, skill, result })
        .select("*, players(id, full_name, jersey_number)")
        .single();
      if (err) throw err;
      setEvents((prev) => [...prev, data]);
      setPlayerId(""); // reset player to force conscious selection next time
    } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
  };

  const deleteEvent = async (id) => {
    if (!confirm(t("common_delete") + "?")) return;
    const { error: err } = await supabase.from("scouting_events").delete().eq("id", id);
    if (!err) setEvents(prev => prev.filter(e => e.id !== id));
  };

  const getLabel = (arr, dbVal) => {
    const item = arr.find(x => x.db === dbVal);
    return item ? (isAR ? item.ar : item.en) : dbVal;
  };

  // --- ANALYTICS CALCULATIONS ---
  const matchInfo = matches.find(m => m.id === matchId);
  
  // Score: Our points = (Our "point") + (Opponent errors - but we only log our team, so "error" means Opponent point)
  const ourScore = events.filter(e => e.result === "point").length;
  const oppScore = events.filter(e => e.result === "error").length;

  // Player Stats Table
  const playerStats = useMemo(() => {
    const stats = {};
    players.forEach(p => {
      stats[p.id] = { ...p, total: 0, pts: 0, err: 0, attTot: 0, attPts: 0, attErr: 0, recTot: 0, recPos: 0, srvTot: 0, srvErr: 0 };
    });

    events.forEach(e => {
      const p = stats[e.player_id];
      if (!p) return;
      p.total++;
      if (e.result === "point") p.pts++;
      if (e.result === "error") p.err++;

      if (e.skill === "attack") {
        p.attTot++;
        if (e.result === "point") p.attPts++;
        if (e.result === "error") p.attErr++;
      }
      if (e.skill === "reception") {
        p.recTot++;
        if (["positive", "point"].includes(e.result)) p.recPos++;
      }
      if (e.skill === "serve") {
        p.srvTot++;
        if (e.result === "error") p.srvErr++;
      }
    });

    // Calculate percentages
    return Object.values(stats)
      .filter(p => p.total > 0) // only show players who have played
      .map(p => ({
        ...p,
        attEff: p.attTot > 0 ? (((p.attPts - p.attErr) / p.attTot) * 100).toFixed(0) + "%" : "-",
        recEff: p.recTot > 0 ? ((p.recPos / p.recTot) * 100).toFixed(0) + "%" : "-"
      }))
      .sort((a, b) => b.pts - a.pts); // sort by points scored
  }, [events, players]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      
      {/* MATCH SELECTOR & LIVE SCOREBOARD */}
      <div className="card bg-gradient-to-br from-gray-900 to-black border-2 border-gray-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 w-full md:w-auto">
            <select value={matchId} onChange={(e) => setMatchId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 font-bold focus:border-red-500 text-lg">
              {matches.map(m => (
                <option key={m.id} value={m.id}>{m.teams?.name || "Unknown"} 🆚 {isAR ? "الخصم" : "Opponent"} ({m.competition || "Friendly"})</option>
              ))}
              {matches.length === 0 && <option value="">{isAR ? "لا توجد مباريات" : "No matches available"}</option>}
            </select>
          </div>

          <div className="flex items-center gap-6 bg-black/50 px-8 py-4 rounded-2xl border border-gray-800 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <div className="text-center">
              <div className="text-xs text-gray-400 font-bold tracking-wider uppercase mb-1">{matchInfo?.teams?.name || (isAR ? "فريقنا" : "Home")}</div>
              <div className="text-5xl font-black text-white">{ourScore}</div>
            </div>
            <div className="text-2xl font-black text-gray-600 mt-4">-</div>
            <div className="text-center">
              <div className="text-xs text-gray-400 font-bold tracking-wider uppercase mb-1">{isAR ? "الخصم" : "Away"}</div>
              <div className="text-5xl font-black text-red-500">{oppScore}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* INPUT PANEL (LEFT) */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          <div className="card border-t-4 border-t-red-600 flex-1">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>🎯</span> {isAR ? "لوحة الإدخال السريع" : "Quick Input Pad"}
            </h2>

            {/* Players Grid */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">{isAR ? "اللاعب (من قام بالحدث؟)" : "Player (Who?)"}</label>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {players.map(p => (
                  <button key={p.id} onClick={() => setPlayerId(p.id)}
                    className={`relative py-3 rounded-xl flex flex-col items-center justify-center transition-all ${
                      playerId === p.id 
                        ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.6)] scale-105 z-10 font-bold ring-2 ring-white" 
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}>
                    <span className="text-lg leading-none mb-1">{p.jersey_number || "?"}</span>
                    <span className="text-[10px] uppercase truncate w-full px-1 text-center opacity-80">{p.full_name?.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Skill & Result Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">{isAR ? "المهارة (ماذا فعل؟)" : "Skill (What?)"}</label>
                <div className="flex flex-col gap-1.5">
                  {SKILLS.map((s) => (
                    <button key={s.db} onClick={() => setSkill(s.db)}
                      className={`py-2 px-3 rounded-lg text-sm font-semibold text-start transition-all border-l-4 ${
                        skill === s.db 
                          ? `bg-gray-800 text-white border-l-white shadow-lg` 
                          : `bg-gray-900/50 text-gray-400 border-l-transparent hover:bg-gray-800 hover:text-gray-200`
                      }`}
                      style={{ borderLeftColor: skill === s.db ? s.color.replace('bg-', '') : 'transparent' }}>
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 rtl:ml-2 rtl:mr-0 ${s.color}`}></span>
                      {isAR ? s.ar : s.en}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">{isAR ? "النتيجة (التقييم)" : "Result (Eval)"}</label>
                <div className="flex flex-col gap-1.5">
                  {RESULTS.map((r) => (
                    <button key={r.db} onClick={() => setResult(r.db)}
                      className={`py-2 px-3 rounded-lg text-sm font-bold text-center transition-all ${
                        result === r.db 
                          ? `${r.color} text-white shadow-lg scale-[1.02] ring-1 ring-white/50` 
                          : "bg-gray-900/50 text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                      }`}>
                      {isAR ? r.ar : r.en}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button onClick={addEvent} disabled={isSubmitting || !matchId || !playerId} 
              className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl font-bold text-lg shadow-[0_10px_20px_rgba(220,38,38,0.3)] disabled:opacity-50 disabled:grayscale transition-all active:scale-95 flex justify-center items-center gap-2">
              <span>{isSubmitting ? "⏳" : "⚡"}</span> 
              {isSubmitting ? (isAR ? "جاري التسجيل..." : "Logging...") : (isAR ? "سجل الحدث بقاعدة البيانات" : "Log Event to Database")}
            </button>
          </div>
        </div>

        {/* ANALYTICS & LOGS (RIGHT) */}
        <div className="xl:col-span-7 flex flex-col gap-6 h-full">
          
          {/* Player Analytics Table */}
          <div className="card flex-1 overflow-hidden flex flex-col">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>📈</span> {isAR ? "تحليل الأداء الفردي المباشر" : "Live Individual Performance"}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="p-3 font-semibold">{isAR ? "اللاعب" : "Player"}</th>
                    <th className="p-3 font-semibold text-center">{isAR ? "نقاط" : "Pts"}</th>
                    <th className="p-3 font-semibold text-center">{isAR ? "أخطاء" : "Err"}</th>
                    <th className="p-3 font-semibold text-center" title="Attack Efficiency">{isAR ? "كفاءة الهجوم" : "Att %"}</th>
                    <th className="p-3 font-semibold text-center" title="Reception Efficiency">{isAR ? "الاستقبال" : "Rec %"}</th>
                    <th className="p-3 font-semibold text-center" title="Serve Errors">{isAR ? "أخطاء إرسال" : "Srv Err"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {playerStats.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500 text-sm">
                        {isAR ? "لم يتم تسجيل أي حدث لهؤلاء اللاعبين بعد." : "No events recorded for these players yet."}
                      </td>
                    </tr>
                  ) : (
                    playerStats.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-gray-800 text-white font-bold flex items-center justify-center text-xs">{p.jersey_number}</span>
                            <span className="text-white text-sm font-medium">{p.full_name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center text-green-400 font-bold">{p.pts}</td>
                        <td className="p-3 text-center text-red-400 font-bold">{p.err}</td>
                        <td className="p-3 text-center text-gray-300 font-mono text-sm">{p.attEff}</td>
                        <td className="p-3 text-center text-gray-300 font-mono text-sm">{p.recEff}</td>
                        <td className="p-3 text-center text-orange-400 font-bold">{p.srvErr}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-time Event Stream */}
          <div className="card h-64 flex flex-col">
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span>📜</span> {isAR ? "سجل الأحداث (شريط المباراة)" : "Match Play-by-Play"}
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
              {[...events].reverse().map((e) => (
                <div key={e.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg p-3 text-sm group hover:border-gray-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-xs font-mono">{new Date(e.created_at).toLocaleTimeString(isAR ? "ar-EG" : "en-GB", { minute: '2-digit', second: '2-digit' })}</span>
                    <span className="font-bold text-white flex items-center gap-1">
                      <span className="text-gray-400">#{e.players?.jersey_number}</span> {e.players?.full_name?.split(" ")[0] || "Unknown"}
                    </span>
                    <span className="text-gray-400 text-xs px-2 py-0.5 rounded bg-gray-800">{getLabel(SKILLS, e.skill)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${RESULTS.find(r => r.db === e.result)?.color || "bg-gray-800"} text-white`}>
                      {getLabel(RESULTS, e.result)}
                    </span>
                    <button onClick={() => deleteEvent(e.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity text-xs p-1">✕</button>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                 <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                   {isAR ? "في انتظار الحدث الأول..." : "Waiting for first event..."}
                 </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
