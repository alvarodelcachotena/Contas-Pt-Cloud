-- AI, RAG, and Vector Tables for Contas-PT Cloud
-- This file creates tables for AI embeddings, similarity search, and RAG functionality

-- RAG Document Vectors (for similarity search)
CREATE TABLE IF NOT EXISTS rag_vectors (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_id TEXT NOT NULL,
    ocr_text TEXT NOT NULL,
    extracted_data JSONB NOT NULL,
    embedding VECTOR(1536), -- Vector representation (OpenAI dimensions)
    similarity NUMERIC(5,4),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Documents Embedding Table with Vector Column
CREATE TABLE IF NOT EXISTS documents_embedding (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    document_type TEXT,
    ocr_text TEXT,
    metadata JSONB DEFAULT '{}',
    embedding VECTOR(1536), -- Vector column for pgvector
    created_at TIMESTAMP DEFAULT NOW()
);

-- RAG Query Log Table for Audit Logging
CREATE TABLE IF NOT EXISTS rag_query_log (
    id TEXT PRIMARY KEY, -- UUID
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id TEXT,

    -- Query information
    query_text TEXT NOT NULL,
    query_type TEXT DEFAULT 'semantic_search',
    query_parameters JSONB DEFAULT '{}',

    -- Results information
    total_results INTEGER DEFAULT 0,
    vector_hit_ids TEXT[], -- Array of document IDs
    similarity_scores NUMERIC(5,4)[], -- Array of similarity scores
    processing_time_ms INTEGER,

    -- Model and cache information
    embedding_model TEXT,
    cache_hit BOOLEAN DEFAULT FALSE,
    cache_key TEXT,

    -- Performance metrics
    response_time_ms INTEGER,
    tokens_used INTEGER,
    cost_estimate NUMERIC(10,6),

    -- Metadata
    user_agent TEXT,
    ip_address TEXT,
    request_headers JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    query_timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rag_vectors_tenant_id ON rag_vectors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rag_vectors_document_id ON rag_vectors(document_id);
CREATE INDEX IF NOT EXISTS idx_rag_vectors_embedding ON rag_vectors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_documents_embedding_tenant_id ON documents_embedding(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_embedding_document_id ON documents_embedding(document_id);
CREATE INDEX IF NOT EXISTS idx_documents_embedding_embedding ON documents_embedding USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_rag_query_log_tenant_id ON rag_query_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rag_query_log_user_id ON rag_query_log(user_id);
CREATE INDEX IF NOT EXISTS idx_rag_query_log_created_at ON rag_query_log(created_at);

-- Log successful table creation
DO $$
BEGIN
    RAISE NOTICE '✅ AI, RAG, and vector tables created successfully';
END $$;


