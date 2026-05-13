// features/scouting/Scouting.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../src/lib/supabase";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const SKILLS = [
  { db: "serve",     code: "S", en: "Serve",     ar: "إرسال",    color: "bg-yellow-500" },
  { db: "reception", code: "R", en: "Reception", ar: "استقبال",  color: "bg-blue-500" },
  { db: "set",       code: "E", en: "Set",       ar: "إعداد",     color: "bg-purple-500" },
  { db: "attack",    code: "A", en: "Attack",    ar: "هجوم",     color: "bg-red-500" },
  { db: "block",     code: "B", en: "Block",     ar: "صد",       color: "bg-green-500" },
  { db: "dig",       code: "D", en: "Dig",       ar: "دفاع",     color: "bg-teal-500" },
  { db: "free_ball", code: "F", en: "Free Ball", ar: "كرة حرة",  color: "bg-gray-500" },
];

const RESULTS = [
  { db: "error",    sym: "=", en: "Error",    ar: "خطأ",      color: "bg-red-600 text-white" },
  { db: "negative", sym: "-", en: "Negative", ar: "سلبي",     color: "bg-orange-500 text-white" },
  { db: "neutral",  sym: "/", en: "Neutral",  ar: "محايد",     color: "bg-gray-400 text-black" },
  { db: "positive", sym: "+", en: "Positive", ar: "إيجابي",    color: "bg-blue-500 text-white" },
  { db: "point",    sym: "#", en: "Point",    ar: "نقطة",     color: "bg-green-600 text-white" },
];

// Data Volley standard court zones
const HOME_ZONES = [4, 3, 2, 5, 6, 1]; 
const AWAY_ZONES = [1, 6, 5, 2, 3, 4]; // from perspective of standing behind home court

