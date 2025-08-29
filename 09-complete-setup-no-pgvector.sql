-- Complete Database Setup (Alternative version without pgvector)
-- This file orchestrates the creation of all database tables and structures
-- without requiring the pgvector extension

BEGIN;

-- Step 1: Enable basic extensions (excluding pgvector)
\i 01-enable-extensions-basic.sql

-- Step 2: Create core business tables
\i 02-core-tables.sql

-- Step 3: Create document processing tables
\i 03-document-processing.sql

-- Step 4: Create AI/RAG tables (without pgvector)
\i 04-ai-rag-vectors-no-pgvector.sql

-- Step 5: Create additional indexes and constraints
\i 05-indexes-and-constraints.sql

-- Step 6: Insert sample data
\i 06-sample-data.sql

-- Step 7: Configure Row-Level Security (CORRECTED VERSION)
\i 07-row-level-security-fixed.sql

-- Step 8: Create functions and triggers
\i 08-functions-and-triggers.sql

COMMIT;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE '🎉 Database setup completed successfully (without pgvector)!';
    RAISE NOTICE '⚠️  Note: Vector functionality is limited - embeddings stored as JSONB';
    RAISE NOTICE '✅ RLS policies configured with UUID compatibility fixes';
    RAISE NOTICE '📋 To enable full vector functionality:';
    RAISE NOTICE '   1. Go to Supabase Dashboard → Database → Extensions';
    RAISE NOTICE '   2. Enable "pgvector" extension';
    RAISE NOTICE '   3. Run the original 09-complete-setup.sql file';
END $$;
