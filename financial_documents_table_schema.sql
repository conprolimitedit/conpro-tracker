-- Financial Documents Table Schema
CREATE TABLE financial_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  project_slug TEXT NOT NULL,
  document_type_id INTEGER NOT NULL, -- References finance_documents.id
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
CREATE INDEX idx_financial_documents_document_type_id ON financial_documents(document_type_id);
CREATE INDEX idx_financial_documents_project_phase ON financial_documents(project_phase);
CREATE INDEX idx_financial_documents_priority ON financial_documents(priority);
CREATE INDEX idx_financial_documents_created_at ON financial_documents(created_at);
CREATE INDEX idx_financial_documents_document_date ON financial_documents(document_date);
CREATE INDEX idx_financial_documents_due_date ON financial_documents(due_date);

-- Add foreign key constraint to finance_documents table
ALTER TABLE financial_documents 
ADD CONSTRAINT fk_financial_documents_document_type 
FOREIGN KEY (document_type_id) REFERENCES finance_documents(id) ON DELETE RESTRICT;

-- Add foreign key constraint to projects table (optional, if you want to enforce referential integrity)
-- ALTER TABLE financial_documents 
-- ADD CONSTRAINT fk_financial_documents_project 
-- FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE;

-- Add check constraints for data validation
ALTER TABLE financial_documents 
ADD CONSTRAINT chk_financial_documents_amount 
CHECK (financial_amount IS NULL OR financial_amount >= 0);

ALTER TABLE financial_documents 
ADD CONSTRAINT chk_financial_documents_priority 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

ALTER TABLE financial_documents 
ADD CONSTRAINT chk_financial_documents_phase 
CHECK (project_phase IN ('pre-contract', 'post-contract-consultant', 'post-contract-contractor'));

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_financial_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_financial_documents_updated_at
    BEFORE UPDATE ON financial_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_financial_documents_updated_at();
