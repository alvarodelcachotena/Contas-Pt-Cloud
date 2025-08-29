-- Create RAG Query Log Table for Audit Logging
-- This table stores detailed logs of all RAG queries for analysis and debugging

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the rag_query_log table
CREATE TABLE IF NOT EXISTS rag_query_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id INTEGER NOT NULL,
    user_id INTEGER,
    session_id TEXT,
    
    -- Query information
    query_text TEXT NOT NULL,
    query_type TEXT DEFAULT 'semantic_search',
    query_parameters JSONB DEFAULT '{}',
    
    -- Results information
    total_results INTEGER DEFAULT 0,
    vector_hit_ids INTEGER[] DEFAULT '{}',
    similarity_scores REAL[] DEFAULT '{}',
    processing_time_ms INTEGER,
    
    -- Model and cache information
    embedding_model TEXT,
    cache_hit BOOLEAN DEFAULT false,
    cache_key TEXT,
    
    -- Performance metrics
    response_time_ms INTEGER,
    tokens_used INTEGER,
    cost_estimate DECIMAL(10,6),
    
    -- Metadata
    user_agent TEXT,
    ip_address INET,
    request_headers JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    query_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_rag_query_log_tenant_id ON rag_query_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rag_query_log_user_id ON rag_query_log(user_id);
CREATE INDEX IF NOT EXISTS idx_rag_query_log_created_at ON rag_query_log(created_at);
CREATE INDEX IF NOT EXISTS idx_rag_query_log_query_type ON rag_query_log(query_type);
CREATE INDEX IF NOT EXISTS idx_rag_query_log_cache_hit ON rag_query_log(cache_hit);

-- Create a GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_rag_query_log_query_parameters ON rag_query_log USING GIN(query_parameters);

