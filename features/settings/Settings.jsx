// features/settings/Settings.jsx
import React, { useState } from "react";

const SECTIONS = ["General", "Account", "Notifications", "Integrations", "Database"];

export default function Settings() {
  const [section, setSection] = useState("General");
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-0.5">Configure your XURA System preferences</p>
      </div>
      <div className="flex gap-6">
        {/* Sidebar */}
        <nav className="w-44 shrink-0 space-y-1">
          {SECTIONS.map((s) => (
            <button key={s} onClick={() => setSection(s)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                section === s ? "bg-red-600/20 text-red-400" : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}>
              {s}
            </button>
          ))}
        </nav>
        {/* Content */}
        <div className="flex-1 card">
          <h2 className="text-base font-semibold text-white mb-4">{section}</h2>
          {section === "General" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Club Name</label>
                <input placeholder="Enter club name" className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Language</label>
                <select className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </div>
              <button className="btn-primary text-sm">Save Changes</button>
            </div>
          )}
          {section === "Integrations" && (
            <div className="space-y-4">
              {["Supabase URL", "Supabase Anon Key", "OpenAI API Key", "Gemini API Key"].map((k) => (
                <div key={k}>
                  <label className="block text-xs text-gray-400 mb-1">{k}</label>
                  <input type="password" placeholder={`Enter ${k}`}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 transition-colors" />
                </div>
              ))}
              <button className="btn-primary text-sm">Save Keys</button>
            </div>
          )}
          {!["General", "Integrations"].includes(section) && (
            <p className="text-gray-400 text-sm">
              {section} settings coming soon.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
