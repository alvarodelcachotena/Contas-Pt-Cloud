# API Reference - Contas-PT

*Last updated: July 10, 2025*

**Recent Update:** Added webhook credentials API endpoints for integrated admin panel management. All webhook configuration now accessible through unified admin interface.

Complete API documentation for the Portuguese Accounting AI System built with Next.js 15.3.4, Supabase integration, and cloud-based AI processing.

**Recent Updates:** Fixed database schema field mismatches and webhook cursor logic. System now successfully processes multiple documents from Dropbox integration with AI extraction creating expense records automatically.

## Base Configuration

```bash
Development: http://localhost:5000
Production: https://your-domain.com
Framework: Next.js 15.3.4 API Routes
Database: Supabase PostgreSQL with Drizzle ORM
AI Processing: Google Gemini-2.5-Flash-Preview + OpenAI GPT-4o-Mini
Authentication: Multi-tenant with role-based access control
```

## Authentication

Session-based authentication with Supabase integration and PostgreSQL session store.

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "isActive": true
  },
  "tenant": {
    "id": 1,
    "name": "Empresa Teste",
    "slug": "empresa-teste",
    "role": "admin"
  },
  "sessionId": "session_id_string"
}
```

### Authentication Status
Check current authentication status and tenant context.

```http
GET /api/auth/status
```

**Response:**
```json
{
  "isAuthenticated": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name"
  },
  "tenant": {
    "id": 1,
    "name": "Empresa Teste",
    "slug": "empresa-teste",
    "role": "admin"
  }
}
```

## Document Processing

### Upload and Process Document

Upload documents for AI-powered extraction optimized for Portuguese invoices and receipts.

**Processing Pipeline:**
- Primary: Google Gemini-2.5-Flash-Preview for enhanced accuracy
- Fallback: OpenAI GPT-4o-Mini for validation and backup processing
- Multi-model consensus for maximum reliability
- Real-time status updates via WebSocket integration

```http
POST /api/upload
Content-Type: multipart/form-data

file: [PDF, JPG, PNG file - max 10MB]
```

**Real Example Response:**
```json
{
  "success": true,
  "document": {
    "id": 58,
    "filename": "FT002924.pdf",
    "processingStatus": "completed",
    "extractedData": {
      "vendor": "SINFOTECH.IT S.R.L.",
      "nif": "IT12345678901",
      "total": 29.69,
      "netAmount": 29.69,
      "vatAmount": 0,
      "vatRate": 0,
      "invoiceNumber": "1/2924",
      "invoiceDate": "2025-05-19",
      "description": "NFC Stickers NTAG424 DNA, 22mm",
      "category": "outras_despesas"
    },
    "confidence": 0.95,
    "processingMethod": "gemini-2.5-flash",
    "createdAt": "2025-06-14T13:46:21.123Z"
  },
  "autoCreatedExpense": {
    "id": 905,
    "vendor": "SINFOTECH.IT S.R.L.",
    "amount": 29.69,
    "category": "outras_despesas",
    "description": "NFC Stickers NTAG424 DNA, 22mm"
  }
}
```

### List Documents

Get all processed documents with extraction data and status.

```http
GET /api/documents
```

**Response:**
```json
[
  {
    "id": 58,
    "filename": "FT002924.pdf",
    "originalFilename": "FT002924.pdf",
    "mimeType": "application/pdf",
    "fileSize": 149724,
    "processingStatus": "completed",
    "confidence": 0.95,
    "extractedData": {
      "vendor": "SINFOTECH.IT S.R.L.",
      "total": 29.69,
      "nif": "IT12345678901"
    },
    "createdAt": "2025-06-14T13:46:21.123Z"
  }
]
```

### Delete Document

Remove document and all related records (expenses, etc.).

```http
DELETE /api/documents/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully",
  "deletedRecords": ["document", "expense_905"]
}
```

### AI Processing Webhook

External webhook endpoint for document processing (used by n8n, Zapier, etc.).

```http
POST /api/extract
Content-Type: multipart/form-data

