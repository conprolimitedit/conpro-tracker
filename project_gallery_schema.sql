-- =====================================================
-- PROJECT GALLERY TABLE
-- =====================================================
-- Stores gallery items (photos and videos) for construction projects
-- Each item contains file metadata and upload response data as JSON

CREATE TABLE project_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  project_slug TEXT NOT NULL,
  file_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for querying by project slug
CREATE INDEX idx_project_gallery_slug ON project_gallery(project_slug);

-- Index for querying by project ID
CREATE INDEX idx_project_gallery_project_id ON project_gallery(project_id);

-- Index for ordering by creation date
CREATE INDEX idx_project_gallery_created_at ON project_gallery(created_at DESC);

-- =====================================================
-- EXAMPLE FILE_DATA JSON STRUCTURE
-- =====================================================
-- The file_data JSONB column will store the complete upload response object
-- Example structure:
/*
{
  "name": "site-progress-jan-2024.jpg",
  "type": "image/jpeg",
  "size": 2621440,
  "url": "https://supabase-storage-url/path/to/file.jpg",
  "thumbnail": "https://supabase-storage-url/path/to/thumbnail.jpg",
  "description": "Site progress photos showing foundation work completion",
  "file_type": "file",
  "comment": "Monthly progress documentation",
  "upload_response": {
    "path": "projects/ghana-water-company/gallery/site-progress-jan-2024.jpg",
    "id": "file-id-from-supabase",
    "fullPath": "projects/ghana-water-company/gallery/site-progress-jan-2024.jpg",
    "name": "site-progress-jan-2024.jpg",
    "size": 2621440,
    "mimeType": "image/jpeg",
    "etag": "etag-value",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "bucketId": "conproProjectsBucket",
    "lastAccessedAt": "2024-01-15T10:30:00Z",
    "metadata": {
      "eTag": "etag-value",
      "size": 2621440,
      "mimetype": "image/jpeg",
      "cacheControl": "max-age=3600",
      "lastModified": "2024-01-15T10:30:00Z",
      "contentLength": 2621440,
      "httpStatusCode": 200
    }
  }
}
*/

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE project_gallery IS 'Stores gallery items (photos and videos) for construction projects';
COMMENT ON COLUMN project_gallery.id IS 'Unique identifier for each gallery item';
COMMENT ON COLUMN project_gallery.project_id IS 'Reference to the project this gallery item belongs to';
COMMENT ON COLUMN project_gallery.project_slug IS 'Project slug for easy querying';
COMMENT ON COLUMN project_gallery.file_data IS 'Complete file metadata and upload response as JSON';
COMMENT ON COLUMN project_gallery.created_at IS 'When the gallery item was created';
COMMENT ON COLUMN project_gallery.updated_at IS 'When the gallery item was last updated';
