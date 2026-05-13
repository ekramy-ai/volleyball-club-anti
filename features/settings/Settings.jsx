// features/settings/Settings.jsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../src/lib/supabase";
import { switchLanguage } from "../../src/i18n";
import { seedDatabase } from "../../src/lib/seeder";

function DatabasePanel() {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";
  
  const [counts, setCounts] = useState({ clubs: 0, teams: 0, players: 0, matches: 0, events: 0 });
  const [loading, setLoading] = useState(true);

  const loadCounts = async () => {
    setLoading(true);
    try {
      const [cRes, tRes, pRes, mRes, eRes] = await Promise.all([
        supabase.from("clubs").select("id", { count: "exact", head: true }),
        supabase.from("teams").select("id", { count: "exact", head: true }),
        supabase.from("players").select("id", { count: "exact", head: true }),
        supabase.from("matches").select("id", { count: "exact", head: true }),
        supabase.from("scouting_events").select("id", { count: "exact", head: true }),
      ]);
      setCounts({
        clubs: cRes.count || 0,
        teams: tRes.count || 0,
        players: pRes.count || 0,
        matches: mRes.count || 0,
        events: eRes.count || 0,
      });
    } catch(e) {}
    setLoading(false);
  };

  useEffect(() => { loadCounts(); }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: isAR ? "الأندية" : "Clubs", val: counts.clubs, icon: "🛡️", color: "text-red-500" },
          { label: isAR ? "الفرق" : "Teams", val: counts.teams, icon: "👥", color: "text-blue-500" },
          { label: isAR ? "اللاعبون" : "Players", val: counts.players, icon: "🤾", color: "text-green-500" },
          { label: isAR ? "المباريات" : "Matches", val: counts.matches, icon: "🏐", color: "text-purple-500" },
          { label: isAR ? "الأحداث" : "Events", val: counts.events, icon: "📡", color: "text-orange-500" },
        ].map((c, i) => (
          <div key={i} className="bg-gray-800 border border-gray-700 p-4 rounded-xl flex flex-col items-center justify-center text-center shadow">
            <span className="text-2xl mb-1">{c.icon}</span>
            <span className={`text-xl font-bold ${c.color}`}>
              {loading ? <span className="animate-pulse">...</span> : c.val}
            </span>
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-gray-800/50 border border-gray-700 p-5 rounded-xl space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span className="text-yellow-500">⚠️</span> {isAR ? "أدوات المطور والاختبار" : "Developer & Testing Tools"}
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          {isAR 
            ? "استخدم هذه الأدوات لملء قاعدة البيانات ببيانات افتراضية (100 لاعب، 5 أندية، الخ) لاختبار أداء النظام. لا تستخدمها في بيئة الإنتاج."
            : "Use these tools to seed the database with mock data (100 players, 5 clubs, etc) for system testing. Do not use in production."}
        </p>
        <div className="flex gap-3 pt-2">
          <button onClick={() => { seedDatabase().then(loadCounts); }} className="btn-primary shadow-lg flex items-center gap-2">
            <span>🚀</span> {isAR ? "توليد بيانات اختبارية (Seed)" : "Seed Test Data"}
          </button>
          <button onClick={loadCounts} className="btn-secondary">
            {isAR ? "تحديث الأرقام" : "Refresh Counts"}
          </button>
        </div>
      </div>
    </div>
  );
}

