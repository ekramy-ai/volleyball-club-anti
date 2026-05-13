// features/settings/Settings.jsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../src/lib/supabase";

function IntegrationsPanel() {
  const { t } = useTranslation();
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
    <div className="space-y-5">
      {!hasEnv && (
        <div className="bg-yellow-900/30 border border-yellow-700/60 rounded-xl p-4 text-sm">
          <p className="font-semibold text-yellow-300 mb-1">⚠️ {t("settings_supabase_not_configured")}</p>
          <p className="text-yellow-200/70 text-xs leading-relaxed">{t("settings_supabase_warning")}</p>
        </div>
      )}
      <div className="space-y-3">
        {[
          { label: "VITE_SUPABASE_URL", val: url },
          { label: "VITE_SUPABASE_ANON_KEY", val: key ? `${key.slice(0,20)}…` : null },
        ].map(({ label, val }) => (
          <div key={label}>
            <label className="block text-xs text-gray-400 mb-1">{label}</label>
            <div className="w-full bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm font-mono truncate">
              {val || <span className="text-red-400">{t("common_not_set")}</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={testConnection} disabled={status === "testing"}
          className="btn-primary text-sm disabled:opacity-50">
          {status === "testing" ? t("settings_testing") : t("settings_test_connection")}
        </button>
        {status === "ok"    && <span className="text-green-400 text-sm font-medium">{t("settings_connected")}</span>}
        {status === "error" && <span className="text-red-400 text-sm font-medium">❌ {errMsg}</span>}
      </div>
      <p className="text-xs text-gray-500 border-t border-gray-800 pt-3">{t("settings_note")}</p>
    </div>
  );
}

export default function Settings() {
  const { t } = useTranslation();
  const SECTIONS = [
    { key: "settings_general",       value: "General" },
    { key: "settings_account",       value: "Account" },
    { key: "settings_notifications", value: "Notifications" },
    { key: "settings_integrations",  value: "Integrations" },
    { key: "settings_database",      value: "Database" },
  ];
  const [section, setSection] = useState("Integrations");

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">{t("settings_title")}</h1>
        <p className="text-gray-400 text-sm mt-0.5">{t("settings_subtitle")}</p>
      </div>
      <div className="flex gap-6">
        <nav className="w-44 shrink-0 space-y-1">
          {SECTIONS.map((s) => (
            <button key={s.value} onClick={() => setSection(s.value)}
              className={`w-full text-start px-3 py-2 rounded-lg text-sm font-medium transition-colors ${section === s.value ? "bg-red-600/20 text-red-400" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}>
              {t(s.key)}
            </button>
          ))}
        </nav>
        <div className="flex-1 card">
          <h2 className="text-base font-semibold text-white mb-4">{t(SECTIONS.find(s => s.value === section)?.key || "")}</h2>
          {section === "General" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">{t("settings_club_name")}</label>
                <input placeholder={t("settings_club_name")}
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">{t("settings_language")}</label>
                <select className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </div>
              <button className="btn-primary text-sm">{t("settings_save")}</button>
            </div>
          )}
          {section === "Integrations" && <IntegrationsPanel />}
          {!["General","Integrations"].includes(section) && (
            <p className="text-gray-400 text-sm">{t(SECTIONS.find(s=>s.value===section)?.key||"")} {t("settings_coming_soon")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
