-- ============================================================
-- XURA SYSTEM — Complete Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- 1. CLUBS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clubs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  logo_url    TEXT,
  country     TEXT,
  city        TEXT,
  founded_year INT,
  email       TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. SEASONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seasons (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id     UUID REFERENCES clubs(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  start_date  DATE,
  end_date    DATE,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 3. TEAMS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id      UUID REFERENCES clubs(id) ON DELETE CASCADE,
  season_id    UUID REFERENCES seasons(id) ON DELETE SET NULL,
  name         TEXT NOT NULL,
  age_category TEXT,  -- U18, U21, Senior, etc.
  gender       TEXT CHECK (gender IN ('male','female','mixed')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 4. PLAYERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id          UUID REFERENCES teams(id) ON DELETE SET NULL,
  club_id          UUID REFERENCES clubs(id) ON DELETE CASCADE,
  full_name        TEXT NOT NULL,
  photo_url        TEXT,
  date_of_birth    DATE,
  nationality      TEXT,
  dominant_hand    TEXT CHECK (dominant_hand IN ('right','left','both')),
  position         TEXT CHECK (position IN ('setter','outside_hitter','middle_blocker','opposite','libero','defensive_specialist')),
  jersey_number    INT,
  height_cm        NUMERIC(5,1),
  weight_kg        NUMERIC(5,1),
  attack_reach_cm  NUMERIC(5,1),
  block_reach_cm   NUMERIC(5,1),
  vertical_jump_cm NUMERIC(5,1),
  experience_level TEXT CHECK (experience_level IN ('beginner','intermediate','advanced','professional')),
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 5. OPPONENTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS opponents (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id    UUID REFERENCES clubs(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  country    TEXT,
  logo_url   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 6. MATCHES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id         UUID REFERENCES clubs(id) ON DELETE CASCADE,
  season_id       UUID REFERENCES seasons(id) ON DELETE SET NULL,
  home_team_id    UUID REFERENCES teams(id) ON DELETE SET NULL,
  away_team_id    UUID REFERENCES opponents(id) ON DELETE SET NULL,
  competition     TEXT,
  venue           TEXT,
  match_date      TIMESTAMPTZ,
  status          TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','completed','postponed','cancelled')),
  home_sets_won   INT DEFAULT 0,
  away_sets_won   INT DEFAULT 0,
  set_scores      JSONB,   -- [{home:25,away:23},{...}]
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 7. SCOUTING EVENTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scouting_events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id     UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id    UUID REFERENCES players(id) ON DELETE SET NULL,
  team_id      UUID REFERENCES teams(id) ON DELETE SET NULL,
  skill        TEXT NOT NULL CHECK (skill IN ('serve','reception','set','attack','block','dig','free_ball')),
  result       TEXT NOT NULL CHECK (result IN ('error','negative','neutral','positive','point')),
  set_number   INT,
  rotation     INT,
  zone_from    INT,   -- 1-6 court zones
  zone_to      INT,
  video_time   NUMERIC(10,3),  -- timestamp in seconds for video sync
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 8. TRAINING SESSIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS training_sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id      UUID REFERENCES teams(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  session_type TEXT CHECK (session_type IN ('technical','tactical','conditioning','recovery','match_prep')),
  session_date TIMESTAMPTZ,
  duration_min INT,
  objectives   TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 9. ATTENDANCE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
  player_id   UUID REFERENCES players(id) ON DELETE CASCADE,
  status      TEXT CHECK (status IN ('present','absent','late','injured')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, player_id)
);

-- ─────────────────────────────────────────────
-- 10. INJURIES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS injuries (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id     UUID REFERENCES players(id) ON DELETE CASCADE,
  injury_type   TEXT NOT NULL,
  body_part     TEXT,
  severity      TEXT CHECK (severity IN ('minor','moderate','severe')),
  injury_date   DATE,
  return_date   DATE,
  is_recovered  BOOLEAN DEFAULT FALSE,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 11. VIDEOS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS videos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id    UUID REFERENCES matches(id) ON DELETE SET NULL,
  club_id     UUID REFERENCES clubs(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  file_url    TEXT,
  duration_s  INT,
  tags        TEXT[],
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 12. USER PROFILES (extends Supabase Auth)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id    UUID REFERENCES clubs(id) ON DELETE SET NULL,
  full_name  TEXT,
  avatar_url TEXT,
  role       TEXT DEFAULT 'player' CHECK (role IN (
    'super_admin','club_manager','head_coach','assistant_coach',
    'scout_analyst','physiotherapist','strength_coach','player','media_manager'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- INDEXES for performance
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_players_team      ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_club      ON players(club_id);
CREATE INDEX IF NOT EXISTS idx_matches_club      ON matches(club_id);
CREATE INDEX IF NOT EXISTS idx_matches_season    ON matches(season_id);
CREATE INDEX IF NOT EXISTS idx_scouting_match    ON scouting_events(match_id);
CREATE INDEX IF NOT EXISTS idx_scouting_player   ON scouting_events(player_id);
CREATE INDEX IF NOT EXISTS idx_scouting_skill    ON scouting_events(skill);
CREATE INDEX IF NOT EXISTS idx_training_team     ON training_sessions(team_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
ALTER TABLE clubs             DISABLE ROW LEVEL SECURITY;
ALTER TABLE seasons           DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams             DISABLE ROW LEVEL SECURITY;
ALTER TABLE players           DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches           DISABLE ROW LEVEL SECURITY;
ALTER TABLE scouting_events   DISABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance        DISABLE ROW LEVEL SECURITY;
ALTER TABLE injuries          DISABLE ROW LEVEL SECURITY;
ALTER TABLE videos            DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles          DISABLE ROW LEVEL SECURITY;
ALTER TABLE opponents         DISABLE ROW LEVEL SECURITY;

-- Profiles: each user sees/edits their own
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Clubs: authenticated users can read clubs; only super_admin can insert/update
CREATE POLICY "clubs_select_auth"   ON clubs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "clubs_insert_admin"  ON clubs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "clubs_update_admin"  ON clubs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Teams, Players, Matches, Scouting: club members can access their club's data
CREATE POLICY "teams_club_access" ON teams FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND club_id = teams.club_id)
);
CREATE POLICY "players_club_access" ON players FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND club_id = players.club_id)
);
CREATE POLICY "matches_club_access" ON matches FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND club_id = matches.club_id)
);
CREATE POLICY "opponents_club_access" ON opponents FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND club_id = opponents.club_id)
);
CREATE POLICY "seasons_club_access" ON seasons FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND club_id = seasons.club_id)
);
CREATE POLICY "videos_club_access" ON videos FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND club_id = videos.club_id)
);

