-- AI, RAG, and Vector Tables (Alternative version without pgvector)
-- This file creates tables for AI processing, RAG, and document embeddings
-- Note: This version uses TEXT fields instead of VECTOR for compatibility

-- RAG Document Vectors (for similarity search - without pgvector)
CREATE TABLE IF NOT EXISTS rag_vectors (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_id TEXT NOT NULL,
    ocr_text TEXT NOT NULL,
    extracted_data JSONB NOT NULL,
    embedding_data JSONB, -- Store embedding as JSONB instead of VECTOR
    embedding_dimensions INTEGER DEFAULT 1536, -- Store dimension info
    similarity NUMERIC(5,4),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Document Embeddings (for semantic search - without pgvector)
CREATE TABLE IF NOT EXISTS documents_embedding (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding_data JSONB, -- Store embedding as JSONB instead of VECTOR
    embedding_dimensions INTEGER DEFAULT 1536, -- Store dimension info
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- RAG Query Log
CREATE TABLE IF NOT EXISTS rag_query_log (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    query_embedding_data JSONB, -- Store embedding as JSONB instead of VECTOR
    results JSONB,
    response_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance (without vector-specific indexes)
CREATE INDEX IF NOT EXISTS idx_rag_vectors_tenant_doc ON rag_vectors(tenant_id, document_id);
CREATE INDEX IF NOT EXISTS idx_rag_vectors_created_at ON rag_vectors(created_at);
CREATE INDEX IF NOT EXISTS idx_rag_vectors_similarity ON rag_vectors(similarity);

CREATE INDEX IF NOT EXISTS idx_documents_embedding_tenant_doc ON documents_embedding(tenant_id, document_id);
CREATE INDEX IF NOT EXISTS idx_documents_embedding_chunk_index ON documents_embedding(chunk_index);
CREATE INDEX IF NOT EXISTS idx_documents_embedding_created_at ON documents_embedding(created_at);

CREATE INDEX IF NOT EXISTS idx_rag_query_log_tenant ON rag_query_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rag_query_log_created_at ON rag_query_log(created_at);

-- Add comments
COMMENT ON TABLE rag_vectors IS 'Alternative RAG vectors table without pgvector dependency';
COMMENT ON TABLE documents_embedding IS 'Alternative document embeddings table without pgvector dependency';
COMMENT ON TABLE rag_query_log IS 'Log of RAG queries for analysis and debugging';

-- Log successful table creation
DO $$
BEGIN
    RAISE NOTICE '✅ AI/RAG tables created successfully (without pgvector)';
    RAISE NOTICE '⚠️  Note: Embeddings stored as JSONB instead of VECTOR type';
    RAISE NOTICE '⚠️  To enable full vector functionality, enable pgvector extension in Supabase dashboard';
END $$;



