-- Financial Documents Table Schema
CREATE TABLE financial_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  project_slug TEXT NOT NULL,
  documentType TEXT NOT NULL,
  project_phase TEXT NOT NULL,
  sub_menu TEXT NOT NULL,
  financial_amount DECIMAL(15,2),
  document_date DATE,
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'medium',
  special_notes TEXT,
  general_comments TEXT,
  file_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_financial_documents_project_slug ON financial_documents(project_slug);
CREATE INDEX idx_financial_documents_project_id ON financial_documents(project_id);
CREATE INDEX idx_financial_documents_document_type ON financial_documents(documentType);
CREATE INDEX idx_financial_documents_project_phase ON financial_documents(project_phase);
CREATE INDEX idx_financial_documents_priority ON financial_documents(priority);
CREATE INDEX idx_financial_documents_created_at ON financial_documents(created_at);

-- Add foreign key constraint (optional, if you want to enforce referential integrity)
-- ALTER TABLE financial_documents ADD CONSTRAINT fk_financial_documents_project 
-- FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE;
