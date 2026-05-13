// features/dashboard/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../src/lib/supabase";
import { Link } from "react-router-dom";
import { seedDatabase } from "../../src/lib/seeder";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";
  
  const [counts, setCounts] = useState({ players: 0, teams: 0, matches: 0, scouting: 0 });
  const [upcoming, setUpcoming] = useState([]);
  const [recent, setRecent] = useState([]);
  const [kpis, setKpis] = useState({ attackEff: 0, sideOut: 0, serveErr: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        // 1. Load Counts
        const [plRes, tmRes, mtRes, scRes] = await Promise.all([
          supabase.from("players").select("id", { count: "exact", head: true }),
          supabase.from("teams").select("id", { count: "exact", head: true }),
          supabase.from("matches").select("id", { count: "exact", head: true }),
          supabase.from("scouting_events").select("id", { count: "exact", head: true }),
        ]);

        setCounts({
          players: plRes.count || 0,
          teams: tmRes.count || 0,
          matches: mtRes.count || 0,
          scouting: scRes.count || 0,
        });

        // 2. Load Upcoming Matches
        const { data: matchesData } = await supabase
          .from("matches")
          .select("*, teams(name)")
          .eq("status", "scheduled")
          .order("match_date", { ascending: true })
          .limit(3);
        setUpcoming(matchesData || []);

        // 3. Load Recent Activity (Last 5 scouting events)
        const { data: eventsData } = await supabase
          .from("scouting_events")
          .select("*, players(full_name)")
          .order("created_at", { ascending: false })
          .limit(5);
        setRecent(eventsData || []);

        // 4. Calculate KPIs from all scouting events
        const { data: allScouting } = await supabase.from("scouting_events").select("skill, result");
        if (allScouting && allScouting.length > 0) {
          let attackTotal = 0, attackKill = 0, attackErr = 0;
          let serveErr = 0;
          let sideOutChances = 0, sideOutSuccess = 0;

          allScouting.forEach(ev => {
            if (ev.skill === "attack") {
              attackTotal++;
              if (ev.result === "point") attackKill++;
              if (ev.result === "error") attackErr++;
            }
            if (ev.skill === "serve" && ev.result === "error") {
              serveErr++;
            }
            // Rough approximation for sideout: if we receive positively or attack point after reception
            if (ev.skill === "reception") {
              sideOutChances++;
              if (ev.result === "positive" || ev.result === "point") sideOutSuccess++;
            }
          });

          const eff = attackTotal > 0 ? ((attackKill - attackErr) / attackTotal) * 100 : 0;
          const so = sideOutChances > 0 ? (sideOutSuccess / sideOutChances) * 100 : 0;
          
          setKpis({
            attackEff: eff.toFixed(1),
            sideOut: so.toFixed(1),
            serveErr: serveErr
          });
        }

      } catch (err) {
        console.error("Dashboard data error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const stats = [
    { key: "dashboard_total_players",   sub: "dashboard_registered_athletes", icon: "🤾", color: "from-red-600 to-red-800", value: counts.players },
    { key: "dashboard_active_teams",    sub: "dashboard_current_season",       icon: "👥", color: "from-blue-600 to-blue-800", value: counts.teams },
    { key: "dashboard_matches_played",  sub: "dashboard_this_season",          icon: "🏐", color: "from-purple-600 to-purple-800", value: counts.matches },
    { key: "dashboard_scouting_events", sub: "dashboard_total_recorded",       icon: "📡", color: "from-green-600 to-green-800", value: counts.scouting },
  ];

  const quickActions = [
    { key: "dashboard_new_match",   path: "/matches",  icon: "➕", cls: "btn-primary" },
    { key: "dashboard_add_player",  path: "/players",  icon: "🤾", cls: "btn-secondary" },
    { key: "dashboard_live_scout",  path: "/scouting", icon: "📡", cls: "btn-secondary" },
    { key: "dashboard_ai_analysis", path: "/ai",       icon: "🤖", cls: "btn-secondary" },
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{t("dashboard_title")}</h1>
            <button onClick={seedDatabase} className="bg-yellow-500 hover:bg-yellow-600 text-black text-xs font-bold px-2 py-1 rounded shadow" title="Temporary Seed Button">🚀 Seed Test Data</button>
          </div>
          <p className="text-gray-400 text-sm mt-0.5">{t("dashboard_welcome")} · {dateStr}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((a) => (
            <Link to={a.path} key={a.key} className={`${a.cls} flex items-center gap-1.5 text-sm`}>
              <span>{a.icon}</span> {t(a.key)}
            </Link>
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
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {loading ? <span className="animate-pulse bg-gray-800 text-transparent rounded">000</span> : s.value}
              </div>
              <div className="text-sm font-medium text-gray-300">{t(s.key)}</div>
              <div className="text-xs text-gray-500 mt-0.5">{t(s.sub)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Middle grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming Matches */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">🏐 {t("dashboard_upcoming_matches")}</h2>
            <Link to="/matches" className="text-sm text-red-500 hover:text-red-400">{isAR ? "عرض الكل" : "View All"}</Link>
          </div>
          
          {loading ? (
             <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-gray-400 text-sm">{t("dashboard_no_matches")}</p>
              <Link to="/matches" className="btn-primary mt-4 text-sm">{t("dashboard_schedule_match")}</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-xl border border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xl">🛡️</div>
                    <div>
                      <div className="font-bold text-white text-sm">{m.teams?.name || (isAR ? "فريق غير محدد" : "Unknown")} <span className="text-gray-500 mx-1">vs</span> Opponent</div>
                      <div className="text-xs text-gray-400">{m.competition || (isAR ? "مباراة ودية" : "Friendly")}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white font-medium">
                      {new Date(m.match_date).toLocaleDateString(isAR ? "ar-EG" : "en-GB", { month: "short", day: "numeric" })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(m.match_date).toLocaleTimeString(isAR ? "ar-EG" : "en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-base font-semibold text-white mb-4">⚡ {t("dashboard_recent_activity")}</h2>
          {loading ? (
             <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="text-4xl mb-3">🔔</div>
              <p className="text-gray-400 text-sm">{t("dashboard_no_activity")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recent.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm text-white">
                      <span className="font-semibold text-red-400">{ev.players?.full_name || (isAR ? "لاعب غير محدد" : "Unknown Player")}</span> 
                      {isAR ? " سجل " : " logged "} 
                      <span className="font-semibold">{ev.skill}</span> ({ev.result})
                    </p>
                    <p className="text-xs text-gray-500">{new Date(ev.created_at).toLocaleString(isAR ? "ar-EG" : "en-GB")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4 border-l-4 border-l-green-500">
          <span className="text-3xl">⚔️</span>
          <div>
            <div className="text-xl font-bold text-white">{kpis.attackEff}%</div>
            <div className="text-xs text-gray-400">{t("dashboard_attack_efficiency")}</div>
          </div>
        </div>
        <div className="card flex items-center gap-4 border-l-4 border-l-blue-500">
          <span className="text-3xl">🔄</span>
          <div>
            <div className="text-xl font-bold text-white">{kpis.sideOut}%</div>
            <div className="text-xs text-gray-400">{t("dashboard_sideout")}</div>
          </div>
        </div>
        <div className="card flex items-center gap-4 border-l-4 border-l-red-500">
          <span className="text-3xl">🚫</span>
          <div>
            <div className="text-xl font-bold text-white">{kpis.serveErr}</div>
            <div className="text-xs text-gray-400">{t("dashboard_serve_errors")}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
