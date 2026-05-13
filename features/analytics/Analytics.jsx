// features/analytics/Analytics.jsx
import React from "react";

const METRICS = [
  { label: "Attack Efficiency", value: "—", desc: "Positive attacks / total", icon: "⚔️" },
  { label: "Reception Quality", value: "—", desc: "Avg reception rating",     icon: "🛡️" },
  { label: "Serve Efficiency",  value: "—", desc: "Aces − errors / total",    icon: "🎯" },
  { label: "Block Points",      value: "—", desc: "Blocks per set",            icon: "✋" },
  { label: "Side-Out %",        value: "—", desc: "Side-out success rate",     icon: "🔄" },
  { label: "Break Point %",     value: "—", desc: "Break point success rate",  icon: "💥" },
];

export default function Analytics() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 text-sm mt-0.5">Team and player performance statistics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {METRICS.map((m) => (
          <div key={m.label} className="card flex items-center gap-4 hover:border-gray-700 transition-colors">
            <span className="text-3xl">{m.icon}</span>
            <div>
              <div className="text-2xl font-bold text-white">{m.value}</div>
              <div className="text-sm font-medium text-gray-300">{m.label}</div>
              <div className="text-xs text-gray-500">{m.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-3">📊</div>
        <h2 className="text-base font-semibold text-white mb-1">No data available</h2>
        <p className="text-gray-400 text-sm">
          Start scouting matches to generate charts and heatmaps.
        </p>
      </div>
    </div>
  );
}