-- Scouting events: accessible via match
CREATE POLICY "scouting_match_access" ON scouting_events FOR ALL USING (
  EXISTS (
    SELECT 1 FROM matches m
    JOIN profiles p ON p.club_id = m.club_id
    WHERE m.id = scouting_events.match_id AND p.id = auth.uid()
  )
);

-- Training/attendance/injuries: via team
CREATE POLICY "training_team_access" ON training_sessions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM teams t
    JOIN profiles p ON p.club_id = t.club_id
    WHERE t.id = training_sessions.team_id AND p.id = auth.uid()
  )
);
CREATE POLICY "attendance_session_access" ON attendance FOR ALL USING (
  EXISTS (
    SELECT 1 FROM training_sessions ts
    JOIN teams t ON t.id = ts.team_id
    JOIN profiles p ON p.club_id = t.club_id
    WHERE ts.id = attendance.session_id AND p.id = auth.uid()
  )
);
CREATE POLICY "injuries_club_access" ON injuries FOR ALL USING (
  EXISTS (
    SELECT 1 FROM players pl
    JOIN profiles p ON p.club_id = pl.club_id
    WHERE pl.id = injuries.player_id AND p.id = auth.uid()
  )
);

-- ─────────────────────────────────────────────
-- AUTO-UPDATE updated_at trigger
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clubs_updated_at    BEFORE UPDATE ON clubs    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_teams_updated_at    BEFORE UPDATE ON teams    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_players_updated_at  BEFORE UPDATE ON players  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_matches_updated_at  BEFORE UPDATE ON matches  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────
-- AUTO-CREATE PROFILE on sign-up
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
