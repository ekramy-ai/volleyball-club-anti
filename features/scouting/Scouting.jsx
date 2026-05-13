// features/scouting/Scouting.jsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const SKILLS_EN  = ["Serve","Reception","Set","Attack","Block","Dig","Free Ball"];
const SKILLS_AR  = ["إرسال","استقبال","إعداد","هجوم","صد","دفاع","كرة حرة"];
const RESULTS_EN = ["Error ❌","Negative ➖","Neutral ○","Positive ➕","Point ⭐"];
const RESULTS_AR = ["خطأ ❌","سلبي ➖","محايد ○","إيجابي ➕","نقطة ⭐"];

export default function Scouting() {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";
  const SKILLS  = isAR ? SKILLS_AR  : SKILLS_EN;
  const RESULTS = isAR ? RESULTS_AR : RESULTS_EN;

  const [events, setEvents] = useState([]);
  const [skill,  setSkill]  = useState(SKILLS[3]);
  const [result, setResult] = useState(RESULTS[3]);

  const addEvent = () => {
    setEvents((prev) => [
      ...prev,
      { id: Date.now(), skill, result, time: new Date().toLocaleTimeString() },
    ]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">{t("scouting_title")}</h1>
        <p className="text-gray-400 text-sm mt-0.5">{t("scouting_subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-1 space-y-4">
          <h2 className="text-base font-semibold text-white">{t("scouting_code_event")}</h2>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t("scouting_skill")}</label>
            <div className="grid grid-cols-2 gap-1.5">
              {SKILLS.map((s) => (
                <button key={s} onClick={() => setSkill(s)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors ${skill === s ? "bg-red-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t("scouting_result")}</label>
            <div className="flex flex-col gap-1.5">
              {RESULTS.map((r) => (
                <button key={r} onClick={() => setResult(r)}
                  className={`py-2 rounded-lg text-xs font-semibold text-start px-3 transition-colors ${result === r ? "bg-red-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
                  {r}
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
              <button onClick={() => setEvents([])} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
                {t("scouting_clear")}
              </button>
            )}
          </div>
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-4xl mb-3">📡</div>
              <p className="text-gray-400 text-sm">{t("scouting_no_events")}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pe-1">
              {[...events].reverse().map((e) => (
                <div key={e.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 text-sm">
                  <span className="font-medium text-white">{e.skill}</span>
                  <span className="text-gray-300">{e.result}</span>
                  <span className="text-gray-500 text-xs">{e.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
