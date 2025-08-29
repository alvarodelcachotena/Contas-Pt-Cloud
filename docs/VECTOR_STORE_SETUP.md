# Vector Store Setup - Contas-PT

*Last Updated: January 30, 2025*

## Overview

This document describes how to set up and configure the Supabase Vector Store for the Contas-PT Portuguese Accounting Platform. The vector store enables semantic search, document similarity, and RAG (Retrieval-Augmented Generation) capabilities.

## 🎯 What We're Building

- **pgvector Extension**: Enable vector operations in Supabase
- **Documents Embedding Table**: Store document vectors with metadata
- **Similarity Search**: Find similar documents using cosine similarity
- **RAG Integration**: Enable AI-powered document retrieval

## 📋 Prerequisites

- Supabase project with admin access
- Node.js 18+ installed
- Environment variables configured
- Basic understanding of PostgreSQL and vector operations

## 🚀 Quick Setup

### Option 1: Automated Setup (Recommended)

```bash
# Run the automated setup script
node scripts/setup-vector-store.js
```

### Option 2: Manual Setup

If the automated script fails, follow these manual steps:

#### Step 1: Enable pgvector Extension

1. Go to **Supabase Dashboard** > **Database** > **Extensions**
2. Find **pgvector** in the list
3. Click **Enable** to activate the extension

#### Step 2: Create Documents Embedding Table

1. Go to **Supabase Dashboard** > **SQL Editor**
2. Run the SQL script: `scripts/create-documents-embedding-table.sql`

#### Step 3: Create RPC Functions

1. In the same SQL Editor, run: `scripts/create-similarity-search-function.sql`

## 📊 Database Schema

### Documents Embedding Table

```sql
CREATE TABLE documents_embedding (
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
    
    -- Unique constraint
    CONSTRAINT unique_document_embedding 
        UNIQUE (tenant_id, document_id)
);
```

### Key Features

- **Multi-tenant Support**: Each tenant has isolated document embeddings
- **Vector Storage**: 1536-dimensional vectors (OpenAI standard)
- **Metadata Support**: JSONB field for flexible document attributes
- **OCR Integration**: Store extracted text for semantic search
- **Performance Indexes**: Optimized for similarity search operations

## 🔍 RPC Functions

### 1. match_documents()

Find similar documents using vector similarity:

```sql
SELECT * FROM match_documents(
    query_embedding := '[0.1, 0.2, ...]'::vector(1536),
    match_threshold := 0.7,
    match_count := 5,
    tenant_filter := 1
);
```

### 2. get_document_stats()

Get statistics about documents and embeddings:

```sql
SELECT * FROM get_document_stats(tenant_id_filter := 1);
```

## 🛠️ API Integration

### Vector Store Service

The `lib/vector-store.ts` file provides a complete service for vector operations:

```typescript
import { vectorStoreService } from '../lib/vector-store';

// Store document embedding
const result = await vectorStoreService.storeDocumentEmbedding(
    tenantId,
    documentId,
    filename,
    documentType,
    ocrText,
    embedding,
    metadata
);

// Find similar documents
const similar = await vectorStoreService.findSimilarDocuments(
    tenantId,
    queryEmbedding,
    limit,
    threshold
);
```

### Available Methods

- `storeDocumentEmbedding()` - Store new document vector
- `findSimilarDocuments()` - Search for similar documents
- `getDocumentEmbedding()` - Retrieve specific embedding
- `updateDocumentEmbedding()` - Update existing embedding
- `deleteDocumentEmbedding()` - Remove embedding
- `getTenantEmbeddings()` - Get all embeddings for a tenant

## 🧪 Testing

### Run Test Suite

```bash
# Test vector store functionality
node scripts/test-vector-store.js
```

### Test Results

The test script will verify:
- ✅ Document embedding storage
- ✅ Vector retrieval
- ✅ Similarity search
- ✅ Multi-tenant operations
- ✅ CRUD operations

## 🔧 Configuration

### Environment Variables

Ensure these are set in your `.env` file:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Vector Dimensions

- **OpenAI**: 1536 dimensions (default)
- **Google Gemini**: 768 dimensions
- **Custom Models**: Configurable dimensions

## 📈 Performance Optimization

### Indexes

The system creates several performance indexes:

```sql
-- Tenant-based queries
CREATE INDEX idx_documents_embedding_tenant ON documents_embedding(tenant_id);

-- Document type filtering
CREATE INDEX idx_documents_embedding_type ON documents_embedding(document_type);

-- Date-based queries
CREATE INDEX idx_documents_embedding_created ON documents_embedding(created_at);

-- Vector similarity search
CREATE INDEX idx_documents_embedding_vector 
    ON documents_embedding 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
```

### Best Practices

1. **Batch Operations**: Process multiple embeddings in single transactions
2. **Similarity Thresholds**: Use 0.7+ for production, 0.5+ for development
3. **Vector Normalization**: Ensure embeddings are properly normalized
4. **Tenant Isolation**: Always filter by tenant_id for security

## 🚨 Troubleshooting

### Common Issues

#### 1. pgvector Extension Not Available

```bash
# Check if extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

# Enable manually if needed
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 2. Vector Column Type Error

```bash
# Verify table structure
\d documents_embedding

# Check vector column type
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documents_embedding';
```

#### 3. Permission Denied

```bash
# Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON documents_embedding TO authenticated;
GRANT EXECUTE ON FUNCTION match_documents TO authenticated;
```

### Debug Mode

Enable debug logging in the vector store service:

```typescript
// Add to vector-store.ts
console.log('Debug: SQL Query:', sql);
console.log('Debug: Parameters:', params);
```

## 🔮 Future Enhancements

### Planned Features

1. **Hybrid Search**: Combine vector similarity with text search
2. **Semantic Caching**: Cache frequently accessed embeddings
3. **Auto-scaling**: Dynamic index optimization based on usage
4. **Multi-modal**: Support for image and text embeddings
5. **Real-time Updates**: WebSocket notifications for embedding changes

### Integration Points

- **AI Processing Pipeline**: Automatic embedding generation
- **Document Upload**: Real-time vector creation
- **Search Interface**: User-friendly similarity search
- **Analytics Dashboard**: Embedding usage statistics

## 📚 Additional Resources

### Documentation

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Supabase Vector Guide](https://supabase.com/docs/guides/ai/vector-embeddings)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)

### Examples

- [Vector Search Examples](https://github.com/pgvector/pgvector/tree/master/examples)
- [Similarity Search Patterns](https://supabase.com/docs/guides/ai/vector-embeddings#similarity-search)

## ✅ Verification Checklist

- [ ] pgvector extension enabled
- [ ] documents_embedding table created
- [ ] RPC functions installed
- [ ] Indexes created
- [ ] Permissions configured
- [ ] Test suite passing
- [ ] Service integration working
- [ ] Performance benchmarks met

## 🎉 Success!

Once all steps are completed, your Contas-PT system will have:

- **Semantic Search**: Find documents by meaning, not just keywords
- **Document Similarity**: Identify related invoices and receipts
- **RAG Capabilities**: Enhanced AI responses with document context
- **Performance**: Fast similarity search with optimized indexes
- **Scalability**: Multi-tenant support with isolated data

The vector store is now ready for production use! 🚀
