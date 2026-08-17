-- Optional: add Design and Yet to Start columns to the cached projects_summary table.
-- The /api/projects-summary GET endpoint already computes live counts from projects,
-- so the app works without this. Run only if you want the cache columns kept in sync.

ALTER TABLE projects_summary
  ADD COLUMN IF NOT EXISTS design integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS yet_to_start integer DEFAULT 0;
