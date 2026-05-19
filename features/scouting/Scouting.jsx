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

const SUB_SKILLS = [
  { code: "H", en: "High Ball", ar: "كرة عالية" },
  { code: "Q", en: "Quick", ar: "هجوم سريع" },
  { code: "F", en: "Fast", ar: "كرة سريعة الأطراف" },
  { code: "P", en: "Pipe", ar: "بايب (هجوم خلفي)" }
];

const HOME_ZONES = [4, 3, 2, 5, 6, 1]; 
const AWAY_ZONES = [1, 6, 5, 2, 3, 4];

export default function Scouting() {
  const { i18n } = useTranslation();
  const isAR = i18n.language === "ar";

  const [matches, setMatches] = useState([]);
  const [teamsMap, setTeamsMap] = useState({});
  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);
  const [events, setEvents] = useState([]);

  const [matchId, setMatchId] = useState("");
  const [homeCourt, setHomeCourt] = useState({ 1: null, 2: null, 3: null, 4: null, 5: null, 6: null });
  const [awayCourt, setAwayCourt] = useState({ 1: null, 2: null, 3: null, 4: null, 5: null, 6: null });
  
  const [selectedPlayer, setSelectedPlayer] = useState(null); 
  const [selectedPlayerTeam, setSelectedPlayerTeam] = useState(null); 
  const [selectedSkill, setSelectedSkill] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [rosterZoneOpen, setRosterZoneOpen] = useState({ side: null, zone: null });

  const [rawCodeInput, setRawCodeInput] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    async function loadMatches() {
      setLoading(true);
      try {
        const { data: matchData } = await supabase
          .from("matches")
          .select("*")
          .order("match_date", { ascending: false })
          .limit(15);
        
        const { data: teamData } = await supabase.from("teams").select("id, name");
        const tMap = {};
        if (teamData) teamData.forEach(t => tMap[t.id] = t.name);
        
        setTeamsMap(tMap);
        setMatches(matchData || []);
        if (matchData?.length > 0) setMatchId(matchData[0].id);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    loadMatches();
  }, []);

  useEffect(() => {
    async function loadPlayers() {
      if (!matchId) return;
      const match = matches.find(m => m.id === matchId);
      if (!match) return;

      const awayTeamId = match.set_scores?.away_team_id;
      const teamIds = [];
      if (match.home_team_id) teamIds.push(match.home_team_id);
      if (awayTeamId) teamIds.push(awayTeamId);

      if (teamIds.length === 0) {
        setHomePlayers([]); setAwayPlayers([]); return;
      }

      const { data } = await supabase
        .from("players")
        .select("id, full_name, jersey_number, position, team_id")
        .in("team_id", teamIds)
        .order("jersey_number", { ascending: true });
      
      const allPlayers = data || [];
      setHomePlayers(allPlayers.filter(p => p.team_id === match.home_team_id));
      setAwayPlayers(allPlayers.filter(p => p.team_id === awayTeamId));
      
      setHomeCourt({ 1: null, 2: null, 3: null, 4: null, 5: null, 6: null });
      setAwayCourt({ 1: null, 2: null, 3: null, 4: null, 5: null, 6: null });
      setSelectedPlayer(null); setSelectedPlayerTeam(null);
    }
    loadPlayers();
  }, [matchId, matches]);

  const loadEvents = useCallback(async () => {
    if (!matchId) return;
    const { data } = await supabase
      .from("scouting_events")
      .select("*, players(id, full_name, jersey_number, team_id)")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });
    setEvents(data || []);
  }, [matchId]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (inputRef.current) inputRef.current.focus();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getPrefixForTeam = (pId) => {
    if (homePlayers.some(p => p.id === pId)) return '*';
    if (awayPlayers.some(p => p.id === pId)) return 'a';
    return '*';
  };

  const getPlayerById = (pId) => {
    return homePlayers.find(p => p.id === pId) || awayPlayers.find(p => p.id === pId);
  };

  const handleResultClick = async (resDb) => {
    if (!matchId) return alert(isAR ? "اختر المباراة" : "Select match");
    if (!selectedPlayer) return alert(isAR ? "اختر اللاعب أولاً" : "Select player first");
    if (!selectedSkill) return alert(isAR ? "اختر المهارة أولاً" : "Select skill first");

    const p = getPlayerById(selectedPlayer);
    const s = SKILLS.find(x => x.db === selectedSkill);
    const r = RESULTS.find(x => x.db === resDb);
    
    const prefix = getPrefixForTeam(p.id);
    const codeString = `${prefix}${p.jersey_number}${s.code}${r.sym}`;

    const payload = { match_id: matchId, player_id: selectedPlayer, skill: selectedSkill, result: resDb, notes: `RAW:${codeString}` };
    const { data, error } = await supabase.from("scouting_events").insert(payload).select("*, players(id, full_name, jersey_number, team_id)").single();
    if (!error) {
      setEvents(prev => [...prev, data]);
      setSelectedPlayer(null); setSelectedPlayerTeam(null); setSelectedSkill(null);
      if (inputRef.current) inputRef.current.focus();
    }
  };

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

    // Advanced Regex for DV4: e.g. *12A#HQ (allows subskills at the end)
    const matchRegex = code.match(/^(\d{1,2})([SREABDF])([=\-/+#])([HQFP]?)$/);
    if (!matchRegex) {
      alert(isAR ? "كود خاطئ (DV4). مثال: *12A# أو a5SQ=" : "Invalid DV4 Code. Example: *12A# or a5SQ=");
      return;
    }

    const jersey = parseInt(matchRegex[1], 10);
    const skillCode = matchRegex[2];
    const resultCode = matchRegex[3];
    const subSkill = matchRegex[4] || "";

    const s = SKILLS.find(x => x.code === skillCode);
    const r = RESULTS.find(x => x.sym === resultCode);

    if (!s || !r) return alert("Invalid skill or result code");

    let pId = null;
    const roster = isHome ? homePlayers : awayPlayers;
    const p = roster.find(x => x.jersey_number === jersey);
    if (p) pId = p.id;

    const finalCodeStr = `${prefix}${jersey}${skillCode}${subSkill}${resultCode}`;
    const payload = { match_id: matchId, player_id: pId, skill: s.db, result: r.db, notes: `RAW:${finalCodeStr}` };
    
    const { data, error } = await supabase.from("scouting_events").insert(payload).select("*, players(id, full_name, jersey_number, team_id)").single();
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

  const assignToCourt = (side, zone, pId) => {
    if (side === 'home') setHomeCourt(prev => ({ ...prev, [zone]: pId }));
    else setAwayCourt(prev => ({ ...prev, [zone]: pId }));
    setRosterZoneOpen({ side: null, zone: null });
  };

  const selectPlayerForAction = (pId, teamType) => {
    setSelectedPlayer(pId);
    setSelectedPlayerTeam(teamType);
  };

  const matchInfo = matches.find(m => m.id === matchId);
  const homeName = matchInfo?.home_team_id ? (teamsMap[matchInfo.home_team_id] || "Home Team") : "Home Team";
  const awayName = matchInfo?.set_scores?.away_team_id ? (teamsMap[matchInfo.set_scores.away_team_id] || "Away Team") : "Away Team";

  let ourScore = 0;
  let oppScore = 0;
  events.forEach(e => {
    const isHomeEvent = e.notes?.startsWith("RAW:*") || (!e.notes?.startsWith("RAW:A") && !e.notes?.startsWith("RAW:#"));
    if (isHomeEvent) {
      if (e.result === "point") ourScore++;
      if (e.result === "error") oppScore++;
    } else {
      if (e.result === "point") oppScore++;
      if (e.result === "error") ourScore++;
    }
  });

  const playerStats = useMemo(() => {
    const stats = {};
    
    homePlayers.forEach(p => { 
      stats[`HOME_${p.id}`] = { id: p.id, jersey: p.jersey_number, name: p.full_name, team: homeName, isHome: true, pts:0, err:0, att:0, attPts:0, attErr:0, rec:0, recPos:0, srv:0, srvErr:0 }; 
    });
    awayPlayers.forEach(p => { 
      stats[`AWAY_${p.id}`] = { id: p.id, jersey: p.jersey_number, name: p.full_name, team: awayName, isHome: false, pts:0, err:0, att:0, attPts:0, attErr:0, rec:0, recPos:0, srv:0, srvErr:0 }; 
    });

    events.forEach(e => {
      const isHomeEvent = e.notes?.startsWith("RAW:*") || (!e.notes?.startsWith("RAW:A") && !e.notes?.startsWith("RAW:#"));
      
      let pKey;
      let jersey = "?";
      if (e.player_id) {
        pKey = isHomeEvent ? `HOME_${e.player_id}` : `AWAY_${e.player_id}`;
      } else {
        const match = e.notes?.match(/^RAW:[*A#](\d+)/i);
        if (match) jersey = parseInt(match[1], 10);
        pKey = isHomeEvent ? `HOME_UNKNOWN_${jersey}` : `AWAY_UNKNOWN_${jersey}`;
        if (!stats[pKey]) {
          stats[pKey] = { id: pKey, jersey: jersey, name: `Player #${jersey}`, team: isHomeEvent ? homeName : awayName, isHome: isHomeEvent, pts:0, err:0, att:0, attPts:0, attErr:0, rec:0, recPos:0, srv:0, srvErr:0 };
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
  }, [events, homePlayers, awayPlayers, homeName, awayName]);

  return (
    <div className="min-h-screen bg-[#111111] text-gray-100 font-sans pb-10">
      
      {/* Top Navbar */}
      <div className="bg-[#000000] p-2 flex items-center justify-between text-white border-b border-gray-800">
        <div className="flex gap-4 items-center">
          <span className="font-bold text-lg px-4 text-blue-500 tracking-widest uppercase">Data Volley 4</span>
          <select value={matchId} onChange={e => setMatchId(e.target.value)} className="bg-gray-800 text-white rounded px-3 py-1.5 outline-none text-sm border border-gray-700 focus:border-blue-500 font-medium shadow-inner">
            {matches.map(m => {
              const hName = m.home_team_id ? teamsMap[m.home_team_id] : "Home Team";
              const aName = m.set_scores?.away_team_id ? teamsMap[m.set_scores.away_team_id] : "Away Team";
              return <option key={m.id} value={m.id}>{hName} vs {aName}</option>;
            })}
          </select>
        </div>
        <div className="text-xs text-gray-500 pe-4 font-mono">
          Syntax: [*/a][#][Skill][Type][Result]
        </div>
      </div>

      <div className="p-4 max-w-[1500px] mx-auto">
        
        {/* Scoreboard */}
        <div className="flex justify-center items-center gap-4 mb-6">
          <div className="bg-[#1a1a1a] text-white border-l-4 border-l-red-600 font-bold text-xl md:text-2xl px-6 md:px-16 py-3 shadow-lg text-center min-w-[200px] truncate">{homeName}</div>
          <div className="bg-red-600 text-white font-black text-5xl px-6 py-2 shadow-lg">{ourScore}</div>
          <div className="flex flex-col text-gray-600 font-black items-center leading-none text-3xl px-2">:</div>
          <div className="bg-blue-800 text-white font-black text-5xl px-6 py-2 shadow-lg">{oppScore}</div>
          <div className="bg-[#1a1a1a] text-white border-r-4 border-r-blue-800 font-bold text-xl md:text-2xl px-6 md:px-16 py-3 shadow-lg text-center min-w-[200px] truncate">{awayName}</div>
        </div>

        <div className="flex gap-4 items-start flex-col xl:flex-row">
          
          {/* Home Roster Sidebar */}
          <div className="w-full xl:w-56 flex flex-col gap-1 bg-[#1a1a1a] p-3 rounded-lg shadow-xl border border-gray-800">
            <h3 className="font-bold border-b border-gray-800 pb-2 mb-3 text-center text-red-500 truncate uppercase tracking-widest text-xs">{homeName}</h3>
            <div className="flex flex-row xl:flex-col overflow-x-auto xl:overflow-visible gap-2 xl:gap-1.5 pb-2 xl:pb-0">
              {homePlayers.map(p => (
                <div key={p.id} className={`flex gap-3 items-center text-sm font-semibold cursor-pointer p-1.5 rounded transition-all ${selectedPlayer === p.id ? "bg-gray-800 border-l-2 border-red-500" : "hover:bg-gray-800"}`}
                     onClick={() => selectPlayerForAction(p.id, 'home')}>
                  <span className={`w-7 h-7 flex items-center justify-center text-xs font-black rounded ${p.position === 'libero' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}>
                    {p.jersey_number}
                  </span>
                  <span className={selectedPlayer === p.id ? "text-white" : "text-gray-400"}>{p.full_name.split(" ").slice(0,2).join(" ")}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 flex-1 w-full">
            
            {/* Visual Court Grid DV4 Style */}
            <div className="flex flex-col items-center border-4 border-orange-500/20 p-2 bg-[#222] relative rounded-xl shadow-2xl">
              <div dir="ltr" className="w-[300px] sm:w-[400px] h-[150px] sm:h-[200px] bg-[#df9753] grid grid-cols-3 grid-rows-2 shadow-inner relative">
                {AWAY_ZONES.map(z => {
                  const pId = awayCourt[z];
                  const p = awayPlayers.find(x => x.id === pId);
                  const isSel = selectedPlayer === pId && pId !== null;
                  return (
                    <div key={`away-${z}`} className="flex items-center justify-center relative border border-white/10">
                      <span className="absolute top-1 left-1 text-[10px] font-black text-white/30 z-0">{z}</span>
                      {p ? (
                        <button onClick={() => selectPlayerForAction(p.id, 'away')} onDoubleClick={() => setRosterZoneOpen({ side: 'away', zone: z })}
                          className={`z-10 w-10 h-10 sm:w-14 sm:h-14 rounded-full font-black flex items-center justify-center text-lg sm:text-xl transition-all shadow-xl border-2 ${
                            isSel ? "bg-white text-blue-800 border-blue-800 ring-4 ring-blue-800/30 scale-125" : "bg-blue-800 text-white border-[#df9753]"
                          }`}>
                          {p.jersey_number}
                        </button>
                      ) : (
                        <button onClick={() => setRosterZoneOpen({ side: 'away', zone: z })} className="w-10 h-10 rounded-full bg-black/10 border-2 border-dashed border-white/30 text-white/50 font-bold hover:bg-black/20">+</button>
                      )}
                      {rosterZoneOpen.side === 'away' && rosterZoneOpen.zone === z && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 p-1 max-h-48 overflow-y-auto">
                          <div className="text-[10px] text-gray-400 font-bold mb-1 text-center bg-gray-800 py-1 rounded">Assign Zone {z}</div>
                          {awayPlayers.map(pl => (
                            <div key={pl.id} onClick={() => assignToCourt('away', z, pl.id)} className="text-xs p-2 hover:bg-gray-800 cursor-pointer text-gray-200 border-b border-gray-800">
                              <span className="font-bold text-blue-400 mr-2">#{pl.jersey_number}</span> {pl.full_name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="w-[320px] sm:w-[420px] h-2 bg-white my-1 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
              
              <div dir="ltr" className="w-[300px] sm:w-[400px] h-[150px] sm:h-[200px] bg-[#df9753] grid grid-cols-3 grid-rows-2 shadow-inner relative">
                {HOME_ZONES.map(z => {
                  const pId = homeCourt[z];
                  const p = homePlayers.find(x => x.id === pId);
                  const isSel = selectedPlayer === pId && pId !== null;
                  return (
                    <div key={`home-${z}`} className="flex items-center justify-center relative border border-white/10">
                      <span className="absolute bottom-1 right-1 text-[10px] font-black text-white/30 z-0">{z}</span>
                      {p ? (
                        <button onClick={() => selectPlayerForAction(p.id, 'home')} onDoubleClick={() => setRosterZoneOpen({ side: 'home', zone: z })}
                          className={`z-10 w-10 h-10 sm:w-14 sm:h-14 rounded-full font-black flex items-center justify-center text-lg sm:text-xl transition-all shadow-xl border-2 ${
                            isSel ? "bg-white text-red-600 border-red-600 ring-4 ring-red-600/30 scale-125" : "bg-red-600 text-white border-[#df9753]"
                          }`}>
                          {p.jersey_number}
                        </button>
                      ) : (
                        <button onClick={() => setRosterZoneOpen({ side: 'home', zone: z })} className="w-10 h-10 rounded-full bg-black/10 border-2 border-dashed border-white/30 text-white/50 font-bold hover:bg-black/20">+</button>
                      )}
                      {rosterZoneOpen.side === 'home' && rosterZoneOpen.zone === z && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 p-1 max-h-48 overflow-y-auto">
                          <div className="text-[10px] text-gray-400 font-bold mb-1 text-center bg-gray-800 py-1 rounded">Assign Zone {z}</div>
                          {homePlayers.map(pl => (
                            <div key={pl.id} onClick={() => assignToCourt('home', z, pl.id)} className="text-xs p-2 hover:bg-gray-800 cursor-pointer text-gray-200 border-b border-gray-800">
                              <span className="font-bold text-red-400 mr-2">#{pl.jersey_number}</span> {pl.full_name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Input & Action Pad */}
            <div className="w-full max-w-[420px]">
              <form onSubmit={handleCodeSubmit} className="flex mb-4 shadow-xl border border-gray-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all bg-gray-900">
                <span className="bg-gray-800 text-blue-500 font-bold px-4 py-3 text-xs flex items-center justify-center uppercase tracking-widest border-r border-gray-700">INPUT</span>
                <input ref={inputRef} value={rawCodeInput} onChange={(e) => setRawCodeInput(e.target.value)}
                  placeholder="e.g. *12A#HQ or a4S="
                  className="flex-1 bg-gray-900 px-4 py-3 outline-none font-mono text-xl uppercase tracking-widest text-white placeholder-gray-600 transition-colors"
                  autoComplete="off" />
                <button type="submit" className="hidden">Submit</button>
              </form>

              <div className="bg-[#1a1a1a] p-4 rounded-xl shadow-xl border border-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-500 text-xs tracking-widest uppercase">Action Interface</h3>
                  <div className="flex items-center gap-3 bg-black px-3 py-1 rounded-lg border border-gray-800">
                    <span className={`font-black text-xl ${selectedPlayerTeam === 'away' ? 'text-blue-500' : 'text-red-500'}`}>
                      {selectedPlayer ? `#${getPlayerById(selectedPlayer)?.jersey_number}` : "--"}
                    </span>
                    <span className="text-gray-600">|</span>
                    <span className="font-black text-white text-xl">{selectedSkill ? SKILLS.find(s=>s.db===selectedSkill)?.code : "-"}</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="grid grid-cols-4 gap-2 flex-1">
                    {SKILLS.map(s => (
                      <button key={s.db} onClick={() => setSelectedSkill(s.db)}
                        className={`py-3 text-sm font-black rounded-lg transition-all ${selectedSkill === s.db ? "bg-white text-black shadow-[0_0_10px_white]" : "bg-gray-800 border-b-4 border-gray-900 text-gray-400 hover:bg-gray-700 hover:text-white"}`}>
                        {s.code}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 w-16">
                    {RESULTS.map(r => (
                      <button key={r.db} onClick={() => handleResultClick(r.db)}
                        className={`flex-1 font-black rounded-lg shadow-lg text-lg transition-all hover:brightness-110 active:scale-95 py-2 ${r.color}`}>
                        {r.sym}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="text-[10px] text-gray-600 mb-2 uppercase tracking-widest font-bold">Sub-Skills (Hit Types)</div>
                  <div className="flex gap-2">
                    {SUB_SKILLS.map(sk => (
                      <button key={sk.code} onClick={() => setRawCodeInput(prev => prev + sk.code)}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 rounded text-xs font-mono font-bold transition-colors border border-gray-700">
                        {sk.code}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Away Roster Sidebar & Event Log */}
          <div className="w-full xl:w-64 flex flex-col gap-4">
            
            <div className="flex flex-col gap-1 bg-[#1a1a1a] p-3 rounded-lg shadow-xl border border-gray-800">
              <h3 className="font-bold border-b border-gray-800 pb-2 mb-3 text-center text-blue-500 truncate uppercase tracking-widest text-xs">{awayName}</h3>
              <div className="flex flex-row xl:flex-col overflow-x-auto xl:overflow-visible gap-2 xl:gap-1.5 pb-2 xl:pb-0">
                {awayPlayers.map(p => (
                  <div key={p.id} className={`flex gap-3 items-center text-sm font-semibold cursor-pointer p-1.5 rounded transition-all ${selectedPlayer === p.id ? "bg-gray-800 border-l-2 border-blue-500" : "hover:bg-gray-800"}`}
                       onClick={() => selectPlayerForAction(p.id, 'away')}>
                    <span className={`w-7 h-7 flex items-center justify-center text-xs font-black rounded ${p.position === 'libero' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}>
                      {p.jersey_number}
                    </span>
                    <span className={selectedPlayer === p.id ? "text-white" : "text-gray-400"}>{p.full_name.split(" ").slice(0,2).join(" ")}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-800 flex-1 overflow-hidden flex flex-col min-h-[250px] xl:max-h-96">
              <div className="bg-gray-900 p-3 text-[10px] uppercase tracking-widest font-bold text-gray-500 flex justify-between items-center border-b border-gray-800">
                <span>Data Volley Log</span>
                <button onClick={undoLast} className="bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded text-white transition-colors">Undo</button>
              </div>
              <div className="overflow-y-auto p-2 text-sm font-mono flex-1 bg-[#111]">
                {[...events].reverse().map(e => {
                  let codeStr = "";
                  if (e.notes?.startsWith("RAW:")) {
                    codeStr = e.notes.replace("RAW:", "");
                  } else {
                    const s = SKILLS.find(x => x.db === e.skill);
                    const r = RESULTS.find(x => x.db === e.result);
                    const isAwayTeamEv = awayPlayers.some(p => p.id === e.player_id);
                    codeStr = `${isAwayTeamEv ? 'a' : '*'}${e.players?.jersey_number || "?"}${s?.code}${r?.sym}`;
                  }
                  const isHome = !codeStr.startsWith("a") && !codeStr.startsWith("A") && !codeStr.startsWith("#");

                  return (
                    <div key={e.id} className="flex gap-3 p-1.5 border-b border-gray-800 hover:bg-gray-900 items-center transition-colors">
                      <span className="text-gray-600 text-[10px] w-12">{new Date(e.created_at).toLocaleTimeString([],{minute:'2-digit',second:'2-digit'})}</span>
                      <span className={isHome ? "text-red-400 font-bold" : "text-blue-400 font-bold"}>
                        {codeStr}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Analytics Table */}
        <div className="mt-8 bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-800 overflow-hidden">
          <div className="bg-gray-900 p-4 text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-800 flex items-center justify-between">
            <span>Statistical Analysis Engine</span>
            <span className="text-[10px] bg-red-600/20 text-red-500 px-2 py-1 rounded">DV4 Simulation</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#111] text-gray-500 text-[10px] uppercase tracking-wider border-b border-gray-800">
                <tr>
                  <th className="p-3 border-r border-gray-800">Team</th>
                  <th className="p-3 border-r border-gray-800">Player</th>
                  <th className="p-3 text-center text-green-500">Pts</th>
                  <th className="p-3 text-center text-red-500 border-r border-gray-800">Err</th>
                  <th className="p-3 text-center">Att Tot</th>
                  <th className="p-3 text-center text-white font-bold">Att %</th>
                  <th className="p-3 text-center border-r border-gray-800 text-red-400">Att Err</th>
                  <th className="p-3 text-center text-white font-bold border-r border-gray-800">Rec %</th>
                  <th className="p-3 text-center text-orange-400">Srv Err</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-[#1a1a1a]">
                {playerStats.map(p => (
                  <tr key={p.id} className="hover:bg-gray-900 transition-colors">
                    <td className="p-3 border-r border-gray-800 font-bold text-xs uppercase">
                      <span className={p.isHome ? "text-red-500" : "text-blue-500"}>{p.team}</span>
                    </td>
                    <td className="p-3 border-r border-gray-800 font-bold text-gray-300">#{p.jersey} {p.name}</td>
                    <td className="p-3 text-center font-bold text-green-500">{p.pts}</td>
                    <td className="p-3 text-center font-bold text-red-500 border-r border-gray-800">{p.err}</td>
                    <td className="p-3 text-center text-gray-500">{p.att}</td>
                    <td className="p-3 text-center font-black text-white">{p.attEff}</td>
                    <td className="p-3 text-center text-red-400 border-r border-gray-800">{p.attErr}</td>
                    <td className="p-3 text-center font-black text-white border-r border-gray-800">{p.recEff}</td>
                    <td className="p-3 text-center text-orange-400">{p.srvErr}</td>
                  </tr>
                ))}
                {playerStats.length === 0 && <tr><td colSpan="9" className="p-8 text-center text-gray-600 uppercase tracking-widest text-xs">Awaiting scouting input</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
