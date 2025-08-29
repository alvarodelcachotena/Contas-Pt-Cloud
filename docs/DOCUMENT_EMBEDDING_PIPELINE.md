# Document Embedding Pipeline - Contas-PT

*Last Updated: January 30, 2025*

## Overview

The Document Embedding Pipeline is a comprehensive system that automatically generates vector embeddings for documents in the Contas-PT Portuguese Accounting Platform. It supports multiple embedding models, intelligent caching, and batch processing for optimal performance.

## 🎯 What We're Building

- **Multi-Model Support**: OpenAI, InstructorXL, and sentence-transformers
- **Intelligent Caching**: Avoid reprocessing duplicate content
- **Batch Processing**: Efficient handling of multiple documents
- **Automatic Pipeline**: Seamless integration with document processing
- **Performance Optimization**: Smart batching and rate limiting

## 🏗️ Architecture

### Core Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Document      │    │   Embedding      │    │   Vector        │
│   Pipeline      │───▶│   Service        │───▶│   Store         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cache         │    │   Model          │    │   Supabase      │
│   Manager       │    │   Registry       │    │   Database      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Data Flow

1. **Document Input**: OCR text + metadata + title
2. **Content Preparation**: Text normalization and truncation
3. **Embedding Generation**: Model selection and vector creation
4. **Caching**: Store results to avoid reprocessing
5. **Vector Storage**: Store in Supabase with metadata
6. **Similarity Search**: Enable semantic document retrieval

## 🚀 Quick Start

### 1. Setup Vector Store

```bash
# Enable pgvector and create tables
npm run vector:setup

# Test vector store functionality
npm run vector:test
```

### 2. Test Embedding Pipeline

```bash
# Test the complete pipeline
npm run embeddings:test
```

### 3. Setup Local Models (Optional)

```bash
# Setup InstructorXL and sentence-transformers
npm run embeddings:setup-local
```

## 🔧 Configuration

### Environment Variables

```bash
# Required for OpenAI
OPENAI_API_KEY=your-openai-api-key

# Optional for local models
INSTRUCTOR_API_URL=http://localhost:8001/embed
INSTRUCTOR_LOCAL_PATH=./models/instructor-xl
SENTENCE_TRANSFORMERS_PATH=./models/sentence-transformers

# Model preferences (comma-separated)
PREFERRED_EMBEDDING_MODELS=openai,instructor,sentence-transformers
```

### Model Configuration

| Model | Dimensions | Speed | Quality | Cost | Setup |
|-------|------------|-------|---------|------|-------|
| **OpenAI** | 1536 | Fast | Excellent | $0.0001/1K tokens | API Key |
| **InstructorXL** | 768 | Medium | Excellent | Free | Local/API |
| **sentence-transformers** | 384 | Fast | Good | Free | Local |

## 📊 API Usage

### Pipeline Statistics

```bash
GET /api/embeddings?tenantId=1&action=stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalDocuments": 150,
    "documentsWithEmbeddings": 120,
    "pendingDocuments": 30,
    "cacheStats": {
      "size": 45,
      "hitRate": 0.0
    }
  }
}
```

### Process Single Document

```bash
POST /api/embeddings
{
  "tenantId": 1,
  "action": "process-single",
  "documentId": 123,
  "options": {
    "preferredModel": "openai",
    "forceRegenerate": false
  }
}
```

### Process All Pending Documents

```bash
POST /api/embeddings
{
  "tenantId": 1,
  "action": "process-all",
  "options": {
    "batchSize": 5,
    "preferredModel": "instructor"
  }
}
```

### Clear Cache

```bash
POST /api/embeddings
{
  "tenantId": 1,
  "action": "clear-cache"
}
```

## 🛠️ Programmatic Usage

### Basic Document Processing

```typescript
import { documentEmbeddingPipeline } from '../lib/document-embedding-pipeline';

// Process a single document
const result = await documentEmbeddingPipeline.processDocument(
  tenantId,
  documentId,
  { preferredModel: 'openai' }
);

if (result.success) {
  console.log('Embedding ID:', result.embeddingId);
  console.log('Model used:', result.model);
  console.log('Processing time:', result.processingTime, 'ms');
}
```

### Batch Processing

```typescript
// Process multiple documents
const results = await documentEmbeddingPipeline.processDocumentsBatch(
  tenantId,
  [123, 124, 125],
  { batchSize: 3, preferredModel: 'instructor' }
);

const successful = results.filter(r => r.success).length;
const failed = results.filter(r => !r.success).length;

console.log(`Processed: ${successful} successful, ${failed} failed`);
```

### Pipeline Statistics

```typescript
// Get pipeline statistics
const stats = await documentEmbeddingPipeline.getPipelineStats(tenantId);

console.log('Total documents:', stats.totalDocuments);
console.log('With embeddings:', stats.documentsWithEmbeddings);
console.log('Pending:', stats.pendingDocuments);
console.log('Cache size:', stats.cacheStats.size);
```

