# RAG System - Contas-PT

*Last Updated: January 30, 2025*

## Overview

The RAG (Retrieval-Augmented Generation) System is a powerful semantic search and document retrieval system for the Contas-PT Portuguese Accounting Platform. It enables users to find relevant documents using natural language queries with vector similarity search.

## 🎯 What We're Building

- **Semantic Search**: Find documents by meaning, not just keywords
- **Vector Similarity**: Use cosine similarity for document matching
- **Intelligent Caching**: Cache query results for improved performance
- **Advanced Filtering**: Filter results by document type, date, metadata
- **Highlighted Matches**: Show relevant text snippets with query highlighting
- **Multi-tenant Support**: Secure document retrieval per tenant

## 🏗️ Architecture

### Core Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   RAG API       │    │   RAG Service    │    │   Vector Store  │
│   Endpoints     │───▶│   (Core Logic)   │───▶│   (Supabase)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Advanced      │    │   Embedding      │    │   Document      │
│   Search        │    │   Service        │    │   Pipeline      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Data Flow

1. **Query Input**: Natural language query from user
2. **Embedding Generation**: Convert query to vector using AI models
3. **Vector Search**: Find similar documents using cosine similarity
4. **Result Enhancement**: Add metadata, content, and highlighting
5. **Caching**: Store results for future similar queries
6. **Response**: Return relevant documents with context

## 🚀 Quick Start

### 1. Test the RAG System

```bash
# Test the complete RAG functionality
npm run rag:test
```

### 2. Basic Query Example

```bash
curl -X POST "http://localhost:5000/api/rag/query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Find invoices from last month",
    "tenantId": 1,
    "topK": 5,
    "similarityThreshold": 0.7
  }'
```

### 3. Advanced Search Example

```bash
curl -X POST "http://localhost:5000/api/rag/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "expense receipts",
    "tenantId": 1,
    "topK": 10,
    "filters": {
      "documentType": "receipt",
      "dateRange": {
        "startDate": "2024-01-01",
        "endDate": "2024-12-31"
      }
    },
    "sortBy": "similarity"
  }'
```

## 📊 API Endpoints

### 1. Basic RAG Query (`/api/rag/query`)

#### POST - Execute RAG Query

**Request Body:**
```json
{
  "query": "string (required)",
  "tenantId": "number (required)",
  "topK": "number (optional, default: 5, max: 50)",
  "similarityThreshold": "number (optional, default: 0.7, range: 0.1-1.0)",
  "includeMetadata": "boolean (optional, default: false)",
  "includeContent": "boolean (optional, default: false)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "Find invoices",
    "documents": [
      {
        "documentId": 123,
        "filename": "invoice_001.pdf",
        "documentType": "invoice",
        "similarity": 0.85,
        "highlightedMatch": "**Invoice** for consulting services...",
        "metadata": { "vendor": "TechCorp", "amount": "500.00" },
        "content": "Full document content...",
        "embeddingId": 456
      }
    ],
    "totalResults": 1,
    "processingTime": 245,
    "model": "openai-text-embedding-3-small"
  }
}
```

#### GET - Get Statistics and Health

```bash
# Get RAG statistics
GET /api/rag/query?action=stats

# Get cache statistics
GET /api/rag/query?action=cache-stats

# Health check
GET /api/rag/query?action=health
```

#### DELETE - Clear Cache

```bash
DELETE /api/rag/query?action=clear-cache
```

### 2. Advanced Search (`/api/rag/search`)

#### POST - Advanced Search with Filters

**Request Body:**
```json
{
  "query": "string (required)",
  "tenantId": "number (required)",
  "topK": "number (optional, default: 10, max: 100)",
  "similarityThreshold": "number (optional, default: 0.6)",
  "includeMetadata": "boolean (optional)",
  "includeContent": "boolean (optional)",
  "filters": {
    "documentType": "string | string[]",
    "dateRange": {
      "startDate": "ISO date string",
      "endDate": "ISO date string"
    },
    "similarityRange": {
      "min": "number (0-1)",
      "max": "number (0-1)"
    },
    "metadata": {
      "vendor": "string",
      "amount": "number"
    },
    "contentLength": {
      "min": "number",
      "max": "number"
    }
  },
  "sortBy": "similarity | filename | documentType | createdAt"
}
```

#### GET - Get Filter Options and Suggestions

