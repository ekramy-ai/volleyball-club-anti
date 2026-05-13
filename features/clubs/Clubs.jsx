// features/clubs/Clubs.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../src/lib/supabase";

function ClubModal({ club, onClose, onSaved }) {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";
  const isEdit = Boolean(club?.id);
  
  const [form, setForm] = useState({
    name: club?.name || "",
    logo_url: club?.logo_url || "",
    country: club?.country || "",
    city: club?.city || "",
    founded_year: club?.founded_year || "",
    email: club?.email || "",
    phone: club?.phone || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      setError(isAR ? "اسم النادي مطلوب!" : "Club name is required!");
      return;
    }
    setLoading(true); setError("");

    const payload = { ...form };
    if (payload.founded_year) payload.founded_year = parseInt(payload.founded_year, 10);
    else payload.founded_year = null;

    try {
      let result;
      if (isEdit) {
        const { data, error: err } = await supabase.from("clubs").update(payload).eq("id", club.id).select().single();
        if (err) throw err; result = data;
      } else {
        const { data, error: err } = await supabase.from("clubs").insert(payload).select().single();
        if (err) throw err; result = data;
      }
      onSaved(result, isEdit);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">{isEdit ? (isAR ? "تعديل النادي" : "Edit Club") : (isAR ? "نادي جديد" : "New Club")}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-3 py-2">⚠️ {error}</div>}
          
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-700 overflow-hidden flex items-center justify-center">
              {form.logo_url ? <img src={form.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-3xl">🛡️</span>}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">{isAR ? "اسم النادي *" : "Club Name *"}</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} required
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{isAR ? "رابط اللوجو (URL)" : "Logo URL"}</label>
            <input value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)}
              placeholder="https://..."
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 text-left" dir="ltr" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">{isAR ? "الدولة" : "Country"}</label>
              <input value={form.country} onChange={(e) => set("country", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{isAR ? "المدينة" : "City"}</label>
              <input value={form.city} onChange={(e) => set("city", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">{isAR ? "سنة التأسيس" : "Founded Year"}</label>
              <input type="number" value={form.founded_year} onChange={(e) => set("founded_year", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{isAR ? "رقم الهاتف" : "Phone"}</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 text-left" dir="ltr" />
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

export default function Clubs() {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";
  
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data, error: err } = await supabase.from("clubs").select("*").order("name");
      if (err) throw err;
      setClubs(data || []);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (club, isEdit) => {
    setClubs((prev) => isEdit ? prev.map((c) => (c.id === club.id ? club : c)) : [...prev, club]);
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (!confirm(isAR ? "هل أنت متأكد من الحذف؟" : "Are you sure you want to delete this club?")) return;
    const { error: err } = await supabase.from("clubs").delete().eq("id", id);
    if (err) { alert(err.message); return; }
    setClubs((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <>
      {modal && <ClubModal club={modal === "create" ? null : modal} onClose={() => setModal(null)} onSaved={handleSaved} />}
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{isAR ? "الأندية" : "Clubs"}</h1>
            <p className="text-gray-400 text-sm mt-0.5">{isAR ? "إدارة قاعدة بيانات الأندية العالمية أو المحلية" : "Manage local and international clubs database"}</p>
          </div>
          <button onClick={() => setModal("create")} className="btn-primary text-sm">➕ {isAR ? "إضافة نادي" : "Add Club"}</button>
        </div>

        {error && (
          <div className="card border-red-800 bg-red-900/20 text-red-300 text-sm flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div><p className="font-semibold">{t("common_supabase_error")}</p><p className="text-xs mt-0.5">{error}</p></div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : clubs.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🛡️</div>
            <h2 className="text-lg font-semibold text-white mb-2">{isAR ? "لا توجد أندية" : "No clubs found"}</h2>
            <button onClick={() => setModal("create")} className="btn-primary mt-4">➕ {isAR ? "إضافة نادي" : "Add Club"}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clubs.map((c) => (
              <div key={c.id} className="card hover:border-gray-700 transition-colors group relative flex flex-col">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                   <button onClick={() => setModal(c)} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-lg">{t("common_edit")}</button>
                   <button onClick={() => handleDelete(c.id)} className="text-xs bg-red-900/40 text-red-400 px-2 py-1 rounded-lg">Del</button>
                </div>
                
                <div className="flex flex-col items-center text-center mt-4">
                  <div className="w-20 h-20 rounded-full bg-gray-800 border-4 border-gray-900 shadow-xl overflow-hidden flex items-center justify-center mb-4">
                     {c.logo_url ? <img src={c.logo_url} alt={c.name} className="w-full h-full object-cover" /> : <span className="text-3xl">🛡️</span>}
                  </div>
                  <h3 className="text-lg font-bold text-white">{c.name}</h3>
                  <div className="text-sm text-gray-400 mt-1">{c.city || c.country ? `${c.city || ''} ${c.country || ''}` : "Unknown Location"}</div>
                </div>

                <div className="mt-auto pt-6">
                  <div className="border-t border-gray-800 pt-3 text-xs text-gray-500 flex justify-between">
                    <span>{isAR ? "تأسس:" : "Est:"} <strong className="text-gray-300">{c.founded_year || "—"}</strong></span>
                    <span>{isAR ? "هاتف:" : "Tel:"} <strong className="text-gray-300">{c.phone || "—"}</strong></span>
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