function IntegrationsPanel() {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";
  const [status, setStatus] = useState(null);
  const [errMsg, setErrMsg] = useState("");

  const testConnection = async () => {
    setStatus("testing"); setErrMsg("");
    try {
      const { error } = await supabase.from("clubs").select("id").limit(1);
      if (error) throw error;
      setStatus("ok");
    } catch (err) {
      setErrMsg(err.message);
      setStatus("error");
    }
  };

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const hasEnv = url && url !== "https://your-project-id.supabase.co";

  return (
    <div className="space-y-6">
      {!hasEnv && (
        <div className="bg-yellow-900/30 border border-yellow-700/60 rounded-xl p-4 text-sm shadow">
          <p className="font-bold text-yellow-500 mb-1 flex items-center gap-2"><span>⚠️</span> {t("settings_supabase_not_configured")}</p>
          <p className="text-yellow-200/70 text-xs leading-relaxed">{t("settings_supabase_warning")}</p>
        </div>
      )}
      <div className="space-y-4">
        {[
          { label: "Supabase Project URL", val: url },
          { label: "Supabase Anon Key", val: key ? `${key.slice(0,20)}••••••••••` : null },
        ].map(({ label, val }) => (
          <div key={label} className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-inner">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{label}</label>
            <div className="w-full bg-gray-900 text-green-400 rounded px-3 py-2 text-sm font-mono truncate border border-black shadow-inner">
              {val || <span className="text-red-500 font-bold">{t("common_not_set")}</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
        <button onClick={testConnection} disabled={status === "testing"}
          className="btn-primary text-sm disabled:opacity-50 font-bold px-6 shadow-lg">
          {status === "testing" ? t("settings_testing") : t("settings_test_connection")}
        </button>
        {status === "ok"    && <span className="text-green-500 text-sm font-bold flex items-center gap-1"><span>✅</span> {t("settings_connected")}</span>}
        {status === "error" && <span className="text-red-500 text-sm font-bold flex items-center gap-1"><span>❌</span> {errMsg}</span>}
      </div>
      <p className="text-xs text-gray-500 italic mt-4">{t("settings_note")}</p>
    </div>
  );
}

function GeneralPanel() {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";
  const [lang, setLang] = useState(i18n.language);

  const handleSave = () => {
    if (lang !== i18n.language) {
      switchLanguage(lang);
    }
    alert(isAR ? "تم حفظ الإعدادات بنجاح" : "Settings saved successfully");
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow">
        <div className="mb-4 pb-4 border-b border-gray-700">
          <label className="block text-sm font-bold text-gray-300 mb-2">{isAR ? "اسم المنصة" : "Platform Name"}</label>
          <input defaultValue="XURA Sports System" readOnly
            className="w-full bg-gray-900 border border-gray-800 text-gray-400 rounded-lg px-4 py-2.5 text-sm focus:outline-none cursor-not-allowed" />
          <p className="text-[10px] text-gray-500 mt-1">{isAR ? "اسم النظام لا يمكن تغييره حالياً" : "System name cannot be changed currently"}</p>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">{t("settings_language")}</label>
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <button onClick={() => setLang("en")} className={`py-3 rounded-lg border text-sm font-bold transition-colors ${lang === "en" ? "bg-red-600 border-red-600 text-white shadow-lg" : "bg-gray-900 border-gray-700 text-gray-400 hover:text-white"}`}>
              English (EN)
            </button>
            <button onClick={() => setLang("ar")} className={`py-3 rounded-lg border text-sm font-bold transition-colors ${lang === "ar" ? "bg-red-600 border-red-600 text-white shadow-lg" : "bg-gray-900 border-gray-700 text-gray-400 hover:text-white"}`}>
              العربية (AR)
            </button>
          </div>
        </div>
      </div>

      <button onClick={handleSave} className="btn-primary font-bold px-8 shadow-lg text-sm">
        {t("settings_save")}
      </button>
    </div>
  );
}

export default function Settings() {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";
  
  const SECTIONS = [
    { key: "settings_general",       value: "General",      icon: "⚙️" },
    { key: "settings_database",      value: "Database",     icon: "🗄️" },
    { key: "settings_integrations",  value: "Integrations", icon: "🔌" },
    { key: "settings_account",       value: "Account",      icon: "👤" },
  ];
  const [section, setSection] = useState("General");

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-wide flex items-center gap-3">
            <span className="text-red-500">⚙️</span> {t("settings_title")}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{t("settings_subtitle")}</p>
        </div>
        <div className="hidden sm:block text-5xl opacity-20">⚙️</div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Sidebar Nav */}
        <nav className="w-full lg:w-64 shrink-0 flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
          {SECTIONS.map((s) => (
            <button key={s.value} onClick={() => setSection(s.value)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                section === s.value 
                  ? "bg-red-600 text-white shadow-lg shadow-red-900/20 translate-x-1" 
                  : "bg-gray-800 text-gray-400 border border-transparent hover:border-gray-700 hover:text-gray-200"
              }`}>
              <span className="text-lg">{s.icon}</span>
              {t(s.key)}
            </button>
          ))}
        </nav>
        
        {/* Content Area */}
        <div className="flex-1 bg-[#111] p-6 sm:p-8 rounded-2xl border border-gray-800 shadow-2xl min-h-[500px]">
          <h2 className="text-xl font-bold text-white mb-6 pb-4 border-b border-gray-800 flex items-center gap-2">
            <span>{SECTIONS.find(s => s.value === section)?.icon}</span>
            {t(SECTIONS.find(s => s.value === section)?.key || "")}
          </h2>
          
          <div className="animate-fade-in">
            {section === "General" && <GeneralPanel />}
            {section === "Database" && <DatabasePanel />}
            {section === "Integrations" && <IntegrationsPanel />}
            {section === "Account" && (
              <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-700 rounded-xl">
                <span className="text-4xl mb-3">👤</span>
                <p className="text-gray-400 font-medium">{t("settings_coming_soon")}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
