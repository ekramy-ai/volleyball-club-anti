// features/scouting/Scouting.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../src/lib/supabase";

const SKILLS = [
  { db: "serve",     en: "Serve",     ar: "إرسال" },
  { db: "reception", en: "Reception", ar: "استقبال" },
  { db: "set",       en: "Set",       ar: "إعداد" },
  { db: "attack",    en: "Attack",    ar: "هجوم" },
  { db: "block",     en: "Block",     ar: "صد" },
  { db: "dig",       en: "Dig",       ar: "دفاع" },
  { db: "free_ball", en: "Free Ball", ar: "كرة حرة" },
];

const RESULTS = [
  { db: "error",    en: "Error ❌",    ar: "خطأ ❌" },
  { db: "negative", en: "Negative ➖", ar: "سلبي ➖" },
  { db: "neutral",  en: "Neutral ○",  ar: "محايد ○" },
  { db: "positive", en: "Positive ➕", ar: "إيجابي ➕" },
  { db: "point",    en: "Point ⭐",    ar: "نقطة ⭐" },
];

export default function Scouting() {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";

  const [events, setEvents] = useState([]);
  const [skill,  setSkill]  = useState(SKILLS[3].db);
  const [result, setResult] = useState(RESULTS[3].db);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from("scouting_events")
        .select("*")
        .order("created_at", { ascending: true });
      if (err) throw err;
      setEvents(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const addEvent = async () => {
    try {
      const payload = { skill, result };
      const { data, error: err } = await supabase.from("scouting_events").insert(payload).select().single();
      if (err) throw err;
      setEvents((prev) => [...prev, data]);
    } catch (err) {
      alert("Failed to log event: " + err.message);
    }
  };

  const clearAll = async () => {
    if (!confirm(t("common_delete") + " All?")) return;
    try {
      // Delete all (dangerous, but okay for demo)
      const { error: err } = await supabase.from("scouting_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (err) throw err;
      setEvents([]);
    } catch (err) {
      alert(err.message);
    }
  };

  const getSkillLabel = (dbVal) => {
    const s = SKILLS.find(x => x.db === dbVal);
    return s ? (isAR ? s.ar : s.en) : dbVal;
  };

  const getResultLabel = (dbVal) => {
    const r = RESULTS.find(x => x.db === dbVal);
    return r ? (isAR ? r.ar : r.en) : dbVal;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">{t("scouting_title")}</h1>
        <p className="text-gray-400 text-sm mt-0.5">{t("scouting_subtitle")}</p>
      </div>

      {error && (
        <div className="card border-red-800 bg-red-900/20 text-red-300 text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-1 space-y-4">
          <h2 className="text-base font-semibold text-white">{t("scouting_code_event")}</h2>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t("scouting_skill")}</label>
            <div className="grid grid-cols-2 gap-1.5">
              {SKILLS.map((s) => (
                <button key={s.db} onClick={() => setSkill(s.db)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors ${skill === s.db ? "bg-red-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
                  {isAR ? s.ar : s.en}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t("scouting_result")}</label>
            <div className="flex flex-col gap-1.5">
              {RESULTS.map((r) => (
                <button key={r.db} onClick={() => setResult(r.db)}
                  className={`py-2 rounded-lg text-xs font-semibold text-start px-3 transition-colors ${result === r.db ? "bg-red-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
                  {isAR ? r.ar : r.en}
                </button>
              ))}
            </div>
          </div>
          <button onClick={addEvent} className="btn-primary w-full">{t("scouting_log_event")}</button>
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">{t("scouting_log")} ({events.length})</h2>
            {events.length > 0 && (
              <button onClick={clearAll} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
                {t("scouting_clear")}
              </button>
            )}
          </div>
          {loading ? (
             <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-4xl mb-3">📡</div>
              <p className="text-gray-400 text-sm">{t("scouting_no_events")}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pe-1">
              {[...events].reverse().map((e) => (
                <div key={e.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 text-sm">
                  <span className="font-medium text-white">{getSkillLabel(e.skill)}</span>
                  <span className="text-gray-300">{getResultLabel(e.result)}</span>
                  <span className="text-gray-500 text-xs">{new Date(e.created_at).toLocaleTimeString(isAR ? "ar-EG" : "en-GB")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
