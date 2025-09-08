-- Enable required extensions for Contas-PT Cloud
-- This file should be run first to enable all necessary PostgreSQL extensions

-- Enable pgvector for AI embeddings and similarity search
CREATE EXTENSION IF NOT EXISTS "vector";

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable JSONB operations
CREATE EXTENSION IF NOT EXISTS "jsonb_plpython3u";

-- Enable full-text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable unaccent for better text search
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Enable pgcrypto for encryption functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable tablefunc for pivot tables
CREATE EXTENSION IF NOT EXISTS "tablefunc";

-- Enable pg_stat_statements for query performance monitoring
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Log successful extension creation
DO $$
BEGIN
    RAISE NOTICE '✅ All required extensions enabled successfully';
END $$;



