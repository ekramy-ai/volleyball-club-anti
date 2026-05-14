// features/teams/Teams.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../src/lib/supabase";
import TeamModal from "./components/TeamModal";

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
