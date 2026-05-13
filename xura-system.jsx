// xura-system.jsx — XURA System main entry point (bilingual AR/EN)
import React, { Suspense, lazy, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";
import { I18nextProvider, useTranslation } from "react-i18next";
import i18n, { switchLanguage } from "./src/i18n.js";
import "./src/index.css";

// ─── Lazy feature modules ─────────────────────────────────────────────────────
const Dashboard    = lazy(() => import("./features/dashboard/Dashboard"));
const Teams        = lazy(() => import("./features/teams/Teams"));
const Players      = lazy(() => import("./features/players/Players"));
const Matches      = lazy(() => import("./features/matches/Matches"));
const Scouting     = lazy(() => import("./features/scouting/Scouting"));
const VideoAnalysis= lazy(() => import("./features/video/VideoAnalysis"));
const Analytics    = lazy(() => import("./features/analytics/Analytics"));
const Training     = lazy(() => import("./features/training/Training"));
const AIAssistant  = lazy(() => import("./features/ai/AIAssistant"));
const Reports      = lazy(() => import("./features/reports/Reports"));
const Settings     = lazy(() => import("./features/settings/Settings"));

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, setCollapsed }) {
  const { t } = useTranslation();

  const NAV = [
    { key: "nav_dashboard", path: "/dashboard", icon: "⚡" },
    { key: "nav_teams",     path: "/teams",     icon: "👥" },
    { key: "nav_players",   path: "/players",   icon: "🤾" },
    { key: "nav_matches",   path: "/matches",   icon: "🏐" },
    { key: "nav_scouting",  path: "/scouting",  icon: "📡" },
    { key: "nav_video",     path: "/video",     icon: "🎬" },
    { key: "nav_analytics", path: "/analytics", icon: "📊" },
    { key: "nav_training",  path: "/training",  icon: "💪" },
    { key: "nav_ai",        path: "/ai",        icon: "🤖" },
    { key: "nav_reports",   path: "/reports",   icon: "📄" },
    { key: "nav_settings",  path: "/settings",  icon: "⚙️" },
  ];

  return (
    <aside
      className={`flex flex-col bg-gray-900 border-e border-gray-800 transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      } min-h-screen`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-800">
        {!collapsed && (
          <span className="text-xl font-extrabold tracking-wider text-white">
            <span className="text-red-500">X</span>URA
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white transition-colors ms-auto"
          aria-label="Toggle sidebar"
        >
          {collapsed ? "▶" : "◀"}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            title={collapsed ? t(item.key) : undefined}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            {!collapsed && <span className="text-sm font-medium">{t(item.key)}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-600">
          {t("common_copyright")} © {new Date().getFullYear()}
        </div>
      )}
    </aside>
  );
}

// ─── Language Switcher ────────────────────────────────────────────────────────
function LangSwitcher() {
  const { i18n: i } = useTranslation();
  const isAR = i.language === "ar";

  const toggle = () => switchLanguage(isAR ? "en" : "ar");

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border border-gray-700"
      title="Switch language / تغيير اللغة"
    >
      <span>{isAR ? "🇺🇸 EN" : "🇸🇦 عربي"}</span>
    </button>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────
function TopBar() {
  const { t } = useTranslation();
  return (
    <header className="h-14 bg-gray-900/80 backdrop-blur border-b border-gray-800 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="text-sm text-gray-400 font-medium">{t("app_tagline")}</div>
      <div className="flex items-center gap-3">
        <LangSwitcher />
        <span className="badge bg-red-900/60 text-red-400">{t("common_live")}</span>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-bold">
          SA
        </div>
      </div>
    </header>
  );
}

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(e) { return { hasError: true, error: e }; }
  componentDidCatch(e, info) { console.error("XURA Error:", e, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-12 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-6">{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })} className="btn-primary">
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Page Loader ──────────────────────────────────────────────────────────────
function PageLoader() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-400 text-sm">{t("common_loading")}</span>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Router>
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6">
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/"           element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard"  element={<Dashboard />} />
                  <Route path="/teams"      element={<Teams />} />
                  <Route path="/players"    element={<Players />} />
                  <Route path="/matches"    element={<Matches />} />
                  <Route path="/scouting"   element={<Scouting />} />
                  <Route path="/video"      element={<VideoAnalysis />} />
                  <Route path="/analytics"  element={<Analytics />} />
                  <Route path="/training"   element={<Training />} />
                  <Route path="/ai"         element={<AIAssistant />} />
                  <Route path="/reports"    element={<Reports />} />
                  <Route path="/settings"   element={<Settings />} />
                  <Route path="*" element={
                    <div className="text-center py-20 text-gray-500">
                      <div className="text-6xl mb-4">404</div>
                      <p>Page not found</p>
                    </div>
                  } />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </Router>
  );
}

// ─── Mount ────────────────────────────────────────────────────────────────────
const container = document.getElementById("root");
if (container) {
  createRoot(container).render(
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  );
}

export default App;
