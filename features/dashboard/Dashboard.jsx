// features/dashboard/Dashboard.jsx
import React from "react";

const stats = [
  { label: "Total Players",   value: "0",  icon: "🤾", color: "from-red-600 to-red-800",    sub: "Registered athletes" },
  { label: "Active Teams",    value: "0",  icon: "👥", color: "from-blue-600 to-blue-800",   sub: "Current season" },
  { label: "Matches Played",  value: "0",  icon: "🏐", color: "from-purple-600 to-purple-800", sub: "This season" },
  { label: "Scouting Events", value: "0",  icon: "📡", color: "from-green-600 to-green-800",  sub: "Total recorded" },
];

const quickActions = [
  { label: "New Match",   icon: "➕", color: "btn-primary" },
  { label: "Add Player",  icon: "🤾", color: "btn-secondary" },
  { label: "Live Scout",  icon: "📡", color: "btn-secondary" },
  { label: "AI Analysis", icon: "🤖", color: "btn-secondary" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Welcome back · {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          {quickActions.map((a) => (
            <button key={a.label} className={a.color + " flex items-center gap-1.5 text-sm"}>
              <span>{a.icon}</span> {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card relative overflow-hidden group hover:border-gray-700 transition-colors">
            <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{s.icon}</span>
                <span className="badge bg-gray-800 text-gray-400">↑ 0%</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-sm font-medium text-gray-300">{s.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming matches */}
        <div className="card lg:col-span-2">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            🏐 Upcoming Matches
          </h2>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-gray-400 text-sm">No upcoming matches scheduled.</p>
            <button className="btn-primary mt-4 text-sm">Schedule a Match</button>
          </div>
        </div>

        {/* Recent activity */}
        <div className="card">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            ⚡ Recent Activity
          </h2>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="text-4xl mb-3">🔔</div>
            <p className="text-gray-400 text-sm">No recent activity.</p>
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Attack Efficiency", value: "—", icon: "⚔️" },
          { label: "Side-Out %",        value: "—", icon: "🔄" },
          { label: "Serve Errors",      value: "—", icon: "🚫" },
        ].map((s) => (
          <div key={s.label} className="card flex items-center gap-4">
            <span className="text-3xl">{s.icon}</span>
            <div>
              <div className="text-xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
