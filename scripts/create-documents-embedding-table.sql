-- Create documents_embedding table with vector column
-- This table stores document embeddings for similarity search and RAG operations

-- Create the documents_embedding table
CREATE TABLE IF NOT EXISTS documents_embedding (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    document_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    document_type TEXT,
    ocr_text TEXT,
    metadata JSONB DEFAULT '{}',
    embedding vector(1536), -- OpenAI embedding dimension
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_documents_embedding_tenant 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_documents_embedding_document 
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    CONSTRAINT unique_document_embedding 
        UNIQUE (tenant_id, document_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_embedding_tenant 
    ON documents_embedding(tenant_id);

CREATE INDEX IF NOT EXISTS idx_documents_embedding_type 
    ON documents_embedding(document_type);

CREATE INDEX IF NOT EXISTS idx_documents_embedding_created 
    ON documents_embedding(created_at);

-- Create vector similarity search index
CREATE INDEX IF NOT EXISTS idx_documents_embedding_vector 
    ON documents_embedding 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Add comments for documentation
COMMENT ON TABLE documents_embedding IS 'Stores document embeddings for vector similarity search and RAG operations';
COMMENT ON COLUMN documents_embedding.embedding IS 'Vector representation of document content (1536 dimensions for OpenAI)';
COMMENT ON COLUMN documents_embedding.metadata IS 'Additional document metadata as JSON';
COMMENT ON COLUMN documents_embedding.ocr_text IS 'Extracted OCR text from the document';
