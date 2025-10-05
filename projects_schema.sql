-- Projects Table Schema
-- This script creates the projects table with all the required fields

CREATE TABLE IF NOT EXISTS projects (
    -- Primary Key
    project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Project Information
    project_name VARCHAR(255) NOT NULL,
    project_slug TEXT UNIQUE NOT NULL,
    project_deadline DATE,
    project_priority TEXT CHECK (project_priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Cover Image (JSON for file upload data)
    project_cover_image JSONB,
    
    -- Location (JSON for country, region, city, town, coordinates)
    project_location JSONB,
    
    -- Arrays for various stakeholders and details
    project_clients TEXT[],
    funding_agencies TEXT[],
    contractors TEXT[],
    clerk_of_works TEXT[],
    project_coordinators TEXT[],
    project_managers TEXT[],
    building_types TEXT[],
    project_services TEXT[],
    
    -- Project Status and Timeline
    project_status TEXT CHECK (project_status IN ('planning', 'in-progress', 'completed', 'on-hold', 'cancelled')),
    project_start_date DATE,
    project_end_date DATE,
    handing_over_date DATE,
    revised_date DATE,
    
    -- Linked Projects
    linked_projects TEXT[],
    
    -- Project Descriptions
    project_description TEXT,
    project_details TEXT,
    project_special_comment TEXT,
    
    -- Completion Tracking
    project_completion_percentage INTEGER CHECK (project_completion_percentage >= 0 AND project_completion_percentage <= 100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(project_slug);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(project_status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(project_priority);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(project_start_date);
CREATE INDEX IF NOT EXISTS idx_projects_deadline ON projects(project_deadline);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments to explain the JSONB fields
COMMENT ON COLUMN projects.project_cover_image IS 'JSON object containing file upload data: {url, filename, size, type, etc.}';
COMMENT ON COLUMN projects.project_location IS 'JSON object containing: {country, region, city, town, gpsCoordinates: {lat, lng}}';
COMMENT ON COLUMN projects.project_clients IS 'Array of client names/IDs';
COMMENT ON COLUMN projects.funding_agencies IS 'Array of funding agency names/IDs';
COMMENT ON COLUMN projects.contractors IS 'Array of contractor names/IDs';
COMMENT ON COLUMN projects.clerk_of_works IS 'Array of clerk of works names/IDs';
COMMENT ON COLUMN projects.project_coordinators IS 'Array of project coordinator names/IDs';
COMMENT ON COLUMN projects.project_managers IS 'Array of project manager names/IDs';
COMMENT ON COLUMN projects.building_types IS 'Array of building type names/IDs';
COMMENT ON COLUMN projects.project_services IS 'Array of project service names/IDs';
COMMENT ON COLUMN projects.linked_projects IS 'Array of linked project names/IDs';

-- Example of how the JSONB fields would look:
-- project_cover_image: {"url": "https://example.com/image.jpg", "filename": "cover.jpg", "size": 1024000, "type": "image/jpeg"}
-- project_location: {"country": "UG", "region": "Central Region", "city": "Kampala", "town": "Nakasero", "gpsCoordinates": {"lat": "0.3476", "lng": "32.5825"}}

-- Sample insert statement (commented out)
/*
INSERT INTO projects (
    project_name,
    project_slug,
    project_deadline,
    project_priority,
    project_cover_image,
    project_location,
    project_clients,
    funding_agencies,
    contractors,
    clerk_of_works,
    project_coordinators,
    project_managers,
    building_types,
    project_services,
    project_status,
    project_start_date,
    project_end_date,
    handing_over_date,
    revised_date,
    linked_projects,
    project_description,
    project_details,
    project_special_comment,
    project_completion_percentage
) VALUES (
    'Sample Project',
    'sample-project',
    '2024-12-31',
    'high',
    '{"url": "https://example.com/cover.jpg", "filename": "cover.jpg", "size": 1024000, "type": "image/jpeg"}',
    '{"country": "UG", "region": "Central Region", "city": "Kampala", "town": "Nakasero", "gpsCoordinates": {"lat": "0.3476", "lng": "32.5825"}}',
    ARRAY['Ministry of Works', 'Ministry of Education'],
    ARRAY['World Bank', 'African Development Bank'],
    ARRAY['Roko Construction', 'Dott Services'],
    ARRAY['John Muwonge', 'Sarah Nalukenge'],
    ARRAY['Dr. Kwame Asante', 'Eng. Ama Serwaa'],
    ARRAY['Ms. Akosua Mensah', 'Mr. Kofi Boateng'],
    ARRAY['Government Building', 'Residential Building'],
    ARRAY['Architectural Design', 'Structural Engineering'],
    'in-progress',
    '2024-01-01',
    '2024-12-31',
    '2024-12-15',
    NULL,
    ARRAY['Related Project 1', 'Related Project 2'],
    'This is a sample project description.',
    'Additional project details here.',
    'This project requires special attention due to tight deadlines.',
    25
);
*/
