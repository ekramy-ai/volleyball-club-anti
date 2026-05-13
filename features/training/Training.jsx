// features/training/Training.jsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function Training() {
  const { t } = useTranslation();
  const TYPES = [
    { key: "training_all",         value: "All" },
    { key: "training_technical",   value: "technical" },
    { key: "training_tactical",    value: "tactical" },
    { key: "training_conditioning",value: "conditioning" },
    { key: "training_recovery",    value: "recovery" },
  ];
  const [type, setType] = useState("All");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("training_title")}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{t("training_subtitle")}</p>
        </div>
        <button className="btn-primary text-sm">➕ {t("training_new")}</button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {TYPES.map((tp) => (
          <button key={tp.value} onClick={() => setType(tp.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${type === tp.value ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
            {t(tp.key)}
          </button>
        ))}
      </div>
      <div className="card flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">💪</div>
        <h2 className="text-lg font-semibold text-white mb-2">{t("training_no_sessions")}</h2>
        <p className="text-gray-400 text-sm mb-6">{t("training_no_sessions_sub")}</p>
        <button className="btn-primary">➕ {t("training_create")}</button>
      </div>
    </div>
  );
}
