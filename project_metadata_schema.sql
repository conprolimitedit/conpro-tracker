-- =====================================================
-- PROJECT METADATA JSONB SCHEMA
-- =====================================================
-- This file contains the JSONB metadata structure for all 25 project phases
-- Created: 2024
-- Description: Complete metadata structure with default values for construction projects

-- =====================================================
-- ADD METADATA COLUMN TO PROJECTS TABLE
-- =====================================================
-- Add this column to your existing projects table

ALTER TABLE projects ADD COLUMN metadata JSONB DEFAULT '{
  "phases": {
    "advert": {
      "phase_status": "unsubmitted",
      "phase_deadline": null,
      "advert_date": null,
      "publication_date": null
    },
    "eoi": {
      "phase_status": "unsubmitted",
      "phase_deadline": null
    },
    "rfp": {
      "phase_status": "unsubmitted",
      "phase_deadline": null
    },
    "conceptual": {
      "phase_status": "unsubmitted",
      "phase_deadline": null
    },
    "specification": {
      "phase_status": "unsubmitted",
      "phase_deadline": null
    },
    "bill-of-quantities": {
      "phase_status": "unsubmitted",
      "phase_deadline": null
    },
    "structural-designs": {
      "phase_status": "unsubmitted",
      "phase_deadline": null
    },
    "meep": {
      "phase_status": "unsubmitted",
      "phase_deadline": null
    },
    "award-letter": {
      "phase_status": "unsubmitted",
      "phase_deadline": null
    },
    "acceptance-letter": {
      "phase_status": "unsubmitted",
      "phase_deadline": null
    },
    "signing": {
      "phase_status": "unsubmitted",
      "phase_deadline": null
    },
    "consultant-inception": {
      "phase_status": "unsubmitted",
      "phase_deadline": null,
      "inception_date": null,
      "inception_status": "not-started"
    },
    "consultant-progress-reports": {
      "phase_status": "unsubmitted",
      "phase_deadline": null
    },
    "consultant-site-meeting-minutes": {
      "phase_status": "unsubmitted",
      "phase_deadline": null
    },
    "consultant-invoice-claims": {
      "phase_status": "unsubmitted",
      "phase_deadline": null
    },
    "consultant-handing-over": {
      "phase_status": "unsubmitted",
      "phase_deadline": null
    },
    "consultant-defect-liability": {
      "phase_status": "unsubmitted",
      "phase_deadline": null
    },
    "consultant-final-account": {
      "phase_status": "unsubmitted",
      "phase_deadline": null
    },
    "contractor-mobilization": {
      "phase_status": "unsubmitted",
      "phase_deadline": null
    },
    "contractor-progress-reports": {
      "phase_status": "unsubmitted",
      "phase_deadline": null
    },
    "contractor-site-meeting-minutes": {
      "phase_status": "unsubmitted",
      "phase_deadline": null
    },
    "contractor-ipcs": {
      "phase_status": "unsubmitted",
      "phase_deadline": null
    },
    "contractor-handing-over": {
      "phase_status": "unsubmitted",
      "phase_deadline": null
    },
    "contractor-defect-liability": {
      "phase_status": "unsubmitted",
      "phase_deadline": null
    },
    "contractor-final-account": {
      "phase_status": "unsubmitted",
      "phase_deadline": null
    }
  }
}'::jsonb;

-- =====================================================
-- CREATE INDEX FOR METADATA QUERIES
-- =====================================================

-- Index for querying specific phase metadata
CREATE INDEX idx_projects_metadata_phases ON projects USING GIN ((metadata->'phases'));

-- Index for querying phase status across all projects
CREATE INDEX idx_projects_phase_status ON projects USING GIN ((metadata->'phases'->'phase_status'));

-- Index for querying phase deadlines
CREATE INDEX idx_projects_phase_deadline ON projects USING GIN ((metadata->'phases'->'phase_deadline'));

-- =====================================================
-- HELPER FUNCTIONS FOR METADATA OPERATIONS
-- =====================================================

