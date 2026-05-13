// features/scouting/Scouting.jsx
import React, { useState, useEffect, useCallback } from "react";
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
  { db: "error",    en: "Error ❌",    ar: "خطأ ❌",      color: "bg-red-900/60 text-red-300" },
  { db: "negative", en: "Negative ➖", ar: "سلبي ➖",     color: "bg-orange-900/60 text-orange-300" },
  { db: "neutral",  en: "Neutral ○",  ar: "محايد ○",     color: "bg-gray-800 text-gray-300" },
  { db: "positive", en: "Positive ➕", ar: "إيجابي ➕",    color: "bg-blue-900/60 text-blue-300" },
  { db: "point",    en: "Point ⭐",    ar: "نقطة ⭐",     color: "bg-green-900/60 text-green-300" },
];

const ZONES = [4, 3, 2, 5, 6, 1];

export default function Scouting() {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";

  // Data states
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [events, setEvents] = useState([]);

  // Selection states
  const [matchId, setMatchId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [skill, setSkill] = useState("attack");
  const [result, setResult] = useState("point");
  const [zone, setZone] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Load context data (Matches & Players)
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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadContext();
  }, []);

  // 2. Load events for the selected match
  const loadEvents = useCallback(async () => {
    if (!matchId) return;
    try {
      const { data, error: err } = await supabase
        .from("scouting_events")
        .select("*, players(full_name, jersey_number)")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });
      if (err) throw err;
      setEvents(data || []);
    } catch (err) {
      console.error(err);
    }
  }, [matchId]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // 3. Log an event
  const addEvent = async () => {
    if (!matchId) { alert(isAR ? "اختر المباراة أولاً" : "Select a match first"); return; }
    if (!playerId) { alert(isAR ? "اختر اللاعب أولاً" : "Select a player first"); return; }
    
    setIsSubmitting(true);
    try {
      const payload = { 
        match_id: matchId, 
        player_id: playerId, 
        skill, 
        result,
        zone_from: zone // saving as zone_from for simplicity
      };
      const { data, error: err } = await supabase
        .from("scouting_events")
        .insert(payload)
        .select("*, players(full_name, jersey_number)")
        .single();
      
      if (err) throw err;
      setEvents((prev) => [...prev, data]);
      setZone(null); // reset zone after logging
    } catch (err) {
      alert("Failed to log event: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLabel = (arr, dbVal) => {
    const item = arr.find(x => x.db === dbVal);
    return item ? (isAR ? item.ar : item.en) : dbVal;
  };

  const getResultColor = (dbVal) => RESULTS.find(x => x.db === dbVal)?.color || "bg-gray-800 text-gray-400";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold text-white">{t("scouting_title")}</h1>
        <p className="text-gray-400 text-sm mt-0.5">{t("scouting_subtitle")}</p>
      </div>

      {error && <div className="card border-red-800 bg-red-900/20 text-red-300 text-sm">⚠️ {error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Context Setup & Logging Panel */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Match & Player Selection */}
          <div className="card space-y-4 border-t-4 border-t-red-600">
            <h2 className="text-base font-semibold text-white mb-2">{isAR ? "إعدادات الرصد" : "Scouting Setup"}</h2>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">{isAR ? "المباراة" : "Match"}</label>
              <select value={matchId} onChange={(e) => setMatchId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:border-red-500">
                <option value="">-- {isAR ? "اختر المباراة" : "Select Match"} --</option>
                {matches.map(m => (
                  <option key={m.id} value={m.id}>{m.teams?.name || "Unknown"} - {m.competition || "Friendly"}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">{isAR ? "اللاعب الحالي" : "Current Player"}</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                {players.map(p => (
                  <button key={p.id} onClick={() => setPlayerId(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                      playerId === p.id ? "bg-red-600 border-red-500 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]" : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                    }`}>
                    {p.jersey_number ? `${p.jersey_number}. ` : ""}{p.full_name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Pad */}
          <div className="card space-y-5">
            <div>
              <label className="block text-xs text-gray-400 mb-2">{t("scouting_skill")}</label>
              <div className="grid grid-cols-2 gap-2">
                {SKILLS.map((s) => (
                  <button key={s.db} onClick={() => setSkill(s.db)}
                    className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                      skill === s.db ? `${s.color} text-white shadow-lg scale-[1.02]` : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}>
                    {isAR ? s.ar : s.en}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2">{t("scouting_result")}</label>
              <div className="flex flex-col gap-2">
                {RESULTS.map((r) => (
                  <button key={r.db} onClick={() => setResult(r.db)}
                    className={`py-2.5 rounded-lg text-sm font-semibold px-4 text-start transition-all ${
                      result === r.db ? `${r.color} shadow-lg ring-2 ring-white/20 scale-[1.02]` : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}>
                    {isAR ? r.ar : r.en}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={addEvent} disabled={isSubmitting || !matchId || !playerId} 
              className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(220,38,38,0.4)] disabled:opacity-50 disabled:shadow-none transition-all active:scale-95">
              ⚡ {isSubmitting ? (isAR ? "جاري التسجيل..." : "Logging...") : t("scouting_log_event")}
            </button>
          </div>
        </div>

        {/* Right Column: Court & Event Log */}
        <div className="lg:col-span-7 space-y-4 flex flex-col h-full">
          
          {/* Volleyball Court Zone Selector */}
          <div className="card flex-shrink-0">
            <h2 className="text-base font-semibold text-white mb-4">{isAR ? "منطقة الملعب (اختياري)" : "Court Zone (Optional)"}</h2>
            <div className="flex justify-center">
              <div className="relative w-[300px] h-[150px] bg-orange-700/80 border-4 border-white shadow-2xl grid grid-cols-3 grid-rows-2 gap-1 p-1">
                {/* Net Line overlay */}
                <div className="absolute top-[-4px] left-1/2 w-1 h-[154px] bg-white transform -translate-x-1/2 z-10 opacity-80" />
                
                {ZONES.map(z => (
                  <button key={z} onClick={() => setZone(zone === z ? null : z)}
                    className={`relative flex items-center justify-center text-2xl font-black transition-all ${
                      zone === z ? "bg-white/90 text-red-600 shadow-inner z-20" : "bg-white/10 text-white/50 hover:bg-white/30"
                    }`}>
                    {z}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-center text-xs text-gray-500 mt-3">{isAR ? "اضغط على المنطقة لتحديد مكان الحدث" : "Click a zone to select event location"}</p>
          </div>

          {/* Event Log */}
          <div className="card flex-1 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
              <h2 className="text-base font-semibold text-white">📋 {t("scouting_log")} <span className="badge bg-gray-800 ms-2">{events.length}</span></h2>
              {events.length > 0 && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> {isAR ? "تزامن مباشر" : "Live Sync"}
                </span>
              )}
            </div>
            
            {loading ? (
               <div className="flex-1 flex justify-center items-center"><div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : events.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                <div className="text-5xl mb-3">📋</div>
                <p className="text-gray-400 text-sm">{t("scouting_no_events")}</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto flex-1 pe-2">
                {[...events].reverse().map((e) => (
                  <div key={e.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-gray-800 font-bold text-white flex items-center justify-center text-xs border border-gray-700">
                        {e.players?.jersey_number || "?"}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{e.players?.full_name || (isAR ? "غير معروف" : "Unknown")}</div>
                        <div className="text-xs text-gray-500 flex gap-2">
                          <span className="font-medium text-gray-400">{getLabel(SKILLS, e.skill)}</span>
                          {e.zone_from && <span>• {isAR ? "منطقة" : "Zone"} {e.zone_from}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 border-t sm:border-0 border-gray-800 pt-2 sm:pt-0">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getResultColor(e.result)}`}>
                        {getLabel(RESULTS, e.result)}
                      </span>
                      <span className="text-gray-600 text-xs font-mono">
                        {new Date(e.created_at).toLocaleTimeString(isAR ? "ar-EG" : "en-GB", { hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
