// features/dashboard/Dashboard.jsx
import React from "react";
import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";

  const stats = [
    { key: "dashboard_total_players",   sub: "dashboard_registered_athletes", icon: "🤾", color: "from-red-600 to-red-800" },
    { key: "dashboard_active_teams",    sub: "dashboard_current_season",       icon: "👥", color: "from-blue-600 to-blue-800" },
    { key: "dashboard_matches_played",  sub: "dashboard_this_season",          icon: "🏐", color: "from-purple-600 to-purple-800" },
    { key: "dashboard_scouting_events", sub: "dashboard_total_recorded",       icon: "📡", color: "from-green-600 to-green-800" },
  ];

  const quickActions = [
    { key: "dashboard_new_match",   icon: "➕", cls: "btn-primary" },
    { key: "dashboard_add_player",  icon: "🤾", cls: "btn-secondary" },
    { key: "dashboard_live_scout",  icon: "📡", cls: "btn-secondary" },
    { key: "dashboard_ai_analysis", icon: "🤖", cls: "btn-secondary" },
  ];

  const kpis = [
    { key: "dashboard_attack_efficiency", icon: "⚔️" },
    { key: "dashboard_sideout",           icon: "🔄" },
    { key: "dashboard_serve_errors",      icon: "🚫" },
  ];

  const dateStr = new Date().toLocaleDateString(
    isAR ? "ar-EG" : "en-GB",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("dashboard_title")}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{t("dashboard_welcome")} · {dateStr}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((a) => (
            <button key={a.key} className={`${a.cls} flex items-center gap-1.5 text-sm`}>
              <span>{a.icon}</span> {t(a.key)}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.key} className="card relative overflow-hidden group hover:border-gray-700 transition-colors">
            <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{s.icon}</span>
                <span className="badge bg-gray-800 text-gray-400">↑ 0%</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">0</div>
              <div className="text-sm font-medium text-gray-300">{t(s.key)}</div>
              <div className="text-xs text-gray-500 mt-0.5">{t(s.sub)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Middle grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <h2 className="text-base font-semibold text-white mb-4">🏐 {t("dashboard_upcoming_matches")}</h2>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-gray-400 text-sm">{t("dashboard_no_matches")}</p>
            <button className="btn-primary mt-4 text-sm">{t("dashboard_schedule_match")}</button>
          </div>
        </div>
        <div className="card">
          <h2 className="text-base font-semibold text-white mb-4">⚡ {t("dashboard_recent_activity")}</h2>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="text-4xl mb-3">🔔</div>
            <p className="text-gray-400 text-sm">{t("dashboard_no_activity")}</p>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <div key={k.key} className="card flex items-center gap-4">
            <span className="text-3xl">{k.icon}</span>
            <div>
              <div className="text-xl font-bold text-white">—</div>
              <div className="text-xs text-gray-400">{t(k.key)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
