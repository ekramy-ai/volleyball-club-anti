// features/players/Players.jsx
import React, { useState } from "react";

const POSITIONS = ["All", "Setter", "Outside Hitter", "Middle Blocker", "Opposite", "Libero"];

export default function Players() {
  const [filter, setFilter] = useState("All");
  const [players] = useState([]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Players</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage player profiles and performance</p>
        </div>
        <button className="btn-primary text-sm">➕ Add Player</button>
      </div>

      {/* Position filter */}
      <div className="flex gap-2 flex-wrap">
        {POSITIONS.map((p) => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === p
                ? "bg-red-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {players.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">🤾</div>
          <h2 className="text-lg font-semibold text-white mb-2">No players yet</h2>
          <p className="text-gray-400 text-sm mb-6">Add your first player to build the roster.</p>
          <button className="btn-primary">➕ Add Player</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {players.map((pl) => (
            <div key={pl.id} className="card hover:border-gray-700 transition-colors">
              <div className="font-semibold text-white">{pl.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
