// features/reports/Reports.jsx
import React from "react";

const REPORT_TYPES = [
  { label: "Match Summary",    icon: "🏐", desc: "Full match event breakdown" },
  { label: "Player Report",    icon: "🤾", desc: "Individual performance stats" },
  { label: "Training Report",  icon: "💪", desc: "Session attendance and load" },
  { label: "Season Overview",  icon: "📅", desc: "Season-wide statistics" },
];

export default function Reports() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-gray-400 text-sm mt-0.5">Generate and export professional PDF reports</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORT_TYPES.map((r) => (
          <div key={r.label} className="card flex items-center gap-4 hover:border-gray-700 transition-colors cursor-pointer group">
            <span className="text-3xl">{r.icon}</span>
            <div className="flex-1">
              <div className="font-semibold text-white">{r.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{r.desc}</div>
            </div>
            <button className="btn-secondary text-xs opacity-0 group-hover:opacity-100 transition-opacity">
              Generate
            </button>
          </div>
        ))}
      </div>
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-3">📄</div>
        <p className="text-gray-400 text-sm">No reports generated yet. Select a report type above.</p>
      </div>
    </div>
  );
}
