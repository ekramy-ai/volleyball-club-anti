import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../../src/lib/supabase";

export default function TeamModal({ team, onClose, onSaved }) {
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
