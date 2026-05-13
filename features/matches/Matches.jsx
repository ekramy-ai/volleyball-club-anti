// features/matches/Matches.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../src/lib/supabase";

function MatchModal({ match, onClose, onSaved }) {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";
  const isEdit = Boolean(match?.id);
  
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState({
    home_team_id: match?.home_team_id || "",
    competition:  match?.competition  || "",
    venue:        match?.venue        || "",
    match_date:   match?.match_date ? new Date(match.match_date).toISOString().slice(0, 16) : "",
    status:       match?.status       || "scheduled",
    notes:        match?.notes        || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const STATUSES = ["scheduled", "live", "completed", "postponed", "cancelled"];

  useEffect(() => {
    supabase.from("teams").select("id, name").order("name").then(({ data }) => setTeams(data || []));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    
    // Optional opponent logic could be added here. We'll leave it null for now.
    const payload = { ...form };
    if (!payload.home_team_id) payload.home_team_id = null;
    if (payload.match_date) payload.match_date = new Date(payload.match_date).toISOString();
    else payload.match_date = null;

    try {
      let result;
      if (isEdit) {
        const { data, error: err } = await supabase.from("matches").update(payload).eq("id", match.id).select("*, teams(name)").single();
        if (err) throw err; result = data;
      } else {
        const { data, error: err } = await supabase.from("matches").insert(payload).select("*, teams(name)").single();
        if (err) throw err; result = data;
      }
      onSaved(result, isEdit);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">{isEdit ? (isAR ? "تعديل المباراة" : "Edit Match") : (isAR ? "مباراة جديدة" : "New Match")}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-3 py-2">⚠️ {error}</div>}
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">{isAR ? "الفريق" : "Team"}</label>
            <select value={form.home_team_id} onChange={(e) => set("home_team_id", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
              <option value="">-- {isAR ? "اختر الفريق" : "Select Team"} --</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{isAR ? "البطولة / المنافسة" : "Competition"}</label>
            <input value={form.competition} onChange={(e) => set("competition", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{isAR ? "الملعب" : "Venue"}</label>
            <input value={form.venue} onChange={(e) => set("venue", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">{isAR ? "الموعد" : "Date & Time"}</label>
              <input type="datetime-local" value={form.match_date} onChange={(e) => set("match_date", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{isAR ? "الحالة" : "Status"}</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 capitalize">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">{t("common_cancel")}</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
              {loading ? (isAR ? "جارٍ الحفظ..." : "Saving...") : t("common_save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Matches() {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";
  
  const TABS = isAR ? ["الكل", "قادمة", "مكتملة", "مباشر"] : ["All", "Upcoming", "Completed", "Live"];
  const [tab, setTab] = useState(TABS[0]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data, error: err } = await supabase.from("matches").select("*, teams(name)").order("match_date", { ascending: true });
      if (err) throw err;
      setMatches(data || []);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (match, isEdit) => {
    setMatches((prev) => isEdit ? prev.map((m) => (m.id === match.id ? match : m)) : [...prev, match]);
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (!confirm(t("common_delete") + "?")) return;
    const { error: err } = await supabase.from("matches").delete().eq("id", id);
    if (err) { alert(err.message); return; }
    setMatches((prev) => prev.filter((m) => m.id !== id));
  };

  const statusBadge = (s) => {
    const colors = { scheduled: "bg-blue-900/60 text-blue-300", live: "bg-red-900/60 text-red-300 animate-pulse", completed: "bg-green-900/60 text-green-300", postponed: "bg-yellow-900/60 text-yellow-300", cancelled: "bg-gray-800 text-gray-400" };
    return colors[s] || "bg-gray-800 text-gray-400";
  };

  return (
    <>
      {modal && <MatchModal match={modal === "create" ? null : modal} onClose={() => setModal(null)} onSaved={handleSaved} />}
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t("nav_matches")}</h1>
            <p className="text-gray-400 text-sm mt-0.5">{isAR ? "جدولة وإدارة كافة المباريات" : "Schedule and manage all your matches"}</p>
          </div>
          <button onClick={() => setModal("create")} className="btn-primary text-sm">➕ {isAR ? "جدولة مباراة" : "Schedule Match"}</button>
        </div>

        {error && (
          <div className="card border-red-800 bg-red-900/20 text-red-300 text-sm flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">{t("common_supabase_error")}</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 border-b border-gray-800 pb-0 overflow-x-auto">
          {TABS.map((t_name) => (
            <button key={t_name} onClick={() => setTab(t_name)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px ${tab === t_name ? "border-red-500 text-red-400" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
              {t_name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : matches.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🏐</div>
            <h2 className="text-lg font-semibold text-white mb-2">{isAR ? "لا توجد مباريات" : "No matches found"}</h2>
            <p className="text-gray-400 text-sm mb-6">{isAR ? "قم بجدولة أول مباراة للبدء." : "Schedule your first match to get started."}</p>
            <button onClick={() => setModal("create")} className="btn-primary">➕ {isAR ? "جدولة مباراة" : "Schedule Match"}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {matches.map((m) => (
              <div key={m.id} className="card hover:border-gray-700 transition-colors group relative">
                <div className="flex items-center justify-between mb-4">
                  <span className={`badge capitalize text-xs ${statusBadge(m.status)}`}>{m.status}</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                     <button onClick={() => setModal(m)} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-lg">{t("common_edit")}</button>
                     <button onClick={() => handleDelete(m.id)} className="text-xs bg-red-900/40 text-red-400 px-2 py-1 rounded-lg">Del</button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-center mb-6">
                  <div className="flex-1">
                    <div className="w-12 h-12 mx-auto rounded-full bg-gray-800 flex items-center justify-center mb-2">
                       <span className="text-lg">🛡️</span>
                    </div>
                    <div className="font-semibold text-white text-sm">{m.teams?.name || (isAR ? "فريق غير محدد" : "Unknown Team")}</div>
                  </div>
                  <div className="px-4 text-gray-500 text-sm font-bold">VS</div>
                  <div className="flex-1">
                    <div className="w-12 h-12 mx-auto rounded-full bg-gray-800 flex items-center justify-center mb-2">
                       <span className="text-lg">❓</span>
                    </div>
                    <div className="font-semibold text-white text-sm">{isAR ? "الخصم" : "Opponent"}</div>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-3 text-xs text-gray-400 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span>🏆 {m.competition || "—"}</span>
                    <span>📍 {m.venue || "—"}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    🕒 {m.match_date ? new Date(m.match_date).toLocaleString(isAR ? "ar-EG" : "en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
