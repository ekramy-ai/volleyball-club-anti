// features/scouting/Scouting.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../src/lib/supabase";

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

const HOME_ZONES = [4, 3, 2, 5, 6, 1]; 
const AWAY_ZONES = [1, 6, 5, 2, 3, 4];

export default function Scouting() {
  const { i18n } = useTranslation();
  const isAR = i18n.language === "ar";

  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [events, setEvents] = useState([]);

  const [matchId, setMatchId] = useState("");
  const [homeCourt, setHomeCourt] = useState({ 1: null, 2: null, 3: null, 4: null, 5: null, 6: null });
  const [selectedPlayer, setSelectedPlayer] = useState(null); 
  const [selectedSkill, setSelectedSkill] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [rosterZoneOpen, setRosterZoneOpen] = useState(null);

  const [rawCodeInput, setRawCodeInput] = useState("");
  const inputRef = useRef(null);

  // 1. Load Matches
  useEffect(() => {
    async function loadMatches() {
      setLoading(true);
      const { data } = await supabase
        .from("matches")
        // we specify teams!home_team_id(name) because matches has a relation to teams table
        .select("id, competition, home_team_id, teams!home_team_id(name)")
        .order("match_date", { ascending: false })
        .limit(15);
      
      setMatches(data || []);
      if (data?.length > 0) setMatchId(data[0].id);
      setLoading(false);
    }
    loadMatches();
  }, []);

  // 2. Load Players dynamically based on the selected match's home_team_id
  useEffect(() => {
    async function loadPlayers() {
      if (!matchId) return;
      const match = matches.find(m => m.id === matchId);
      if (!match || !match.home_team_id) {
        setPlayers([]);
        return;
      }
      const { data } = await supabase
        .from("players")
        .select("id, full_name, jersey_number, position, team_id")
        .eq("team_id", match.home_team_id)
        .order("jersey_number", { ascending: true });
      
      setPlayers(data || []);
      
      // Clear court and selections when match changes
      setHomeCourt({ 1: null, 2: null, 3: null, 4: null, 5: null, 6: null });
      setSelectedPlayer(null);
    }
    loadPlayers();
  }, [matchId, matches]);

  // 3. Load Events
  const loadEvents = useCallback(async () => {
    if (!matchId) return;
    const { data } = await supabase
      .from("scouting_events")
      .select("*, players(id, full_name, jersey_number)")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });
    setEvents(data || []);
  }, [matchId]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // Keep focus on input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (inputRef.current) inputRef.current.focus();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Submit via Button Clicks
  const handleResultClick = async (resDb) => {
    if (!matchId) return alert(isAR ? "اختر المباراة" : "Select match");
    if (!selectedPlayer) return alert(isAR ? "اختر اللاعب أولاً" : "Select player first");
    if (!selectedSkill) return alert(isAR ? "اختر المهارة أولاً" : "Select skill first");

    const p = players.find(x => x.id === selectedPlayer);
    const s = SKILLS.find(x => x.db === selectedSkill);
    const r = RESULTS.find(x => x.db === resDb);
    
    const codeString = `*${p.jersey_number}${s.code}${r.sym}`;

    const payload = { match_id: matchId, player_id: selectedPlayer, skill: selectedSkill, result: resDb, notes: `RAW:${codeString}` };
    const { data, error } = await supabase.from("scouting_events").insert(payload).select("*, players(id, full_name, jersey_number)").single();
    if (!error) {
      setEvents(prev => [...prev, data]);
      setSelectedPlayer(null);
      setSelectedSkill(null);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  // Submit via Text Input
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    if (!matchId) return alert(isAR ? "اختر المباراة" : "Select match");
    
    let code = rawCodeInput.trim().toUpperCase();
    if (!code) return;

    let isHome = true;
    let prefix = '*';
    if (code.startsWith('*')) { isHome = true; code = code.slice(1); }
    else if (code.startsWith('A') || code.startsWith('#')) { isHome = false; prefix = code[0]; code = code.slice(1); }
    else { isHome = true; }

    const match = code.match(/^(\d{1,2})([SREABDF])([=\-/+#])$/);
    if (!match) {
      alert(isAR ? "كود خاطئ. مثال: *12A# أو a5S=" : "Invalid code. Example: *12A# or a5S=");
      return;
    }

    const jersey = parseInt(match[1], 10);
    const skillCode = match[2];
    const resultCode = match[3];

    const s = SKILLS.find(x => x.code === skillCode);
    const r = RESULTS.find(x => x.sym === resultCode);

    if (!s || !r) return alert("Invalid skill or result code");

    let pId = null;
    if (isHome) {
      const p = players.find(x => x.jersey_number === jersey);
      if (p) pId = p.id;
    }

    const finalCodeStr = `${prefix}${jersey}${skillCode}${resultCode}`;
    const payload = { match_id: matchId, player_id: pId, skill: s.db, result: r.db, notes: `RAW:${finalCodeStr}` };
    
    const { data, error } = await supabase.from("scouting_events").insert(payload).select("*, players(id, full_name, jersey_number)").single();
    if (!error) {
      setEvents(prev => [...prev, data]);
      setRawCodeInput("");
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

  let ourScore = 0;
  let oppScore = 0;
  events.forEach(e => {
    const isHome = !e.notes?.startsWith("RAW:A") && !e.notes?.startsWith("RAW:#");
    if (isHome) {
      if (e.result === "point") ourScore++;
      if (e.result === "error") oppScore++;
    } else {
      if (e.result === "point") oppScore++;
      if (e.result === "error") ourScore++;
    }
  });

  const playerStats = useMemo(() => {
    const stats = {};
    
    players.forEach(p => { 
      stats[`HOME_${p.id}`] = { id: p.id, jersey: p.jersey_number, name: p.full_name, isHome: true, pts:0, err:0, att:0, attPts:0, attErr:0, rec:0, recPos:0, srv:0, srvErr:0 }; 
    });

    events.forEach(e => {
      const isHome = !e.notes?.startsWith("RAW:A") && !e.notes?.startsWith("RAW:#");
      
      let pKey;
      let jersey = "?";
      if (isHome && e.player_id) {
        pKey = `HOME_${e.player_id}`;
      } else {
        const match = e.notes?.match(/^RAW:[*A#](\d+)/i);
        if (match) jersey = parseInt(match[1], 10);
        pKey = `AWAY_${jersey}`;
        if (!stats[pKey]) {
          stats[pKey] = { id: pKey, jersey: jersey, name: `Away #${jersey}`, isHome: false, pts:0, err:0, att:0, attPts:0, attErr:0, rec:0, recPos:0, srv:0, srvErr:0 };
        }
      }

      const p = stats[pKey];
      if (!p) return;

      if (e.result === "point") p.pts++;
      if (e.result === "error") p.err++;
      if (e.skill === "attack") { p.att++; if(e.result==="point") p.attPts++; if(e.result==="error") p.attErr++; }
      if (e.skill === "reception") { p.rec++; if(["positive","point"].includes(e.result)) p.recPos++; }
      if (e.skill === "serve") { p.srv++; if(e.result==="error") p.srvErr++; }
    });

    return Object.values(stats)
      .filter(p => p.pts > 0 || p.att > 0 || p.rec > 0 || p.srv > 0)
      .map(p => ({
        ...p,
        attEff: p.att > 0 ? Math.round(((p.attPts - p.attErr) / p.att) * 100) + "%" : "-",
        recEff: p.rec > 0 ? Math.round((p.recPos / p.rec) * 100) + "%" : "-"
      }))
      .sort((a,b)=> {
        if (a.isHome !== b.isHome) return a.isHome ? -1 : 1; 
        return b.pts - a.pts; 
      });
  }, [events, players]);

  return (
    <div className="min-h-screen bg-[#dcdcdc] text-black font-sans pb-10">
      
      <div className="bg-black p-2 flex items-center justify-between text-white">
        <div className="flex gap-4 items-center">
          <span className="font-bold text-lg px-4 text-red-500">DATA SCOUT</span>
          <select value={matchId} onChange={e => setMatchId(e.target.value)} className="bg-gray-800 text-white rounded px-2 py-1 outline-none text-sm border border-gray-600">
            {matches.map(m => <option key={m.id} value={m.id}>{m.teams?.name} vs Opponent</option>)}
          </select>
        </div>
        <div className="text-xs text-gray-400 pe-4">
          {isAR ? "الكود: [* أو a أو #][رقم اللاعب][المهارة][التقييم] مثال: *12A#" : "Code: [*/a/#][Player][Skill][Result] e.g: *12A#"}
        </div>
      </div>

      <div className="p-4 max-w-[1400px] mx-auto">
        
        <div className="flex justify-center items-center gap-4 mb-6">
          <div className="bg-red-600 text-white font-bold text-2xl px-16 py-2 rounded shadow">{homeName}</div>
          <div className="bg-red-600 text-white font-black text-4xl px-4 py-2 rounded shadow">{ourScore}</div>
          <div className="flex flex-col text-gray-500 font-bold items-center leading-none text-xl">
            <span>+</span><span>-</span>
          </div>
          <div className="bg-blue-800 text-white font-black text-4xl px-4 py-2 rounded shadow">{oppScore}</div>
          <div className="bg-blue-800 text-white font-bold text-2xl px-16 py-2 rounded shadow">{awayName}</div>
        </div>

        <div className="flex gap-6 items-start">
          
          <div className="w-48 flex flex-col gap-1 bg-white p-2 rounded shadow">
            <h3 className="font-bold border-b pb-1 mb-2 text-center text-red-700">{homeName}</h3>
            {players.map(p => (
              <div key={p.id} className="flex gap-2 items-center text-sm font-semibold cursor-pointer hover:bg-gray-200 p-1 rounded"
                   onClick={() => setSelectedPlayer(p.id)}>
                <span className={`w-6 text-center ${p.position === 'libero' ? 'bg-yellow-300 text-black' : 'text-gray-600'}`}>
                  {p.jersey_number}
                </span>
                <span className={selectedPlayer === p.id ? "text-red-600 font-black" : "text-gray-800"}>{p.full_name.split(" ")[0]}</span>
              </div>
            ))}
            {players.length === 0 && (
              <div className="text-xs text-center text-gray-500 py-4">
                {isAR ? "لا يوجد لاعبين في هذا الفريق." : "No players in this team."}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-col items-center border-[3px] border-black p-1 bg-white relative">
              <div className="w-[300px] h-[150px] bg-[#d9d9d9] grid grid-cols-3 grid-rows-2">
                {AWAY_ZONES.map(z => (
                  <div key={`away-${z}`} className="flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-blue-800 text-white font-bold flex items-center justify-center text-xl opacity-90 shadow-inner">{z}</div>
                  </div>
                ))}
              </div>
              <div className="w-[320px] h-1.5 bg-black my-1"></div>
              <div className="w-[300px] h-[150px] bg-[#d9d9d9] grid grid-cols-3 grid-rows-2">
                {HOME_ZONES.map(z => {
                  const pId = homeCourt[z];
                  const p = players.find(x => x.id === pId);
                  const isSel = selectedPlayer === pId && pId !== null;
                  return (
                    <div key={`home-${z}`} className="flex items-center justify-center relative">
                      {p ? (
                        <button onClick={() => setSelectedPlayer(p.id)} onDoubleClick={() => setRosterZoneOpen(z)}
                          className={`w-12 h-12 rounded-full font-bold flex items-center justify-center text-xl transition-all border-2 shadow-lg ${
                            isSel ? "bg-white text-red-600 border-red-600 ring-2 ring-red-600 scale-110" : "bg-red-600 text-white border-black"
                          }`}>
                          {p.jersey_number}
                        </button>
                      ) : (
                        <button onClick={() => setRosterZoneOpen(z)} className="w-12 h-12 rounded-full bg-white/50 border-2 border-dashed border-gray-500 text-gray-500 font-bold hover:bg-white">+</button>
                      )}
                      {rosterZoneOpen === z && (
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-36 bg-white border border-gray-400 rounded shadow-2xl z-50 p-1 max-h-40 overflow-y-auto">
                          <div className="text-[10px] text-gray-500 font-bold mb-1 text-center bg-gray-100 py-1">Assign to Zone {z}</div>
                          {players.map(pl => (
                            <div key={pl.id} onClick={() => assignToCourt(z, pl.id)} className="text-xs p-1 hover:bg-gray-200 cursor-pointer text-black border-b border-gray-100">
                              <span className="font-bold mr-1">#{pl.jersey_number}</span> {pl.full_name.split(" ")[0]}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleCodeSubmit} className="w-full flex mt-2 shadow border-2 border-red-600 rounded overflow-hidden focus-within:ring-2 focus-within:ring-red-400 transition-all">
              <span className="bg-red-600 text-white font-bold px-3 py-2 text-sm flex items-center justify-center uppercase">Code</span>
              <input 
                ref={inputRef}
                value={rawCodeInput}
                onChange={(e) => setRawCodeInput(e.target.value)}
                placeholder="*12A# or a4S="
                className="flex-1 bg-white px-3 py-2 outline-none font-mono text-lg uppercase tracking-widest text-black focus:bg-yellow-50 transition-colors"
                autoComplete="off"
              />
              <button type="submit" className="hidden">Submit</button>
            </form>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            
            <div className="bg-white p-3 rounded shadow border border-gray-300">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-700 text-sm">Action Pad</h3>
                <div className="flex items-center gap-2">
                  <span className="font-black text-red-600 text-lg">{selectedPlayer ? `#${players.find(p=>p.id===selectedPlayer)?.jersey_number}` : "—"}</span>
                  <span className="font-black text-blue-600 text-lg">{selectedSkill ? SKILLS.find(s=>s.db===selectedSkill)?.code : "—"}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <div className="grid grid-cols-4 gap-1 flex-1">
                  {SKILLS.map(s => (
                    <button key={s.db} onClick={() => setSelectedSkill(s.db)}
                      className={`py-1 text-sm font-bold border rounded ${selectedSkill === s.db ? "bg-red-100 border-red-500 text-red-800" : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"}`}>
                      {s.code}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-1 w-16">
                  {RESULTS.map(r => (
                    <button key={r.db} onClick={() => handleResultClick(r.db)}
                      className={`flex-1 font-bold rounded shadow-sm text-sm ${r.color} hover:opacity-80 active:scale-95 py-1`}>
                      {r.sym}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded shadow border border-gray-300 flex-1 overflow-hidden flex flex-col max-h-72">
              <div className="bg-gray-200 p-2 text-xs font-bold flex justify-between items-center border-b border-gray-300">
                <span>CODES LIST</span>
                <button onClick={undoLast} className="bg-white px-2 py-0.5 rounded border border-gray-400 text-gray-700 hover:bg-gray-100 shadow-sm">Undo</button>
              </div>
              <div className="overflow-y-auto p-1 text-sm font-mono flex-1 bg-white">
                {[...events].reverse().map(e => {
                  let codeStr = "";
                  if (e.notes?.startsWith("RAW:")) {
                    codeStr = e.notes.replace("RAW:", "");
                  } else {
                    const s = SKILLS.find(x => x.db === e.skill);
                    const r = RESULTS.find(x => x.db === e.result);
                    codeStr = `*${e.players?.jersey_number || "?"}${s?.code}${r?.sym}`;
                  }
                  const isHome = !codeStr.startsWith("A") && !codeStr.startsWith("#") && !codeStr.startsWith("a");

                  return (
                    <div key={e.id} className="flex gap-2 p-1 border-b border-gray-100 hover:bg-gray-100 items-center">
                      <span className="text-gray-400 text-xs w-16">{new Date(e.created_at).toLocaleTimeString([],{minute:'2-digit',second:'2-digit'})}</span>
                      <span className={isHome ? "text-red-700 font-bold bg-red-50 px-1 rounded" : "text-blue-700 font-bold bg-blue-50 px-1 rounded"}>
                        {codeStr}
                      </span>
                    </div>
                  );
                })}
                {events.length === 0 && <div className="text-center text-gray-400 py-4 text-xs">No events logged</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded shadow border border-gray-300">
          <div className="bg-gray-200 p-2 text-sm font-bold border-b border-gray-300 flex justify-between">
            <span>MATCH ANALYSIS (BOTH TEAMS)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-100 text-gray-700 text-xs uppercase border-b border-gray-300">
                <tr>
                  <th className="p-2 border-r border-gray-300">Team</th>
                  <th className="p-2 border-r border-gray-300">Player</th>
                  <th className="p-2 text-center text-green-700 bg-green-50">Pts</th>
                  <th className="p-2 text-center text-red-700 border-r border-gray-300 bg-red-50">Err</th>
                  <th className="p-2 text-center">Att Tot</th>
                  <th className="p-2 text-center text-blue-700 font-bold">Att %</th>
                  <th className="p-2 text-center border-r border-gray-300 text-red-600">Att Err</th>
                  <th className="p-2 text-center text-blue-700 font-bold border-r border-gray-300">Rec %</th>
                  <th className="p-2 text-center border-r border-gray-300 text-orange-600">Srv Err</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {playerStats.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-2 border-r border-gray-300 font-bold text-xs uppercase">
                      <span className={p.isHome ? "text-red-600" : "text-blue-600"}>{p.isHome ? homeName : awayName}</span>
                    </td>
                    <td className="p-2 border-r border-gray-300 font-bold text-gray-800">{p.jersey} - {p.name}</td>
                    <td className="p-2 text-center font-bold text-green-600 bg-green-50/50">{p.pts}</td>
                    <td className="p-2 text-center font-bold text-red-600 border-r border-gray-300 bg-red-50/50">{p.err}</td>
                    <td className="p-2 text-center text-gray-600">{p.att}</td>
                    <td className="p-2 text-center font-bold text-blue-600">{p.attEff}</td>
                    <td className="p-2 text-center text-red-600 border-r border-gray-300">{p.attErr}</td>
                    <td className="p-2 text-center font-bold text-blue-600 border-r border-gray-300">{p.recEff}</td>
                    <td className="p-2 text-center text-orange-600 border-r border-gray-300">{p.srvErr}</td>
                  </tr>
                ))}
                {playerStats.length === 0 && <tr><td colSpan="9" className="p-4 text-center text-gray-500">No events logged yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
