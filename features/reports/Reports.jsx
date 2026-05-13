// features/reports/Reports.jsx
import React from "react";
import { useTranslation } from "react-i18next";

export default function Reports() {
  const { t } = useTranslation();

  const TYPES = [
    { titleKey: "reports_match",    subKey: "reports_match_sub",    icon: "🏐" },
    { titleKey: "reports_player",   subKey: "reports_player_sub",   icon: "🤾" },
    { titleKey: "reports_training", subKey: "reports_training_sub", icon: "💪" },
    { titleKey: "reports_season",   subKey: "reports_season_sub",   icon: "📅" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">{t("reports_title")}</h1>
        <p className="text-gray-400 text-sm mt-0.5">{t("reports_subtitle")}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TYPES.map((r) => (
          <div key={r.titleKey} className="card flex items-center gap-4 hover:border-gray-700 transition-colors cursor-pointer group">
            <span className="text-3xl">{r.icon}</span>
            <div className="flex-1">
              <div className="font-semibold text-white">{t(r.titleKey)}</div>
              <div className="text-xs text-gray-400 mt-0.5">{t(r.subKey)}</div>
            </div>
            <button className="btn-secondary text-xs opacity-0 group-hover:opacity-100 transition-opacity">
              {t("reports_generate")}
            </button>
          </div>
        ))}
      </div>
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-3">📄</div>
        <p className="text-gray-400 text-sm">{t("reports_no_reports")}</p>
      </div>
    </div>
  );
}
