-- =====================================================
-- CONPRO TRACKER - COMPLETE DATABASE SCHEMAS
-- =====================================================
-- This file contains all the database schemas for the ConPro Tracker application
-- Created: 2024
-- Description: Complete database structure for project management system

-- =====================================================
-- 1. PROJECT FILES TABLE
-- =====================================================
-- Stores file uploads and links for each phase of construction projects

CREATE TABLE project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  project_slug TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN (
    -- Pre-contract phases
    'advert', 
    'eoi', 
    'rfp', 
    'conceptual', 
    'specification', 
    'bill-of-quantities',
    'structural-designs', 
    'meep', 
    'award-letter', 
    'acceptance-letter', 
    'signing',
    -- Post-contract phases
    'consultant-inception', 
    'consultant-progress-reports', 
    'consultant-site-meeting-minutes',
    'consultant-invoice-claims', 
    'consultant-handing-over', 
    'consultant-defect-liability',
    'consultant-final-account', 
    'contractor-mobilization', 
    'contractor-progress-reports',
    'contractor-site-meeting-minutes', 
    'contractor-ipcs', 
    'contractor-handing-over',
    'contractor-defect-liability', 
    'contractor-final-account'
  )),
  file_link JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. PROJECT METADATA TABLE
-- =====================================================
-- Stores phase-specific metadata for construction projects

CREATE TABLE project_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  project_slug TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN (
    -- Pre-contract phases
    'advert', 
    'eoi', 
    'rfp', 
    'conceptual', 
    'specification', 
    'bill-of-quantities',
    'structural-designs', 
    'meep', 
    'award-letter', 
    'acceptance-letter', 
    'signing',
    -- Post-contract phases
    'consultant-inception', 
    'consultant-progress-reports', 
    'consultant-site-meeting-minutes',
    'consultant-invoice-claims', 
    'consultant-handing-over', 
    'consultant-defect-liability',
    'consultant-final-account', 
    'contractor-mobilization', 
    'contractor-progress-reports',
    'contractor-site-meeting-minutes', 
    'contractor-ipcs', 
    'contractor-handing-over',
    'contractor-defect-liability', 
    'contractor-final-account'
  )),
  
  -- Common fields for ALL phases
  phase_status TEXT NOT NULL CHECK (phase_status IN ('completed', 'uncompleted', 'unsubmitted')),
  phase_deadline DATE NOT NULL,
  
  -- Advert in the Media specific fields
  advert_date DATE,
  publication_date DATE,
  
  -- Consultant Inception specific fields
  inception_date DATE,
  inception_status TEXT CHECK (inception_status IN ('not-started', 'draft', 'in-progress', 'under-review', 'approved', 'completed', 'rejected')),
  
  -- Additional metadata as JSONB for flexibility (for any other custom fields)
  additional_metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. INDEXES FOR PROJECT_FILES TABLE
-- =====================================================

CREATE INDEX idx_project_files_project_phase ON project_files(project_slug, phase);
CREATE INDEX idx_project_files_project_id ON project_files(project_id);
CREATE INDEX idx_project_files_phase ON project_files(phase);
CREATE INDEX idx_project_files_file_link ON project_files USING GIN (file_link);
CREATE INDEX idx_project_files_created_at ON project_files(created_at);

-- =====================================================
-- 4. INDEXES FOR PROJECT_METADATA TABLE
-- =====================================================

CREATE INDEX idx_project_metadata_project_phase ON project_metadata(project_slug, phase);
CREATE INDEX idx_project_metadata_project_id ON project_metadata(project_id);
CREATE INDEX idx_project_metadata_phase ON project_metadata(phase);
CREATE INDEX idx_project_metadata_phase_status ON project_metadata(phase_status);
CREATE INDEX idx_project_metadata_phase_deadline ON project_metadata(phase_deadline);
CREATE INDEX idx_project_metadata_additional_metadata ON project_metadata USING GIN (additional_metadata);

-- =====================================================
-- 5. FOREIGN KEY CONSTRAINTS
-- =====================================================
-- Uncomment these when the projects table exists

-- ALTER TABLE project_files ADD CONSTRAINT fk_project_files_project_id 
-- FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE;

