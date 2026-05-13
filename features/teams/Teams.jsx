// features/teams/Teams.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../src/lib/supabase";

const CATEGORIES = ["U12","U14","U16","U18","U21","Senior","Masters"];

function TeamModal({ team, onClose, onSaved }) {
  const { t } = useTranslation();
  const isEdit = Boolean(team?.id);
  const GENDERS = [
    { v: "male",   label: t("teams_male") },
    { v: "female", label: t("teams_female") },
    { v: "mixed",  label: t("teams_mixed") },
  ];
  const [form, setForm] = useState({ name: team?.name || "", age_category: team?.age_category || "Senior", gender: team?.gender || "male" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError(t("teams_name_required")); return; }
    setLoading(true); setError("");
    try {
      let result;
      if (isEdit) {
        const { data, error: err } = await supabase.from("teams").update(form).eq("id", team.id).select().single();
        if (err) throw err; result = data;
      } else {
        const { data, error: err } = await supabase.from("teams").insert(form).select().single();
        if (err) throw err; result = data;
      }
      onSaved(result, isEdit);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">{isEdit ? t("teams_modal_edit") : t("teams_modal_create")}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-3 py-2">⚠️ {error}</div>}
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t("teams_name")} *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={t("teams_name_placeholder")}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t("teams_category")}</label>
            <select value={form.age_category} onChange={(e) => set("age_category", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t("teams_gender")}</label>
            <div className="flex gap-2">
              {GENDERS.map((g) => (
                <button type="button" key={g.v} onClick={() => set("gender", g.v)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${form.gender === g.v ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">{t("common_cancel")}</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
              {loading ? t("teams_saving") : isEdit ? t("teams_update") : t("teams_create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const genderBadge = (g) => ({ male: "bg-blue-900/60 text-blue-300", female: "bg-pink-900/60 text-pink-300", mixed: "bg-purple-900/60 text-purple-300" }[g] || "bg-gray-800 text-gray-400");

export default function Teams() {
  const { t } = useTranslation();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data, error: err } = await supabase.from("teams").select("*").order("name");
      if (err) throw err;
      setTeams(data || []);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (team, isEdit) => {
    setTeams((prev) => isEdit ? prev.map((t) => (t.id === team.id ? team : t)) : [...prev, team]);
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (!confirm(t("teams_delete_confirm"))) return;
    const { error: err } = await supabase.from("teams").delete().eq("id", id);
    if (err) { alert(err.message); return; }
    setTeams((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {modal && <TeamModal team={modal === "create" ? null : modal} onClose={() => setModal(null)} onSaved={handleSaved} />}
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t("teams_title")}</h1>
            <p className="text-gray-400 text-sm mt-0.5">{t("teams_subtitle")}</p>
          </div>
          <button onClick={() => setModal("create")} className="btn-primary text-sm">➕ {t("teams_new")}</button>
        </div>

        {error && (
          <div className="card border-red-800 bg-red-900/20 text-red-300 text-sm flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">{t("common_supabase_error")}</p>
              <p className="text-xs mt-0.5">{error}</p>
              <p className="text-xs text-red-400 mt-1">{t("common_supabase_hint")}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : teams.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">👥</div>
            <h2 className="text-lg font-semibold text-white mb-2">{t("teams_no_teams")}</h2>
            <p className="text-gray-400 text-sm mb-6">{t("teams_no_teams_sub")}</p>
            <button onClick={() => setModal("create")} className="btn-primary">➕ {t("teams_create")}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div key={team.id} className="card hover:border-gray-700 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-sm">
                    {team.name?.[0]?.toUpperCase() || "T"}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setModal(team)} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded-lg">{t("teams_edit")}</button>
                    <button onClick={() => handleDelete(team.id)} className="text-xs bg-red-900/40 hover:bg-red-900 text-red-400 px-2 py-1 rounded-lg">{t("teams_delete")}</button>
                  </div>
                </div>
                <h3 className="font-semibold text-white mb-2">{team.name}</h3>
                <div className="flex gap-2">
                  <span className="badge bg-gray-800 text-gray-400">{team.age_category || "—"}</span>
                  <span className={`badge capitalize ${genderBadge(team.gender)}`}>{team.gender || "—"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
