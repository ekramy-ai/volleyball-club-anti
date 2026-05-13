// src/lib/db.js
// All Supabase database helpers for XURA System
import { supabase } from "./supabase";

// ─── CLUBS ─────────────────────────────────────────────────────────────────
export const getClub = async (clubId) => {
  const { data, error } = await supabase.from("clubs").select("*").eq("id", clubId).single();
  if (error) throw error;
  return data;
};

// ─── TEAMS ─────────────────────────────────────────────────────────────────
export const getTeams = async (clubId) => {
  const { data, error } = await supabase
    .from("teams")
    .select("*, seasons(name)")
    .eq("club_id", clubId)
    .order("name");
  if (error) throw error;
  return data;
};

export const createTeam = async (team) => {
  const { data, error } = await supabase.from("teams").insert(team).select().single();
  if (error) throw error;
  return data;
};

export const updateTeam = async (id, updates) => {
  const { data, error } = await supabase.from("teams").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
};

export const deleteTeam = async (id) => {
  const { error } = await supabase.from("teams").delete().eq("id", id);
  if (error) throw error;
};

// ─── PLAYERS ───────────────────────────────────────────────────────────────
export const getPlayers = async (clubId, filters = {}) => {
  let query = supabase
    .from("players")
    .select("*, teams(name)")
    .eq("club_id", clubId)
    .order("full_name");

  if (filters.teamId)   query = query.eq("team_id", filters.teamId);
  if (filters.position) query = query.eq("position", filters.position);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createPlayer = async (player) => {
  const { data, error } = await supabase.from("players").insert(player).select().single();
  if (error) throw error;
  return data;
};

export const updatePlayer = async (id, updates) => {
  const { data, error } = await supabase.from("players").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
};

export const deletePlayer = async (id) => {
  const { error } = await supabase.from("players").delete().eq("id", id);
  if (error) throw error;
};

// ─── MATCHES ───────────────────────────────────────────────────────────────
export const getMatches = async (clubId, filters = {}) => {
  let query = supabase
    .from("matches")
    .select("*, seasons(name), teams(name), opponents(name)")
    .eq("club_id", clubId)
    .order("match_date", { ascending: false });

  if (filters.status)   query = query.eq("status", filters.status);
  if (filters.seasonId) query = query.eq("season_id", filters.seasonId);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createMatch = async (match) => {
  const { data, error } = await supabase.from("matches").insert(match).select().single();
  if (error) throw error;
  return data;
};

export const updateMatch = async (id, updates) => {
  const { data, error } = await supabase.from("matches").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
};

// ─── SCOUTING EVENTS ───────────────────────────────────────────────────────
export const getScoutingEvents = async (matchId) => {
  const { data, error } = await supabase
    .from("scouting_events")
    .select("*, players(full_name, position, jersey_number)")
    .eq("match_id", matchId)
    .order("created_at");
  if (error) throw error;
  return data;
};

export const createScoutingEvent = async (event) => {
  const { data, error } = await supabase.from("scouting_events").insert(event).select().single();
  if (error) throw error;
  return data;
};

export const deleteLastScoutingEvent = async (matchId) => {
  const { data: last } = await supabase
    .from("scouting_events")
    .select("id")
    .eq("match_id", matchId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (last) {
    const { error } = await supabase.from("scouting_events").delete().eq("id", last.id);
    if (error) throw error;
  }
};

// ─── ANALYTICS ─────────────────────────────────────────────────────────────
export const getMatchStats = async (matchId) => {
  const { data, error } = await supabase
    .from("scouting_events")
    .select("skill, result, player_id, players(full_name, position)")
    .eq("match_id", matchId);
  if (error) throw error;

  // Aggregate stats
  const stats = {};
  for (const ev of data) {
    if (!stats[ev.skill]) stats[ev.skill] = { error:0, negative:0, neutral:0, positive:0, point:0, total:0 };
    stats[ev.skill][ev.result]++;
    stats[ev.skill].total++;
  }
  return { events: data, stats };
};

// ─── TRAINING ──────────────────────────────────────────────────────────────
export const getTrainingSessions = async (teamId) => {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("*")
    .eq("team_id", teamId)
    .order("session_date", { ascending: false });
  if (error) throw error;
  return data;
};

export const createTrainingSession = async (session) => {
  const { data, error } = await supabase.from("training_sessions").insert(session).select().single();
  if (error) throw error;
  return data;
};

// ─── PROFILE ───────────────────────────────────────────────────────────────
export const getProfile = async (userId) => {
  const { data, error } = await supabase.from("profiles").select("*, clubs(*)").eq("id", userId).single();
  if (error) throw error;
  return data;
};

export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select().single();
  if (error) throw error;
  return data;
};
