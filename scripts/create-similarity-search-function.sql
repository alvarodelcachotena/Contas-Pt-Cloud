-- Create RPC function for vector similarity search
-- This function enables efficient similarity search using pgvector

-- Function to find similar documents using cosine similarity
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  tenant_filter int DEFAULT NULL
)
RETURNS TABLE (
  id int,
  document_id int,
  filename text,
  document_type text,
  ocr_text text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    de.id,
    de.document_id,
    de.filename,
    de.document_type,
    de.ocr_text,
    de.metadata,
    1 - (de.embedding <=> query_embedding) as similarity
  FROM documents_embedding de
  WHERE 
    (tenant_filter IS NULL OR de.tenant_id = tenant_filter)
    AND 1 - (de.embedding <=> query_embedding) > match_threshold
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to find documents by semantic similarity to text query
-- This would require converting text to embedding first
CREATE OR REPLACE FUNCTION match_documents_by_text(
  query_text text,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  tenant_filter int DEFAULT NULL
)
RETURNS TABLE (
  id int,
  document_id int,
  filename text,
  document_type text,
  ocr_text text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_embedding vector(1536);
BEGIN
  -- Note: This function requires the text to be converted to embedding first
  -- You would typically call this from your application code after generating the embedding
  
  -- For now, return empty result
  -- In production, you'd generate the embedding here or pass it as parameter
  RETURN QUERY
  SELECT 
    de.id,
    de.document_id,
    de.filename,
    de.document_type,
    de.ocr_text,
    de.metadata,
    0.0 as similarity
  FROM documents_embedding de
  WHERE false; -- Return no results for now
END;
$$;

-- Function to get document statistics
CREATE OR REPLACE FUNCTION get_document_stats(tenant_id_filter int DEFAULT NULL)
RETURNS TABLE (
  total_documents bigint,
  total_embeddings bigint,
  avg_embedding_size float,
  last_updated timestamp
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT d.id) as total_documents,
    COUNT(de.id) as total_embeddings,
    AVG(array_length(string_to_array(de.embedding::text, ','), 1)) as avg_embedding_size,
    MAX(de.created_at) as last_updated
  FROM documents d
  LEFT JOIN documents_embedding de ON d.id = de.document_id
  WHERE (tenant_id_filter IS NULL OR d.tenant_id = tenant_id_filter);
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION match_documents TO authenticated;
GRANT EXECUTE ON FUNCTION match_documents_by_text TO authenticated;
GRANT EXECUTE ON FUNCTION get_document_stats TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION match_documents IS 'Find similar documents using vector cosine similarity search';
COMMENT ON FUNCTION match_documents_by_text IS 'Find documents similar to text query (requires embedding generation)';
COMMENT ON FUNCTION get_document_stats IS 'Get statistics about documents and embeddings for a tenant';
