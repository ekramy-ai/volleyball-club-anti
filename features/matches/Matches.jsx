// features/matches/Matches.jsx
import React, { useState } from "react";

const TABS = ["All", "Upcoming", "Completed", "Live"];

export default function Matches() {
  const [tab, setTab] = useState("All");
  const [matches] = useState([]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Matches</h1>
          <p className="text-gray-400 text-sm mt-0.5">Schedule and manage all your matches</p>
        </div>
        <button className="btn-primary text-sm">➕ Schedule Match</button>
      </div>

      <div className="flex gap-2 border-b border-gray-800 pb-0">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t
                ? "border-red-500 text-red-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {matches.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">🏐</div>
          <h2 className="text-lg font-semibold text-white mb-2">No matches found</h2>
          <p className="text-gray-400 text-sm mb-6">Schedule your first match to get started.</p>
          <button className="btn-primary">➕ Schedule Match</button>
        </div>
      ) : null}
    </div>
  );
}