-- ALTER TABLE project_metadata ADD CONSTRAINT fk_project_metadata_project_id 
-- FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE;

-- =====================================================
-- 6. TRIGGER FUNCTIONS
-- =====================================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to ensure only one row per project-phase combination for project_files
CREATE OR REPLACE FUNCTION ensure_unique_project_phase()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if a row already exists for this project-phase combination
    IF EXISTS (
        SELECT 1 FROM project_files 
        WHERE project_slug = NEW.project_slug 
        AND phase = NEW.phase 
        AND id != COALESCE(NEW.id, gen_random_uuid())
    ) THEN
        RAISE EXCEPTION 'A file entry already exists for project % and phase %', 
            NEW.project_slug, NEW.phase;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to ensure only one row per project-phase combination for project_metadata
CREATE OR REPLACE FUNCTION ensure_unique_project_phase_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if a row already exists for this project-phase combination
    IF EXISTS (
        SELECT 1 FROM project_metadata 
        WHERE project_slug = NEW.project_slug 
        AND phase = NEW.phase 
        AND id != COALESCE(NEW.id, gen_random_uuid())
    ) THEN
        RAISE EXCEPTION 'Metadata already exists for project % and phase %', 
            NEW.project_slug, NEW.phase;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Triggers for project_files table
CREATE TRIGGER update_project_files_updated_at 
    BEFORE UPDATE ON project_files 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER ensure_unique_project_phase_trigger
    BEFORE INSERT OR UPDATE ON project_files
    FOR EACH ROW
    EXECUTE FUNCTION ensure_unique_project_phase();

-- Triggers for project_metadata table
CREATE TRIGGER update_project_metadata_updated_at_trigger
    BEFORE UPDATE ON project_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_project_metadata_updated_at();

CREATE TRIGGER ensure_unique_project_phase_metadata_trigger
    BEFORE INSERT OR UPDATE ON project_metadata
    FOR EACH ROW
    EXECUTE FUNCTION ensure_unique_project_phase_metadata();

-- =====================================================
-- 8. COMMENTS AND DOCUMENTATION
-- =====================================================

-- Table comments
COMMENT ON TABLE project_files IS 'Stores file uploads and links for each phase of construction projects';
COMMENT ON TABLE project_metadata IS 'Stores phase-specific metadata for construction projects';

-- Column comments for project_files
COMMENT ON COLUMN project_files.project_id IS 'Reference to the project UUID';
COMMENT ON COLUMN project_files.project_slug IS 'Human-readable project identifier';
COMMENT ON COLUMN project_files.phase IS 'The specific phase this file belongs to (pre-contract or post-contract)';
COMMENT ON COLUMN project_files.file_link IS 'JSONB array containing file objects with type, name, url, size, etc.';

-- Column comments for project_metadata
COMMENT ON COLUMN project_metadata.project_id IS 'Reference to the project UUID';
COMMENT ON COLUMN project_metadata.project_slug IS 'Human-readable project identifier';
COMMENT ON COLUMN project_metadata.phase IS 'The specific phase this metadata belongs to';
COMMENT ON COLUMN project_metadata.phase_status IS 'Current status of the phase (completed, uncompleted, unsubmitted)';
COMMENT ON COLUMN project_metadata.phase_deadline IS 'Deadline for completing this phase';
COMMENT ON COLUMN project_metadata.additional_metadata IS 'JSONB object for storing any additional phase-specific data';

-- =====================================================
-- 9. JSONB STRUCTURE EXAMPLES
-- =====================================================

-- Example of the JSONB structure for file_link in project_files
/*
[
  {
    "id": "unique-file-id",
    "type": "file",
    "name": "specifications.pdf",
    "url": "https://storage.url/specs.pdf",
    "size": 1024000,
    "mimeType": "application/pdf",
    "comment": "Main specifications document",
    "uploadedAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": "unique-link-id",
    "type": "link", 
    "name": "https://example.com/guidelines",
    "url": "https://example.com/guidelines",
    "comment": "External design guidelines",
    "uploadedAt": "2024-01-15T10:35:00Z"
  }
]
*/

