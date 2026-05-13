// features/teams/Teams.jsx
import React, { useState } from "react";

export default function Teams() {
  const [teams] = useState([]);
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Teams</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage your club teams and rosters</p>
        </div>
        <button className="btn-primary text-sm">➕ New Team</button>
      </div>

      {teams.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">👥</div>
          <h2 className="text-lg font-semibold text-white mb-2">No teams yet</h2>
          <p className="text-gray-400 text-sm mb-6">Create your first team to get started.</p>
          <button className="btn-primary">➕ Create Team</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {teams.map((t) => (
            <div key={t.id} className="card hover:border-gray-700 transition-colors">
              <div className="font-semibold text-white">{t.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
