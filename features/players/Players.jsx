// features/players/Players.jsx
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../src/lib/supabase";

const POSITIONS = ["All", "setter", "outside_hitter", "middle_blocker", "opposite", "libero", "defensive_specialist"];
const POS_LABELS = { setter: "Setter", outside_hitter: "Outside", middle_blocker: "Middle", opposite: "Opposite", libero: "Libero", defensive_specialist: "DS" };
const HANDS = ["right", "left", "both"];
const EXP_LEVELS = ["beginner", "intermediate", "advanced", "professional"];

function PlayerModal({ player, onClose, onSaved }) {
  const isEdit = Boolean(player?.id);
  const [form, setForm] = useState({
    full_name:     player?.full_name     || "",
    position:      player?.position      || "setter",
    jersey_number: player?.jersey_number || "",
    date_of_birth: player?.date_of_birth || "",
    nationality:   player?.nationality   || "",
    dominant_hand: player?.dominant_hand || "right",
    height_cm:     player?.height_cm     || "",
    weight_kg:     player?.weight_kg     || "",
    experience_level: player?.experience_level || "intermediate",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) { setError("Player name is required."); return; }
    setLoading(true); setError("");
    const payload = {
      ...form,
      jersey_number: form.jersey_number ? Number(form.jersey_number) : null,
      height_cm:     form.height_cm     ? Number(form.height_cm)     : null,
      weight_kg:     form.weight_kg     ? Number(form.weight_kg)     : null,
    };
    try {
      let result;
      if (isEdit) {
        const { data, error: err } = await supabase.from("players").update(payload).eq("id", player.id).select().single();
        if (err) throw err;
        result = data;
      } else {
        const { data, error: err } = await supabase.from("players").insert(payload).select().single();
        if (err) throw err;
        result = data;
      }
      onSaved(result, isEdit);
    } catch (err) {
      setError(err.message || "Database error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">{isEdit ? "Edit Player" : "Add Player"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-3 py-2">⚠️ {error}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Full Name *</label>
              <input value={form.full_name} onChange={(e) => set("full_name", e.target.value)}
                placeholder="Player full name"
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Position</label>
              <select value={form.position} onChange={(e) => set("position", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
                {POSITIONS.filter(p => p !== "All").map((p) => <option key={p} value={p}>{POS_LABELS[p] || p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Jersey #</label>
              <input type="number" value={form.jersey_number} onChange={(e) => set("jersey_number", e.target.value)}
                placeholder="e.g. 7" min="1" max="99"
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Date of Birth</label>
              <input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nationality</label>
              <input value={form.nationality} onChange={(e) => set("nationality", e.target.value)}
                placeholder="e.g. Egyptian"
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Height (cm)</label>
              <input type="number" value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)}
                placeholder="185"
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Weight (kg)</label>
              <input type="number" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)}
                placeholder="80"
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Dominant Hand</label>
              <div className="flex gap-1">
                {HANDS.map((h) => (
                  <button type="button" key={h} onClick={() => set("dominant_hand", h)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      form.dominant_hand === h ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400"}`}>
                    {h}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Experience</label>
              <select value={form.experience_level} onChange={(e) => set("experience_level", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
                {EXP_LEVELS.map((l) => <option key={l} value={l} className="capitalize">{l}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
              {loading ? "Saving…" : isEdit ? "Update Player" : "Add Player"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const posBadgeColor = (pos) => {
  const map = {
    setter: "bg-yellow-900/60 text-yellow-300",
    outside_hitter: "bg-blue-900/60 text-blue-300",
    middle_blocker: "bg-green-900/60 text-green-300",
    opposite: "bg-orange-900/60 text-orange-300",
    libero: "bg-purple-900/60 text-purple-300",
    defensive_specialist: "bg-pink-900/60 text-pink-300",
  };
  return map[pos] || "bg-gray-800 text-gray-400";
};

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [filter,  setFilter]  = useState("All");
  const [modal,   setModal]   = useState(null);
  const [search,  setSearch]  = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data, error: err } = await supabase.from("players").select("*").order("full_name");
      if (err) throw err;
      setPlayers(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (player, isEdit) => {
    setPlayers((prev) =>
      isEdit ? prev.map((p) => (p.id === player.id ? player : p)) : [...prev, player]
    );
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this player?")) return;
    const { error: err } = await supabase.from("players").delete().eq("id", id);
    if (err) { alert(err.message); return; }
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const filtered = players.filter((p) => {
    const matchPos    = filter === "All" || p.position === filter;
    const matchSearch = !search || p.full_name?.toLowerCase().includes(search.toLowerCase());
    return matchPos && matchSearch;
  });

  return (
    <>
      {modal && <PlayerModal player={modal === "create" ? null : modal} onClose={() => setModal(null)} onSaved={handleSaved} />}

      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Players</h1>
            <p className="text-gray-400 text-sm mt-0.5">{players.length} registered players</p>
          </div>
          <button onClick={() => setModal("create")} className="btn-primary text-sm">➕ Add Player</button>
        </div>

        {error && (
          <div className="card border-red-800 bg-red-900/20 text-red-300 text-sm flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">Supabase Error</p>
              <p className="text-xs mt-0.5">{error}</p>
              <p className="text-xs text-red-400 mt-1">Add your Supabase credentials to <code>.env</code> file.</p>
            </div>
          </div>
        )}

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search players…"
            className="bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-red-500 sm:w-64" />
          <div className="flex gap-1.5 flex-wrap">
            {POSITIONS.map((p) => (
              <button key={p} onClick={() => setFilter(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  filter === p ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
                {p === "All" ? "All" : POS_LABELS[p] || p}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🤾</div>
            <h2 className="text-lg font-semibold text-white mb-2">
              {search || filter !== "All" ? "No players match your filter" : "No players yet"}
            </h2>
            <p className="text-gray-400 text-sm mb-6">Add your first player to build the roster.</p>
            <button onClick={() => setModal("create")} className="btn-primary">➕ Add Player</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <div key={p.id} className="card hover:border-gray-700 transition-colors group relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold text-base">
                    {p.jersey_number ?? p.full_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{p.full_name}</p>
                    <p className="text-xs text-gray-500">{p.nationality || "—"}</p>
                  </div>
                </div>
                <div className="flex gap-2 mb-3 flex-wrap">
                  <span className={`badge capitalize text-xs ${posBadgeColor(p.position)}`}>
                    {POS_LABELS[p.position] || p.position || "—"}
                  </span>
                  <span className="badge bg-gray-800 text-gray-400 capitalize text-xs">
                    {p.experience_level || "—"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 text-xs text-gray-500">
                  <span>↕ {p.height_cm ? `${p.height_cm} cm` : "—"}</span>
                  <span>⚖ {p.weight_kg ? `${p.weight_kg} kg` : "—"}</span>
                </div>
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setModal(p)} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded-lg">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="text-xs bg-red-900/40 hover:bg-red-900 text-red-400 px-2 py-1 rounded-lg">Del</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