-- Example of additional_metadata JSONB structure
/*
{
  "customField1": "value1",
  "customField2": "value2",
  "notes": "Additional phase-specific notes",
  "priority": "high",
  "assignedTo": "user@example.com"
}
*/

-- =====================================================
-- 10. USAGE EXAMPLES
-- =====================================================

-- Insert files for a phase
/*
INSERT INTO project_files (project_id, project_slug, phase, file_link) 
VALUES (
  'project-uuid-here',
  'sample-project',
  'bill-of-quantities',
  '[
    {
      "id": "file-1",
      "type": "file",
      "name": "specifications.pdf",
      "url": "https://storage.url/specs.pdf",
      "size": 1024000,
      "mimeType": "application/pdf",
      "comment": "Main specifications",
      "uploadedAt": "2024-01-15T10:30:00Z"
    }
  ]'::jsonb
);
*/

-- Insert metadata for a phase
/*
INSERT INTO project_metadata (
  project_id, project_slug, phase, 
  phase_status, phase_deadline, 
  advert_date, publication_date
) VALUES (
  'project-uuid', 'sample-project', 'advert',
  'completed', '2024-02-15',
  '2024-01-15', '2024-01-20'
);
*/

-- Query files for a specific phase
/*
SELECT file_link FROM project_files 
WHERE project_slug = 'sample-project' 
AND phase = 'bill-of-quantities';
*/

-- Query metadata for a specific phase
/*
SELECT * FROM project_metadata 
WHERE project_slug = 'sample-project' 
AND phase = 'advert';
*/

-- Update files for a phase
/*
UPDATE project_files 
SET file_link = '[...new files...]'::jsonb,
    updated_at = NOW()
WHERE project_slug = 'sample-project' 
AND phase = 'bill-of-quantities';
*/

-- Update phase status
/*
UPDATE project_metadata 
SET phase_status = 'completed', 
    updated_at = NOW()
WHERE project_slug = 'sample-project' 
AND phase = 'advert';
*/

-- =====================================================
-- 11. PHASE REFERENCE
-- =====================================================

-- Pre-contract phases (9 total):
-- 1. advert - Advert in the Media
-- 2. eoi - Expression of Interest (EOI)
-- 3. rfp - Request for Proposal
-- 4. conceptual - Conceptual and ArcViz
-- 5. specification - Specification and General Work Schedule
-- 6. bill-of-quantities - Bill of Quantities
-- 7. structural-designs - Structural Designs
-- 8. meep - MEEP (Mechanical, Electrical, Electronic, and Plumbing)
-- 9. award-letter - Award Letter
-- 10. acceptance-letter - Acceptance Letter
-- 11. signing - Signing of Contract Documents

-- Post-contract phases (14 total):
-- Consultant (7 phases):
-- 12. consultant-inception - Inception Report
-- 13. consultant-progress-reports - Progress Reports
-- 14. consultant-site-meeting-minutes - Site Meeting Minutes
-- 15. consultant-invoice-claims - Consultant's Invoice / Fee Claims
-- 16. consultant-handing-over - Handing Over
-- 17. consultant-defect-liability - Defect Liability
-- 18. consultant-final-account - Final Account

-- Contractor (7 phases):
-- 19. contractor-mobilization - Mobilization to Sites
-- 20. contractor-progress-reports - Progress Reports
-- 21. contractor-site-meeting-minutes - Site Meeting Minutes
-- 22. contractor-ipcs - Contractor IPCs
-- 23. contractor-handing-over - Handing Over
-- 24. contractor-defect-liability - Defect Liability Period
-- 25. contractor-final-account - Final Account

-- =====================================================
-- 12. FIELD MAPPING BY PHASE
-- =====================================================

-- Most phases (21 out of 25) only have:
-- - phase_status (completed, uncompleted, unsubmitted)
-- - phase_deadline (DATE)

-- Special phases with additional fields:
-- - advert: + advert_date, publication_date
-- - consultant-inception: + inception_date, inception_status

-- All other phases use the additional_metadata JSONB field for custom data

-- =====================================================
-- END OF SCHEMA
-- =====================================================