-- Create a function to get RAG query statistics
CREATE OR REPLACE FUNCTION get_rag_query_stats(
    p_tenant_id INTEGER DEFAULT NULL,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE(
    total_queries BIGINT,
    unique_users BIGINT,
    avg_response_time REAL,
    cache_hit_rate REAL,
    top_queries TEXT[],
    query_types JSONB,
    performance_metrics JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as total_queries,
            COUNT(DISTINCT user_id) as unique_users,
            AVG(response_time_ms) as avg_response_time,
            AVG(CASE WHEN cache_hit THEN 1.0 ELSE 0.0 END) * 100 as cache_hit_rate
        FROM rag_query_log
        WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
        AND (p_start_date IS NULL OR created_at >= p_start_date)
        AND (p_end_date IS NULL OR created_at <= p_end_date)
    ),
    top_queries AS (
        SELECT array_agg(query_text ORDER BY count DESC LIMIT 10) as top_queries
        FROM (
            SELECT query_text, COUNT(*) as count
            FROM rag_query_log
            WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
            AND (p_start_date IS NULL OR created_at >= p_start_date)
            AND (p_end_date IS NULL OR created_at <= p_end_date)
            GROUP BY query_text
            ORDER BY count DESC
            LIMIT 10
        ) tq
    ),
    query_types AS (
        SELECT jsonb_object_agg(query_type, count) as query_types
        FROM (
            SELECT query_type, COUNT(*) as count
            FROM rag_query_log
            WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
            AND (p_start_date IS NULL OR created_at >= p_start_date)
            AND (p_end_date IS NULL OR created_at <= p_end_date)
            GROUP BY query_type
        ) qt
    ),
    performance AS (
        SELECT jsonb_build_object(
            'avg_processing_time', AVG(processing_time_ms),
            'avg_tokens_used', AVG(tokens_used),
            'total_cost_estimate', SUM(COALESCE(cost_estimate, 0))
        ) as performance_metrics
        FROM rag_query_log
        WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
        AND (p_start_date IS NULL OR created_at >= p_start_date)
        AND (p_end_date IS NULL OR created_at <= p_end_date)
    )
    SELECT 
        s.total_queries,
        s.unique_users,
        s.avg_response_time,
        s.cache_hit_rate,
        tq.top_queries,
        qt.query_types,
        p.performance_metrics
    FROM stats s, top_queries tq, query_types qt, performance p;
END;
$$ LANGUAGE plpgsql;

-- Create a function to export RAG query logs for analysis
CREATE OR REPLACE FUNCTION export_rag_query_logs(
    p_tenant_id INTEGER DEFAULT NULL,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_format TEXT DEFAULT 'json'
)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
    query_result RECORD;
BEGIN
    IF p_format = 'csv' THEN
        -- Export as CSV
        result := 'id,tenant_id,user_id,query_text,query_type,total_results,processing_time_ms,response_time_ms,cache_hit,created_at' || E'\n';
        
        FOR query_result IN
            SELECT 
                id, tenant_id, user_id, query_text, query_type, 
                total_results, processing_time_ms, response_time_ms, 
                cache_hit, created_at
            FROM rag_query_log
            WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
            AND (p_start_date IS NULL OR created_at >= p_start_date)
            AND (p_end_date IS NULL OR created_at <= p_end_date)
            ORDER BY created_at DESC
        LOOP
            result := result || 
                query_result.id || ',' ||
                query_result.tenant_id || ',' ||
                COALESCE(query_result.user_id::text, '') || ',' ||
                '"' || REPLACE(query_result.query_text, '"', '""') || '",' ||
                query_result.query_type || ',' ||
                query_result.total_results || ',' ||
                COALESCE(query_result.processing_time_ms::text, '') || ',' ||
                COALESCE(query_result.response_time_ms::text, '') || ',' ||
                query_result.cache_hit || ',' ||
                query_result.created_at || E'\n';
        END LOOP;
    ELSE
        -- Export as JSON
        SELECT jsonb_pretty(jsonb_agg(
            jsonb_build_object(
                'id', id,
                'tenant_id', tenant_id,
                'user_id', user_id,
                'query_text', query_text,
                'query_type', query_type,
                'total_results', total_results,
                'vector_hit_ids', vector_hit_ids,
                'similarity_scores', similarity_scores,
                'processing_time_ms', processing_time_ms,
                'response_time_ms', response_time_ms,
                'cache_hit', cache_hit,
                'embedding_model', embedding_model,
                'created_at', created_at
            )
        )) INTO result
        FROM rag_query_log
        WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
        AND (p_start_date IS NULL OR created_at >= p_start_date)
        AND (p_end_date IS NULL OR created_at <= p_end_date);
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a function to clean old logs (retention policy)
CREATE OR REPLACE FUNCTION clean_old_rag_logs(
    p_days_to_keep INTEGER DEFAULT 90,
    p_tenant_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM rag_query_log
    WHERE created_at < NOW() - INTERVAL '1 day' * p_days_to_keep
    AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT ON rag_query_log TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_rag_query_stats TO authenticated;
-- GRANT EXECUTE ON FUNCTION export_rag_query_logs TO authenticated;
-- GRANT EXECUTE ON FUNCTION clean_old_rag_logs TO authenticated;

-- Insert sample data for testing
INSERT INTO rag_query_log (
    tenant_id, user_id, query_text, query_type, total_results, 
    vector_hit_ids, similarity_scores, processing_time_ms, 
    response_time_ms, cache_hit, embedding_model
) VALUES 
(1, 1, 'Find invoices with high amounts', 'semantic_search', 3, 
 ARRAY[1,2,3], ARRAY[0.85,0.78,0.72], 150, 200, false, 'openai'),
(1, 1, 'Search for expense receipts', 'semantic_search', 5, 
 ARRAY[4,5,6,7,8], ARRAY[0.91,0.87,0.83,0.79,0.75], 120, 180, true, 'openai'),
(1, 2, 'Find documents about payments', 'semantic_search', 2, 
 ARRAY[9,10], ARRAY[0.88,0.82], 180, 250, false, 'instructor');

COMMENT ON TABLE rag_query_log IS 'Audit log for all RAG queries - stores detailed information for analysis and debugging';
COMMENT ON COLUMN rag_query_log.vector_hit_ids IS 'Array of document IDs that matched the query';
COMMENT ON COLUMN rag_query_log.similarity_scores IS 'Array of similarity scores for each hit';
COMMENT ON COLUMN rag_query_log.query_parameters IS 'JSON object containing query parameters like topK, threshold, etc.';
COMMENT ON COLUMN rag_query_log.cost_estimate IS 'Estimated cost of the query in USD';
