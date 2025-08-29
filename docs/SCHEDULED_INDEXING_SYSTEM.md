# Scheduled Indexing System - Contas-PT

*Last Updated: January 30, 2025*

## Overview

The Scheduled Indexing System is an automated document processing pipeline that continuously monitors Supabase storage for new or changed documents, generates vector embeddings, and maintains a synchronized vector store for RAG (Retrieval-Augmented Generation) functionality.

## 🎯 What We're Building

- **Automated Scanning**: Continuous monitoring of storage buckets every X minutes
- **Smart Processing**: Only processes new or changed documents
- **Batch Operations**: Efficient processing of multiple documents
- **Embedding Generation**: Automatic vector creation using OpenAI, InstructorXL, or sentence-transformers
- **Version Control**: Tracks embedding generation timestamps and content hashes
- **Real-time Monitoring**: Live dashboard for service status and statistics
- **Retry Logic**: Automatic retry for failed processing jobs
- **Multi-tenant Support**: Secure document processing per tenant

## 🏗️ Architecture

### Core Components

```
┌─────────────────┐    ┌──────────────────┐   ┌─────────────────┐
│   Supabase      │    │   Indexing       │   │   Vector Store  │
│   Storage       │◄──►│   Service        │◄──►│   (pgvector)    │
│                 │    │                  │   │                 │
│ • documents     │    │ • Scanner        │   │ • embeddings    │
│ • metadata      │    │ • Processor      │   │ • metadata      │
│ • file changes  │    │ • Queue Manager  │   │ • versioning    │
└─────────────────┘    └──────────────────┘   └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   Embedding      │
                       │   Service        │
                       │                  │
                       │ • OpenAI         │
                       │ • InstructorXL   │
                       │ • sentence-      │
                       │   transformers  │
                       └──────────────────┘
```

### Data Flow

1. **Storage Monitoring**: Service scans storage buckets at configurable intervals
2. **Change Detection**: Identifies new, modified, or deleted documents
3. **Content Extraction**: Downloads and processes document content
4. **Embedding Generation**: Creates vector representations using AI models
5. **Vector Storage**: Stores embeddings in Supabase with metadata
6. **Version Tracking**: Records timestamps and content hashes
7. **Status Updates**: Updates job status and statistics

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Run the setup script
npm run indexing:setup

# Copy and configure environment variables
cp .env.indexing.template .env.indexing
# Edit .env.indexing with your actual values
```

### 2. Start the Service

```bash
# Manual start
npm run indexing:start

# Or run directly
node start-indexing-service.js
```

### 3. Monitor the Service

Open `indexing-dashboard.html` in your browser to monitor:
- Service status and health
- Processing statistics
- Active job queue
- Error logs and retry attempts

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `INDEXING_SCAN_INTERVAL_MINUTES` | 15 | Minutes between storage scans |
| `INDEXING_BATCH_SIZE` | 10 | Documents processed per batch |
| `INDEXING_MAX_CONCURRENT_JOBS` | 5 | Maximum concurrent processing jobs |
| `INDEXING_RETRY_ATTEMPTS` | 3 | Number of retry attempts for failed jobs |
| `INDEXING_RETRY_DELAY_MINUTES` | 5 | Minutes to wait between retries |
| `INDEXING_FILE_TYPES` | pdf,jpg,jpeg,png,tiff | Supported file extensions |
| `INDEXING_MAX_FILE_SIZE_MB` | 50 | Maximum file size in MB |
| `INDEXING_INCREMENTAL_SYNC` | true | Enable incremental scanning |

### Runtime Configuration

Update configuration at runtime via API:

```javascript
// Example: Update scan interval
fetch('/api/indexing', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'update-config',
    config: { 
      scanIntervalMinutes: 30,
      batchSize: 15,
      maxConcurrentJobs: 8
    }
  })
});
```

## 🔌 API Reference

### Service Control

#### Start Service
```http
POST /api/indexing
Content-Type: application/json

{
  "action": "start"
}
```

#### Stop Service
```http
POST /api/indexing
Content-Type: application/json

{
  "action": "stop"
}
```

#### Force Scan
```http
POST /api/indexing
Content-Type: application/json

{
  "action": "force-scan"
}
```

#### Update Configuration
```http
POST /api/indexing
Content-Type: application/json

{
  "action": "update-config",
  "config": {
    "scanIntervalMinutes": 30,
    "batchSize": 15,
    "maxConcurrentJobs": 8
  }
}
```

### Monitoring

#### Get Statistics
```http
GET /api/indexing?action=stats
```

Response:
```json
{
  "success": true,
  "data": {
    "totalDocuments": 150,
    "indexedDocuments": 145,
    "failedDocuments": 3,
    "pendingDocuments": 2,
    "lastSyncTime": "2025-01-30T10:30:00.000Z",
    "averageProcessingTime": 1250,
    "storageSize": 1073741824,
    "embeddingsSize": 536870912
  }
}
```

#### Get Service Status
```http
GET /api/indexing?action=status
```

Response:
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "queueLength": 0,
    "activeJobs": [
      {
        "id": "job_1706625000000_abc123",
        "status": "processing",
        "filename": "invoice_2025_001.pdf",
        "startedAt": "2025-01-30T10:30:00.000Z",
        "processingTime": 1250,
        "error": null
      }
    ]
  }
}
```

