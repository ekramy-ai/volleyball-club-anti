// features/analytics/Analytics.jsx
import React from "react";
import { useTranslation } from "react-i18next";

export default function Analytics() {
  const { t } = useTranslation();

  const METRICS = [
    { key: "analytics_attack",    icon: "⚔️", desc: "Positive attacks / total" },
    { key: "analytics_reception", icon: "🛡️", desc: "Avg reception rating" },
    { key: "analytics_serve",     icon: "🎯", desc: "Aces − errors / total" },
    { key: "analytics_blocks",    icon: "✋", desc: "Blocks per set" },
    { key: "analytics_sideout",   icon: "🔄", desc: "Side-out success rate" },
    { key: "analytics_breakpoint",icon: "💥", desc: "Break point success rate" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">{t("analytics_title")}</h1>
        <p className="text-gray-400 text-sm mt-0.5">{t("analytics_subtitle")}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {METRICS.map((m) => (
          <div key={m.key} className="card flex items-center gap-4 hover:border-gray-700 transition-colors">
            <span className="text-3xl">{m.icon}</span>
            <div>
              <div className="text-2xl font-bold text-white">—</div>
              <div className="text-sm font-medium text-gray-300">{t(m.key)}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-3">📊</div>
        <h2 className="text-base font-semibold text-white mb-1">{t("analytics_no_data")}</h2>
        <p className="text-gray-400 text-sm">{t("analytics_no_data_sub")}</p>
      </div>
    </div>
  );
}
