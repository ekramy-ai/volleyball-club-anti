-- ============================================================
-- XURA SYSTEM — Roles & Row Level Security (RLS) Migration
-- Run this in your Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- ─────────────────────────────────────────────
-- STEP 1: ADD permissions column to profiles
-- ─────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ─────────────────────────────────────────────
-- STEP 2: ROLE PERMISSIONS HELPER FUNCTION
-- Returns the effective permission set for the logged-in user
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_club()
RETURNS UUID AS $$
  SELECT club_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = required_role
      AND is_active = TRUE
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION has_any_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = ANY(required_roles)
      AND is_active = TRUE
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ─────────────────────────────────────────────
-- STEP 3: ENABLE RLS ON ALL TABLES
-- ─────────────────────────────────────────────
ALTER TABLE clubs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons           ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams             ENABLE ROW LEVEL SECURITY;
ALTER TABLE players           ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches           ENABLE ROW LEVEL SECURITY;
ALTER TABLE scouting_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance        ENABLE ROW LEVEL SECURITY;
ALTER TABLE injuries          ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE opponents         ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- STEP 4: DROP OLD POLICIES (clean slate)
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select_own"     ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"     ON profiles;
DROP POLICY IF EXISTS "clubs_select_auth"       ON clubs;
DROP POLICY IF EXISTS "clubs_insert_admin"      ON clubs;
DROP POLICY IF EXISTS "clubs_update_admin"      ON clubs;
DROP POLICY IF EXISTS "teams_club_access"       ON teams;
DROP POLICY IF EXISTS "players_club_access"     ON players;
DROP POLICY IF EXISTS "matches_club_access"     ON matches;
DROP POLICY IF EXISTS "opponents_club_access"   ON opponents;
DROP POLICY IF EXISTS "seasons_club_access"     ON seasons;
DROP POLICY IF EXISTS "videos_club_access"      ON videos;
DROP POLICY IF EXISTS "scouting_match_access"   ON scouting_events;
DROP POLICY IF EXISTS "training_team_access"    ON training_sessions;
DROP POLICY IF EXISTS "attendance_session_access" ON attendance;
DROP POLICY IF EXISTS "injuries_club_access"    ON injuries;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================
-- Everyone can read their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- super_admin can see ALL profiles
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  USING (has_role('super_admin'));

-- club_manager can see profiles in their club
CREATE POLICY "profiles_select_club_manager"
  ON profiles FOR SELECT
  USING (
    club_id = get_my_club()
    AND has_any_role(ARRAY['club_manager', 'head_coach'])
  );

-- Each user can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Only super_admin and club_manager can change roles/club assignments
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (has_any_role(ARRAY['super_admin', 'club_manager']));

-- super_admin can insert new profiles manually
CREATE POLICY "profiles_insert_admin"
  ON profiles FOR INSERT
  WITH CHECK (has_role('super_admin'));

-- ============================================================
-- CLUBS POLICIES
-- ============================================================
-- All authenticated users can read clubs
CREATE POLICY "clubs_select_all"
  ON clubs FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only super_admin can create/edit/delete clubs
CREATE POLICY "clubs_insert_admin"
  ON clubs FOR INSERT
  WITH CHECK (has_role('super_admin'));

CREATE POLICY "clubs_update_admin"
  ON clubs FOR UPDATE
  USING (has_role('super_admin'));

CREATE POLICY "clubs_delete_admin"
  ON clubs FOR DELETE
  USING (has_role('super_admin'));

-- ============================================================
-- SEASONS POLICIES
-- ============================================================
CREATE POLICY "seasons_select_club"
  ON seasons FOR SELECT
  USING (club_id = get_my_club() OR has_role('super_admin'));

CREATE POLICY "seasons_write_manager"
  ON seasons FOR ALL
  USING (
    club_id = get_my_club()
    AND has_any_role(ARRAY['super_admin', 'club_manager', 'head_coach'])
  );

-- ============================================================
-- TEAMS POLICIES
-- ============================================================
-- Club members can see their teams
CREATE POLICY "teams_select_club"
  ON teams FOR SELECT
  USING (club_id = get_my_club() OR has_role('super_admin'));

