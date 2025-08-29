# Audit Logging System for RAG Queries

## 📋 Overview

The Audit Logging System provides comprehensive logging and monitoring for all RAG (Retrieval-Augmented Generation) queries in the Contas-PT system. This system captures detailed information about every query, including user context, performance metrics, and results, enabling prompt-tuning, debugging, and performance analysis.

## 🎯 Features

### **Comprehensive Query Logging**
- **User Context**: userId, sessionId, userAgent, ipAddress
- **Query Details**: query text, parameters, type, timestamp
- **Performance Metrics**: processing time, response time, cache hits
- **Results Data**: vector hit IDs, similarity scores, total results
- **Model Information**: embedding model used, tokens consumed, cost estimates

### **Advanced Analytics**
- **Query Statistics**: total queries, unique users, average response times
- **Cache Performance**: hit rates, cache key tracking
- **User Behavior**: query patterns, popular searches, user engagement
- **Performance Monitoring**: response time trends, bottleneck identification

### **Data Export & Management**
- **Multiple Formats**: JSON and CSV export options
- **Flexible Filtering**: by tenant, date range, query type
- **Retention Policies**: automated cleanup of old logs
- **Data Privacy**: configurable logging levels and data masking

## 🏗️ Architecture

### **Database Schema**

```sql
-- Main audit log table
CREATE TABLE rag_query_log (
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
```

### **Service Architecture**

```
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────┐
│   RAG Service  │───▶│ Audit Logging      │───▶│   Supabase     │
│                 │    │ Service             │    │   Database     │
└─────────────────┘    └─────────────────────┘    └─────────────────┘
         │                       │                        │
         │                       │                        │
         ▼                       ▼                        ▼
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────┐
│   API Routes   │    │   Analytics &       │    │   Export &      │
│                 │    │   Monitoring        │    │   Cleanup       │
└─────────────────┘    └─────────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### **1. Setup Database**

```bash
# Run the setup script
npm run audit:setup
```

This will:
- Create the `rag_query_log` table
- Set up indexes for efficient querying
- Create RPC functions for analytics
- Insert sample data for testing

### **2. Test the System**

```bash
# Run comprehensive tests
npm run audit:test
```

### **3. Verify Integration**

The audit logging is automatically integrated with the RAG service. Every query will be logged automatically.

## 📊 API Endpoints

### **GET /api/audit/rag-logs**

#### **Get Statistics**
```bash
GET /api/audit/rag-logs?action=stats&tenantId=1
```

Response:
```json
{
  "success": true,
  "stats": {
    "totalQueries": 150,
    "uniqueUsers": 25,
    "avgResponseTime": 245.67,
    "cacheHitRate": 78.5,
    "topQueries": ["Find invoices", "Search receipts"],
    "queryTypes": {
      "semantic_search": 120,
      "advanced_search": 30
    },
    "performanceMetrics": {
      "avgProcessingTime": 180.5,
      "avgTokensUsed": 150,
      "totalCostEstimate": 0.045
    }
  }
}
```

#### **Get Recent Logs**
```bash
GET /api/audit/rag-logs?action=recent&limit=10&tenantId=1
```

#### **Export Data**
```bash
# JSON export
GET /api/audit/rag-logs?action=export&format=json&tenantId=1

# CSV export
GET /api/audit/rag-logs?action=export&format=csv&tenantId=1
```

### **POST /api/audit/rag-logs**

#### **Clean Old Logs**
```bash
POST /api/audit/rag-logs
{
  "action": "clean",
  "daysToKeep": 90,
  "tenantId": 1
}
```

#### **Toggle Logging**
```bash
POST /api/audit/rag-logs
{
  "action": "toggle",
  "enabled": false
}
```

## 🔧 Configuration

### **Environment Variables**

```bash
# Required
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
AUDIT_LOGGING_ENABLED=true
AUDIT_LOG_RETENTION_DAYS=90
AUDIT_LOG_MAX_SIZE=10000
```

### **Service Configuration**

```typescript
// Enable/disable audit logging
auditLoggingService.setEnabled(true);

// Check status
const isEnabled = auditLoggingService.isAuditLoggingEnabled();
```

## 📈 Analytics & Monitoring

### **Key Metrics**

- **Query Volume**: Total queries per day/week/month
- **User Engagement**: Unique users, query frequency per user
- **Performance**: Response times, processing times, cache hit rates
- **Cost Analysis**: Token usage, estimated costs per query
- **Quality Metrics**: Result counts, similarity score distributions

### **Performance Dashboards**

```typescript
// Get comprehensive statistics
const stats = await auditLoggingService.getAuditLogStats(
  tenantId,           // Optional: filter by tenant
  startDate,          // Optional: filter by start date
  endDate            // Optional: filter by end date
);

// Get recent activity
const recentLogs = await auditLoggingService.getRecentLogs(
  100,               // Limit
  tenantId           // Optional: filter by tenant
);
```

## 🔍 Use Cases

### **1. Prompt Tuning**
```typescript
// Analyze query patterns for prompt optimization
const stats = await auditLoggingService.getAuditLogStats();
const topQueries = stats.topQueries;

