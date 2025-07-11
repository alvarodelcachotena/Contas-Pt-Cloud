# Cloud AI Setup Guide

Complete configuration guide for AI-powered document processing in Contas-PT using Google Gemini and OpenAI with Supabase integration.

## Overview

Contas-PT uses a sophisticated cloud-based AI architecture for processing Portuguese financial documents:

**Primary Processing**: Google Gemini-2.5-Flash-Preview with enhanced vision capabilities for direct document analysis  
**Fallback Processing**: OpenAI GPT-4o-Mini for validation and backup extraction with improved accuracy  
**Database Integration**: Supabase PostgreSQL for real-time status and extracted data storage  
**Portuguese Optimization**: Specialized prompts designed for Portuguese business documents and tax requirements

**User Experience**: Upload a receipt photo → AI extracts vendor, amount, VAT → Expense record created automatically

## Google AI Configuration (Recommended Primary)

### Getting Your API Key
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Create a new project or select existing one
3. Generate API key for Gemini models
4. Add to your environment variables:

```bash
GOOGLE_AI_API_KEY=your-google-ai-api-key-here
```

### Gemini-2.5-Flash Capabilities
**Vision Processing**: Analyzes images and PDFs directly without OCR preprocessing  
**Structured Outputs**: Returns properly formatted JSON for Portuguese invoices  
**Portuguese Optimization**: Trained on Portuguese business document patterns  
**Speed and Accuracy**: Fast processing with high confidence scores for European documents

**Real-World Processing Example**:
```javascript
// Input: Portuguese invoice photo
// Output: Extracted data ready for accounting system
{
  "vendor": "TECNOLOGIA DIGITAL LDA",
  "nif": "PT507456123", 
  "total": 1045.50,
  "vatRate": 23,
  "invoiceDate": "2024-06-14",
  "confidence": 0.95
}
```

### Portuguese Prompt Optimization
The system uses specialized prompts for Portuguese business documents:
```
Analise esta fatura portuguesa e extraia:
- Fornecedor e NIF completo (incluindo prefixo do país)
- Data de emissão e número da fatura
- Valores: líquido, IVA, e total
- Taxa de IVA aplicada (6%, 13%, ou 23%)
- Descrição dos serviços/produtos
```

## OpenAI Configuration (Fallback)