-- Only managers/coaches can create/edit teams
CREATE POLICY "teams_write_staff"
  ON teams FOR INSERT
  WITH CHECK (
    club_id = get_my_club()
    AND has_any_role(ARRAY['super_admin', 'club_manager', 'head_coach'])
  );

CREATE POLICY "teams_update_staff"
  ON teams FOR UPDATE
  USING (
    club_id = get_my_club()
    AND has_any_role(ARRAY['super_admin', 'club_manager', 'head_coach'])
  );

CREATE POLICY "teams_delete_manager"
  ON teams FOR DELETE
  USING (
    club_id = get_my_club()
    AND has_any_role(ARRAY['super_admin', 'club_manager'])
  );

-- ============================================================
-- PLAYERS POLICIES
-- ============================================================
-- All club members can read players
CREATE POLICY "players_select_club"
  ON players FOR SELECT
  USING (club_id = get_my_club() OR has_role('super_admin'));

-- Players can read their own record
CREATE POLICY "players_select_own"
  ON players FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.full_name = players.full_name -- link via name as fallback
    )
  );

-- Coaches and managers can create/edit players
CREATE POLICY "players_write_coaches"
  ON players FOR INSERT
  WITH CHECK (
    club_id = get_my_club()
    AND has_any_role(ARRAY['super_admin','club_manager','head_coach','assistant_coach'])
  );

CREATE POLICY "players_update_coaches"
  ON players FOR UPDATE
  USING (
    club_id = get_my_club()
    AND has_any_role(ARRAY['super_admin','club_manager','head_coach','assistant_coach','physiotherapist'])
  );

CREATE POLICY "players_delete_manager"
  ON players FOR DELETE
  USING (
    club_id = get_my_club()
    AND has_any_role(ARRAY['super_admin','club_manager'])
  );

-- ============================================================
-- MATCHES POLICIES
-- ============================================================
-- All club members can view matches
CREATE POLICY "matches_select_club"
  ON matches FOR SELECT
  USING (club_id = get_my_club() OR has_role('super_admin'));

-- Coaches, managers, scouts can create matches
CREATE POLICY "matches_write_staff"
  ON matches FOR INSERT
  WITH CHECK (
    club_id = get_my_club()
    AND has_any_role(ARRAY['super_admin','club_manager','head_coach','assistant_coach','scout_analyst'])
  );

CREATE POLICY "matches_update_staff"
  ON matches FOR UPDATE
  USING (
    club_id = get_my_club()
    AND has_any_role(ARRAY['super_admin','club_manager','head_coach','assistant_coach','scout_analyst'])
  );

CREATE POLICY "matches_delete_manager"
  ON matches FOR DELETE
  USING (
    club_id = get_my_club()
    AND has_any_role(ARRAY['super_admin','club_manager'])
  );

-- ============================================================
-- OPPONENTS POLICIES
-- ============================================================
CREATE POLICY "opponents_select_club"
  ON opponents FOR SELECT
  USING (club_id = get_my_club() OR has_role('super_admin'));

CREATE POLICY "opponents_write_scout"
  ON opponents FOR ALL
  USING (
    club_id = get_my_club()
    AND has_any_role(ARRAY['super_admin','club_manager','head_coach','scout_analyst'])
  );

-- ============================================================
-- SCOUTING EVENTS POLICIES
-- ============================================================
-- Coaches and scouts can view scouting data
CREATE POLICY "scouting_select_staff"
  ON scouting_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = scouting_events.match_id
        AND m.club_id = get_my_club()
    )
    AND has_any_role(ARRAY['super_admin','club_manager','head_coach','assistant_coach','scout_analyst'])
  );

-- Only scouts and coaches can add events
CREATE POLICY "scouting_write_scout"
  ON scouting_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = scouting_events.match_id
        AND m.club_id = get_my_club()
    )
    AND has_any_role(ARRAY['super_admin','head_coach','assistant_coach','scout_analyst'])
  );

CREATE POLICY "scouting_update_scout"
  ON scouting_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = scouting_events.match_id
        AND m.club_id = get_my_club()
    )
    AND has_any_role(ARRAY['super_admin','head_coach','assistant_coach','scout_analyst'])
  );