export default function Scouting() {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";

  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [events, setEvents] = useState([]);

  // Data Volley State
  const [matchId, setMatchId] = useState("");
  const [homeCourt, setHomeCourt] = useState({ 1: null, 2: null, 3: null, 4: null, 5: null, 6: null });
  const [selectedPlayer, setSelectedPlayer] = useState(null); // id
  const [selectedSkill, setSelectedSkill] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [rosterZoneOpen, setRosterZoneOpen] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [mRes, pRes] = await Promise.all([
        supabase.from("matches").select("id, competition, teams(name)").order("match_date", { ascending: false }).limit(10),
        supabase.from("players").select("id, full_name, jersey_number, position").order("jersey_number", { ascending: true })
      ]);
      setMatches(mRes.data || []);
      setPlayers(pRes.data || []);
      if (mRes.data?.length > 0) setMatchId(mRes.data[0].id);
      setLoading(false);
    }
    load();
  }, []);

  const loadEvents = useCallback(async () => {
    if (!matchId) return;
    const { data } = await supabase.from("scouting_events").select("*, players(id, full_name, jersey_number)").eq("match_id", matchId).order("created_at", { ascending: true });
    setEvents(data || []);
  }, [matchId]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // Handle Event Input sequence (Player -> Skill -> Result)
  const handleResultClick = async (res) => {
    if (!matchId) { alert(isAR ? "اختر المباراة" : "Select match"); return; }
    if (!selectedPlayer) { alert(isAR ? "اختر اللاعب أولاً" : "Select player first"); return; }
    if (!selectedSkill) { alert(isAR ? "اختر المهارة أولاً" : "Select skill first"); return; }

    const payload = { match_id: matchId, player_id: selectedPlayer, skill: selectedSkill, result: res };
    const { data, error } = await supabase.from("scouting_events").insert(payload).select("*, players(id, full_name, jersey_number)").single();
    if (!error) {
      setEvents(prev => [...prev, data]);
      // Reset after log
      setSelectedPlayer(null);
      setSelectedSkill(null);
    }
  };

  const undoLast = async () => {
    if (events.length === 0) return;
    const last = events[events.length - 1];
    const { error } = await supabase.from("scouting_events").delete().eq("id", last.id);
    if (!error) setEvents(prev => prev.slice(0, -1));
  };

  const assignToCourt = (zone, pId) => {
    setHomeCourt(prev => ({ ...prev, [zone]: pId }));
    setRosterZoneOpen(null);
  };

  const matchInfo = matches.find(m => m.id === matchId);
  const homeName = matchInfo?.teams?.name || "HOME";
  const awayName = "AWAY";

  const ourScore = events.filter(e => e.result === "point").length;
  const oppScore = events.filter(e => e.result === "error").length;

  const playerStats = useMemo(() => {
    const stats = {};
    players.forEach(p => { stats[p.id] = { ...p, pts:0, err:0, att:0, attPts:0, attErr:0, rec:0, recPos:0, srv:0, srvErr:0 }; });
    events.forEach(e => {
      const p = stats[e.player_id];
      if(!p) return;
      if (e.result === "point") p.pts++;
      if (e.result === "error") p.err++;
      if (e.skill === "attack") { p.att++; if(e.result==="point") p.attPts++; if(e.result==="error") p.attErr++; }
      if (e.skill === "reception") { p.rec++; if(["positive","point"].includes(e.result)) p.recPos++; }
      if (e.skill === "serve") { p.srv++; if(e.result==="error") p.srvErr++; }
    });
    return Object.values(stats).filter(p => p.pts > 0 || p.att > 0 || p.rec > 0 || p.srv > 0).map(p => ({
      ...p,
      attEff: p.att > 0 ? Math.round(((p.attPts - p.attErr) / p.att) * 100) + "%" : "-",
      recEff: p.rec > 0 ? Math.round((p.recPos / p.rec) * 100) + "%" : "-"
    })).sort((a,b)=>b.pts-a.pts);
  }, [events, players]);

  return (
    <div className="min-h-screen bg-[#dcdcdc] text-black font-sans pb-10">
      
      {/* MATCH SELECTOR (Dark Header) */}
      <div className="bg-black p-2 flex items-center justify-between text-white">
        <div className="flex gap-4 items-center">
          <span className="font-bold text-lg px-4">DATA SCOUT</span>
          <select value={matchId} onChange={e => setMatchId(e.target.value)} className="bg-gray-800 text-white rounded px-2 py-1 outline-none text-sm border border-gray-600">
            {matches.map(m => <option key={m.id} value={m.id}>{m.teams?.name} vs Opponent</option>)}
          </select>
        </div>
      </div>

      <div className="p-4 max-w-[1400px] mx-auto">
        
        {/* SCOREBOARD ROW */}
        <div className="flex justify-center items-center gap-4 mb-6">
          <div className="bg-red-600 text-white font-bold text-2xl px-16 py-2 rounded shadow">{homeName}</div>
          <div className="bg-red-600 text-white font-black text-4xl px-4 py-2 rounded shadow">{ourScore}</div>
          <div className="flex flex-col text-gray-500 font-bold items-center leading-none text-xl">
            <span>+</span><span>-</span>
          </div>
          <div className="bg-blue-800 text-white font-black text-4xl px-4 py-2 rounded shadow">{oppScore}</div>
          <div className="bg-blue-800 text-white font-bold text-2xl px-16 py-2 rounded shadow">{awayName}</div>
        </div>

        {/* WORKSPACE */}
        <div className="flex gap-6 items-start">
          
          {/* LEFT: ROSTER */}
          <div className="w-48 flex flex-col gap-1 bg-white p-2 rounded shadow">
            <h3 className="font-bold border-b pb-1 mb-2 text-center">{homeName} Roster</h3>
            {players.map(p => (
              <div key={p.id} className="flex gap-2 items-center text-sm font-semibold cursor-pointer hover:bg-gray-200 p-1 rounded"
                   onClick={() => setSelectedPlayer(p.id)}>
                <span className={`w-6 text-center ${p.position === 'libero' ? 'bg-yellow-300 text-black' : 'text-gray-600'}`}>
                  {p.jersey_number}
                </span>
                <span className={selectedPlayer === p.id ? "text-red-600 font-black" : "text-gray-800"}>{p.full_name.split(" ")[0]}</span>
              </div>
            ))}
          </div>

          {/* CENTER: COURT */}
          <div className="flex flex-col items-center">
            {/* Away Court (Top) */}
            <div className="w-[300px] h-[150px] bg-gray-300 border-2 border-black grid grid-cols-3 grid-rows-2 relative">
              {AWAY_ZONES.map(z => (
                <div key={`away-${z}`} className="flex items-center justify-center relative">
                  <div className="w-12 h-12 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-xl shadow-inner">
                    {z}
                  </div>
                </div>
              ))}
            </div>
            {/* Net */}
            <div className="w-[320px] h-2 bg-black -my-1 z-10"></div>
            {/* Home Court (Bottom) */}
            <div className="w-[300px] h-[150px] bg-gray-300 border-2 border-black grid grid-cols-3 grid-rows-2 relative">
              {HOME_ZONES.map(z => {
                const pId = homeCourt[z];
                const p = players.find(x => x.id === pId);
                const isSel = selectedPlayer === pId && pId !== null;
                return (
                  <div key={`home-${z}`} className="flex items-center justify-center relative">
                    {p ? (
                      <button onClick={() => setSelectedPlayer(p.id)} onDoubleClick={() => setRosterZoneOpen(z)}
                        className={`w-12 h-12 rounded-full font-bold flex items-center justify-center text-xl shadow-lg transition-all border-2 ${
                          isSel ? "bg-white text-blue-900 border-yellow-400 scale-110 ring-4 ring-yellow-400/50" : "bg-blue-900 text-white border-black"
                        }`}>
                        {p.jersey_number}
                      </button>
                    ) : (
                      <button onClick={() => setRosterZoneOpen(z)} className="w-12 h-12 rounded-full bg-white/50 border-2 border-dashed border-gray-500 text-gray-500 font-bold">+</button>
                    )}
                    {rosterZoneOpen === z && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-32 bg-white border border-gray-400 rounded shadow-2xl z-50 p-1">
                        {players.map(pl => (
                          <div key={pl.id} onClick={() => assignToCourt(z, pl.id)} className="text-xs p-1 hover:bg-gray-200 cursor-pointer">#{pl.jersey_number} {pl.full_name.split(" ")[0]}</div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: INPUT PAD & LOG */}
          <div className="flex-1 flex flex-col gap-4">
            
            {/* Input Pad */}
            <div className="bg-white p-4 rounded shadow border border-gray-300">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-700 uppercase tracking-widest text-sm">Action Code Pad</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Target:</span>
                  <span className="font-black text-red-600 text-lg">{selectedPlayer ? `#${players.find(p=>p.id===selectedPlayer)?.jersey_number}` : "—"}</span>
                  <span className="font-black text-blue-600 text-lg">{selectedSkill ? SKILLS.find(s=>s.db===selectedSkill)?.code : "—"}</span>
                </div>
              </div>
              
              <div className="flex gap-4">
                {/* Skills */}
                <div className="grid grid-cols-4 gap-1 flex-1">
                  {SKILLS.map(s => (
                    <button key={s.db} onClick={() => setSelectedSkill(s.db)}
                      className={`py-2 text-sm font-bold border-2 rounded ${selectedSkill === s.db ? "bg-blue-100 border-blue-500 text-blue-800" : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"}`}>
                      {s.code} <span className="text-[10px] block font-normal">{isAR ? s.ar : s.en}</span>
                    </button>
                  ))}
                </div>
                {/* Results */}
                <div className="flex flex-col gap-1 w-24">
                  {RESULTS.map(r => (
                    <button key={r.db} onClick={() => handleResultClick(r.db)}
                      className={`flex-1 font-bold rounded shadow-sm text-lg ${r.color} hover:opacity-80 active:scale-95`}>
                      {r.sym}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live List */}
            <div className="bg-white rounded shadow border border-gray-300 flex-1 overflow-hidden flex flex-col max-h-64">
              <div className="bg-gray-200 p-2 text-xs font-bold flex justify-between items-center border-b border-gray-300">
                <span>CODES LIST</span>
                <button onClick={undoLast} className="bg-white px-2 py-0.5 rounded border border-gray-400 text-gray-700 hover:bg-gray-100">Undo Last</button>
              </div>
              <div className="overflow-y-auto p-1 text-sm font-mono flex-1">
                {[...events].reverse().map(e => {
                  const p = e.players;
                  const s = SKILLS.find(x => x.db === e.skill);
                  const r = RESULTS.find(x => x.db === e.result);
                  const isHome = true; // For now all logged are home
                  return (
                    <div key={e.id} className="flex gap-2 p-1 border-b border-gray-100 hover:bg-blue-50">
                      <span className="w-16 text-gray-400 text-xs">{new Date(e.created_at).toLocaleTimeString([],{minute:'2-digit',second:'2-digit'})}</span>
                      <span className={isHome ? "text-blue-700 font-bold" : "text-red-700 font-bold"}>
                        {isHome ? "*" : "a"}{p?.jersey_number}{s?.code}{r?.sym}
                      </span>
                      <span className="text-gray-600 text-xs ml-4">({p?.full_name?.split(" ")[0]} {s?.en} {r?.en})</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM: ANALYTICS TABLE */}
        <div className="mt-6 bg-white rounded shadow border border-gray-300">
          <div className="bg-gray-200 p-2 text-sm font-bold border-b border-gray-300">MATCH ANALYSIS</div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-700 text-xs uppercase border-b border-gray-300">
              <tr>
                <th className="p-2 border-r border-gray-300">Player</th>
                <th className="p-2 text-center text-green-700">Pts</th>
                <th className="p-2 text-center text-red-700 border-r border-gray-300">Err</th>
                <th className="p-2 text-center">Att Tot</th>
                <th className="p-2 text-center text-blue-700 font-bold">Att %</th>
                <th className="p-2 text-center border-r border-gray-300">Att Err</th>
                <th className="p-2 text-center text-blue-700 font-bold border-r border-gray-300">Rec %</th>
                <th className="p-2 text-center border-r border-gray-300">Srv Err</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {playerStats.map(p => (
                <tr key={p.id} className="hover:bg-blue-50">
                  <td className="p-2 border-r border-gray-300 font-bold">{p.jersey_number} - {p.full_name}</td>
                  <td className="p-2 text-center font-bold text-green-600">{p.pts}</td>
                  <td className="p-2 text-center font-bold text-red-600 border-r border-gray-300">{p.err}</td>
                  <td className="p-2 text-center text-gray-600">{p.att}</td>
                  <td className="p-2 text-center font-bold text-blue-600">{p.attEff}</td>
                  <td className="p-2 text-center text-red-600 border-r border-gray-300">{p.attErr}</td>
                  <td className="p-2 text-center font-bold text-blue-600 border-r border-gray-300">{p.recEff}</td>
                  <td className="p-2 text-center text-orange-600 border-r border-gray-300">{p.srvErr}</td>
                </tr>
              ))}
              {playerStats.length === 0 && <tr><td colSpan="8" className="p-4 text-center text-gray-500">No data</td></tr>}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
