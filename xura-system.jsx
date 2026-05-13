// xura-system.jsx — XURA System main entry point
import React, { Suspense, lazy, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";
import "./src/index.css";

// ─── Lazy feature modules ───────────────────────────────────────────────────
const Dashboard   = lazy(() => import("./features/dashboard/Dashboard"));
const Teams       = lazy(() => import("./features/teams/Teams"));
const Players     = lazy(() => import("./features/players/Players"));
const Matches     = lazy(() => import("./features/matches/Matches"));
const Scouting    = lazy(() => import("./features/scouting/Scouting"));
const VideoAnalysis = lazy(() => import("./features/video/VideoAnalysis"));
const Analytics   = lazy(() => import("./features/analytics/Analytics"));
const Training    = lazy(() => import("./features/training/Training"));
const AIAssistant = lazy(() => import("./features/ai/AIAssistant"));
const Reports     = lazy(() => import("./features/reports/Reports"));
const Settings    = lazy(() => import("./features/settings/Settings"));

// ─── Nav items ───────────────────────────────────────────────────────────────
const NAV = [
  { label: "Dashboard",      path: "/dashboard",  icon: "⚡" },
  { label: "Teams",          path: "/teams",       icon: "👥" },
  { label: "Players",        path: "/players",     icon: "🤾" },
  { label: "Matches",        path: "/matches",     icon: "🏐" },
  { label: "Scouting",       path: "/scouting",    icon: "📡" },
  { label: "Video Analysis", path: "/video",       icon: "🎬" },
  { label: "Analytics",      path: "/analytics",   icon: "📊" },
  { label: "Training",       path: "/training",    icon: "💪" },
  { label: "AI Assistant",   path: "/ai",          icon: "🤖" },
  { label: "Reports",        path: "/reports",     icon: "📄" },
  { label: "Settings",       path: "/settings",    icon: "⚙️" },
];

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, setCollapsed }) {
  return (
    <aside
      className={`flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-300 ${
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
          className="text-gray-400 hover:text-white transition-colors ml-auto"
          aria-label="Toggle sidebar"
        >
          {collapsed ? "▶" : "◀"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
            title={collapsed ? item.label : undefined}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            {!collapsed && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-600">
          XURA v1.0 © {new Date().getFullYear()}
        </div>
      )}
    </aside>
  );
}

// ─── Top Bar ─────────────────────────────────────────────────────────────────
function TopBar() {
  return (
    <header className="h-14 bg-gray-900/80 backdrop-blur border-b border-gray-800 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="text-sm text-gray-400 font-medium">
        Professional Volleyball Management Platform
      </div>
      <div className="flex items-center gap-3">
        <span className="badge bg-red-900/60 text-red-400">● Live</span>
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
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("XURA Error:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-12 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-6">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Page Loader ─────────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-400 text-sm">Loading module…</span>
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
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
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
  createRoot(container).render(<App />);
}

export default App;
