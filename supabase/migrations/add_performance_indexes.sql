-- Performance optimization indexes for StackJob
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- Jobs Table Indexes
-- ============================================================================

-- Most common query: fetch all jobs for a user, ordered by creation date
CREATE INDEX IF NOT EXISTS idx_jobs_user_created
  ON jobs(user_id, created_at DESC);

-- Filter jobs by user and stage (for homepage grouping)
CREATE INDEX IF NOT EXISTS idx_jobs_user_stage
  ON jobs(user_id, stage);

-- Filter jobs by user and trade (for trade-specific filtering)
CREATE INDEX IF NOT EXISTS idx_jobs_user_trade
  ON jobs(user_id, trade);

-- Sort jobs by updated_at (for "recently modified" views)
CREATE INDEX IF NOT EXISTS idx_jobs_updated_at
  ON jobs(updated_at DESC);

-- ============================================================================
-- Documents Table Indexes
-- ============================================================================

-- Most common query: fetch all documents for a job
CREATE INDEX IF NOT EXISTS idx_documents_job_id
  ON documents(job_id, uploaded_at DESC);

-- Filter documents by type (for document type queries)
CREATE INDEX IF NOT EXISTS idx_documents_file_type
  ON documents(file_type);

-- ============================================================================
-- Voice Notes Table Indexes
-- ============================================================================

-- Most common query: fetch all notes for a job
CREATE INDEX IF NOT EXISTS idx_voice_notes_job_id
  ON voice_notes(job_id, created_at DESC);

-- ============================================================================
-- Profiles Table Indexes
-- ============================================================================

-- Query profile by user_id (already has PK, but explicit for clarity)
-- No additional index needed since id is already the primary key

-- ============================================================================
-- Analyze Tables for Query Planner
-- ============================================================================

ANALYZE jobs;
ANALYZE documents;
ANALYZE voice_notes;
ANALYZE profiles;

-- ============================================================================
-- Verify Indexes
-- ============================================================================

-- Run this query to see all indexes:
-- SELECT tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;