// Identify common query patterns
// Optimize prompts based on user behavior
```

### **2. Performance Debugging**
```typescript
// Identify slow queries
const slowQueries = await auditLoggingService.getRecentLogs(1000);
const problematicQueries = slowQueries.filter(log => 
  log.response_time_ms > 1000
);

// Analyze cache performance
const cacheStats = stats.performanceMetrics;
```

### **3. User Behavior Analysis**
```typescript
// Track user engagement
const userStats = await auditLoggingService.getAuditLogStats();
console.log(`Active users: ${userStats.uniqueUsers}`);
console.log(`Average queries per user: ${userStats.totalQueries / userStats.uniqueUsers}`);
```

### **4. Cost Monitoring**
```typescript
// Monitor API costs
const costStats = await auditLoggingService.getAuditLogStats();
const totalCost = costStats.performanceMetrics.totalCostEstimate;
const avgCostPerQuery = totalCost / costStats.totalQueries;
```

## 🛡️ Security & Privacy

### **Data Protection**
- **User Anonymization**: Optional user ID masking
- **Sensitive Data Filtering**: Configurable field exclusion
- **Access Control**: Tenant-based data isolation
- **Audit Trail**: Log access and modifications

### **Compliance Features**
- **GDPR Compliance**: Right to be forgotten
- **Data Retention**: Configurable retention policies
- **Export Controls**: User data export capabilities
- **Privacy Settings**: Granular logging controls

## 🔄 Maintenance

### **Automated Cleanup**

```typescript
// Clean logs older than 90 days
const cleanupResult = await auditLoggingService.cleanOldLogs(90);

// Clean specific tenant logs
const tenantCleanup = await auditLoggingService.cleanOldLogs(90, tenantId);
```

### **Performance Optimization**

```sql
-- Monitor table size
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE tablename = 'rag_query_log';

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM rag_query_log WHERE tenant_id = 1;
```

## 🚨 Troubleshooting

### **Common Issues**

#### **1. Logging Not Working**
```bash
# Check if service is enabled
const isEnabled = auditLoggingService.isAuditLoggingEnabled();

# Verify database connection
const testLog = await auditLoggingService.logRAGQuery(testData);
```

#### **2. Performance Issues**
```bash
# Check table size and indexes
SELECT * FROM pg_indexes WHERE tablename = 'rag_query_log';

# Monitor slow queries
SELECT query_text, response_time_ms 
FROM rag_query_log 
WHERE response_time_ms > 1000 
ORDER BY response_time_ms DESC;
```

#### **3. Export Failures**
```bash
# Check function permissions
GRANT EXECUTE ON FUNCTION export_rag_query_logs TO authenticated;

# Verify data format
SELECT * FROM rag_query_log LIMIT 1;
```

### **Debug Mode**

```typescript
// Enable detailed logging
console.log('Audit logging debug mode enabled');

// Test individual components
const testResult = await auditLoggingService.logRAGQuery(testData);
console.log('Test result:', testResult);
```

## 📚 Examples

### **Complete Integration Example**

```typescript
import { ragService } from './lib/rag-service';
import { auditLoggingService } from './lib/audit-logging-service';

// RAG query with automatic audit logging
const query = {
  query: 'Find invoices from last month',
  tenantId: 1,
  userId: 123,
  sessionId: 'session-abc-123',
  userAgent: 'Mozilla/5.0...',
  ipAddress: '192.168.1.100'
};

const result = await ragService.query(query);
// Audit logging happens automatically!

// Get analytics
const stats = await auditLoggingService.getAuditLogStats(1);
console.log(`Cache hit rate: ${stats.cacheHitRate}%`);
```

### **Custom Analytics Example**

```typescript
// Analyze user behavior patterns
const userQueries = await auditLoggingService.getRecentLogs(1000, tenantId);
const userPatterns = {};

userQueries.forEach(log => {
  const userId = log.user_id;
  if (!userPatterns[userId]) {
    userPatterns[userId] = {
      totalQueries: 0,
      avgResponseTime: 0,
      favoriteQueries: new Set()
    };
  }
  
  userPatterns[userId].totalQueries++;
  userPatterns[userId].avgResponseTime += log.response_time_ms;
  userPatterns[userId].favoriteQueries.add(log.query_text);
});

// Calculate averages
Object.values(userPatterns).forEach(pattern => {
  pattern.avgResponseTime /= pattern.totalQueries;
});
```

## 🔮 Future Enhancements

### **Planned Features**
- **Real-time Monitoring**: WebSocket-based live updates
- **Advanced Analytics**: Machine learning insights
- **Alerting System**: Performance threshold notifications
- **Integration APIs**: Third-party monitoring tools
- **Custom Dashboards**: Configurable visualization panels

### **Roadmap**
- **Q1**: Enhanced analytics and reporting
- **Q2**: Real-time monitoring and alerting
- **Q3**: Advanced ML-powered insights
- **Q4**: Enterprise features and integrations

## 📞 Support

### **Getting Help**
- **Documentation**: This file and related docs
- **Code Examples**: See `/scripts` directory
- **API Reference**: Check endpoint documentation
- **Issues**: Report bugs and feature requests

### **Contributing**
- **Code Review**: Submit pull requests
- **Testing**: Run test suites before changes
- **Documentation**: Update docs with changes
- **Feedback**: Share ideas and improvements

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: Contas-PT Development Team