#### Health Check
```http
GET /api/indexing?action=health
```

Response:
```json
{
  "success": true,
  "status": "healthy",
  "service": "Scheduled Indexing Service",
  "timestamp": "2025-01-30T10:30:00.000Z"
}
```

## 📊 Monitoring Dashboard

The HTML dashboard (`indexing-dashboard.html`) provides:

### Real-time Statistics
- **Total Documents**: Count of all documents in storage
- **Indexed Documents**: Successfully processed documents
- **Failed Documents**: Documents that failed processing
- **Pending Documents**: Currently queued documents
- **Service Status**: Running/Stopped indicator
- **Last Sync Time**: Timestamp of last successful scan

### Service Controls
- **Start Service**: Begin automatic scanning
- **Stop Service**: Halt all processing
- **Force Scan**: Trigger immediate scan
- **Refresh Stats**: Update dashboard data

### Active Jobs Table
- **Job ID**: Unique identifier for each processing job
- **Filename**: Name of the document being processed
- **Status**: Current job status (pending, processing, completed, failed)
- **Started At**: When processing began
- **Processing Time**: Time taken to process (in milliseconds)
- **Error**: Any error messages if processing failed

## 🔄 Processing Pipeline

### 1. Document Discovery

```typescript
interface DocumentFile {
  name: string;
  filePath: string;
  bucket: string;
  metadata: {
    mimetype: string;
    size: number;
    lastModified: string;
  };
  updated_at: string;
  created_at: string;
}
```

### 2. Content Extraction

```typescript
interface DocumentContent {
  ocrText: string;
  title: string;
  metadata: Record<string, any>;
  documentType: string;
}
```

### 3. Embedding Generation

```typescript
interface EmbeddingResult {
  success: boolean;
  embedding?: number[];
  error?: string;
  model?: string;
  dimensions?: number;
  processingTime?: number;
}
```

### 4. Vector Storage

```typescript
interface VectorDocument {
  tenantId: number;
  documentId: number;
  filename: string;
  documentType: string;
  ocrText: string;
  metadata: {
    mimeType: string;
    size: number;
    lastModified: string;
    embeddingGeneratedAt: string;
    embeddingVersion: string;
    processingJobId: string;
  };
  embedding: string; // Comma-separated vector values
}
```

## 🛠️ Service Management

### Linux (systemd)

```bash
# Install the service
sudo cp contas-pt-indexing.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable contas-pt-indexing
sudo systemctl start contas-pt-indexing

# Check status
sudo systemctl status contas-pt-indexing

# View logs
sudo journalctl -u contas-pt-indexing -f

# Stop service
sudo systemctl stop contas-pt-indexing
```

### Windows

```cmd
# Install the service (requires NSSM)
install-indexing-service.bat

# Start the service
net start "Contas-PT-Indexing"

# Stop the service
net stop "Contas-PT-Indexing"

# Check status
sc query "Contas-PT-Indexing"
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start the indexing service
CMD ["node", "start-indexing-service.js"]
```

```bash
# Build and run
docker build -t contas-pt-indexing .
docker run -d --name indexing-service \
  --env-file .env.indexing \
  -p 3000:3000 \
  contas-pt-indexing
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Service Won't Start

**Symptoms**: Service fails to start or immediately stops

**Diagnosis**:
```bash
# Check environment variables
cat .env.indexing

# Check Supabase connection
curl -X GET "https://your-project.supabase.co/rest/v1/" \
  -H "apikey: YOUR_SERVICE_ROLE_KEY"
```

**Solutions**:
- Verify all required environment variables are set
- Check Supabase URL and service role key
- Ensure vector store is properly configured

#### 2. No Documents Processed

**Symptoms**: Service runs but processes no documents

**Diagnosis**:
```bash
# Check storage bucket contents
curl -X GET "https://your-project.supabase.co/storage/v1/object/list/documents" \
  -H "apikey: YOUR_SERVICE_ROLE_KEY"

# Check service logs
tail -f /var/log/contas-pt-indexing.log
```

**Solutions**:
- Verify documents bucket exists and contains files
- Check file type filters in configuration
- Verify file size limits are appropriate

#### 3. High Failure Rate

**Symptoms**: Many documents fail processing

**Diagnosis**:
```bash
# Check embedding service status
curl -X GET "https://api.openai.com/v1/models" \
  -H "Authorization: Bearer YOUR_OPENAI_API_KEY"

# Check service statistics
curl -X GET "http://localhost:3000/api/indexing?action=stats"
```

**Solutions**:
- Verify OpenAI API key and quota
- Check network connectivity
- Review error logs for specific failure reasons

#### 4. Slow Processing

**Symptoms**: Documents take too long to process

**Diagnosis**:
```bash
# Check current configuration
curl -X GET "http://localhost:3000/api/indexing?action=status"

