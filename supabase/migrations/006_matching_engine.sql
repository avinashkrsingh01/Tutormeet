-- ============================================================
-- TutorMeet — Matching Engine Schema Extensions
-- Run AFTER 005_tutor_onboarding.sql
-- ============================================================

-- Add match score + reasons to tutor_matches
ALTER TABLE tutor_matches
  ADD COLUMN IF NOT EXISTS match_score    NUMERIC(5, 2)
    CHECK (match_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS match_reasons  JSONB  DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS matched_by     UUID   REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS match_source   TEXT   DEFAULT 'admin'
    CHECK (match_source IN ('admin', 'engine', 'auto'));

-- Index for sorting matches by score
CREATE INDEX IF NOT EXISTS idx_tutor_matches_score
  ON tutor_matches(match_score DESC NULLS LAST)
  WHERE match_status NOT IN ('rejected');

-- Add match_score column to admin_actions metadata audit
-- (already handled via metadata JSONB)