```bash
# Get available filter options
GET /api/rag/search?action=filter-options&tenantId=1

# Get search suggestions
GET /api/rag/search?action=search-suggestions&tenantId=1
```

## 🛠️ Programmatic Usage

### Basic RAG Service

```typescript
import { ragService } from '../lib/rag-service';

// Basic query
const result = await ragService.query({
  query: 'Find expense documents',
  tenantId: 1,
  topK: 5,
  similarityThreshold: 0.7
});

if (result.success) {
  console.log('Found documents:', result.totalResults);
  result.documents.forEach(doc => {
    console.log(`- ${doc.filename} (similarity: ${doc.similarity})`);
    console.log(`  Match: ${doc.highlightedMatch}`);
  });
}
```

### Advanced Search with Filters

```typescript
// Advanced search with multiple filters
const advancedResult = await ragService.query({
  query: 'payment confirmations',
  tenantId: 1,
  topK: 20,
  similarityThreshold: 0.5,
  includeMetadata: true,
  includeContent: true
});

// Apply additional filtering
const filteredDocs = advancedResult.documents.filter(doc => {
  // Filter by metadata
  if (doc.metadata?.amount > 1000) return false;
  
  // Filter by content length
  if (doc.content && doc.content.length < 100) return false;
  
  return true;
});
```

### Service Statistics

```typescript
// Get RAG service statistics
const stats = ragService.getStats();
console.log('Total queries (24h):', stats.totalQueries);
console.log('Average response time:', stats.averageResponseTime, 'ms');
console.log('Top queries:', stats.topQueries);

// Get cache statistics
const cacheStats = ragService.getCacheStats();
console.log('Cache size:', cacheStats.size);
console.log('Cache hit rate:', cacheStats.hitRate, '%');

// Clear cache
ragService.clearCache();
```

## 🔍 Search Features

### 1. Semantic Search

- **Natural Language Queries**: "Find invoices from last month"
- **Concept Matching**: Understands synonyms and related terms
- **Context Awareness**: Considers document type and metadata

### 2. Similarity Scoring

- **Cosine Similarity**: Mathematical similarity between vectors
- **Configurable Thresholds**: Adjust sensitivity (0.1 to 1.0)
- **Ranked Results**: Best matches first

### 3. Advanced Filtering

- **Document Type**: Filter by invoice, receipt, contract, etc.
- **Date Range**: Filter by creation or processing date
- **Similarity Range**: Filter by minimum/maximum similarity
- **Metadata**: Filter by vendor, amount, category, etc.
- **Content Length**: Filter by document content size

### 4. Result Enhancement

- **Highlighted Matches**: Bold matching query terms
- **Metadata Inclusion**: Add document metadata to results
- **Content Preview**: Include full or truncated content
- **Smart Truncation**: Intelligent text cutting at word boundaries

## 📈 Performance Optimization

### 1. Caching Strategy

- **Query Cache**: Cache results for 30 minutes
- **Smart Keys**: Content-based cache key generation
- **Automatic Cleanup**: Remove expired entries
- **Size Limits**: Maximum 1000 cached queries

### 2. Vector Search Optimization

- **RPC Functions**: Use PostgreSQL functions when available
- **Fallback Search**: Manual similarity calculation if needed
- **Batch Processing**: Efficient handling of multiple queries
- **Index Usage**: Leverage pgvector indexes

### 3. Response Time Optimization

- **Async Processing**: Non-blocking query execution
- **Parallel Embedding**: Generate embeddings concurrently
- **Smart Batching**: Group similar operations
- **Memory Management**: Efficient data structures

## 🧪 Testing

### Test the Complete System

```bash
npm run rag:test
```

**Tests performed:**
- ✅ Basic RAG queries
- ✅ Metadata and content inclusion
- ✅ Similarity threshold variations
- ✅ Cache functionality
- ✅ Service statistics
- ✅ Error handling
- ✅ Performance benchmarks
- ✅ Cache management

### Manual Testing

```bash
# Test basic endpoint
curl -X POST "http://localhost:5000/api/rag/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "tenantId": 1}'

# Test health check
curl "http://localhost:5000/api/rag/query?action=health"

# Test statistics
curl "http://localhost:5000/api/rag/query?action=stats"
```

## 🔧 Configuration

### Environment Variables

```bash
# Required
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional
OPENAI_API_KEY=your-openai-api-key
INSTRUCTOR_API_URL=http://localhost:8001/embed
PREFERRED_EMBEDDING_MODELS=openai,instructor,sentence-transformers
```

