-- Document Processing and AI Tables for Contas-PT Cloud
-- This file creates tables for document management, AI processing, and ML features

-- Documents
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_filename TEXT,
    file_path TEXT,
    file_size INTEGER,
    mime_type TEXT,
    processing_status TEXT DEFAULT 'pending',
    confidence_score NUMERIC(3,2),
    extracted_data JSONB,
    processing_method TEXT,
    ai_model_used TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    content_hash TEXT
);

-- Cloud Drive Configurations
CREATE TABLE IF NOT EXISTS cloud_drive_configs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- 'dropbox', 'google_drive'
    folder_path TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP,
    sync_cursor TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Raw Documents (from cloud sync)
CREATE TABLE IF NOT EXISTS raw_documents (
    id TEXT PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    extracted_data JSONB DEFAULT '{}',
    processing_status TEXT,
    processing_error TEXT,
    confidence NUMERIC(5,2),
    cloud_config_id INTEGER REFERENCES cloud_drive_configs(id) ON DELETE SET NULL,
    s3_url TEXT NOT NULL,
    ocr_text TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Multi-Agent Processing Results
CREATE TABLE IF NOT EXISTS multi_agent_results (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_id TEXT NOT NULL UNIQUE,
    ocr_text TEXT NOT NULL,
    extracted_data JSONB NOT NULL,
    agent_results JSONB NOT NULL, -- Results from each agent
    confidence_score NUMERIC(5,2) NOT NULL,
    issues JSONB DEFAULT '[]', -- Array of processing issues
    processing_time_ms INTEGER,
    rag_similar_documents JSONB DEFAULT '[]',
    created_invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
    created_expense_id INTEGER REFERENCES expenses(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Field-Level Provenance Metadata
CREATE TABLE IF NOT EXISTS field_provenance (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_id TEXT NOT NULL,
    field_name TEXT NOT NULL,
    field_value TEXT,
    model TEXT NOT NULL,
    confidence NUMERIC(5,2) NOT NULL,
    method TEXT NOT NULL,
    model_version TEXT,
    processing_time INTEGER,
    raw_value TEXT,
    extraction_context JSONB DEFAULT '{}',
    timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Line Item Provenance Metadata
CREATE TABLE IF NOT EXISTS line_item_provenance (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_id TEXT NOT NULL,
    row_index INTEGER NOT NULL,
    field_name TEXT NOT NULL,
    field_value TEXT,
    model TEXT NOT NULL,
    confidence NUMERIC(5,2) NOT NULL,
    method TEXT NOT NULL,
    model_version TEXT,
    processing_time INTEGER,
    raw_value TEXT,
    extraction_context JSONB DEFAULT '{}',
    timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Consensus Metadata
CREATE TABLE IF NOT EXISTS consensus_metadata (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_id TEXT NOT NULL UNIQUE,
    total_models INTEGER NOT NULL,
    agreement_level NUMERIC(5,2) NOT NULL,
    conflict_resolution TEXT NOT NULL,
    final_confidence NUMERIC(5,2) NOT NULL,
    model_contributions JSONB NOT NULL, -- Which model contributed each field
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI Chat Messages
CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT,
    is_from_user BOOLEAN NOT NULL,
    context JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Webhook Credentials
CREATE TABLE IF NOT EXISTS webhook_credentials (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL, -- 'whatsapp', 'gmail', 'dropbox', 'custom'
    credential_name TEXT NOT NULL,
    encrypted_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Log successful table creation
DO $$
BEGIN
    RAISE NOTICE '✅ Document processing tables created successfully';
END $$;


