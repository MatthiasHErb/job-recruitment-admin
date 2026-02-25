-- Recruitment candidates table (AI analysis cache)
-- Run this in your Supabase SQL Editor (same project as job-application-erb)

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

-- RLS: only authenticated users can access
ALTER TABLE recruitment_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can do everything"
  ON recruitment_candidates
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Settings for AI analysis prompt (editable by users)
CREATE TABLE IF NOT EXISTS recruitment_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

ALTER TABLE recruitment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can do everything on settings"
  ON recruitment_settings FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Archived applications (hidden from main list)
CREATE TABLE IF NOT EXISTS archived_applications (
  pdf_path TEXT PRIMARY KEY,
  archived_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE archived_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can do everything on archived"
  ON archived_applications FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
