// features/training/Training.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../src/lib/supabase";

const SESSION_TYPES = ["technical", "tactical", "conditioning", "recovery", "match_prep"];

function TrainingModal({ session, onClose, onSaved }) {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";
  const isEdit = Boolean(session?.id);

  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState({
    title:        session?.title        || "",
    team_id:      session?.team_id      || "",
    session_type: session?.session_type || "technical",
    session_date: session?.session_date ? new Date(session.session_date).toISOString().slice(0, 16) : "",
    duration_min: session?.duration_min || "",
    objectives:   session?.objectives   || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("teams").select("id, name").order("name").then(({ data }) => setTeams(data || []));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError(isAR ? "عنوان الجلسة مطلوب" : "Title is required"); return; }
    
    setLoading(true); setError("");
    
    const payload = { ...form };
    if (!payload.team_id) payload.team_id = null;
    if (payload.duration_min) payload.duration_min = Number(payload.duration_min);
    if (payload.session_date) payload.session_date = new Date(payload.session_date).toISOString();
    else payload.session_date = null;

    try {
      let result;
      if (isEdit) {
        const { data, error: err } = await supabase.from("training_sessions").update(payload).eq("id", session.id).select("*, teams(name)").single();
        if (err) throw err; result = data;
      } else {
        const { data, error: err } = await supabase.from("training_sessions").insert(payload).select("*, teams(name)").single();
        if (err) throw err; result = data;
      }
      onSaved(result, isEdit);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">{isEdit ? (isAR ? "تعديل التدريب" : "Edit Training") : (isAR ? "تدريب جديد" : "New Training")}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-3 py-2">⚠️ {error}</div>}
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">{isAR ? "عنوان التدريب *" : "Title *"}</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">{isAR ? "الفريق" : "Team"}</label>
              <select value={form.team_id} onChange={(e) => set("team_id", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
                <option value="">-- {isAR ? "اختر" : "Select"} --</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{isAR ? "النوع" : "Type"}</label>
              <select value={form.session_type} onChange={(e) => set("session_type", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 capitalize">
                {SESSION_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">{isAR ? "الموعد" : "Date & Time"}</label>
              <input type="datetime-local" value={form.session_date} onChange={(e) => set("session_date", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{isAR ? "المدة (دقائق)" : "Duration (min)"}</label>
              <input type="number" value={form.duration_min} onChange={(e) => set("duration_min", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{isAR ? "الأهداف" : "Objectives"}</label>
            <textarea value={form.objectives} onChange={(e) => set("objectives", e.target.value)} rows="3"
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
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

export default function Training() {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";
  
  const TYPES = [
    { key: "training_all",         value: "All" },
    { key: "training_technical",   value: "technical" },
    { key: "training_tactical",    value: "tactical" },
    { key: "training_conditioning",value: "conditioning" },
    { key: "training_recovery",    value: "recovery" },
  ];
  
  const [typeFilter, setTypeFilter] = useState("All");
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data, error: err } = await supabase.from("training_sessions").select("*, teams(name)").order("session_date", { ascending: false });
      if (err) throw err;
      setSessions(data || []);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (session, isEdit) => {
    setSessions((prev) => isEdit ? prev.map((s) => (s.id === session.id ? session : s)) : [session, ...prev]);
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (!confirm(t("common_delete") + "?")) return;
    const { error: err } = await supabase.from("training_sessions").delete().eq("id", id);
    if (err) { alert(err.message); return; }
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const filtered = typeFilter === "All" ? sessions : sessions.filter(s => s.session_type === typeFilter);

  return (
    <>
      {modal && <TrainingModal session={modal === "create" ? null : modal} onClose={() => setModal(null)} onSaved={handleSaved} />}
      
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t("training_title")}</h1>
            <p className="text-gray-400 text-sm mt-0.5">{t("training_subtitle")}</p>
          </div>
          <button onClick={() => setModal("create")} className="btn-primary text-sm">➕ {t("training_new")}</button>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {TYPES.map((tp) => (
            <button key={tp.value} onClick={() => setTypeFilter(tp.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === tp.value ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
              {t(tp.key)}
            </button>
          ))}
        </div>

        {error && (
          <div className="card border-red-800 bg-red-900/20 text-red-300 text-sm flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div><p className="font-semibold">{t("common_supabase_error")}</p><p className="text-xs mt-0.5">{error}</p></div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">💪</div>
            <h2 className="text-lg font-semibold text-white mb-2">{t("training_no_sessions")}</h2>
            <p className="text-gray-400 text-sm mb-6">{t("training_no_sessions_sub")}</p>
            <button onClick={() => setModal("create")} className="btn-primary">➕ {t("training_create")}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((s) => (
              <div key={s.id} className="card hover:border-gray-700 transition-colors group relative">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-xl">
                    {s.session_type === 'conditioning' ? '🏋️' : s.session_type === 'tactical' ? '🧠' : s.session_type === 'recovery' ? '🧘' : '🏐'}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setModal(s)} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded-lg">{t("common_edit")}</button>
                    <button onClick={() => handleDelete(s.id)} className="text-xs bg-red-900/40 hover:bg-red-900 text-red-400 px-2 py-1 rounded-lg">Del</button>
                  </div>
                </div>
                <h3 className="font-semibold text-white mb-1">{s.title}</h3>
                <div className="text-xs text-gray-400 mb-3 flex items-center gap-2">
                  <span className="badge bg-gray-800 capitalize text-gray-300">{s.session_type}</span>
                  {s.teams?.name && <span className="badge bg-gray-800 text-gray-300">👥 {s.teams.name}</span>}
                </div>
                
                {s.objectives && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{s.objectives}</p>}
                
                <div className="border-t border-gray-800 pt-3 text-xs text-gray-400 flex items-center justify-between">
                  <span>📅 {s.session_date ? new Date(s.session_date).toLocaleDateString(isAR ? "ar-EG" : "en-GB") : "—"}</span>
                  <span>⏱️ {s.duration_min ? `${s.duration_min} min` : "—"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
