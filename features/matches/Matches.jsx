// features/matches/Matches.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../src/lib/supabase";

function MatchModal({ match, onClose, onSaved }) {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";
  const isEdit = Boolean(match?.id);
  const [teams, setTeams] = useState([]);
  const savedAwayTeamId = match?.set_scores?.away_team_id || "";

  const [form, setForm] = useState({
    home_team_id: match?.home_team_id || "",
    away_team_id: savedAwayTeamId,
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
    if (form.home_team_id === form.away_team_id && form.home_team_id !== "") {
      setError(isAR ? "لا يمكن أن يكون الفريقان متطابقين!" : "Home and Away teams cannot be the same!");
      return;
    }
    setLoading(true); setError("");
    const payload = {
      home_team_id: form.home_team_id || null,
      competition: form.competition,
      venue: form.venue,
      status: form.status,
      notes: form.notes,
      set_scores: { ...(match?.set_scores || {}), away_team_id: form.away_team_id || null }
    };
    if (form.match_date) payload.match_date = new Date(form.match_date).toISOString();
    else payload.match_date = null;

    try {
      let result;
      if (isEdit) {
        const { data, error: err } = await supabase.from("matches").update(payload).eq("id", match.id).select("*").single();
        if (err) throw err; result = data;
      } else {
        const { data, error: err } = await supabase.from("matches").insert(payload).select("*").single();
        if (err) throw err; result = data;
      }
      onSaved(result, isEdit);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-800/50">
          <h2 className="text-lg font-bold text-white">{isEdit ? (isAR ? "تعديل المباراة" : "مباراة جديدة") : (isAR ? "جدولة مباراة" : "Schedule Match")}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-3 py-2">⚠️ {error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-red-400 mb-1 uppercase tracking-wider">{isAR ? "الفريق المضيف" : "Home Team"}</label>
              <select value={form.home_team_id} onChange={(e) => set("home_team_id", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-500 shadow-inner">
                <option value="">-- {isAR ? "اختر" : "Select"} --</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-blue-400 mb-1 uppercase tracking-wider">{isAR ? "الفريق الضيف" : "Away Team"}</label>
              <select value={form.away_team_id} onChange={(e) => set("away_team_id", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 shadow-inner">
                <option value="">-- {isAR ? "اختر" : "Select"} --</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{isAR ? "المنافسة / البطولة" : "Competition"}</label>
            <input value={form.competition} onChange={(e) => set("competition", e.target.value)} placeholder="e.g. Egyptian Super League"
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-500 shadow-inner" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{isAR ? "الملعب / الصالة" : "Venue"}</label>
            <input value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="e.g. Cairo Stadium Hall 1"
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-500 shadow-inner" />
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
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">{t("common_cancel")}</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50 font-bold shadow-lg">
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
  const [matches, setMatches] = useState([]);
  const [teamsMap, setTeamsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data: matchData, error: matchErr } = await supabase.from("matches").select("*").order("match_date", { ascending: false });
      if (matchErr) throw matchErr;
      const { data: teamData, error: teamErr } = await supabase.from("teams").select("id, name");
      if (teamErr) throw teamErr;
      const tMap = {};
      teamData.forEach(t => tMap[t.id] = t.name);
      setTeamsMap(tMap);
      setMatches(matchData || []);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (match, isEdit) => {
    setMatches((prev) => isEdit ? prev.map((m) => (m.id === match.id ? match : m)) : [match, ...prev]);
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (!confirm(t("common_delete") + "?")) return;
    const { error: err } = await supabase.from("matches").delete().eq("id", id);
    if (err) { alert(err.message); return; }
    setMatches((prev) => prev.filter((m) => m.id !== id));
  };

  const statusBadge = (s) => {
    const colors = { 
      scheduled: "bg-blue-900/40 text-blue-400 border-blue-900", 
      live: "bg-red-900/40 text-red-500 border-red-900 animate-pulse font-black", 
      completed: "bg-green-900/40 text-green-400 border-green-900", 
      postponed: "bg-yellow-900/40 text-yellow-400 border-yellow-900", 
      cancelled: "bg-gray-800 text-gray-500 border-gray-700" 
    };
    return colors[s] || "bg-gray-800 text-gray-400 border-gray-700";
  };

  return (
    <>
      {modal && <MatchModal match={modal === "create" ? null : modal} onClose={() => setModal(null)} onSaved={handleSaved} />}
      <div className="space-y-8 max-w-7xl mx-auto pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span className="text-red-600">🏐</span> {t("nav_matches")}
            </h1>
            <p className="text-gray-400 text-sm mt-1">{isAR ? "مركز إدارة المباريات والنتائج الحية" : "Match management & live results center"}</p>
          </div>
          <button onClick={() => setModal("create")} className="btn-primary text-sm font-bold shadow-xl shadow-red-900/20 px-6 py-3 rounded-xl flex items-center gap-2">
            <span>➕</span> {isAR ? "جدولة مباراة جديدة" : "Schedule New Match"}
          </button>
        </div>

        {error && (
          <div className="card border-red-800 bg-red-900/20 text-red-300 text-sm flex items-start gap-3 shadow-lg">
            <span className="text-xl">⚠️</span>
            <div><p className="font-semibold">{t("common_supabase_error")}</p><p className="text-xs mt-0.5">{error}</p></div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24"><div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : matches.length === 0 ? (
          <div className="bg-gray-900/50 border-2 border-dashed border-gray-800 rounded-[2.5rem] flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner border border-gray-700">🏐</div>
            <h2 className="text-2xl font-black text-white mb-2">{isAR ? "لا توجد مباريات مجدولة" : "No matches scheduled yet"}</h2>
            <p className="text-gray-400 max-w-sm mb-8">{isAR ? "ابدأ بجدولة أول مباراة لك أو استخدم أداة ملء البيانات في الإعدادات." : "Start by scheduling your first match or use the seed tool in settings."}</p>
            <button onClick={() => setModal("create")} className="btn-primary px-8 py-3 rounded-xl font-bold shadow-xl shadow-red-900/20">➕ {isAR ? "جدولة مباراة" : "Schedule Match"}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {matches.map((m) => {
              const homeName = m.home_team_id ? (teamsMap[m.home_team_id] || "Team A") : "Team A";
              const awayTeamId = m.set_scores?.away_team_id;
              const awayName = awayTeamId ? (teamsMap[awayTeamId] || "Team B") : "Team B";

              return (
                <div key={m.id} className="group relative bg-[#1a1a1a] border border-gray-800 rounded-[2rem] p-6 shadow-xl hover:border-gray-600 transition-all hover:-translate-y-1 flex flex-col h-full overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm ${statusBadge(m.status)}`}>
                      {m.status}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                       <button onClick={() => setModal(m)} className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg shadow-lg border border-gray-700">✏️</button>
                       <button onClick={() => handleDelete(m.id)} className="bg-red-900/40 hover:bg-red-900 text-white p-2 rounded-lg shadow-lg border border-red-800">🗑️</button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-center mb-8 relative z-10">
                    <div className="flex-1 space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-600/20 to-red-900/40 border border-red-800/50 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                         <span className="text-3xl">🛡️</span>
                      </div>
                      <div className="font-black text-white text-sm line-clamp-1 uppercase tracking-tight">{homeName}</div>
                    </div>
                    
                    <div className="px-4 flex flex-col items-center">
                       <div className="text-[10px] text-gray-600 font-black uppercase tracking-[0.3em] mb-1">VS</div>
                       <div className="w-px h-8 bg-gradient-to-b from-gray-800 via-gray-700 to-gray-800"></div>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-900/40 border border-blue-800/50 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                         <span className="text-3xl">⚔️</span>
                      </div>
                      <div className="font-black text-white text-sm line-clamp-1 uppercase tracking-tight">{awayName}</div>
                    </div>
                  </div>

                  <div className="mt-auto space-y-3 relative z-10">
                    <div className="bg-black/40 border border-gray-800/50 p-4 rounded-2xl flex flex-col gap-2 shadow-inner">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-gray-500 uppercase tracking-wider">🏆 {m.competition || "Exhibition"}</span>
                        <span className="text-gray-500 uppercase tracking-wider">📍 {m.venue || "TBD"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-xs mt-1">
                        <span className="bg-gray-800 p-1 rounded-md">📅</span>
                        <span className="font-medium">
                          {m.match_date ? new Date(m.match_date).toLocaleString(isAR ? "ar-EG" : "en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                        </span>
                      </div>
                    </div>
                    
                    {m.status === 'live' ? (
                       <Link to="/scouting" className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 transition-all active:scale-95">
                         <span>📡</span> {isAR ? "فتح غرفة الرصد" : "Enter Scouting Room"}
                       </Link>
                    ) : (
                       <div className="w-full bg-gray-800 text-gray-500 font-bold text-[10px] uppercase tracking-widest py-3 rounded-xl flex items-center justify-center">
                         {isAR ? "المباراة ليست مباشرة" : "Match not in progress"}
                       </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
