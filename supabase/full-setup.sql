-- ============================================================
-- Recruitment Admin: Vollständiges Setup für Supabase SQL Editor
-- Einmal ausführen im gleichen Projekt wie job-application-erb
-- ============================================================

-- 1. Tabelle: recruitment_candidates (AI-Analyse + Recruiter-Ranking)
CREATE TABLE IF NOT EXISTS recruitment_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_path TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  current_position TEXT,
  ranking_score INTEGER,
  recruiter_ranking TEXT CHECK (recruiter_ranking IN ('A', 'B', 'C')),
  strengths TEXT,
  weaknesses TEXT,
  raw_analysis JSONB,
  analyzed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE recruitment_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can do everything" ON recruitment_candidates;
CREATE POLICY "Authenticated users can do everything"
  ON recruitment_candidates FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Tabelle: recruitment_settings (ChatGPT-Anweisungen)
CREATE TABLE IF NOT EXISTS recruitment_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

ALTER TABLE recruitment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can do everything on settings" ON recruitment_settings;
CREATE POLICY "Authenticated users can do everything on settings"
  ON recruitment_settings FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Tabelle: archived_applications (archivierte Bewerbungen)
CREATE TABLE IF NOT EXISTS archived_applications (
  pdf_path TEXT PRIMARY KEY,
  archived_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE archived_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can do everything on archived" ON archived_applications;
CREATE POLICY "Authenticated users can do everything on archived"
  ON archived_applications FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Fertig. Anschliessend: Auth-Nutzer anlegen unter Authentication → Add user