CREATE POLICY "scouting_delete_coach"
  ON scouting_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = scouting_events.match_id
        AND m.club_id = get_my_club()
    )
    AND has_any_role(ARRAY['super_admin','head_coach'])
  );

-- ============================================================
-- TRAINING SESSIONS POLICIES
-- ============================================================
-- All club staff can view training
CREATE POLICY "training_select_club"
  ON training_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = training_sessions.team_id
        AND t.club_id = get_my_club()
    )
  );

-- Coaches create/edit sessions
CREATE POLICY "training_write_coaches"
  ON training_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = training_sessions.team_id
        AND t.club_id = get_my_club()
    )
    AND has_any_role(ARRAY['super_admin','club_manager','head_coach','assistant_coach','strength_coach'])
  );

CREATE POLICY "training_update_coaches"
  ON training_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = training_sessions.team_id
        AND t.club_id = get_my_club()
    )
    AND has_any_role(ARRAY['super_admin','club_manager','head_coach','assistant_coach','strength_coach'])
  );

-- ============================================================
-- ATTENDANCE POLICIES
-- ============================================================
-- Coaches and players can view attendance
CREATE POLICY "attendance_select_staff"
  ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM training_sessions ts
      JOIN teams t ON t.id = ts.team_id
      WHERE ts.id = attendance.session_id
        AND t.club_id = get_my_club()
    )
  );

-- Only coaches can mark attendance
CREATE POLICY "attendance_write_coaches"
  ON attendance FOR ALL
  USING (
    has_any_role(ARRAY['super_admin','head_coach','assistant_coach','strength_coach'])
    AND EXISTS (
      SELECT 1 FROM training_sessions ts
      JOIN teams t ON t.id = ts.team_id
      WHERE ts.id = attendance.session_id
        AND t.club_id = get_my_club()
    )
  );

-- ============================================================
-- INJURIES POLICIES
-- ============================================================
-- Medical staff, coaches, player themselves can view
CREATE POLICY "injuries_select_medical"
  ON injuries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM players pl
      WHERE pl.id = injuries.player_id
        AND pl.club_id = get_my_club()
    )
    AND has_any_role(ARRAY['super_admin','club_manager','head_coach','assistant_coach','physiotherapist'])
  );

-- Only physiotherapist and coaches can log injuries
CREATE POLICY "injuries_write_medical"
  ON injuries FOR ALL
  USING (
    has_any_role(ARRAY['super_admin','physiotherapist','head_coach'])
    AND EXISTS (
      SELECT 1 FROM players pl
      WHERE pl.id = injuries.player_id
        AND pl.club_id = get_my_club()
    )
  );

-- ============================================================
-- VIDEOS POLICIES
-- ============================================================
-- All club staff can view videos
CREATE POLICY "videos_select_club"
  ON videos FOR SELECT
  USING (club_id = get_my_club() OR has_role('super_admin'));

-- Media manager, scouts, coaches can upload
CREATE POLICY "videos_write_media"
  ON videos FOR INSERT
  WITH CHECK (
    club_id = get_my_club()
    AND has_any_role(ARRAY['super_admin','club_manager','head_coach','scout_analyst','media_manager'])
  );

CREATE POLICY "videos_delete_media"
  ON videos FOR DELETE
  USING (
    club_id = get_my_club()
    AND has_any_role(ARRAY['super_admin','media_manager','club_manager'])
  );

-- ============================================================
-- STEP 5: DEFAULT ROLE PERMISSIONS REFERENCE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  role        TEXT PRIMARY KEY,
  label_ar    TEXT NOT NULL,
  label_en    TEXT NOT NULL,
  permissions JSONB NOT NULL,
  color       TEXT DEFAULT '#6B7280',
  icon        TEXT DEFAULT '👤'
);

-- Clear and insert fresh
DELETE FROM role_permissions;

