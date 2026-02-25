-- Migration: Add settings and archive tables (if you already ran candidates.sql before)
-- Run this in Supabase SQL Editor if recruitment_settings/archived_applications don't exist yet

CREATE TABLE IF NOT EXISTS recruitment_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

ALTER TABLE recruitment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can do everything on settings"
  ON recruitment_settings FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS archived_applications (
  pdf_path TEXT PRIMARY KEY,
  archived_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE archived_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can do everything on archived"
  ON archived_applications FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