file: [Document file]
vendor: [Optional vendor hint]
```

## Financial Management

### Dashboard Metrics

Get financial overview and key performance indicators.

```http
GET /api/dashboard/metrics
```

**Response:**
```json
{
  "monthlyRevenue": "0.00",
  "monthlyExpenses": "29.69",
  "pendingInvoices": 0,
  "totalClients": 0,
  "processedDocuments": 1,
  "recentDocuments": [
    {
      "id": 58,
      "filename": "FT002924.pdf",
      "status": "completed",
      "vendor": "SINFOTECH.IT S.R.L."
    }
  ]
}
```

### Invoices

Create and manage Portuguese-compliant invoices.

```http
POST /api/invoices
Content-Type: application/json

{
  "clientId": 1,
  "number": "FT 2025/001",
  "issueDate": "2025-06-14",
  "items": [
    {
      "description": "Consultoria Tecnológica",
      "quantity": 1,
      "unitPrice": 850.00,
      "vatRate": 23
    }
  ]
}
```

```http
GET /api/invoices
```

### Expenses

Track business expenses with automatic categorization.

```http
POST /api/expenses
Content-Type: application/json

{
  "vendor": "Restaurante O Bacalhau",
  "amount": 45.60,
  "category": "refeicoes_e_alojamento",
  "description": "Almoço de negócios",
  "expenseDate": "2025-06-14",
  "vatRate": 23,
  "isDeductible": true
}
```

```http
GET /api/expenses
```

### Clients

Manage customer database with Portuguese NIF validation.

```http
POST /api/clients
Content-Type: application/json

{
  "name": "Empresa Cliente, Lda",
  "taxId": "123456789",
  "email": "cliente@empresa.pt",
  "address": "Rua Principal 123\n1000-100 Lisboa",
  "phone": "+351 21 123 4567"
}
```

```http
GET /api/clients
```

## Portuguese Tax Compliance

### VAT Rates

Get current Portuguese VAT rates and classifications.

```http
GET /api/vat-rates
```

**Response:**
```json
[
  {
    "rate": 23,
    "type": "standard",
    "description": "Taxa normal",
    "region": "PT"
  },
  {
    "rate": 13,
    "type": "reduced",
    "description": "Taxa reduzida",
    "region": "PT"
  },
  {
    "rate": 6,
    "type": "super_reduced",
    "description": "Taxa reduzida especial",
    "region": "PT"
  }
]
```

### SAF-T Export

Generate Standard Audit File for Portuguese tax authorities.

```http
POST /api/saft-exports
Content-Type: application/json

{
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "companyTaxId": "123456789"
}
```

```http
GET /api/saft-exports
```

## Webhook Integration

### Webhook Credentials Management
**Accessible through Admin Panel > Configurações tab**

Manage per-tenant encrypted webhook credentials for multi-service integration.

```http
GET /api/webhooks/credentials?service=whatsapp
Authorization: Bearer <session_token>
```

**Response:**
```json
{
  "whatsapp": [
    {
      "name": "access_token",
      "value": "EAAG************",
      "created_at": "2025-07-10T10:30:00Z",
      "updated_at": "2025-07-10T10:30:00Z"
    },
    {
      "name": "phone_number_id",
      "value": "123456789012345",
      "created_at": "2025-07-10T10:30:00Z"
    }
  ]
}
```

```http
POST /api/webhooks/credentials
Content-Type: application/json
Authorization: Bearer <session_token>

{
  "service": "whatsapp",
  "credentials": [
    {
      "name": "access_token",
      "value": "EAAG************"
    },
    {
      "name": "phone_number_id", 
      "value": "123456789012345"
    }
  ]
}
```

```http
DELETE /api/webhooks/credentials
Content-Type: application/json
Authorization: Bearer <session_token>

{
  "service": "whatsapp",
  "credential_name": "access_token"
}
```

### WhatsApp Webhook
Process incoming WhatsApp Business API messages with documents.

```http
POST /api/webhooks/whatsapp
Content-Type: application/json

