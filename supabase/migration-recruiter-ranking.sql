-- Migration: Add recruiter_ranking column
-- Run in Supabase SQL Editor if column doesn't exist yet

ALTER TABLE recruitment_candidates
ADD COLUMN IF NOT EXISTS recruiter_ranking TEXT CHECK (recruiter_ranking IN ('A', 'B', 'C'));