## 🔍 Embedding Service

### Direct Embedding Generation

```typescript
import { embeddingService } from '../lib/embedding-service';

const content = {
  ocrText: 'Invoice for consulting services...',
  title: 'Consulting Invoice',
  metadata: { vendor: 'TechCorp', amount: '500.00' },
  documentType: 'invoice'
};

const result = await embeddingService.generateEmbedding(content, 'openai');

if (result.success) {
  console.log('Dimensions:', result.dimensions);
  console.log('Model:', result.model);
  console.log('Was cached:', result.model?.includes('(cached)'));
}
```

### Cache Management

```typescript
// Get cache statistics
const cacheStats = embeddingService.getCacheStats();
console.log('Cache size:', cacheStats.size);

// Clear cache
embeddingService.clearCache();
```

## 📈 Performance Optimization

### Batch Processing

- **Default batch size**: 5 documents
- **Configurable**: Adjust based on your hardware
- **Rate limiting**: 1 second delay between batches
- **Memory management**: Automatic cleanup of old cache entries

### Caching Strategy

- **TTL**: 24 hours for cached embeddings
- **Key generation**: Content-based hashing
- **Automatic cleanup**: When cache exceeds 1000 entries
- **Hit rate tracking**: Monitor cache effectiveness

### Model Selection

1. **Preferred model** (if specified and available)
2. **Fallback models** in order of preference
3. **Error handling** with graceful degradation
4. **Performance monitoring** for each model

## 🧪 Testing

### Test Pipeline

```bash
npm run embeddings:test
```

**Tests performed:**
- ✅ Pipeline statistics
- ✅ Single document processing
- ✅ Batch processing
- ✅ Direct embedding generation
- ✅ Cache functionality
- ✅ Model availability

### Test Local Models

```bash
# Setup local models
npm run embeddings:setup-local

# Install Python dependencies
pip install -r requirements-embeddings.txt

# Start embedding server
./start-embedding-server.sh  # Unix/Linux
start-embedding-server.bat   # Windows

# Test server
curl http://localhost:8001/health
```

## 🔧 Troubleshooting

### Common Issues

#### 1. OpenAI Rate Limiting

```typescript
// Reduce batch size
const options = { batchSize: 2 };

// Add delay between requests
await new Promise(resolve => setTimeout(resolve, 2000));
```

#### 2. Memory Issues

```typescript
// Clear cache periodically
embeddingService.clearCache();

// Process smaller batches
const options = { batchSize: 3 };
```

#### 3. Model Loading Failures

```bash
# Check Python environment
python --version
pip list | grep transformers

# Verify model paths
ls -la models/
```

### Debug Mode

```typescript
// Enable detailed logging
console.log('Debug: Processing document:', documentId);
console.log('Debug: Content length:', content.ocrText.length);
console.log('Debug: Cache hit:', cachedResult ? 'yes' : 'no');
```

## 🔮 Future Enhancements

### Planned Features

1. **Hybrid Search**: Combine vector similarity with text search
2. **Semantic Caching**: Intelligent cache invalidation
3. **Model Auto-scaling**: Dynamic model selection based on load
4. **Real-time Updates**: WebSocket notifications for embedding changes
5. **Performance Analytics**: Detailed metrics and optimization suggestions

### Integration Points

- **AI Processing Pipeline**: Automatic embedding generation
- **Document Upload**: Real-time vector creation
- **Search Interface**: User-friendly similarity search
- **Analytics Dashboard**: Embedding usage statistics
- **RAG System**: Enhanced AI responses with document context

## 📚 Additional Resources

### Documentation

- [Vector Store Setup](./VECTOR_STORE_SETUP.md)
- [Local Models Guide](./LOCAL_MODELS_README.md)
- [API Reference](./api-reference.md)

### Examples

- [Embedding Pipeline Examples](./examples/embedding-pipeline.md)
- [Cache Optimization](./examples/cache-optimization.md)
- [Performance Tuning](./examples/performance-tuning.md)

### External Resources

- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [InstructorXL Documentation](https://github.com/xlang-ai/instructor-embedding)
- [Sentence Transformers](https://www.sbert.net/)

## ✅ Verification Checklist

- [ ] Vector store configured and tested
- [ ] Embedding pipeline functional
- [ ] API endpoints responding
- [ ] Cache system working
- [ ] Model availability verified
- [ ] Performance benchmarks met
- [ ] Error handling tested
- [ ] Documentation complete

## 🎉 Success!

Once all steps are completed, your Contas-PT system will have:

- **Automatic Embeddings**: Documents automatically get vector representations
- **Multi-Model Support**: Flexible embedding generation with fallbacks
- **Intelligent Caching**: Avoid reprocessing duplicate content
- **Batch Processing**: Efficient handling of large document sets
- **Semantic Search**: Find documents by meaning, not just keywords
- **RAG Capabilities**: Enhanced AI responses with document context

The document embedding pipeline is now ready for production use! 🚀