{
  "entry": [
    {
      "id": "123456789",
      "changes": [
        {
          "value": {
            "messages": [
              {
                "id": "message_id",
                "type": "image",
                "image": {
                  "id": "media_id"
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

### Gmail Webhook
Process Gmail IMAP integration for email attachments.

```http
POST /api/webhooks/gmail
Content-Type: application/json

{
  "tenant_id": 1,
  "action": "check_attachments"
}
```

## Cloud Storage Integration

### Cloud Drive Configurations

Manage Google Drive and Dropbox integrations.

```http
GET /api/cloud-drives
```

```http
POST /api/cloud-drives
Content-Type: application/json

{
  "provider": "google_drive",
  "folderPath": "/Contabilidade/Faturas",
  "autoSync": true,
  "processingMode": "automatic"
}
```

### Authentication Flow

OAuth2 authentication for cloud storage providers.

```http
GET /api/cloud-drives/auth/google?redirect_uri=http://localhost:5000/callback
```

```http
GET /api/cloud-drives/auth/dropbox?redirect_uri=http://localhost:5000/callback
```

## Banking Integration

### Bank Accounts

Manage business bank accounts and transactions.

```http
POST /api/bank-accounts
Content-Type: application/json

{
  "bankName": "Banco Português",
  "accountNumber": "12345678901234567890",
  "iban": "PT50123456789012345678901",
  "currency": "EUR"
}
```

```http
GET /api/bank-accounts
```

### Bank Transactions

Import and categorize bank transactions.

```http
POST /api/bank-transactions
Content-Type: application/json

{
  "accountId": 1,
  "description": "TRANSF Pagamento FT001",
  "amount": 1045.50,
  "transactionDate": "2025-06-14",
  "type": "credit"
}
```

```http
GET /api/bank-transactions
```

## AI Assistant

### Chat Messages

Interact with AI assistant for accounting questions.

```http
POST /api/ai-chat
Content-Type: application/json

{
  "message": "Quanto gastei em despesas de escritório este mês?",
  "context": "expenses_analysis"
}
```

**Response:**
```json
{
  "response": "Este mês gastou €234.56 em despesas de escritório, incluindo material informático (€180.00) e material de escritório (€54.56).",
  "confidence": 0.92,
  "sources": ["expenses_table", "categories_analysis"]
}
```

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "NIF inválido: deve ter 9 dígitos",
  "details": {
    "field": "taxId",
    "code": "INVALID_NIF_FORMAT"
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created successfully
- `400` - Bad request (validation error)
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `404` - Resource not found
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable entity (business logic error)
- `500` - Internal server error

## Rate Limiting

- **Document Processing**: 10 uploads per minute per user
- **AI Chat**: 30 messages per minute per user
- **API Calls**: 1000 requests per hour per tenant
- **Cloud Sync**: 100 files per sync operation

## WebSocket Events

Real-time updates for document processing and system status.

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:5000/ws');

// Listen for processing updates
ws.on('message', (data) => {
  const event = JSON.parse(data);
  
  if (event.type === 'document_processing') {
    console.log(`Document ${event.documentId}: ${event.status}`);
  }
});
```

**Event Types:**
- `document_processing` - Document AI processing status
- `expense_created` - New expense automatically created
- `cloud_sync_status` - Cloud storage synchronization updates
- `system_status` - AI system availability changes

---

**Authentication**: All endpoints require valid session except `/api/auth/*`
**Tenant Isolation**: All data automatically filtered by user's tenant
**Portuguese Localization**: All dates, currencies, and formats follow Portuguese standards

Get all processed documents for the tenant.

```http
GET /api/documents
```

**Response:**
```json
{
  "documents": [
    {
      "id": 123,
      "filename": "invoice.pdf",
      "originalFilename": "Invoice_Company_ABC.pdf",
      "mimeType": "application/pdf",
      "fileSize": 1024000,
      "processingStatus": "completed",
      "extractedData": { ... },
      "confidence": "0.95",
      "createdAt": "2024-06-14T10:30:00Z"
    }
  ]
}
```

### Get Document Details

Retrieve specific document with full extraction data.

```http
GET /api/documents/:id
```

## AI Processing

### Webhook Extraction

External webhook endpoint for n8n and other automation systems.

```http
POST /api/extract
Content-Type: multipart/form-data

file: [Document file]
```

**Response:**
```json
{
  "success": true,
  "extractedData": {
    "invoiceNumber": "FT 2024/001",
    "vendor": "Empresa Exemplo, Lda - NIF: 123456789",
    "invoiceDate": "2024-06-14",
    "netAmount": 100.00,
    "vatAmount": 23.00,
    "total": 123.00,
    "vatRate": 23,
    "issuedTo": "Cliente Final - NIF: 987654321",
    "nif": "123456789",
    "clientNif": "987654321",
    "documentType": "invoice"
  },
  "confidence": 0.95,
  "processingMethod": "gemini-2.5-flash",
  "processingTime": 2.3
}
```

### Test Cloud Extraction

Test AI processing capabilities with sample documents.

```http
POST /api/test-cloud-extraction
Content-Type: application/json

{
  "text": "Sample invoice text in Portuguese",
  "filename": "test-invoice.pdf"
}
```

### Cloud Processor Status

Check AI system availability and configuration.

```http
GET /api/cloud-processor-status
```

**Response:**
```json
{
  "status": "available",
  "models": {
    "primary": "gemini-2.5-flash",
    "fallback": "gpt-4o-mini",
    "available": ["gemini", "openai"]
  },
  "features": {
    "visionProcessing": true,
    "pdfSupport": true,
    "realTimeUpdates": true
  }
}
```

## Financial Data

### Invoices

#### List Invoices
```http
GET /api/invoices
```

#### Create Invoice
```http
POST /api/invoices
Content-Type: application/json

{
  "clientId": 1,
  "invoiceNumber": "FT 2024/001",
  "issueDate": "2024-06-14",
  "dueDate": "2024-07-14",
  "netAmount": "100.00",
  "vatAmount": "23.00",
  "totalAmount": "123.00",
  "vatRate": "23.00",
  "status": "pending"
}
```

#### Get Invoice
```http
GET /api/invoices/:id
```

#### Update Invoice
```http
PUT /api/invoices/:id
```

### Expenses

#### List Expenses
```http
GET /api/expenses
```

#### Create Expense
```http
POST /api/expenses
Content-Type: application/json

{
  "vendor": "Fornecedor Exemplo",
  "amount": "50.00",
  "category": "office_supplies",
  "expenseDate": "2024-06-14",
  "vatAmount": "11.50",
  "vatRate": "23.00",
  "description": "Material de escritório",
  "receiptNumber": "REC001",
  "isDeductible": true
}
```

### Payments

#### List Payments
```http
GET /api/payments
```

#### Create Payment
```http
POST /api/payments
```

### Bank Accounts

#### List Bank Accounts
```http
GET /api/bank-accounts
```

#### Create Bank Account
```http
POST /api/bank-accounts
Content-Type: application/json

{
  "bankName": "Banco Exemplo",
  "accountNumber": "1234567890",
  "iban": "PT50000000000000000000000",
  "accountType": "checking",
  "balance": "1000.00"
}
```

## Client Management

### List Clients
```http
GET /api/clients
```

### Create Client
```http
POST /api/clients
Content-Type: application/json

{
  "name": "Cliente Exemplo, Lda",
  "taxId": "123456789",
  "address": "Rua Exemplo, 123, Lisboa",
  "phone": "+351 123 456 789",
  "email": "cliente@exemplo.pt"
}
```

### Update Client
```http
PUT /api/clients/:id
```

### Delete Client
```http
DELETE /api/clients/:id
```

## Dashboard & Analytics

### Dashboard Metrics

Get comprehensive financial overview and KPIs.

```http
GET /api/dashboard/metrics
```

**Response:**
```json
{
  "monthlyRevenue": "5000.00",
  "monthlyExpenses": "2000.00",
  "pendingInvoices": 5,
  "overdueInvoices": 2,
  "totalClients": 25,
  "processingStats": {
    "documentsProcessed": 150,
    "averageConfidence": 0.94,
    "processingSuccess": 0.98
  },
  "vatSummary": {
    "vatOwed": "1150.00",
    "vatDeductible": "460.00",
    "netVatPosition": "690.00"
  }
}
```

## Cloud Storage Integration

### Google Drive

#### List Folders
```http
GET /api/google-drive/folders
```

#### Search Documents
```http
GET /api/google-drive/search?folderId=:folderId
```

#### Sync Configuration
```http
POST /api/cloud-drive-configs
Content-Type: application/json

{
  "provider": "google_drive",
  "configName": "Main Drive Sync",
  "folderId": "1A2B3C4D5E6F",
  "syncEnabled": true,
  "autoProcess": true
}
```

### Dropbox

#### List Folders
```http
GET /api/dropbox/folders
```

#### Search Documents
```http
GET /api/dropbox/search?folderPath=/Invoices
```

## AI Chat & Assistance

### List Chat Messages
```http
GET /api/ai-chat/messages
```

### Send Chat Message
```http
POST /api/ai-chat/messages
Content-Type: application/json

{
  "message": "Help me analyze this month's expenses",
  "context": "financial_analysis"
}
```

## VAT & Tax Compliance

### VAT Rates
```http
GET /api/vat-rates?region=mainland
```

**Response:**
```json
{
  "rates": [
    { "rate": 6, "category": "essential_goods", "description": "Essential goods and services" },
    { "rate": 13, "category": "reduced_rate", "description": "Reduced rate items" },
    { "rate": 23, "category": "standard_rate", "description": "Standard rate (mainland)" }
  ]
}
```

### SAFT-PT Export

Generate Portuguese tax authority compliance files.

```http
POST /api/saft-exports
Content-Type: application/json

{
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "exportType": "annual"
}
```

### Monthly Statements

Get organized monthly financial statements.

```http
GET /api/monthly-statements/:year/:month
```

**Response:**
```json
{
  "period": "2024-06",
  "entries": [
    {
      "day": 1,
      "transactions": [
        {
          "type": "invoice",
          "amount": "123.00",
          "description": "Invoice FT 2024/001",
          "vatAmount": "23.00"
        }
      ]
    }
  ],
  "summary": {
    "totalRevenue": "5000.00",
    "totalExpenses": "2000.00",
    "netProfit": "3000.00",
    "vatOwed": "690.00"
  }
}
```

## Manager Approvals

### List Pending Approvals
```http
GET /api/manager-approvals?status=pending
```

### Approve/Reject Items
```http
PUT /api/manager-approvals/:id
Content-Type: application/json

{
  "status": "approved",
  "comments": "Approved for processing"
}
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid NIF number format",
    "details": {
      "field": "taxId",
      "value": "invalid_nif"
    }
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Invalid input data
- `AUTHENTICATION_REQUIRED`: User not authenticated
- `AUTHORIZATION_FAILED`: Insufficient permissions
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `AI_PROCESSING_FAILED`: Document extraction failed
- `RATE_LIMIT_EXCEEDED`: Too many requests

## Rate Limits

- Document processing: 100 requests/hour
- General API: 1000 requests/hour
- AI chat: 50 requests/hour

## Webhook Events

For real-time integration, subscribe to Supabase real-time channels:

```javascript
// Document processing updates
supabase
  .channel('document-processing')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'documents'
  }, handleDocumentUpdate)
  .subscribe();

// New invoices
supabase
  .channel('invoices')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'invoices'
  }, handleNewInvoice)
  .subscribe();
```

## SDK Examples

### Node.js
```javascript
const response = await fetch('/api/documents/upload', {
  method: 'POST',
  body: formData,
  credentials: 'include'
});
const result = await response.json();
```

### Python
```python
import requests

response = requests.post(
    'http://localhost:5000/api/extract',
    files={'file': open('invoice.pdf', 'rb')}
)
data = response.json()
```

### cURL
```bash
curl -X POST http://localhost:5000/api/extract \
  -F "file=@invoice.pdf" \
  -H "Content-Type: multipart/form-data"

---

**API Documentation Version**: 2.3  
**Last Updated**: June 23, 2025  
**System Architecture**: Supabase-Only Cloud with Enhanced Dropbox Integration  
**Status**: Production Ready with Perfected Automated Expense Creation
```