# Monitor resource usage
top -p $(pgrep -f "start-indexing-service")
```

**Solutions**:
- Increase batch size for faster processing
- Reduce concurrent job limits if system is overwhelmed
- Optimize file size limits

### Performance Tuning

#### Batch Processing
```typescript
// Optimal batch sizes based on system capabilities
const batchConfigs = {
  lowMemory: { batchSize: 5, maxConcurrentJobs: 3 },
  mediumMemory: { batchSize: 10, maxConcurrentJobs: 5 },
  highMemory: { batchSize: 20, maxConcurrentJobs: 10 }
};
```

#### Scan Intervals
```typescript
// Balance responsiveness vs resource usage
const intervalConfigs = {
  realtime: { scanIntervalMinutes: 1 },    // High resource usage
  responsive: { scanIntervalMinutes: 5 },   // Balanced
  efficient: { scanIntervalMinutes: 15 },  // Low resource usage
  batch: { scanIntervalMinutes: 60 }       // Very low resource usage
};
```

#### File Size Limits
```typescript
// Adjust based on storage and processing capacity
const sizeConfigs = {
  small: { maxFileSize: 10 * 1024 * 1024 },    // 10MB
  medium: { maxFileSize: 50 * 1024 * 1024 },   // 50MB
  large: { maxFileSize: 100 * 1024 * 1024 },   // 100MB
  unlimited: { maxFileSize: Number.MAX_SAFE_INTEGER }
};
```

## 🔐 Security Considerations

### Access Control
- **Service Role Key**: Uses Supabase service role for full access
- **Tenant Isolation**: Maintains multi-tenant security boundaries
- **File Validation**: Validates file types and sizes before processing

### Data Protection
- **Error Handling**: Prevents information leakage in error messages
- **Log Sanitization**: Removes sensitive data from logs
- **Secure Storage**: Uses encrypted connections to Supabase

### Monitoring
- **Audit Logs**: Tracks all processing activities
- **Access Logs**: Records API access and service operations
- **Error Reporting**: Secure error reporting without exposing internals

## 📈 Metrics and Analytics

### Performance Metrics
- **Processing Time**: Average time per document
- **Throughput**: Documents processed per hour
- **Success Rate**: Percentage of successful processing
- **Queue Length**: Number of pending documents

### Resource Metrics
- **Memory Usage**: RAM consumption during processing
- **CPU Usage**: Processing load and efficiency
- **Storage Usage**: Vector store size and growth
- **Network Usage**: API call frequency and bandwidth

### Business Metrics
- **Document Volume**: Total documents processed
- **Storage Growth**: Vector store expansion over time
- **Processing Efficiency**: Cost per document processed
- **Service Uptime**: Availability and reliability

## 🔮 Future Enhancements

### Planned Features
- **Webhook Integration**: Real-time processing triggers
- **Advanced Filtering**: Content-based document selection
- **Multi-model Support**: Automatic model selection based on content
- **Distributed Processing**: Multi-node processing for large volumes

### Performance Improvements
- **Streaming Processing**: Handle very large documents
- **Parallel Processing**: Multi-threaded content extraction
- **Smart Caching**: Intelligent embedding cache management
- **Load Balancing**: Distribute processing across multiple instances

### Monitoring Enhancements
- **Real-time Alerts**: Proactive issue detection
- **Performance Dashboards**: Advanced analytics and reporting
- **Integration APIs**: Connect with external monitoring systems
- **Custom Metrics**: User-defined performance indicators

## 📚 Additional Resources

### Documentation
- [Vector Store Setup](./VECTOR_STORE_SETUP.md)
- [Document Embedding Pipeline](./DOCUMENT_EMBEDDING_PIPELINE.md)
- [RAG System](./RAG_SYSTEM.md)
- [API Reference](./api-reference.md)

### Scripts and Tools
- `scripts/setup-indexing-service.js` - Complete setup automation
- `scripts/test-scheduled-indexing.js` - Comprehensive testing
- `start-indexing-service.js` - Service startup script
- `indexing-dashboard.html` - Real-time monitoring dashboard

### Configuration Files
- `indexing-service.config.json` - Service configuration
- `.env.indexing.template` - Environment variables template
- `contas-pt-indexing.service` - Linux systemd service
- `install-indexing-service.bat` - Windows service installer

## 🤝 Support and Contributing

### Getting Help
1. Check the troubleshooting section above
2. Review service logs and dashboard
3. Test with provided test scripts
4. Verify configuration and environment setup

### Contributing
1. Follow the existing code style and patterns
2. Add comprehensive tests for new features
3. Update documentation for any changes
4. Test thoroughly before submitting changes

### Reporting Issues
When reporting issues, please include:
- Service version and configuration
- Error logs and stack traces
- Steps to reproduce the problem
- Environment details (OS, Node.js version, etc.)

---

*This system is part of the Contas-PT Portuguese Accounting Platform and provides the foundation for intelligent document search and retrieval capabilities.*
