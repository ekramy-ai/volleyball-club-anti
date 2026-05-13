// features/training/Training.jsx
import React, { useState } from "react";

const TYPES = ["All", "Technical", "Tactical", "Conditioning", "Recovery"];

export default function Training() {
  const [type, setType] = useState("All");
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Training</h1>
          <p className="text-gray-400 text-sm mt-0.5">Plan and manage training sessions</p>
        </div>
        <button className="btn-primary text-sm">➕ New Session</button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {TYPES.map((t) => (
          <button key={t} onClick={() => setType(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${type === t ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="card flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">💪</div>
        <h2 className="text-lg font-semibold text-white mb-2">No sessions planned</h2>
        <p className="text-gray-400 text-sm mb-6">Create your first training session.</p>
        <button className="btn-primary">➕ Create Session</button>
      </div>
    </div>
  );
}
