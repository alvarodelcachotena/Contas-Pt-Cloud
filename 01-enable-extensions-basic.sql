-- Enable Basic Extensions for Contas-PT Cloud (without pgvector)
-- This file enables extensions that are commonly available in Supabase

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable JSONB operations (if available)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'jsonb_plpython3u') THEN
        CREATE EXTENSION IF NOT EXISTS "jsonb_plpython3u";
        RAISE NOTICE '✅ jsonb_plpython3u extension enabled';
    ELSE
        RAISE NOTICE '⚠️  jsonb_plpython3u extension not available - skipping';
    END IF;
END $$;

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
    RAISE NOTICE '✅ Basic extensions enabled successfully';
    RAISE NOTICE '⚠️  pgvector extension not enabled - vector functionality will be limited';
    RAISE NOTICE '📋 To enable pgvector: Supabase Dashboard → Database → Extensions → pgvector';
END $$;