INSERT INTO role_permissions (role, label_ar, label_en, permissions, color, icon) VALUES
(
  'super_admin',
  'مدير النظام الأعلى',
  'Super Administrator',
  '{
    "clubs":      {"read": true,  "write": true,  "delete": true},
    "teams":      {"read": true,  "write": true,  "delete": true},
    "players":    {"read": true,  "write": true,  "delete": true},
    "matches":    {"read": true,  "write": true,  "delete": true},
    "scouting":   {"read": true,  "write": true,  "delete": true},
    "training":   {"read": true,  "write": true,  "delete": true},
    "injuries":   {"read": true,  "write": true,  "delete": true},
    "videos":     {"read": true,  "write": true,  "delete": true},
    "analytics":  {"read": true,  "export": true},
    "ai":         {"read": true,  "query": true},
    "reports":    {"read": true,  "export": true, "generate": true},
    "settings":   {"read": true,  "write": true},
    "users":      {"read": true,  "write": true,  "delete": true, "assign_roles": true}
  }',
  '#EF4444',
  '👑'
),
(
  'club_manager',
  'مدير النادي',
  'Club Manager',
  '{
    "clubs":      {"read": true,  "write": true,  "delete": false},
    "teams":      {"read": true,  "write": true,  "delete": true},
    "players":    {"read": true,  "write": true,  "delete": true},
    "matches":    {"read": true,  "write": true,  "delete": true},
    "scouting":   {"read": true,  "write": false, "delete": false},
    "training":   {"read": true,  "write": true,  "delete": true},
    "injuries":   {"read": true,  "write": false, "delete": false},
    "videos":     {"read": true,  "write": true,  "delete": true},
    "analytics":  {"read": true,  "export": true},
    "ai":         {"read": true,  "query": true},
    "reports":    {"read": true,  "export": true, "generate": true},
    "settings":   {"read": true,  "write": true},
    "users":      {"read": true,  "write": true,  "delete": false, "assign_roles": true}
  }',
  '#F59E0B',
  '🏢'
),
(
  'head_coach',
  'المدرب الرئيسي',
  'Head Coach',
  '{
    "clubs":      {"read": true,  "write": false, "delete": false},
    "teams":      {"read": true,  "write": true,  "delete": false},
    "players":    {"read": true,  "write": true,  "delete": false},
    "matches":    {"read": true,  "write": true,  "delete": false},
    "scouting":   {"read": true,  "write": true,  "delete": true},
    "training":   {"read": true,  "write": true,  "delete": true},
    "injuries":   {"read": true,  "write": true,  "delete": false},
    "videos":     {"read": true,  "write": true,  "delete": false},
    "analytics":  {"read": true,  "export": true},
    "ai":         {"read": true,  "query": true},
    "reports":    {"read": true,  "export": true, "generate": true},
    "settings":   {"read": true,  "write": false},
    "users":      {"read": true,  "write": false, "delete": false, "assign_roles": false}
  }',
  '#3B82F6',
  '🎯'
),
(
  'assistant_coach',
  'المدرب المساعد',
  'Assistant Coach',
  '{
    "clubs":      {"read": true,  "write": false, "delete": false},
    "teams":      {"read": true,  "write": false, "delete": false},
    "players":    {"read": true,  "write": true,  "delete": false},
    "matches":    {"read": true,  "write": true,  "delete": false},
    "scouting":   {"read": true,  "write": true,  "delete": false},
    "training":   {"read": true,  "write": true,  "delete": false},
    "injuries":   {"read": true,  "write": false, "delete": false},
    "videos":     {"read": true,  "write": false, "delete": false},
    "analytics":  {"read": true,  "export": false},
    "ai":         {"read": true,  "query": true},
    "reports":    {"read": true,  "export": false, "generate": false},
    "settings":   {"read": true,  "write": false},
    "users":      {"read": false, "write": false, "delete": false, "assign_roles": false}
  }',
  '#8B5CF6',
  '🏋️'
),
(
  'scout_analyst',
  'محلل الكشافة',
  'Scout & Analyst',
  '{
    "clubs":      {"read": true,  "write": false, "delete": false},
    "teams":      {"read": true,  "write": false, "delete": false},
    "players":    {"read": true,  "write": false, "delete": false},
    "matches":    {"read": true,  "write": true,  "delete": false},
    "scouting":   {"read": true,  "write": true,  "delete": true},
    "training":   {"read": true,  "write": false, "delete": false},
    "injuries":   {"read": false, "write": false, "delete": false},
    "videos":     {"read": true,  "write": true,  "delete": false},
    "analytics":  {"read": true,  "export": true},
    "ai":         {"read": true,  "query": true},
    "reports":    {"read": true,  "export": true, "generate": true},
    "settings":   {"read": false, "write": false},
    "users":      {"read": false, "write": false, "delete": false, "assign_roles": false}
  }',
  '#10B981',
  '📡'
),
(
  'physiotherapist',
  'المعالج الفيزيائي',
  'Physiotherapist',
  '{
    "clubs":      {"read": true,  "write": false, "delete": false},
    "teams":      {"read": true,  "write": false, "delete": false},
    "players":    {"read": true,  "write": true,  "delete": false},
    "matches":    {"read": true,  "write": false, "delete": false},
    "scouting":   {"read": false, "write": false, "delete": false},
    "training":   {"read": true,  "write": false, "delete": false},
    "injuries":   {"read": true,  "write": true,  "delete": false},
    "videos":     {"read": false, "write": false, "delete": false},
    "analytics":  {"read": false, "export": false},
    "ai":         {"read": true,  "query": false},
    "reports":    {"read": true,  "export": false, "generate": false},
    "settings":   {"read": false, "write": false},
    "users":      {"read": false, "write": false, "delete": false, "assign_roles": false}
  }',
  '#F97316',
  '🏥'
),
(
  'strength_coach',
  'مدرب اللياقة',
  'Strength & Conditioning Coach',
  '{
    "clubs":      {"read": true,  "write": false, "delete": false},
    "teams":      {"read": true,  "write": false, "delete": false},
    "players":    {"read": true,  "write": true,  "delete": false},
    "matches":    {"read": true,  "write": false, "delete": false},
    "scouting":   {"read": false, "write": false, "delete": false},
    "training":   {"read": true,  "write": true,  "delete": true},
    "injuries":   {"read": true,  "write": false, "delete": false},
    "videos":     {"read": true,  "write": false, "delete": false},
    "analytics":  {"read": true,  "export": false},
    "ai":         {"read": true,  "query": false},
    "reports":    {"read": true,  "export": false, "generate": false},
    "settings":   {"read": false, "write": false},
    "users":      {"read": false, "write": false, "delete": false, "assign_roles": false}
  }',
  '#84CC16',
  '💪'
),
(
  'media_manager',
  'مدير الإعلام',
  'Media Manager',
  '{
    "clubs":      {"read": true,  "write": false, "delete": false},
    "teams":      {"read": true,  "write": false, "delete": false},
    "players":    {"read": true,  "write": false, "delete": false},
    "matches":    {"read": true,  "write": false, "delete": false},
    "scouting":   {"read": false, "write": false, "delete": false},
    "training":   {"read": false, "write": false, "delete": false},
    "injuries":   {"read": false, "write": false, "delete": false},
    "videos":     {"read": true,  "write": true,  "delete": true},
    "analytics":  {"read": true,  "export": false},
    "ai":         {"read": false, "query": false},
    "reports":    {"read": true,  "export": true, "generate": false},
    "settings":   {"read": false, "write": false},
    "users":      {"read": false, "write": false, "delete": false, "assign_roles": false}
  }',
  '#EC4899',
  '🎬'
),
(
  'player',
  'لاعب',
  'Player',
  '{
    "clubs":      {"read": true,  "write": false, "delete": false},
    "teams":      {"read": true,  "write": false, "delete": false},
    "players":    {"read": true,  "write": false, "delete": false},
    "matches":    {"read": true,  "write": false, "delete": false},
    "scouting":   {"read": false, "write": false, "delete": false},
    "training":   {"read": true,  "write": false, "delete": false},
    "injuries":   {"read": false, "write": false, "delete": false},
    "videos":     {"read": true,  "write": false, "delete": false},
    "analytics":  {"read": false, "export": false},
    "ai":         {"read": false, "query": false},
    "reports":    {"read": false, "export": false, "generate": false},
    "settings":   {"read": true,  "write": false},
    "users":      {"read": false, "write": false, "delete": false, "assign_roles": false}
  }',
  '#6B7280',
  '🤾'
);

-- Grant select on role_permissions to all authenticated users
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "role_permissions_select_all"
  ON role_permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- DONE! Run roles_and_rls.sql in Supabase SQL Editor
-- ============================================================
