-- Projects Table Schema for Supabase
-- This script creates the projects table with all required fields

CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_name TEXT NOT NULL,
    project_slug TEXT UNIQUE NOT NULL,
    project_deadline DATE,
    project_priority TEXT CHECK (project_priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    project_cover_image JSONB, -- Stores the image upload response JSON from Supabase Storage
    project_location JSONB, -- Stores location data as JSON: {country, region, city, town, gpsCoordinates: {lat, lng}}
    project_clients TEXT[], -- Array of client IDs
    funding_agencies TEXT[], -- Array of funding agency IDs
    clerk_of_works TEXT[], -- Array of clerk of works IDs
    project_managers TEXT[], -- Array of project manager IDs
    project_coordinators TEXT[], -- Array of project coordinator IDs
    building_types TEXT[], -- Array of building type IDs
    project_services TEXT[], -- Array of service IDs
    project_status TEXT,
    
    -- Timeline fields (all as TEXT)
    project_start_date TEXT,
    project_completion_date TEXT,
    handing_over_date TEXT,
    revised_date TEXT,
    
    -- Project details
    linked_projects TEXT[], -- Array of linked project IDs
    project_description TEXT,
    project_details TEXT,
    project_special_comment TEXT,
    project_completion_percentage INTEGER DEFAULT 0 CHECK (project_completion_percentage >= 0 AND project_completion_percentage <= 100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on the slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(project_slug);

-- Create an index on project status for filtering
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(project_status);

-- Create an index on project priority for filtering
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(project_priority);

-- Create a function to automatically generate slug from project name
CREATE OR REPLACE FUNCTION generate_project_slug(project_name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(project_name, '[^a-zA-Z0-9\s-]', '', 'g'),
                '\s+', '-', 'g'
            ),
            '-+', '-', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically generate slug when project name is inserted or updated
CREATE OR REPLACE FUNCTION set_project_slug()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate slug from project name
    NEW.project_slug := generate_project_slug(NEW.project_name);
    
    -- Update the updated_at timestamp
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT
CREATE TRIGGER trigger_set_project_slug_insert
    BEFORE INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION set_project_slug();

-- Create trigger for UPDATE
CREATE TRIGGER trigger_set_project_slug_update
    BEFORE UPDATE ON projects
    FOR EACH ROW
    WHEN (OLD.project_name IS DISTINCT FROM NEW.project_name)
    EXECUTE FUNCTION set_project_slug();

-- Create trigger for updated_at
CREATE TRIGGER trigger_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION set_project_slug();

-- Insert some sample data (optional - remove if not needed)
INSERT INTO projects (
    project_name,
    project_deadline,
    project_priority,
    project_location,
    project_clients,
    funding_agencies,
    project_status,
    project_description
) VALUES (
    'Sample Construction Project',
    '2024-12-31',
    'high',
    '{"country": "UG", "region": "Central Region", "city": "Kampala", "town": "Nakasero", "gpsCoordinates": {"lat": "0.3476", "lng": "32.5825"}}',
    ARRAY['client1', 'client2'],
    ARRAY['funding1'],
    'in-progress',
    'This is a sample construction project for demonstration purposes.'
) ON CONFLICT (project_slug) DO NOTHING;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT ALL ON projects TO authenticated;
-- GRANT ALL ON projects TO anon;
