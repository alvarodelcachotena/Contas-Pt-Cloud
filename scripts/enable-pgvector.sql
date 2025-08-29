-- Enable pgvector extension for vector operations
-- This script enables the pgvector extension in Supabase

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify the extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Show available vector operations
SELECT * FROM pg_proc WHERE proname LIKE '%vector%';
