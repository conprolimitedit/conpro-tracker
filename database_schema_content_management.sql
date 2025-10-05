-- Content Management Database Schema
-- This file contains all the tables for content management with their respective fields

-- 1. Building Types Table
CREATE TABLE building_types (
    id SERIAL PRIMARY KEY,
    building_type VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Clerk of Works Table
CREATE TABLE clerk_of_works (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Clients Table
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    client_types VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Project Managers Table
CREATE TABLE project_managers (
    id SERIAL PRIMARY KEY,
    manager_name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Finance Documents Table
CREATE TABLE finance_documents (
    id SERIAL PRIMARY KEY,
    document_type VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Contractors Table
CREATE TABLE contractors (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Funding Agency Table
CREATE TABLE funding_agency (
    id SERIAL PRIMARY KEY,
    agency_name VARCHAR(255) NOT NULL,
    agency_type VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Project Types Table
CREATE TABLE project_types (
    id SERIAL PRIMARY KEY,
    project_type VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Services Table
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_role VARCHAR(100) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Project Coordinators Table
CREATE TABLE project_coordinators (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_building_types_category ON building_types(category);
CREATE INDEX idx_clerk_of_works_company ON clerk_of_works(company);
CREATE INDEX idx_clients_client_types ON clients(client_types);
CREATE INDEX idx_project_managers_company ON project_managers(company);
CREATE INDEX idx_finance_documents_category ON finance_documents(category);
CREATE INDEX idx_contractors_category ON contractors(category);
CREATE INDEX idx_funding_agency_agency_type ON funding_agency(agency_type);
CREATE INDEX idx_project_types_category ON project_types(category);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_role ON users(user_role);
CREATE INDEX idx_project_coordinators_company ON project_coordinators(company);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
CREATE TRIGGER update_building_types_updated_at 
    BEFORE UPDATE ON building_types 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clerk_of_works_updated_at 
    BEFORE UPDATE ON clerk_of_works 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_managers_updated_at 
    BEFORE UPDATE ON project_managers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finance_documents_updated_at 
    BEFORE UPDATE ON finance_documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contractors_updated_at 
    BEFORE UPDATE ON contractors 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funding_agency_updated_at 
    BEFORE UPDATE ON funding_agency 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_types_updated_at 
    BEFORE UPDATE ON project_types 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at 
    BEFORE UPDATE ON services 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_coordinators_updated_at 
    BEFORE UPDATE ON project_coordinators 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO building_types (building_type, category) VALUES
('Residential Building', 'Housing'),
('Commercial Building', 'Business'),
('Industrial Building', 'Manufacturing'),
('Educational Building', 'Education'),
('Healthcare Building', 'Healthcare');

INSERT INTO clerk_of_works (full_name, company, specialization) VALUES
('John Muwonge', 'Senior Clerk of Works', 'Residential Projects'),
('Sarah Nalukenge', 'Clerk of Works', 'Commercial Buildings'),
('David Kato', 'Senior Clerk of Works', 'Infrastructure Projects');

INSERT INTO clients (client_name, client_types) VALUES
('Ministry of Works and Housing', 'Government'),
('Ministry of Education', 'Government'),
('Ministry of Health', 'Government'),
('Accra Metropolitan Assembly', 'Local Government');

INSERT INTO project_managers (manager_name, company, specialization) VALUES
('Dr. Kwame Asante', 'Healthcare Projects Ltd', 'Healthcare Projects'),
('Eng. Ama Serwaa', 'Infrastructure Solutions', 'Infrastructure Projects'),
('Prof. Kofi Mensah', 'Educational Consultants', 'Educational Buildings');

INSERT INTO finance_documents (document_type, category, description) VALUES
('Invoice', 'Billing', 'Document requesting payment for goods or services rendered'),
('Receipt', 'Payment Confirmation', 'Proof of payment received for goods or services'),
('Purchase Order', 'Procurement', 'Official document authorizing a purchase transaction');

INSERT INTO contractors (full_name, category, specialization) VALUES
('Mansour Group', 'General Construction', 'Large Scale Projects'),
('Kofi Job Construction Ltd', 'Infrastructure', 'Road Construction'),
('China Railway Construction Corporation', 'International', 'Railway Projects');

INSERT INTO funding_agency (agency_name, agency_type) VALUES
('World Bank', 'International Financial Institution'),
('African Development Bank', 'Regional Development Bank'),
('European Investment Bank', 'International Financial Institution');

INSERT INTO project_types (project_type, category, description) VALUES
('Infrastructure Project', 'Civil Engineering', 'Roads, bridges, and transportation systems'),
('Residential Development', 'Housing', 'Housing projects and residential complexes'),
('Commercial Complex', 'Business', 'Office buildings and commercial spaces');

INSERT INTO services (service_name, description) VALUES
('Architectural Design', 'Design and planning of building structures'),
('Structural Engineering', 'Engineering services for structural integrity'),
('Mechanical Engineering', 'HVAC and mechanical systems design');

INSERT INTO users (email, password, user_role) VALUES
('admin@conpro.com', 'admin123', 'admin'),
('user@conpro.com', 'user123', 'user'),
('manager@conpro.com', 'manager123', 'manager');

INSERT INTO project_coordinators (full_name, company, specialization) VALUES
('Ms. Akosua Mensah', 'Healthcare Coordination Ltd', 'Healthcare Coordination'),
('Mr. Kofi Boateng', 'Infrastructure Coordination', 'Infrastructure Coordination'),
('Ms. Adwoa Asante', 'Educational Coordination', 'Educational Coordination');