### Similarity Thresholds

| Use Case | Threshold | Description |
|----------|-----------|-------------|
| **Exact Match** | 0.9-1.0 | Very specific queries |
| **High Relevance** | 0.7-0.9 | Standard search queries |
| **Medium Relevance** | 0.5-0.7 | Broader searches |
| **Low Relevance** | 0.3-0.5 | Exploratory searches |
| **Very Broad** | 0.1-0.3 | Catch-all searches |

### Top-K Recommendations

| Use Case | Top-K | Description |
|----------|-------|-------------|
| **Quick Preview** | 3-5 | Fast results overview |
| **Standard Search** | 10-20 | Normal search results |
| **Comprehensive** | 50-100 | Detailed analysis |
| **Bulk Processing** | 100+ | Data mining operations |

## 🔮 Future Enhancements

### Planned Features

1. **Hybrid Search**: Combine vector similarity with text search
2. **Semantic Caching**: Intelligent cache invalidation
3. **Query Expansion**: Automatically expand search terms
4. **Real-time Updates**: WebSocket notifications for new documents
5. **Performance Analytics**: Detailed metrics and optimization suggestions

### Integration Points

- **AI Chat Interface**: Enhanced responses with document context
- **Document Upload**: Automatic embedding generation
- **Search Dashboard**: User-friendly search interface
- **Analytics Platform**: Search usage statistics
- **Workflow Automation**: Trigger actions based on search results

## 📚 Additional Resources

### Documentation

- [Vector Store Setup](./VECTOR_STORE_SETUP.md)
- [Document Embedding Pipeline](./DOCUMENT_EMBEDDING_PIPELINE.md)
- [API Reference](./api-reference.md)

### Examples

- [RAG Query Examples](./examples/rag-queries.md)
- [Advanced Filtering](./examples/advanced-filtering.md)
- [Performance Tuning](./examples/performance-tuning.md)

### External Resources

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Cosine Similarity](https://en.wikipedia.org/wiki/Cosine_similarity)
- [Vector Search Best Practices](https://www.pinecone.io/learn/vector-search/)

## ✅ Verification Checklist

- [ ] RAG service functional
- [ ] API endpoints responding
- [ ] Vector similarity working
- [ ] Caching system operational
- [ ] Filtering and sorting working
- [ ] Error handling tested
- [ ] Performance benchmarks met
- [ ] Documentation complete

## 🎉 Success!

Once all steps are completed, your Contas-PT system will have:

- **Semantic Search**: Find documents by meaning and context
- **Intelligent Retrieval**: Relevant results with similarity scoring
- **Advanced Filtering**: Powerful search refinement options
- **Performance Optimization**: Fast responses with intelligent caching
- **Multi-tenant Security**: Secure document access per tenant
- **RAG Capabilities**: Enhanced AI responses with document context

The RAG system is now ready for production use! 🚀

## 🚨 Troubleshooting

### Common Issues

#### 1. No Results Returned

```typescript
// Check similarity threshold
const result = await ragService.query({
  query: 'your query',
  tenantId: 1,
  similarityThreshold: 0.3, // Lower threshold
  topK: 20
});
```

#### 2. Slow Response Times

```typescript
// Clear cache
ragService.clearCache();

// Check cache statistics
const cacheStats = ragService.getCacheStats();
console.log('Cache size:', cacheStats.size);
```

#### 3. Embedding Generation Failures

```bash
# Check OpenAI API key
echo $OPENAI_API_KEY

# Test embedding service directly
npm run embeddings:test
```

#### 4. Vector Search Errors

```bash
# Verify vector store setup
npm run vector:test

# Check database connection
curl "http://localhost:5000/api/rag/query?action=health"
```

### Debug Mode

```typescript
// Enable detailed logging
console.log('Debug: Processing query:', query);
console.log('Debug: Tenant ID:', tenantId);
console.log('Debug: Cache hit:', cachedResponse ? 'yes' : 'no');
console.log('Debug: Search results:', searchResult);
```

### Performance Monitoring

```typescript
// Monitor response times
const startTime = Date.now();
const result = await ragService.query(query);
const responseTime = Date.now() - startTime;

console.log('Query response time:', responseTime, 'ms');
console.log('Results count:', result.totalResults);
console.log('Cache status:', result.model?.includes('(cached)') ? 'hit' : 'miss');
```
