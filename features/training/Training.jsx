// features/training/Training.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../src/lib/supabase";

const SESSION_TYPES = ["technical", "tactical", "conditioning", "recovery", "match_prep"];
const MICRO_CYCLES = ["Pre-Season", "Competition", "Play-offs", "Active Rest"];
const DRILL_TYPES = ["Serve/Pass", "Block/Defense", "6v6 Transition", "Side-out Phase", "Individual Skill"];

function TrainingModal({ session, onClose, onSaved }) {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";
  const isEdit = Boolean(session?.id);

  const [teams, setTeams] = useState([]);
  
  // Parse existing notes if they exist
  let existingNotes = {};
  try { existingNotes = JSON.parse(session?.notes || "{}"); } catch(e){}

  const [form, setForm] = useState({
    title:        session?.title        || "",
    team_id:      session?.team_id      || "",
    session_type: session?.session_type || "technical",
    session_date: session?.session_date ? new Date(session.session_date).toISOString().slice(0, 16) : "",
    duration_min: session?.duration_min || "",
    objectives:   session?.objectives   || "",
    rpe:          existingNotes.rpe || 5,
    micro_cycle:  existingNotes.micro_cycle || "Competition",
    main_drill:   existingNotes.main_drill || "6v6 Transition"
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
    
    const payload = { 
      title: form.title,
      session_type: form.session_type,
      objectives: form.objectives,
      team_id: form.team_id || null,
      duration_min: form.duration_min ? Number(form.duration_min) : null,
      session_date: form.session_date ? new Date(form.session_date).toISOString() : null,
      notes: JSON.stringify({
        rpe: Number(form.rpe),
        micro_cycle: form.micro_cycle,
        main_drill: form.main_drill
      })
    };

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
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-800/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-red-500">📋</span>
            {isEdit ? (isAR ? "تعديل خطة التدريب" : "Edit Training Plan") : (isAR ? "خطة تدريب جديدة" : "New Training Plan")}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-3 py-2">⚠️ {error}</div>}
          
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">{isAR ? "عنوان التدريب *" : "Title *"}</label>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder={isAR ? "مثال: تكتيك سايد أوت P1" : "e.g. P1 Side-Out Tactics"}
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">{isAR ? "الفريق المستهدف" : "Target Team"}</label>
              <select value={form.team_id} onChange={(e) => set("team_id", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
                <option value="">-- {isAR ? "اختر" : "Select"} --</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">{isAR ? "نوع الجلسة" : "Session Type"}</label>
              <select value={form.session_type} onChange={(e) => set("session_type", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 capitalize">
                {SESSION_TYPES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">{isAR ? "المرحلة (Micro-Cycle)" : "Micro-Cycle Phase"}</label>
              <select value={form.micro_cycle} onChange={(e) => set("micro_cycle", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
                {MICRO_CYCLES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">{isAR ? "التركيز الرئيسي (Main Drill)" : "Main Drill Focus"}</label>
              <select value={form.main_drill} onChange={(e) => set("main_drill", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
                {DRILL_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">{isAR ? "الموعد" : "Date & Time"}</label>
              <input type="datetime-local" value={form.session_date} onChange={(e) => set("session_date", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">{isAR ? "المدة (دقائق)" : "Duration (min)"}</label>
              <input type="number" value={form.duration_min} onChange={(e) => set("duration_min", e.target.value)} placeholder="120"
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </div>

            <div className="col-span-2 border-t border-gray-800 pt-3 mt-1">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs text-gray-400">{isAR ? "معدل المجهود البدني (RPE 1-10)" : "RPE Load (1-10)"}</label>
                <span className={`text-xs font-bold ${form.rpe >= 8 ? 'text-red-500' : form.rpe >= 5 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {form.rpe}/10
                </span>
              </div>
              <input type="range" min="1" max="10" value={form.rpe} onChange={(e) => set("rpe", e.target.value)}
                className="w-full accent-red-600" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">{isAR ? "الأهداف التكتيكية والفنية" : "Tactical & Technical Objectives"}</label>
              <textarea value={form.objectives} onChange={(e) => set("objectives", e.target.value)} rows="3"
                placeholder={isAR ? "اكتب أهداف الوحدة التدريبية هنا..." : "Enter session objectives..."}
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
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
    { key: "Match Prep",           value: "match_prep" },
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
      
      const parsedData = data.map(s => {
        let notes = {};
        try { notes = JSON.parse(s.notes || "{}"); } catch(e){}
        return { ...s, parsedNotes: notes };
      });
      setSessions(parsedData || []);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (session, isEdit) => {
    let notes = {};
    try { notes = JSON.parse(session.notes || "{}"); } catch(e){}
    const formatted = { ...session, parsedNotes: notes };
    setSessions((prev) => isEdit ? prev.map((s) => (s.id === formatted.id ? formatted : s)) : [formatted, ...prev]);
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (!confirm(t("common_delete") + "?")) return;
    const { error: err } = await supabase.from("training_sessions").delete().eq("id", id);
    if (err) { alert(err.message); return; }
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const filtered = typeFilter === "All" ? sessions : sessions.filter(s => s.session_type === typeFilter);

  const rpeColor = (rpe) => rpe >= 8 ? "text-red-400" : rpe >= 5 ? "text-yellow-400" : "text-green-400";

  return (
    <>
      {modal && <TrainingModal session={modal === "create" ? null : modal} onClose={() => setModal(null)} onSaved={handleSaved} />}
      
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-red-500">📋</span> {t("training_title")}
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">{isAR ? "إدارة خطط التدريب والوحدات البدنية (Micro/Macro Cycles)" : "Manage training plans and physical loads (Micro/Macro Cycles)"}</p>
          </div>
          <button onClick={() => setModal("create")} className="btn-primary text-sm font-bold shadow-lg">➕ {t("training_new")}</button>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {TYPES.map((tp) => (
            <button key={tp.value} onClick={() => setTypeFilter(tp.value)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow ${typeFilter === tp.value ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white border border-gray-700"}`}>
              {t(tp.key) || tp.key}
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
          <div className="card flex flex-col items-center justify-center py-20 text-center border-dashed border-gray-700">
            <div className="text-5xl mb-4">💪</div>
            <h2 className="text-lg font-semibold text-white mb-2">{t("training_no_sessions")}</h2>
            <p className="text-gray-400 text-sm mb-6">{t("training_no_sessions_sub")}</p>
            <button onClick={() => setModal("create")} className="btn-primary">➕ {t("training_create")}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((s) => (
              <div key={s.id} className="card hover:border-gray-600 transition-colors group relative flex flex-col h-full bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700 shadow-xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-900" />
                
                <div className="flex justify-between items-start mb-3 mt-1">
                  <div className="flex gap-2 items-center">
                    <div className="w-10 h-10 rounded-lg bg-gray-900 border border-gray-700 flex items-center justify-center text-xl shadow-inner">
                      {s.session_type === 'conditioning' ? '🏋️' : s.session_type === 'tactical' ? '🧠' : s.session_type === 'recovery' ? '🧘' : '🏐'}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{s.title}</h3>
                      <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{s.parsedNotes?.micro_cycle || "General"}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setModal(s)} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded shadow">{t("common_edit")}</button>
                    <button onClick={() => handleDelete(s.id)} className="text-xs bg-red-900/60 hover:bg-red-800 text-red-300 px-2 py-1 rounded shadow">Del</button>
                  </div>
                </div>
                
                <div className="flex gap-2 flex-wrap mb-4">
                  <span className="badge bg-gray-900 border border-gray-700 capitalize text-gray-300 text-[10px]">{s.session_type.replace("_", " ")}</span>
                  {s.teams?.name && <span className="badge bg-gray-900 border border-gray-700 text-blue-300 text-[10px]">🛡️ {s.teams.name}</span>}
                  {s.parsedNotes?.main_drill && <span className="badge bg-gray-900 border border-gray-700 text-yellow-300 text-[10px]">🎯 {s.parsedNotes.main_drill}</span>}
                </div>
                
                {s.objectives && (
                  <div className="bg-gray-900/50 p-3 rounded-lg mb-4 flex-1 border border-gray-800">
                    <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">{s.objectives}</p>
                  </div>
                )}
                
                <div className="mt-auto grid grid-cols-3 divide-x divide-gray-800 border-t border-gray-800 pt-3 text-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase">Date</span>
                    <span className="text-xs font-semibold text-gray-200">{s.session_date ? new Date(s.session_date).toLocaleDateString(isAR ? "ar-EG" : "en-GB", { month: 'short', day: 'numeric'}) : "—"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase">Duration</span>
                    <span className="text-xs font-semibold text-gray-200">{s.duration_min ? `${s.duration_min}m` : "—"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase">Load (RPE)</span>
                    <span className={`text-xs font-bold ${rpeColor(s.parsedNotes?.rpe)}`}>{s.parsedNotes?.rpe || 5}/10</span>
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
