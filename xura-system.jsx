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
import { AuthProvider, useAuth } from "./src/lib/AuthContext";

// ─── Lazy feature modules ─────────────────────────────────────────────────────
const Login        = lazy(() => import("./features/auth/Login"));
const Dashboard    = lazy(() => import("./features/dashboard/Dashboard"));
const Clubs        = lazy(() => import("./features/clubs/Clubs"));
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

// ─── Protected Route Component ───────────────────────────────────────────────
function ProtectedRoute({ children, module, action = "read" }) {
  const { user, loading, can } = useAuth();
  
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (module && !can(module, action)) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center">
        <div className="text-5xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h2>
        <p className="text-gray-400 mb-6">You don't have permission to access this module.</p>
        <Navigate to="/dashboard" replace />
      </div>
    );
  }
  return children;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, setCollapsed }) {
  const { t } = useTranslation();
  const { can, signOut, profile } = useAuth();

  const NAV = [
    { key: "nav_dashboard", path: "/dashboard", icon: "⚡", module: "dashboard" },
    { key: "nav_clubs",     path: "/clubs",     icon: "🛡️", module: "clubs" },
    { key: "nav_teams",     path: "/teams",     icon: "👥", module: "teams" },
    { key: "nav_players",   path: "/players",   icon: "🤾", module: "players" },
    { key: "nav_matches",   path: "/matches",   icon: "🏐", module: "matches" },
    { key: "nav_scouting",  path: "/scouting",  icon: "📡", module: "scouting" },
    { key: "nav_video",     path: "/video",     icon: "🎬", module: "videos" },
    { key: "nav_analytics", path: "/analytics", icon: "📊", module: "analytics" },
    { key: "nav_training",  path: "/training",  icon: "💪", module: "training" },
    { key: "nav_ai",        path: "/ai",        icon: "🤖", module: "ai" },
    { key: "nav_reports",   path: "/reports",   icon: "📄", module: "reports" },
    { key: "nav_settings",  path: "/settings",  icon: "⚙️", module: "settings" },
  ];

  const allowedNav = NAV.filter(item => !item.module || can(item.module, "read"));

  return (
    <aside
      className={`flex flex-col bg-gray-900 border-e border-gray-800 transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      } min-h-screen`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800">
        <img src="/logo-x.png" alt="X" className="h-8 w-8 object-contain" />
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
        {allowedNav.map((item) => (
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

      {/* User & Footer */}
      <div className="mt-auto border-t border-gray-800">
        {!collapsed && profile && (
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-xs font-bold text-white">
              {profile.full_name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{profile.full_name}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{profile.role?.replace('_', ' ')}</p>
            </div>
          </div>
        )}
        
        <div className="flex flex-col gap-1 p-2">
           <button 
             onClick={signOut}
             className="flex items-center gap-2 p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-all text-sm w-full"
           >
             <span>🚪</span>
             {!collapsed && <span>{t("auth_logout", "Logout")}</span>}
           </button>
           
           {!collapsed && (
            <div className="px-2 py-2 text-[10px] text-gray-600">
              {t("common_copyright")} © {new Date().getFullYear()}
            </div>
          )}
        </div>
      </div>
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
  const { profile } = useAuth();
  return (
    <header className="h-14 bg-gray-900/80 backdrop-blur border-b border-gray-800 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="text-sm text-gray-400 font-medium">{t("app_tagline")}</div>
      <div className="flex items-center gap-3">
        <LangSwitcher />
        <span className="badge bg-red-900/60 text-red-400">{t("common_live")}</span>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-red-900/20">
          {profile?.full_name?.substring(0, 2).toUpperCase() || "XU"}
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
    <div className="flex items-center justify-center h-screen bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-400 text-sm font-medium animate-pulse">{t("common_loading")}</span>
      </div>
    </div>
  );
}

// ─── App Content ──────────────────────────────────────────────────────────────
function AppContent() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;

  return (
    <Router>
      <div className="flex min-h-screen bg-gray-950 text-gray-100">
        {user && <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {user && <TopBar />}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
                  
                  <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute module="dashboard"><Dashboard /></ProtectedRoute>} />
                  <Route path="/clubs" element={<ProtectedRoute module="clubs"><Clubs /></ProtectedRoute>} />
                  <Route path="/teams" element={<ProtectedRoute module="teams"><Teams /></ProtectedRoute>} />
                  <Route path="/players" element={<ProtectedRoute module="players"><Players /></ProtectedRoute>} />
                  <Route path="/matches" element={<ProtectedRoute module="matches"><Matches /></ProtectedRoute>} />
                  <Route path="/scouting" element={<ProtectedRoute module="scouting"><Scouting /></ProtectedRoute>} />
                  <Route path="/video" element={<ProtectedRoute module="videos"><VideoAnalysis /></ProtectedRoute>} />
                  <Route path="/analytics" element={<ProtectedRoute module="analytics"><Analytics /></ProtectedRoute>} />
                  <Route path="/training" element={<ProtectedRoute module="training"><Training /></ProtectedRoute>} />
                  <Route path="/ai" element={<ProtectedRoute module="ai"><AIAssistant /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute module="reports"><Reports /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute module="settings"><Settings /></ProtectedRoute>} />
                  
                  <Route path="*" element={
                    <div className="text-center py-20 text-gray-500">
                      <div className="text-6xl mb-4 font-black">404</div>
                      <p className="text-xl">Page not found</p>
                      <NavLink to="/" className="mt-4 text-red-500 hover:underline inline-block">Go Home</NavLink>
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

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
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

