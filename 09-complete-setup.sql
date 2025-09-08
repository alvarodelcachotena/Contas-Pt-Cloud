-- Complete Database Setup for Contas-PT Cloud
-- This file runs all the setup scripts in the correct order

-- Start transaction
BEGIN;

-- Log setup start
DO $$
BEGIN
    RAISE NOTICE '🚀 Starting Contas-PT Cloud database setup...';
    RAISE NOTICE '📅 Setup started at: %', NOW();
END $$;

-- 1. Enable required extensions
\echo '📦 Enabling PostgreSQL extensions...'
\i 01-enable-extensions.sql

-- 2. Create core business tables
\echo '🏗️ Creating core business tables...'
\i 02-core-tables.sql

-- 3. Create document processing and AI tables
\echo '🤖 Creating AI and document processing tables...'
\i 03-document-processing.sql

-- 4. Create AI, RAG, and vector tables
\echo '🧠 Creating AI, RAG, and vector tables...'
\i 04-ai-rag-vectors.sql

-- 5. Create indexes and constraints
\echo '🔍 Creating indexes and constraints...'
\i 05-indexes-and-constraints.sql

-- 6. Insert sample data
\echo '📊 Inserting sample data...'
\i 06-sample-data.sql

-- 7. Configure Row-Level Security
\echo '🔒 Configuring Row-Level Security...'
\i 07-row-level-security.sql

-- 8. Create functions and triggers
\echo '⚡ Creating functions and triggers...'
\i 08-functions-and-triggers.sql

-- Final verification
DO $$
DECLARE
    table_count INTEGER;
    extension_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    -- Count extensions
    SELECT COUNT(*) INTO extension_count
    FROM pg_extension;
    
    RAISE NOTICE '✅ Database setup completed successfully!';
    RAISE NOTICE '📊 Total tables created: %', table_count;
    RAISE NOTICE '🔌 Total extensions enabled: %', extension_count;
    RAISE NOTICE '🎯 Setup completed at: %', NOW();
END $$;

-- Commit transaction
COMMIT;

-- Final success message
\echo '🎉 Contas-PT Cloud database setup completed successfully!'
\echo '📋 Next steps:'
\echo '   1. Verify all tables were created correctly'
\echo '   2. Test the sample data'
\echo '   3. Configure your application to use this database'
\echo '   4. Test Row-Level Security policies'
\echo ''
\echo '🔧 To verify setup, run: SELECT * FROM tenants;'



