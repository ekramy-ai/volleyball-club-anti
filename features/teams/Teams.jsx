// features/teams/Teams.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../src/lib/supabase";

function TeamModal({ team, onClose, onSaved }) {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";
  const isEdit = Boolean(team?.id);

  const [clubs, setClubs] = useState([]);
  const [form, setForm] = useState({
    name: team?.name || "",
    club_id: team?.club_id || "",
    age_category: team?.age_category || "Senior",
    gender: team?.gender || "male",
    photo_url: team?.photo_url || "", // Custom field (we'll save it to notes if column doesn't exist, or just send it)
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("clubs").select("id, name").order("name").then(({ data }) => setClubs(data || []));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.club_id) {
      setError(isAR ? "اسم الفريق والنادي مطلوبان!" : "Team name and club are required!");
      return;
    }
    setLoading(true); setError("");

    const payload = {
      name: form.name,
      club_id: form.club_id,
      age_category: form.age_category,
      gender: form.gender,
      // Workaround: saving photo_url inside notes if the column doesn't exist.
      notes: JSON.stringify({ photo_url: form.photo_url })
    };

    try {
      let result;
      if (isEdit) {
        const { data, error: err } = await supabase.from("teams").update(payload).eq("id", team.id).select("*, clubs(name)").single();
        if (err) throw err; result = data;
      } else {
        const { data, error: err } = await supabase.from("teams").insert(payload).select("*, clubs(name)").single();
        if (err) throw err; result = data;
      }
      onSaved(result, isEdit);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">{isEdit ? t("teams_modal_edit") : t("teams_modal_create")}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-3 py-2">⚠️ {error}</div>}
          
          <div className="flex justify-center mb-4">
            <div className="w-48 h-28 rounded-xl bg-gray-800 border-2 border-gray-700 overflow-hidden flex items-center justify-center">
              {form.photo_url ? <img src={form.photo_url} alt="Team" className="w-full h-full object-cover" /> : <span className="text-3xl">👥</span>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-red-400 mb-1">{isAR ? "النادي التابع له *" : "Belonging Club *"}</label>
            <select value={form.club_id} onChange={(e) => set("club_id", e.target.value)} required
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
              <option value="">-- {isAR ? "اختر النادي" : "Select Club"} --</option>
              {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">{t("teams_name")} *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder={t("teams_name_placeholder")}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">{isAR ? "رابط صورة الفريق الجماعية" : "Team Group Photo URL"}</label>
            <input value={form.photo_url} onChange={(e) => set("photo_url", e.target.value)}
              placeholder="https://..."
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 text-left" dir="ltr" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t("teams_category")}</label>
              <select value={form.age_category} onChange={(e) => set("age_category", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
                <option value="Senior">Senior</option>
                <option value="U21">U21</option>
                <option value="U19">U19</option>
                <option value="U17">U17</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t("teams_gender")}</label>
              <select value={form.gender} onChange={(e) => set("gender", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
                <option value="male">{t("teams_male")}</option>
                <option value="female">{t("teams_female")}</option>
                <option value="mixed">{t("teams_mixed")}</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">{t("common_cancel")}</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
              {loading ? t("teams_saving") : t("common_save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Teams() {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";
  
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data, error: err } = await supabase.from("teams").select("*, clubs(name)").order("name");
      if (err) throw err;
      
      const parsedData = data.map(team => {
        let photo_url = "";
        try {
          const notesObj = JSON.parse(team.notes || "{}");
          photo_url = notesObj.photo_url || "";
        } catch(e) {}
        return { ...team, photo_url };
      });

      setTeams(parsedData || []);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (team, isEdit) => {
    let photo_url = "";
    try { photo_url = JSON.parse(team.notes || "{}").photo_url || ""; } catch(e) {}
    const parsedTeam = { ...team, photo_url };

    setTeams((prev) => isEdit ? prev.map((t) => (t.id === parsedTeam.id ? parsedTeam : t)) : [...prev, parsedTeam]);
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
            <p className="text-gray-400 text-sm mt-0.5">{isAR ? "إدارة فرق الأندية وفئاتها السنية" : "Manage club teams and their age categories"}</p>
          </div>
          <button onClick={() => setModal("create")} className="btn-primary text-sm">➕ {t("teams_create")}</button>
        </div>

        {error && (
          <div className="card border-red-800 bg-red-900/20 text-red-300 text-sm flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div><p className="font-semibold">{t("common_supabase_error")}</p><p className="text-xs mt-0.5">{error}</p></div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : teams.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">👥</div>
            <h2 className="text-lg font-semibold text-white mb-2">{t("teams_no_teams")}</h2>
            <p className="text-gray-400 text-sm">{t("teams_no_teams_sub")}</p>
            <button onClick={() => setModal("create")} className="btn-primary mt-4">➕ {t("teams_create")}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div key={team.id} className="card hover:border-gray-700 transition-colors group relative flex flex-col p-0 overflow-hidden">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                   <button onClick={() => setModal(team)} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-lg shadow">{t("common_edit")}</button>
                   <button onClick={() => handleDelete(team.id)} className="text-xs bg-red-900/40 text-red-400 px-2 py-1 rounded-lg shadow">Del</button>
                </div>
                
                <div className="h-32 bg-gray-800 flex items-center justify-center overflow-hidden border-b border-gray-800">
                  {team.photo_url ? (
                    <img src={team.photo_url} alt={team.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-5xl">🏐</div>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">{team.name}</h3>
                      <div className="text-sm text-red-400 font-medium">🛡️ {team.clubs?.name || (isAR ? "نادي غير معروف" : "Unknown Club")}</div>
                    </div>
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-800 rounded p-2 text-center">
                      <div className="text-gray-500 mb-0.5">{t("teams_category")}</div>
                      <div className="font-semibold text-gray-200">{team.age_category}</div>
                    </div>
                    <div className="bg-gray-800 rounded p-2 text-center">
                      <div className="text-gray-500 mb-0.5">{t("teams_gender")}</div>
                      <div className="font-semibold text-gray-200 capitalize">{team.gender}</div>
                    </div>
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