-- Function to update a specific phase's metadata
CREATE OR REPLACE FUNCTION update_phase_metadata(
  project_slug_param TEXT,
  phase_name TEXT,
  phase_data JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE projects 
  SET metadata = jsonb_set(
    metadata, 
    ARRAY['phases', phase_name], 
    phase_data
  )
  WHERE project_slug = project_slug_param;
END;
$$ LANGUAGE plpgsql;

-- Function to get a specific phase's metadata
CREATE OR REPLACE FUNCTION get_phase_metadata(
  project_slug_param TEXT,
  phase_name TEXT
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT metadata->'phases'->phase_name INTO result
  FROM projects 
  WHERE project_slug = project_slug_param;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Function to update phase status
CREATE OR REPLACE FUNCTION update_phase_status(
  project_slug_param TEXT,
  phase_name TEXT,
  new_status TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE projects 
  SET metadata = jsonb_set(
    metadata, 
    ARRAY['phases', phase_name, 'phase_status'], 
    to_jsonb(new_status)
  )
  WHERE project_slug = project_slug_param;
END;
$$ LANGUAGE plpgsql;

-- Function to update phase deadline
CREATE OR REPLACE FUNCTION update_phase_deadline(
  project_slug_param TEXT,
  phase_name TEXT,
  new_deadline DATE
)
RETURNS VOID AS $$
BEGIN
  UPDATE projects 
  SET metadata = jsonb_set(
    metadata, 
    ARRAY['phases', phase_name, 'phase_deadline'], 
    to_jsonb(new_deadline)
  )
  WHERE project_slug = project_slug_param;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Update a specific phase's metadata
/*
SELECT update_phase_metadata(
  'sample-project',
  'advert',
  '{
    "phase_status": "completed",
    "phase_deadline": "2024-01-15",
    "advert_date": "2024-01-10",
    "publication_date": "2024-01-12"
  }'::jsonb
);
*/

-- Get a specific phase's metadata
/*
SELECT get_phase_metadata('sample-project', 'advert');
*/

-- Update just the phase status
/*
SELECT update_phase_status('sample-project', 'advert', 'completed');
*/

-- Update just the phase deadline
/*
SELECT update_phase_deadline('sample-project', 'advert', '2024-01-15');
*/

-- Query all phases for a project
/*
SELECT metadata->'phases' FROM projects WHERE project_slug = 'sample-project';
*/

-- Query specific phase status
/*
SELECT metadata->'phases'->'advert'->'phase_status' as advert_status
FROM projects WHERE project_slug = 'sample-project';
*/

-- Query all projects with a specific phase status
/*
SELECT project_slug, project_name
FROM projects 
WHERE metadata->'phases'->'advert'->>'phase_status' = 'completed';
*/

-- Query projects with overdue phases
/*
SELECT project_slug, project_name, phase_name, phase_deadline
FROM projects, 
     jsonb_each(metadata->'phases') as phases(phase_name, phase_data)
WHERE (phase_data->>'phase_deadline')::date < CURRENT_DATE
  AND phase_data->>'phase_status' != 'completed';
*/

-- =====================================================
-- PHASE REFERENCE WITH DEFAULT VALUES
-- =====================================================

-- PRE-CONTRACT PHASES (11 total):
-- 1. advert - Advert in the Media
--    Default: phase_status: "unsubmitted", phase_deadline: null, advert_date: null, publication_date: null
-- 2. eoi - Expression of Interest (EOI)
--    Default: phase_status: "unsubmitted", phase_deadline: null
-- 3. rfp - Request for Proposal
--    Default: phase_status: "unsubmitted", phase_deadline: null
-- 4. conceptual - Conceptual and ArcViz
--    Default: phase_status: "unsubmitted", phase_deadline: null
-- 5. specification - Specification and General Work Schedule
--    Default: phase_status: "unsubmitted", phase_deadline: null
-- 6. bill-of-quantities - Bill of Quantities
--    Default: phase_status: "unsubmitted", phase_deadline: null
-- 7. structural-designs - Structural Designs
--    Default: phase_status: "unsubmitted", phase_deadline: null
-- 8. meep - MEEP (Mechanical, Electrical, Electronic, and Plumbing)
--    Default: phase_status: "unsubmitted", phase_deadline: null
-- 9. award-letter - Award Letter
--    Default: phase_status: "unsubmitted", phase_deadline: null
-- 10. acceptance-letter - Acceptance Letter
--     Default: phase_status: "unsubmitted", phase_deadline: null
-- 11. signing - Signing of Contract Documents
--     Default: phase_status: "unsubmitted", phase_deadline: null

-- POST-CONTRACT PHASES (14 total):
-- CONSULTANT PHASES (7 total):
-- 12. consultant-inception - Inception Report
--     Default: phase_status: "unsubmitted", phase_deadline: null, inception_date: null, inception_status: "not-started"
-- 13. consultant-progress-reports - Progress Reports
--     Default: phase_status: "unsubmitted", phase_deadline: null
-- 14. consultant-site-meeting-minutes - Site Meeting Minutes
--     Default: phase_status: "unsubmitted", phase_deadline: null
-- 15. consultant-invoice-claims - Consultant's Invoice / Fee Claims
--     Default: phase_status: "unsubmitted", phase_deadline: null
-- 16. consultant-handing-over - Handing Over
--     Default: phase_status: "unsubmitted", phase_deadline: null
-- 17. consultant-defect-liability - Defect Liability
--     Default: phase_status: "unsubmitted", phase_deadline: null
-- 18. consultant-final-account - Final Account
--     Default: phase_status: "unsubmitted", phase_deadline: null

-- CONTRACTOR PHASES (7 total):
-- 19. contractor-mobilization - Mobilization to Sites
--     Default: phase_status: "unsubmitted", phase_deadline: null
-- 20. contractor-progress-reports - Progress Reports
--     Default: phase_status: "unsubmitted", phase_deadline: null
-- 21. contractor-site-meeting-minutes - Site Meeting Minutes
--     Default: phase_status: "unsubmitted", phase_deadline: null
-- 22. contractor-ipcs - Contractor IPCs
--     Default: phase_status: "unsubmitted", phase_deadline: null
-- 23. contractor-handing-over - Handing Over
--     Default: phase_status: "unsubmitted", phase_deadline: null
-- 24. contractor-defect-liability - Defect Liability Period
--     Default: phase_status: "unsubmitted", phase_deadline: null
-- 25. contractor-final-account - Final Account
--     Default: phase_status: "unsubmitted", phase_deadline: null

-- =====================================================
-- STATUS VALUES REFERENCE
-- =====================================================

-- phase_status possible values:
-- - "unsubmitted" (default for all phases)
-- - "uncompleted" (work in progress)
-- - "completed" (phase finished)

-- inception_status possible values (Consultant Inception only):
-- - "not-started" (default)
-- - "draft"
-- - "in-progress"
-- - "under-review"
-- - "approved"
-- - "completed"
-- - "rejected"

-- =====================================================
-- END OF PROJECT METADATA JSONB SCHEMA
-- =====================================================