### Getting Your API Key
1. Create account at [OpenAI Platform](https://platform.openai.com/)
2. Navigate to API keys section
3. Generate new API key with appropriate permissions
4. Add to environment variables:

```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### GPT-4o-Mini Features
**Validation Engine**: Cross-validates Gemini results for maximum accuracy  
**Structured Outputs**: JSON schema validation for consistent data format  
**Fallback Processing**: Takes over when Gemini encounters issues  
**Portuguese Context**: Understands Portuguese business terminology and formats

**Automatic Fallback Scenario**:
- Gemini processes document first
- If confidence score < 0.8 or errors occur
- OpenAI automatically processes the same document  
- System compares results and uses best extraction

## System Integration with Supabase

### Real-Time Processing Flow
1. **Document Upload**: File saved to Supabase storage with metadata
2. **AI Processing**: Google Gemini analyzes document with vision capabilities
3. **Data Extraction**: Structured JSON data extracted with confidence scores
4. **Database Storage**: Results saved to Supabase with processing status
5. **Auto-Creation**: Invoices/expenses created automatically from extracted data
6. **User Notification**: Real-time updates via WebSocket connections

### Processing Status Tracking
```javascript
// Real-time status updates
{
  "status": "processing",
  "progress": 75,
  "engine": "gemini-2.5-flash",
  "confidence": 0.92,
  "extractedFields": 8
}
```

## Environment Configuration

### Complete Setup
```bash
# Required: Supabase database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
DATABASE_URL=your-supabase-database-url
SESSION_SECRET=your-session-secret

# AI Processing (at least one recommended)
GOOGLE_AI_API_KEY=your-google-ai-key      # Primary processor
OPENAI_API_KEY=sk-your-openai-key         # Fallback processor

# Optional: Cloud storage integration
GOOGLE_CLIENT_ID=your-google-oauth-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
DROPBOX_CLIENT_ID=your-dropbox-app-key
DROPBOX_CLIENT_SECRET=your-dropbox-app-secret
```

### Testing Your Setup
```bash
# Test AI extraction with sample document
curl -X POST http://localhost:5000/api/test-cloud-extraction \
  -F "file=@sample-invoice.pdf"

# Check AI system status
curl http://localhost:5000/api/cloud-processor-status
```

## Portuguese Document Optimization

### Supported Document Types
**Invoices (Faturas)**: Complete extraction of vendor, NIF, amounts, VAT rates  
**Receipts (Recibos)**: Expense tracking with automatic categorization  
**Bank Statements**: Transaction parsing with Portuguese bank formats  
**Contracts**: Client information and service details extraction

### VAT Rate Detection
The system automatically identifies Portuguese VAT rates:
- **6%**: Essential goods and services
- **13%**: Reduced rate items (food, medicine, culture)
- **23%**: Standard rate for most goods and services
- **0%**: Exempt transactions and EU cross-border

### NIF Validation
**Portuguese Format**: 9-digit validation with country prefix support  
**EU Format**: Italian, Spanish, German, French tax ID recognition  
**Algorithm Validation**: Mathematical verification of tax ID checksums  
**Database Storage**: Complete vendor information with tax registration details

## Troubleshooting

### Common Issues
**No API Key**: System falls back to manual entry mode
**Rate Limiting**: Automatic retry with exponential backoff
**Low Confidence**: Manual review queue for user validation
**Processing Errors**: Detailed error logging with suggested fixes

### Performance Optimization
**Parallel Processing**: Multiple documents processed simultaneously
**Caching**: Frequently used vendor data cached for speed
**Batch Operations**: Bulk document processing for cloud storage sync
**Mobile Optimization**: Optimized processing for smartphone photos

---

**Next Steps**: Once configured, test with sample Portuguese invoices to verify extraction accuracy. The system learns from corrections to improve future processing.

### GPT-4o-Mini Integration
Used as intelligent fallback when Gemini is unavailable:
- **Cost Effective**: Lower cost per token for backup processing
- **Reliable Processing**: Consistent results for standard invoices
- **Portuguese Support**: Trained on Portuguese business documents

## Supabase AI Integration

### Database Configuration
The system stores AI processing results in Supabase:

```sql
-- Documents table with AI processing metadata
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by INTEGER NOT NULL,
  extracted_data JSONB,
  processing_status TEXT DEFAULT 'pending',
  processing_error TEXT,
  confidence TEXT,
  processing_method TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Real-time Processing Updates
Supabase channels provide live processing status:

```javascript
// Subscribe to processing updates
const subscription = supabase
  .channel('document-processing')
  .on('postgres_changes', 
    { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'documents' 
    },
    (payload) => {
      // Handle real-time processing updates
      updateProcessingStatus(payload.new);
    }
  )
  .subscribe();
```

## Processing Architecture

### Intelligent Model Selection
1. **Primary**: Google Gemini-2.5-Flash processes document
2. **Fallback**: OpenAI GPT-4o-Mini if Gemini fails
3. **Consensus**: Compare results when both models available
4. **Confidence Scoring**: ML-based confidence metrics

### Processing Flow
```
Document Upload (Supabase Storage)
    ↓
Gemini-2.5-Flash Processing
    ↓ (if fails)
OpenAI GPT-4o-Mini Fallback
    ↓
Confidence Analysis
    ↓
Real-time Status Update (Supabase)
    ↓
Final Results Storage
```

### Supported Document Types
- **PDF Documents**: Multi-page invoice processing
- **Images**: JPG, PNG with vision capabilities
- **Receipts**: Mobile-optimized scanning
- **Invoices**: Portuguese VAT compliant extraction

## Configuration Verification

### Environment Variables
Complete configuration for production:

```bash
# Supabase Configuration (Required)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_supabase_database_url

# AI Processing (Google recommended, OpenAI optional)
GOOGLE_AI_API_KEY=your-google-ai-key
OPENAI_API_KEY=sk-your-openai-key

# Session Management
SESSION_SECRET=strong_random_session_secret
NODE_ENV=production
```

### Test Endpoints
Verify your AI setup:

```bash
# Check AI system status
GET /api/cloud-processor-status

# Test extraction with sample document
POST /api/test-cloud-extraction

# Upload and process document
POST /api/documents/upload

# Webhook for external systems (n8n integration)
POST /api/extract
```

## Portuguese Invoice Extraction

### Extracted Fields
The system extracts Portuguese-specific invoice data:

```json
{
  "invoiceNumber": "FT 2024/001",
  "vendor": "Empresa Exemplo, Lda - NIF: 123456789",
  "invoiceDate": "2024-06-14",
  "netAmount": 100.00,
  "vatAmount": 23.00,
  "total": 123.00,
  "vatRate": 23,
  "issuedTo": "Cliente Final - NIF: 987654321",
  "documentType": "invoice",
  "confidence": 0.95
}
```

### VAT Rate Validation
Automatic validation of Portuguese VAT rates:
- **6%**: Essential goods and services
- **13%**: Reduced rate items
- **23%**: Standard rate (mainland Portugal)

## Performance Optimization

### Model Selection Strategy
- **Gemini-2.5-Flash**: Primary for vision and accuracy
- **GPT-4o-Mini**: Cost-effective fallback
- **Batch Processing**: Multiple documents in single request
- **Caching**: Supabase for processed results

### Cost Management
```javascript
// Usage tracking in Supabase
const trackUsage = {
  model_used: 'gemini-2.5-flash',
  tokens_consumed: 1250,
  processing_time: 2.3,
  cost_estimate: 0.005,
  confidence_score: 0.94
};
```

## Security & Privacy

### Data Protection
- **Row-Level Security**: Tenant-based data isolation in Supabase
- **API Key Security**: Environment variables only
- **Processing Logs**: Audit trail in Supabase
- **GDPR Compliance**: Data retention policies

### Error Handling
Comprehensive error management:
- **Exponential Backoff**: Automatic retry with delays
- **Model Fallback**: Switch between AI providers
- **Graceful Degradation**: Basic extraction if AI fails
- **Real-time Alerts**: Supabase functions for notifications

## Troubleshooting

### Common Issues

**Google AI API Errors**
- Verify API key in Google AI Studio
- Check quota limits and billing
- Confirm model availability in your region

**OpenAI Fallback Issues**
- Validate API key in OpenAI dashboard
- Check account credits and rate limits
- Verify GPT-4o-Mini model access

**Supabase Connection Problems**
- Confirm SUPABASE_URL and ANON_KEY
- Check database connection string
- Verify row-level security policies

### Debugging Tools
```bash
# Check environment configuration
npm run check

# Test database connection
npm run db:push

# View processing logs
# (Available in Supabase dashboard)
```

### Performance Monitoring
Monitor AI processing through Supabase:
- Processing success rates
- Average confidence scores
- Model usage distribution
- Error frequency and types

---

**Cloud AI Setup Guide Version**: 2.3  
**Last Updated**: June 23, 2025  
**AI Architecture**: Google Gemini-2.5-Flash-Preview + OpenAI GPT-4o-Mini  
**Status**: Production Ready with Enhanced Validation