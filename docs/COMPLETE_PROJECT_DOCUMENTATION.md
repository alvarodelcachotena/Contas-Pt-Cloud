# Contas-PT: Complete Project Documentation
*Portuguese AI-Powered Accounting Platform - Version 3.2*  
*Generated: January 30, 2025*

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Database Documentation](#database-documentation)
4. [Frontend Architecture](#frontend-architecture)
5. [Backend Architecture](#backend-architecture)
6. [AI Processing Pipeline](#ai-processing-pipeline)
7. [Cloud Integration](#cloud-integration)
8. [Authentication & Security](#authentication--security)
9. [Portuguese Compliance](#portuguese-compliance)
10. [API Reference](#api-reference)
11. [Environment Configuration](#environment-configuration)
12. [Deployment Guide](#deployment-guide)
13. [Development Workflow](#development-workflow)
14. [Troubleshooting](#troubleshooting)
15. [Contributing](#contributing)

---

## Project Overview

### What is Contas-PT?

Contas-PT is a sophisticated Portuguese accounting platform that revolutionizes financial document management through intelligent processing and comprehensive enterprise solutions. The system delivers advanced multi-tenant support with robust webhook integrations and intelligent document processing capabilities, focusing on seamless document ingestion and automated financial analysis.

Built specifically for Portuguese businesses, it provides complete tax compliance (IVA/VAT), automated document processing with dual AI models, real-time financial analytics, and comprehensive multi-tenant architecture with role-based access control.

### Key Features

- **Advanced AI Document Processing**: Dual AI architecture with Google Gemini-2.5-Flash-Preview + OpenAI GPT-4o-Mini
- **Complete Portuguese Tax Compliance**: Full IVA/VAT support with 6%, 13%, 23% rates, NIF validation, SAF-T export
- **Enterprise Multi-Tenant Architecture**: Complete tenant isolation with Row Level Security and role-based access
- **Comprehensive Integration Ecosystem**: Cloud storage (Google Drive, Dropbox), webhooks, and real-time sync
- **Advanced Financial Analytics**: Real-time dashboard metrics, revenue tracking, expense management
- **Security & Compliance**: AES-256 encryption, audit logging, backup management, session security
- **Admin Panel**: 8 comprehensive management tabs with full system administration
- **Real-Time Processing**: WebSocket-based live updates and processing notifications

### Technology Stack

#### Frontend
- **Framework**: Next.js 15.3.4 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state
- **Forms**: React Hook Form with Zod validation
- **Real-time**: WebSocket client integration

#### Backend
- **Framework**: Next.js API Routes (App Router)
- **Language**: TypeScript with ES modules
- **Database**: Supabase PostgreSQL
- **ORM**: Drizzle with Supabase client
- **Authentication**: Session-based with localStorage persistence
- **Background Services**: Node-cron schedulers
- **File Processing**: Next.js FormData handling

#### AI & Cloud Services
- **Primary AI**: Google Gemini-2.5-Flash-Preview
- **Secondary AI**: OpenAI GPT-4o-Mini
- **Database**: Supabase PostgreSQL (exclusive)
- **Cloud Storage**: Dropbox API v2, Google Drive API v3
- **Real-time**: WebSocket server integration

---

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Next.js)     │    │   (API Routes)  │    │   Services      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • React Pages   │◄──►│ • Auth Routes   │◄──►│ • Supabase DB   │
│ • UI Components │    │ • API Endpoints │    │ • Google AI     │
│ • State Mgmt    │    │ • File Upload   │    │ • OpenAI        │
│ • WebSocket     │    │ • WebSocket     │    │ • Dropbox API   │
│ • Forms         │    │ • Schedulers    │    │ • Google Drive  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow

```
User Upload → Next.js API → AI Processing → Database → UI Update
     ↓              ↓            ↓           ↓         ↓
Cloud Sync → Webhook → Document Extract → Expense → WebSocket
```

### Component Architecture

- **Presentation Layer**: React components with shadcn/ui
- **Business Logic**: Next.js API routes with TypeScript
- **Data Layer**: Supabase PostgreSQL with Drizzle ORM
- **External Services**: Cloud AI and storage integrations
- **Real-time Layer**: WebSocket server for live updates

---

## Database Documentation

### Database Schema Overview

The system uses Supabase PostgreSQL as the exclusive database solution with the following core tables:

#### Core Tables

**1. tenants** - Company/Organization Management
```sql
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    nif VARCHAR(20),                    -- Portuguese tax ID
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**2. users** - User Management
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',    -- super_admin, admin, accountant, user
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**3. user_tenants** - Many-to-Many User-Company Relationships
```sql
CREATE TABLE user_tenants (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);
```

#### Business Tables

**4. clients** - Customer Management
```sql
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    nif VARCHAR(20),                    -- Portuguese tax ID
    address TEXT,
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
```

**5. invoices** - Invoice Management
```sql
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id),
    number VARCHAR(100) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE,
    amount DECIMAL(10,2) NOT NULL,
    vat_amount DECIMAL(10,2) DEFAULT 0,
    vat_rate DECIMAL(5,2) DEFAULT 23,   -- Portuguese VAT rates: 6%, 13%, 23%
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**6. expenses** - Expense Management
```sql
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vendor VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    vat_amount DECIMAL(10,2),
    vat_rate DECIMAL(5,2),
    category VARCHAR(100) NOT NULL,
    description TEXT,
    receipt_number VARCHAR(100),
    expense_date DATE NOT NULL,
    is_deductible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Document Management

**7. documents** - Document Storage
```sql
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size INTEGER,
    mime_type VARCHAR(100),
    processing_status VARCHAR(50) DEFAULT 'pending',
    confidence_score DECIMAL(3,2),
    extracted_data JSONB,
    processing_method VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Cloud Integration

**8. cloud_drive_configs** - Cloud Storage Configuration
```sql
CREATE TABLE cloud_drive_configs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,      -- 'dropbox', 'google_drive'
    folder_path VARCHAR(500) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, provider)
);
```

#### Banking

**9. bank_accounts** - Bank Account Management
```sql
CREATE TABLE bank_accounts (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255),
    iban VARCHAR(34),                   -- Portuguese IBAN format
    account_number VARCHAR(50),
    balance DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**10. payments** - Payment Tracking
```sql
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bank_account_id INTEGER REFERENCES bank_accounts(id),
    invoice_id INTEGER REFERENCES invoices(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    description TEXT,
    reference VARCHAR(100),
    type VARCHAR(50) DEFAULT 'income',  -- 'income', 'expense'
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Database Relationships

```
tenants (1) ←→ (M) user_tenants (M) ←→ (1) users
tenants (1) ←→ (M) clients
tenants (1) ←→ (M) invoices
tenants (1) ←→ (M) expenses
tenants (1) ←→ (M) documents
tenants (1) ←→ (M) cloud_drive_configs
tenants (1) ←→ (M) bank_accounts
tenants (1) ←→ (M) payments

clients (1) ←→ (M) invoices
bank_accounts (1) ←→ (M) payments
invoices (1) ←→ (M) payments
```

### Database Constraints

- **Foreign Keys**: All tenant-scoped tables reference tenants(id) with CASCADE DELETE
- **Unique Constraints**: 
  - user_tenants(user_id, tenant_id)
  - cloud_drive_configs(tenant_id, provider)
  - users(email)
- **Check Constraints**: VAT rates must be valid Portuguese rates (6, 13, or 23)

### Initial Data

```sql
-- Default company
INSERT INTO tenants (name, nif, address) 
VALUES ('DIAMOND NXT TRADING, LDA', '517124548', 'Vila Nova de Gaia, Portugal');

-- Default admin user
INSERT INTO users (email, password_hash, name, role) 
VALUES ('admin@contas-pt.com', '$2b$10$...', 'Admin User', 'super_admin');

-- Link user to company
INSERT INTO user_tenants (user_id, tenant_id, role) 
VALUES (1, 1, 'admin');
```

---

## Frontend Architecture

### Component Structure

```
app/
├── layout.tsx                 # Root layout with providers
├── page.tsx                   # Dashboard homepage
├── login/
│   └── page.tsx              # Login page
├── documents/
│   └── page.tsx              # Document management
├── expenses/
│   └── page.tsx              # Expense tracking
├── invoices/
│   └── page.tsx              # Invoice management
├── clients/
│   └── page.tsx              # Client management
├── cloud-drives/
│   └── page.tsx              # Cloud storage settings
├── admin/
│   └── page.tsx              # Admin panel
└── api/                      # API routes (backend)
```

### Key Components

#### Core UI Components

**1. Dashboard Component** (`components/dashboard.tsx`)
- Real-time metrics display
- Financial overview cards
- Recent activity feed
- Quick action buttons

**2. Document Management** (`components/documents-table.tsx`)
- File upload with drag & drop
- AI processing status indicators
- Document preview modal
- Batch operations

**3. Expense Tracking** (`components/expenses-table.tsx`)
- Expense creation forms
- VAT calculation
- Category management
- Export functionality

**4. Invoice Management** (`components/invoices-table.tsx`)
- Invoice generation
- Portuguese VAT compliance
- Client integration
- Payment tracking

#### Authentication Components

**5. Login Form** (`components/login-form.tsx`)
```tsx
export default function LoginForm() {
  const { login } = useAuth()
  // Form validation with Zod
  // Integration with authentication API
}
```

**6. Company Switcher** (`components/company-switcher.tsx`)
```tsx
export default function CompanySwitcher() {
  // Multi-tenant company selection
  // Role-based access control
  // Session management
}
```

#### Cloud Integration Components

**7. Dropbox Integration** (`components/dropbox-folder-selector.tsx`)
- OAuth2 authentication flow
- Folder selection interface
- Real-time sync status
- Token management

### State Management

#### TanStack Query Implementation

```tsx
// hooks/useDocuments.tsx
export function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: () => apiRequest('/api/documents')
  })
}

// hooks/useExpenses.tsx
export function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: () => apiRequest('/api/expenses')
  })
}
```

#### Authentication State

```tsx
// hooks/useAuth.tsx
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  
  // localStorage persistence
  // Session management
  // Auto-login functionality
}
```

### Styling Architecture

#### Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Portuguese brand colors
        primary: "hsl(210, 100%, 50%)",
        secondary: "hsl(25, 100%, 50%)",
      }
    }
  }
}
```

#### Component Library

- **Base**: shadcn/ui components
- **Icons**: Lucide React for actions, React Icons for brands
- **Forms**: React Hook Form with Zod validation
- **Tables**: Custom responsive table components
- **Modals**: Dialog components with proper accessibility

---

## Backend Architecture

### API Route Structure

```
app/api/
├── auth/
│   ├── login/route.ts         # User authentication
│   ├── logout/route.ts        # Session termination
│   ├── status/route.ts        # Auth status check
│   └── dropbox/
│       ├── route.ts           # Dropbox OAuth init
│       └── callback/route.ts  # OAuth callback
├── dashboard/
│   └── metrics/route.ts       # Dashboard data
├── documents/
│   └── route.ts               # Document CRUD
├── expenses/
│   └── route.ts               # Expense CRUD
├── invoices/
│   └── route.ts               # Invoice CRUD
├── clients/
│   └── route.ts               # Client CRUD
├── cloud-integrations/
│   └── route.ts               # Cloud storage config
├── upload/
│   └── route.ts               # File upload handler
├── user/
│   └── companies/route.ts     # User companies
└── webhooks/
    ├── dropbox/route.ts       # Dropbox webhook
    └── save-config/route.ts   # Config webhook
```

### API Implementation Patterns

#### Standard CRUD Route

```typescript
// app/api/expenses/route.ts
export async function GET(request: NextRequest) {
  try {
    loadEnvStrict()
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return NextResponse.json({ expenses: data })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
```

#### File Upload Route

```typescript
// app/api/upload/route.ts
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    // AI processing
    const processor = new CloudDocumentProcessor()
    const result = await processor.processDocument(file, 'upload-web')
    
    // Database storage
    const documentId = await storage.createDocument({
      filename: file.name,
      tenant_id: tenantId,
      processing_status: 'completed',
      extracted_data: result
    })
    
    return NextResponse.json({ success: true, documentId })
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
```

### Authentication Middleware

```typescript
// middleware/auth.ts
export function withAuth(handler: Function) {
  return async (request: NextRequest) => {
    const session = request.headers.get('authorization')
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Validate session and extract user/tenant context
    const context = await validateSession(session)
    request.context = context
    
    return handler(request)
  }
}
```

### Background Services

#### Dropbox Scheduler

```typescript
// lib/background-services.ts
class DropboxSchedulerService {
  private intervalId: NodeJS.Timeout | null = null
  
  start() {
    this.intervalId = setInterval(async () => {
      await this.checkDropboxConfigs()
    }, 5 * 60 * 1000) // Every 5 minutes
  }
  
  private async checkDropboxConfigs() {
    const configs = await this.getAllDropboxConfigs()
    for (const config of configs) {
      await this.processDropboxConfig(config)
    }
  }
}
```

#### WebSocket Service

```typescript
// lib/background-services.ts
class WebSocketService {
  private connections: Map<string, any> = new Map()
  
  broadcast(tenantId: number, message: any) {
    const connection = this.connections.get(tenantId.toString())
    if (connection) {
      connection.send(JSON.stringify(message))
    }
  }
  
  notifyDocumentProcessing(tenantId: number, documentId: number, status: string) {
    this.broadcast(tenantId, {
      type: 'DOCUMENT_PROCESSING',
      documentId,
      status
    })
  }
}
```

---

## AI Processing Pipeline

### Overview

The AI processing pipeline uses a multi-model consensus approach for maximum accuracy in document extraction, specifically optimized for Portuguese business documents.

### AI Models

#### Primary: Google Gemini-2.5-Flash-Preview
- **Use Case**: Primary document processing
- **Strengths**: Multi-modal capabilities, Portuguese language support
- **Configuration**: Vision enabled, structured output
- **Rate Limits**: Managed with exponential backoff

#### Secondary: OpenAI GPT-4o-Mini
- **Use Case**: Fallback processing and validation
- **Strengths**: Reliable text processing, JSON output
- **Configuration**: Temperature 0.1 for consistency
- **Rate Limits**: Managed with queue system

### Processing Workflow

```
Document Upload → Format Detection → AI Processing → Validation → Storage
       ↓               ↓                ↓            ↓         ↓
   PDF/Image → Image/Text Split → Gemini/OpenAI → Field Check → Database
```

### Document Processor Implementation

```typescript
// server/cloud-document-processor.ts
export class CloudDocumentProcessor {
  async processDocument(file: File, method: string): Promise<ExtractionResult> {
    // Step 1: Format detection and preprocessing
    const fileType = this.detectFileType(file)
    const processedContent = await this.preprocessFile(file, fileType)
    
    // Step 2: AI processing with fallback
    let result = await this.processWithGemini(processedContent)
    
    if (!this.isValidResult(result)) {
      result = await this.processWithOpenAI(processedContent)
    }
    
    // Step 3: Portuguese-specific validation
    result = this.validatePortugueseFields(result)
    
    // Step 4: Confidence scoring
    result.confidence = this.calculateConfidence(result)
    
    return result
  }
  
  private async processWithGemini(content: any): Promise<ExtractionResult> {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview" })
    
    const prompt = this.buildPortuguesePrompt()
    const response = await model.generateContent([prompt, content])
    
    return this.parseResponse(response)
  }
  
  private buildPortuguesePrompt(): string {
    return `
    Extract data from this Portuguese business document.
    
    Required fields:
    - VENDOR/ISSUER: Company name and tax ID (NIF)
    - AMOUNTS: Total, VAT amount, VAT rate (6%, 13%, 23%)
    - DATES: Invoice date, due date
    - DESCRIPTION: Service/product description
    - CATEGORY: Portuguese business category
    
    Rules:
    - Only extract real data, no placeholders
    - VAT rates must be valid Portuguese rates
    - Dates in DD/MM/YYYY format
    - Amounts as numbers with 2 decimals
    - Return empty string if data not found
    
    Output as JSON with confidence scores.
    `
  }
}
```

### Portuguese-Specific Processing

#### NIF (Tax ID) Validation

```typescript
function validateNIF(nif: string): boolean {
  // Portuguese NIF validation algorithm
  if (!/^\d{9}$/.test(nif)) return false
  
  const weights = [9, 8, 7, 6, 5, 4, 3, 2]
  const sum = nif.slice(0, 8).split('').reduce((acc, digit, i) => 
    acc + parseInt(digit) * weights[i], 0
  )
  
  const remainder = sum % 11
  const checkDigit = remainder < 2 ? 0 : 11 - remainder
  
  return checkDigit === parseInt(nif[8])
}
```

#### VAT Rate Validation

```typescript
function validateVATRate(rate: number): boolean {
  const validRates = [6, 13, 23] // Portuguese VAT rates
  return validRates.includes(rate)
}
```

#### Category Classification

```typescript
const portugueseCategories = {
  'combustivel': ['gasolina', 'gasóleo', 'combustível'],
  'deslocações': ['viagem', 'hotel', 'transporte'],
  'refeições': ['restaurante', 'almoço', 'jantar'],
  'material': ['material', 'equipamento', 'ferramentas'],
  'serviços': ['consultoria', 'serviços', 'manutenção']
}

function classifyCategory(description: string): string {
  const text = description.toLowerCase()
  
  for (const [category, keywords] of Object.entries(portugueseCategories)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category
    }
  }
  
  return 'outros'
}
```

### Error Handling and Retry Logic

```typescript
async function processWithRetry(processor: Function, maxRetries: number = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await processor()
    } catch (error) {
      if (attempt === maxRetries) throw error
      
      const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}
```

---

## Cloud Integration

### Dropbox Integration

#### OAuth2 Flow

```typescript
// app/api/auth/dropbox/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  
  if (action === 'connect') {
    const authUrl = `https://www.dropbox.com/oauth2/authorize?` +
      `client_id=${process.env.DROPBOX_CLIENT_ID}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `token_access_type=offline`
    
    return NextResponse.redirect(authUrl)
  }
}
```

#### API Client Implementation

```typescript
// server/dropbox-api-client.ts
export class DropboxApiClient {
  private accessToken: string
  private refreshToken?: string
  
  async ensureValidToken(): Promise<void> {
    if (this.isTokenExpired()) {
      await this.refreshAccessToken()
    }
  }
  
  async listFolder(path: string): Promise<DropboxListFolderResult> {
    await this.ensureValidToken()
    
    const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path, recursive: false })
    })
    
    return response.json()
  }
  
  async downloadFile(path: string): Promise<Buffer> {
    await this.ensureValidToken()
    
    const response = await fetch('https://content.dropboxapi.com/2/files/download', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Dropbox-API-Arg': JSON.stringify({ path })
      }
    })
    
    return Buffer.from(await response.arrayBuffer())
  }
}
```

#### Webhook Processing

```typescript
// app/api/webhooks/dropbox/route.ts
export async function POST(request: NextRequest) {
  // Verify webhook signature
  const signature = request.headers.get('x-dropbox-signature')
  const body = await request.text()
  
  if (!this.verifySignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  const notification = JSON.parse(body)
  
  // Process file changes
  for (const account of notification.list_folder.accounts) {
    await this.processAccountChanges(account)
  }
  
  return NextResponse.json({ status: 'processed' })
}
```

### Automated Document Processing

#### Scheduler Implementation

```typescript
// server/dropbox-scheduler.ts
export class DropboxScheduler {
  private isRunning = false
  private cronJob: any = null
  
  start() {
    if (this.isRunning) return
    
    this.cronJob = cron.schedule('*/5 * * * *', async () => {
      await this.checkAllDropboxConfigs()
    })
    
    this.isRunning = true
    console.log('Dropbox scheduler started (every 5 minutes)')
  }
  
  private async checkAllDropboxConfigs() {
    const configs = await this.getAllDropboxConfigs()
    
    for (const config of configs) {
      try {
        await this.processDropboxConfig(config)
      } catch (error) {
        console.error(`Error processing config ${config.id}:`, error)
      }
    }
  }
  
  private async processDropboxConfig(config: CloudDriveConfig) {
    const apiClient = new DropboxApiClient(config.access_token, config.refresh_token)
    
    // Get cursor for delta sync
    const cursor = await this.getFolderCursor(config)
    const changes = await apiClient.listFolderContinue(cursor)
    
    for (const file of changes.entries) {
      if (this.isDocumentFile(file.name)) {
        await this.processDropboxFile(apiClient, file, config)
      }
    }
  }
  
  private async processDropboxFile(apiClient: DropboxApiClient, file: any, config: CloudDriveConfig) {
    // Download file
    const fileBuffer = await apiClient.downloadFile(file.path_display)
    
    // Create document record
    const documentId = await this.createDocumentRecord(file, config.tenant_id)
    
    // Process with AI
    const processor = new CloudDocumentProcessor()
    const extractedData = await processor.processBuffer(fileBuffer, file.name)
    
    // Update document with results
    await this.updateDocumentWithResults(documentId, extractedData)
    
    // Create expense if valid data
    if (this.isValidExpenseData(extractedData)) {
      await this.createExpenseFromExtraction(extractedData, config.tenant_id, documentId)
    }
    
    // Notify via WebSocket
    this.notifyProcessingComplete(config.tenant_id, documentId)
  }
}
```

### Google Drive Integration

#### Setup and Authentication

```typescript
// server/google-drive-folder-explorer.ts
export class GoogleDriveFolderExplorer {
  private oauth2Client: OAuth2Client
  private googleDrive: drive_v3.Drive | null = null
  
  async setupDrive(accessToken: string, refreshToken?: string): Promise<void> {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    })
    
    this.googleDrive = google.drive({ version: 'v3', auth: this.oauth2Client })
  }
  
  async listAllFolders(config: CloudDriveConfig): Promise<any[]> {
    if (!this.googleDrive) throw new Error('Google Drive not initialized')
    
    const response = await this.googleDrive.files.list({
      q: "mimeType='application/vnd.google-apps.folder'",
      fields: 'files(id, name, parents)',
      pageSize: 1000
    })
    
    return response.data.files || []
  }
}
```

---

## Authentication & Security

### Authentication Flow

#### Session-Based Authentication

```typescript
// server/controllers/auth.ts
async function login(req: Request, res: Response) {
  const { email, password } = req.body
  
  // Verify credentials
  const user = await storage.getUserByEmail(email)
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  
  const isValidPassword = await bcrypt.compare(password, user.password_hash)
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  
  // Get user tenants
  const userTenants = await storage.getUserTenants(user.id)
  const selectedTenant = userTenants[0] // Default to first tenant
  
  // Create session
  req.session.userId = user.id
  req.session.tenantId = selectedTenant.tenantId
  req.session.userRole = selectedTenant.role
  
  return res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    },
    tenant: selectedTenant
  })
}
```

#### Frontend Authentication Hook

```typescript
// hooks/useAuth.tsx
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Check for stored authentication
    const stored = localStorage.getItem('auth')
    if (stored) {
      const { user, tenant } = JSON.parse(stored)
      setUser(user)
      setTenant(tenant)
    }
    setIsLoading(false)
  }, [])
  
  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    
    if (!response.ok) throw new Error('Login failed')
    
    const data = await response.json()
    setUser(data.user)
    setTenant(data.tenant)
    
    localStorage.setItem('auth', JSON.stringify({
      user: data.user,
      tenant: data.tenant
    }))
  }
  
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setTenant(null)
    localStorage.removeItem('auth')
    window.location.href = '/login'
  }
  
  return { user, tenant, isLoading, login, logout }
}
```

### Role-Based Access Control

#### Role Definitions

```typescript
type UserRole = 'super_admin' | 'admin' | 'accountant' | 'assistant' | 'viewer'

const permissions = {
  super_admin: ['*'], // All permissions
  admin: [
    'documents:read', 'documents:write', 'documents:delete',
    'expenses:read', 'expenses:write', 'expenses:delete',
    'invoices:read', 'invoices:write', 'invoices:delete',
    'clients:read', 'clients:write', 'clients:delete',
    'users:read', 'users:write',
    'settings:read', 'settings:write'
  ],
  accountant: [
    'documents:read', 'documents:write',
    'expenses:read', 'expenses:write',
    'invoices:read', 'invoices:write',
    'clients:read', 'clients:write'
  ],
  assistant: [
    'documents:read', 'documents:write',
    'expenses:read',
    'clients:read'
  ],
  viewer: [
    'documents:read',
    'expenses:read',
    'invoices:read',
    'clients:read'
  ]
}
```

#### Permission Checking

```typescript
function hasPermission(userRole: UserRole, permission: string): boolean {
  const userPermissions = permissions[userRole]
  
  if (userPermissions.includes('*')) return true
  if (userPermissions.includes(permission)) return true
  
  return false
}

// Middleware for API routes
function requirePermission(permission: string) {
  return (req: any, res: any, next: any) => {
    const userRole = req.session.userRole
    
    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    next()
  }
}
```

### Security Measures

#### Password Security

```typescript
// Password hashing with bcrypt
const saltRounds = 12

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, saltRounds)
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

#### API Security

```typescript
// Rate limiting
const rateLimit = {
  '/api/auth/login': { requests: 5, window: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  '/api/upload': { requests: 10, window: 60 * 1000 }, // 10 uploads per minute
}

// Input validation with Zod
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200
}
```

#### Environment Security

```typescript
// Environment variable validation
function validateEnvironment() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SESSION_SECRET',
    'NEXTAUTH_SECRET'
  ]
  
  for (const env of required) {
    if (!process.env[env]) {
      throw new Error(`Missing required environment variable: ${env}`)
    }
  }
}
```

---

## Portuguese Compliance

### VAT (IVA) Implementation

#### VAT Rates and Rules

Portugal has three standard VAT rates:
- **6%**: Essential goods (food, books, medicines)
- **13%**: Reduced rate (restaurants, tourism, cultural events)
- **23%**: Standard rate (most goods and services)

#### VAT Calculation

```typescript
interface VATCalculation {
  netAmount: number
  vatRate: number
  vatAmount: number
  totalAmount: number
}

function calculateVAT(netAmount: number, vatRate: number): VATCalculation {
  const vatAmount = (netAmount * vatRate) / 100
  const totalAmount = netAmount + vatAmount
  
  return {
    netAmount: Math.round(netAmount * 100) / 100,
    vatRate,
    vatAmount: Math.round(vatAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100
  }
}

function reverseVAT(totalAmount: number, vatRate: number): VATCalculation {
  const netAmount = totalAmount / (1 + vatRate / 100)
  const vatAmount = totalAmount - netAmount
  
  return {
    netAmount: Math.round(netAmount * 100) / 100,
    vatRate,
    vatAmount: Math.round(vatAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100
  }
}
```

### NIF (Tax ID) Validation

#### Portuguese NIF Algorithm

```typescript
export function validatePortugueseNIF(nif: string): boolean {
  // Remove spaces and non-digits
  const cleanNIF = nif.replace(/\D/g, '')
  
  // Must be exactly 9 digits
  if (cleanNIF.length !== 9) return false
  
  // First digit must be valid (1, 2, 3, 5, 6, 8, 9)
  const firstDigit = parseInt(cleanNIF[0])
  if (![1, 2, 3, 5, 6, 8, 9].includes(firstDigit)) return false
  
  // Calculate check digit
  const weights = [9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  
  for (let i = 0; i < 8; i++) {
    sum += parseInt(cleanNIF[i]) * weights[i]
  }
  
  const remainder = sum % 11
  const checkDigit = remainder < 2 ? 0 : 11 - remainder
  
  return checkDigit === parseInt(cleanNIF[8])
}

export function formatNIF(nif: string): string {
  const cleanNIF = nif.replace(/\D/g, '')
  if (cleanNIF.length === 9) {
    return `${cleanNIF.slice(0, 3)} ${cleanNIF.slice(3, 6)} ${cleanNIF.slice(6, 9)}`
  }
  return nif
}
```

### SAF-T (Standard Audit File for Tax) Export

#### SAF-T Structure

```typescript
interface SAFTData {
  header: SAFTHeader
  masterFiles: SAFTMasterFiles
  generalLedgerEntries: SAFTGeneralLedger
  sourceDocuments: SAFTSourceDocuments
}

interface SAFTHeader {
  auditFileVersion: string // "1.04_01"
  companyID: string // Portuguese NIF
  taxRegistrationNumber: string
  taxAccountingBasis: string // "F" for Facturação
  companyName: string
  businessName: string
  companyAddress: SAFTAddress
  fiscalYear: string // "2025"
  startDate: string // "2025-01-01"
  endDate: string // "2025-12-31"
  currencyCode: string // "EUR"
  dateCreated: string // Current date
  taxEntity: string // "Global"
  productCompanyTaxID: string
  softwareCertificateNumber: string
  productID: string
  productVersion: string
}
```

#### SAF-T Generation

```typescript
export class SAFTGenerator {
  async generateSAFT(tenantId: number, fiscalYear: string): Promise<string> {
    const tenant = await this.getTenant(tenantId)
    const invoices = await this.getInvoices(tenantId, fiscalYear)
    const expenses = await this.getExpenses(tenantId, fiscalYear)
    const clients = await this.getClients(tenantId)
    
    const saftData: SAFTData = {
      header: this.buildHeader(tenant, fiscalYear),
      masterFiles: this.buildMasterFiles(clients),
      generalLedgerEntries: this.buildGeneralLedger(invoices, expenses),
      sourceDocuments: this.buildSourceDocuments(invoices)
    }
    
    return this.generateXML(saftData)
  }
  
  private buildHeader(tenant: any, fiscalYear: string): SAFTHeader {
    return {
      auditFileVersion: "1.04_01",
      companyID: tenant.nif,
      taxRegistrationNumber: tenant.nif,
      taxAccountingBasis: "F",
      companyName: tenant.name,
      businessName: tenant.name,
      companyAddress: this.parseAddress(tenant.address),
      fiscalYear: fiscalYear,
      startDate: `${fiscalYear}-01-01`,
      endDate: `${fiscalYear}-12-31`,
      currencyCode: "EUR",
      dateCreated: new Date().toISOString().split('T')[0],
      taxEntity: "Global",
      productCompanyTaxID: "999999990",
      softwareCertificateNumber: "0",
      productID: "Contas-PT",
      productVersion: "3.0"
    }
  }
  
  private generateXML(data: SAFTData): string {
    // Generate XML according to Portuguese SAF-T schema
    return `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:PT_1.04_01">
  ${this.buildHeaderXML(data.header)}
  ${this.buildMasterFilesXML(data.masterFiles)}
  ${this.buildGeneralLedgerXML(data.generalLedgerEntries)}
  ${this.buildSourceDocumentsXML(data.sourceDocuments)}
</AuditFile>`
  }
}
```

### Portuguese Business Categories

```typescript
export const portugueseBusinessCategories = {
  'combustíveis': {
    code: '26.06.01',
    description: 'Combustíveis e lubrificantes',
    vatDeductible: true,
    limitPercentage: 100
  },
  'viaturas': {
    code: '26.06.02', 
    description: 'Viaturas ligeiras de passageiros ou mistas',
    vatDeductible: true,
    limitPercentage: 50
  },
  'refeições': {
    code: '26.02.01',
    description: 'Encargos com refeições',
    vatDeductible: true,
    limitPercentage: 100
  },
  'representação': {
    code: '26.02.02',
    description: 'Encargos de representação',
    vatDeductible: true,
    limitPercentage: 50
  },
  'comunicações': {
    code: '26.03.01',
    description: 'Telefones, fax e internet',
    vatDeductible: true,
    limitPercentage: 100
  },
  'material_escritório': {
    code: '26.04.01',
    description: 'Material de escritório',
    vatDeductible: true,
    limitPercentage: 100
  },
  'consultoria': {
    code: '26.08.01',
    description: 'Honorários e consultoria',
    vatDeductible: true,
    limitPercentage: 100
  }
}
```

---

## API Reference

### Authentication Endpoints

#### POST /api/auth/login
Authenticate user and create session.

**Request:**
```json
{
  "email": "admin@contas-pt.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "admin@contas-pt.com",
    "name": "Admin User"
  },
  "tenant": {
    "tenantId": 1,
    "tenantName": "DIAMOND NXT TRADING, LDA",
    "role": "admin"
  }
}
```

#### POST /api/auth/logout
Terminate user session.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /api/auth/status
Check authentication status.

**Response:**
```json
{
  "authenticated": true,
  "user": { /* user object */ },
  "tenant": { /* tenant object */ }
}
```

### Document Management

#### GET /api/documents
List documents for authenticated tenant.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Filter by processing status

**Response:**
```json
{
  "documents": [
    {
      "id": 1,
      "filename": "invoice_2025_001.pdf",
      "processing_status": "completed",
      "confidence_score": 0.95,
      "extracted_data": { /* extracted fields */ },
      "created_at": "2025-07-02T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

#### POST /api/upload
Upload and process document.

**Request:** Multipart form data with `file` field

**Response:**
```json
{
  "success": true,
  "documentId": 1,
  "processing_status": "processing",
  "message": "Document uploaded successfully"
}
```

#### DELETE /api/documents/:id
Delete document and related data.

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

### Expense Management

#### GET /api/expenses
List expenses for authenticated tenant.

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page  
- `category`: Filter by category
- `start_date`: Filter from date (YYYY-MM-DD)
- `end_date`: Filter to date (YYYY-MM-DD)

**Response:**
```json
{
  "expenses": [
    {
      "id": 1,
      "vendor": "Pingo Doce",
      "amount": 25.50,
      "vat_amount": 5.87,
      "vat_rate": 23,
      "category": "refeições",
      "description": "Almoço de negócios",
      "expense_date": "2025-07-02",
      "is_deductible": true,
      "created_at": "2025-07-02T10:00:00Z"
    }
  ],
  "total": 1,
  "summary": {
    "total_amount": 25.50,
    "total_vat": 5.87,
    "deductible_amount": 25.50
  }
}
```

#### POST /api/expenses
Create new expense.

**Request:**
```json
{
  "vendor": "Pingo Doce",
  "amount": 25.50,
  "vat_rate": 23,
  "category": "refeições",
  "description": "Almoço de negócios",
  "expense_date": "2025-07-02",
  "receipt_number": "RC001"
}
```

**Response:**
```json
{
  "success": true,
  "expense": { /* created expense object */ }
}
```

### Invoice Management

#### GET /api/invoices
List invoices for authenticated tenant.

**Response:**
```json
{
  "invoices": [
    {
      "id": 1,
      "number": "FAT/2025/001",
      "client_name": "Cliente ABC",
      "issue_date": "2025-07-02",
      "due_date": "2025-08-01",
      "amount": 100.00,
      "vat_amount": 23.00,
      "vat_rate": 23,
      "total_amount": 123.00,
      "status": "pending"
    }
  ]
}
```

#### POST /api/invoices
Create new invoice.

**Request:**
```json
{
  "client_id": 1,
  "number": "FAT/2025/001",
  "issue_date": "2025-07-02",
  "due_date": "2025-08-01",
  "amount": 100.00,
  "vat_rate": 23,
  "description": "Serviços de consultoria"
}
```

### Client Management

#### GET /api/clients
List clients for authenticated tenant.

**Response:**
```json
{
  "clients": [
    {
      "id": 1,
      "name": "Cliente ABC, Lda",
      "email": "cliente@abc.pt",
      "nif": "123456789",
      "address": "Rua ABC, 123, Lisboa",
      "phone": "+351 912 345 678"
    }
  ]
}
```

#### POST /api/clients
Create new client.

**Request:**
```json
{
  "name": "Cliente ABC, Lda",
  "email": "cliente@abc.pt", 
  "nif": "123456789",
  "address": "Rua ABC, 123, Lisboa",
  "phone": "+351 912 345 678"
}
```

### Cloud Integration

#### GET /api/cloud-integrations
List cloud storage integrations.

**Response:**
```json
{
  "integrations": [
    {
      "id": "1",
      "provider": "dropbox",
      "status": "connected",
      "folder_path": "/input",
      "last_sync_at": "2025-07-02T10:00:00Z"
    }
  ]
}
```

#### POST /api/cloud-integrations
Save cloud storage configuration.

**Request:**
```json
{
  "provider": "dropbox",
  "access_token": "...",
  "refresh_token": "...",
  "folder_path": "/input"
}
```

### Dashboard Data

#### GET /api/dashboard/metrics
Get dashboard metrics for authenticated tenant.

**Response:**
```json
{
  "totalInvoices": 15,
  "totalExpenses": 45,
  "totalDocuments": 60,
  "totalClients": 8,
  "totalRevenue": 15250.00,
  "totalExpenseAmount": 3420.50,
  "netProfit": 11829.50,
  "vatSummary": {
    "vat_6": 125.30,
    "vat_13": 245.80,
    "vat_23": 2105.45
  }
}
```

### Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": { /* additional error details */ }
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (validation error)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## Environment Configuration

### Required Environment Variables

#### Database Configuration
```bash
# Supabase Database (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

#### Session Management
```bash
# Session Secret (Required)
SESSION_SECRET=your-32-character-secret-key
NEXTAUTH_SECRET=your-nextauth-secret-key
```

#### AI Services (Optional but Recommended)
```bash
# Google AI API
GOOGLE_AI_API_KEY=your-google-ai-api-key

# OpenAI API
OPENAI_API_KEY=your-openai-api-key
```

#### Cloud Storage Integration (Optional)
```bash
# Dropbox Integration
DROPBOX_CLIENT_ID=your-dropbox-client-id
DROPBOX_CLIENT_SECRET=your-dropbox-client-secret

# Google Drive Integration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### Application Configuration
```bash
# Environment
NODE_ENV=development # or production
PORT=5000

# URLs
NEXT_PUBLIC_BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5000
```

### Environment Setup Guide

#### 1. Development Environment

Create `.env` file in project root:

```bash
# Copy example file
cp .env.example .env

# Edit with your values
nano .env
```

#### 2. Supabase Setup

1. Create Supabase project at https://supabase.com
2. Get project URL and API keys from Settings > API
3. Set up database schema using provided SQL scripts
4. Configure Row Level Security (RLS) policies

#### 3. AI Services Setup

**Google AI (Gemini):**
1. Go to https://aistudio.google.com
2. Create API key
3. Add to environment as `GOOGLE_AI_API_KEY`

**OpenAI:**
1. Create account at https://platform.openai.com
2. Generate API key
3. Add to environment as `OPENAI_API_KEY`

#### 4. Cloud Storage Setup

**Dropbox:**
1. Create app at https://www.dropbox.com/developers
2. Set redirect URI to `{YOUR_URL}/api/auth/dropbox/callback`
3. Get client ID and secret

**Google Drive:**
1. Create project in Google Cloud Console
2. Enable Drive API
3. Create OAuth2 credentials
4. Set redirect URI to `{YOUR_URL}/api/auth/google/callback`

### Configuration Validation

The application includes environment validation:

```typescript
// server/config.ts
export function validateConfiguration() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'SESSION_SECRET'
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
  
  console.log('✅ Environment configuration validated')
}
```

---

## Deployment Guide

### Development Deployment

#### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

#### Setup Steps

```bash
# 1. Clone repository
git clone <repository-url>
cd contas-pt

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your configuration

# 4. Setup database
npm run db:push

# 5. Start development server
npm run dev
```

The application will be available at http://localhost:5000

### Production Deployment

#### Option 1: Replit Deployment

1. Import project to Replit
2. Configure environment variables in Secrets
3. Click "Deploy" button
4. Application will be available at your Replit URL

#### Option 2: Vercel Deployment

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel

# 4. Set environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
# ... add all required variables

# 5. Redeploy with environment
vercel --prod
```

#### Option 3: Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "run", "start"]
```

```bash
# Build and run
docker build -t contas-pt .
docker run -p 5000:5000 --env-file .env contas-pt
```

#### Option 4: Ubuntu Server Deployment

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PM2
sudo npm install -g pm2

# 4. Clone and setup project
git clone <repository-url>
cd contas-pt
npm install
npm run build

# 5. Configure environment
cp .env.example .env
# Edit with production values

# 6. Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Production Configuration

#### Environment Variables

```bash
# Production environment
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-domain.com

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Security
SESSION_SECRET=your-32-character-production-secret
```

#### Security Checklist

- [ ] Use HTTPS in production
- [ ] Set strong session secret (32+ characters)
- [ ] Configure CORS for production domain
- [ ] Enable Supabase RLS policies
- [ ] Set up rate limiting
- [ ] Configure file upload limits
- [ ] Enable request logging
- [ ] Set up monitoring and alerts

#### Performance Optimization

```javascript
// next.config.js - Production optimizations
module.exports = {
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  images: {
    unoptimized: true
  },
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../')
  }
}
```

### Monitoring and Maintenance

#### Health Checks

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database connection
    const dbStatus = await checkDatabaseConnection()
    
    // Check AI services
    const aiStatus = await checkAIServices()
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbStatus,
        ai_services: aiStatus
      }
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: error.message },
      { status: 500 }
    )
  }
}
```

#### Backup Strategy

```bash
# Database backup (daily)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Application backup
tar -czf app_backup_$(date +%Y%m%d).tar.gz /path/to/app

# Environment backup (encrypted)
gpg --cipher-algo AES256 --compress-algo 1 --s2k-cipher-algo AES256 \
    --s2k-digest-algo SHA512 --s2k-mode 3 --s2k-count 65536 \
    --symmetric --output .env.backup.gpg .env
```

#### Log Management

```bash
# PM2 log management
pm2 logs contas-pt
pm2 logs contas-pt --lines 1000
pm2 flush # Clear logs

# Log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

---

## Development Workflow

### Getting Started

#### 1. Local Development Setup

```bash
# Clone and setup
git clone <repository-url>
cd contas-pt
npm install

# Environment setup
cp .env.example .env
# Configure your local environment variables

# Database setup
npm run db:push

# Start development
npm run dev
```

#### 2. Development Scripts

```json
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development tsx server/index.ts",
    "next:dev": "next dev -p 5000",
    "build": "next build",
    "start": "next start -p 5000",
    "db:push": "drizzle-kit push:pg",
    "db:clean": "node db-clean.ts",
    "check": "tsc --noEmit",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "test": "jest"
  }
}
```

### Code Organization

#### Project Structure

```
contas-pt/
├── app/                       # Next.js app directory
│   ├── api/                   # API routes
│   ├── (pages)/               # Page components
│   ├── globals.css            # Global styles
│   └── layout.tsx             # Root layout
├── components/                # Reusable components
│   ├── ui/                    # shadcn/ui components
│   └── *.tsx                  # Feature components
├── hooks/                     # Custom React hooks
├── lib/                       # Utility libraries
├── server/                    # Backend logic
│   ├── controllers/           # Route controllers
│   ├── storage/               # Database layer
│   └── *.ts                   # Server utilities
├── docs/                      # Documentation
├── scripts/                   # Build/deployment scripts
├── shared/                    # Shared types/schemas
└── public/                    # Static assets
```

#### Coding Standards

**TypeScript Configuration:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/hooks/*": ["./hooks/*"]
    }
  }
}
```

**ESLint Configuration:**
```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Database Development

#### Schema Management

```typescript
// shared/schema.ts - Drizzle schema definition
import { pgTable, serial, varchar, text, boolean, timestamp, decimal, integer } from 'drizzle-orm/pg-core'

export const tenants = pgTable('tenants', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  nif: varchar('nif', { length: 20 }),
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow()
})

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('user'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
})
```

#### Database Migrations

```bash
# Generate migration
npm run db:generate

# Push schema changes
npm run db:push

# Reset database (development only)
npm run db:clean
npm run db:push
```

### Testing Strategy

#### Unit Tests

```typescript
// __tests__/utils/nif-validation.test.ts
import { validatePortugueseNIF } from '@/lib/nif-validation'

describe('NIF Validation', () => {
  test('validates correct NIF', () => {
    expect(validatePortugueseNIF('123456789')).toBe(true)
  })
  
  test('rejects invalid NIF', () => {
    expect(validatePortugueseNIF('123456788')).toBe(false)
  })
  
  test('handles formatted NIF', () => {
    expect(validatePortugueseNIF('123 456 789')).toBe(true)
  })
})
```

#### Integration Tests

```typescript
// __tests__/api/auth.test.ts
import { POST } from '@/app/api/auth/login/route'

describe('/api/auth/login', () => {
  test('authenticates valid user', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@contas-pt.com',
        password: 'admin123'
      })
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.user).toBeDefined()
  })
})
```

#### E2E Tests

```typescript
// __tests__/e2e/upload.test.ts
import { test, expect } from '@playwright/test'

test('document upload flow', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.fill('input[name="email"]', 'admin@contas-pt.com')
  await page.fill('input[name="password"]', 'admin123')
  await page.click('button[type="submit"]')
  
  // Navigate to documents
  await page.goto('/documents')
  
  // Upload file
  await page.setInputFiles('input[type="file"]', 'test-invoice.pdf')
  
  // Wait for processing
  await expect(page.locator('.processing-indicator')).toBeVisible()
  await expect(page.locator('.processing-complete')).toBeVisible({ timeout: 30000 })
  
  // Verify document appears in list
  await expect(page.locator('table')).toContainText('test-invoice.pdf')
})
```

### Git Workflow

#### Branch Strategy

```bash
# Main branches
main          # Production-ready code
develop       # Integration branch

# Feature branches
feature/user-management
feature/ai-improvements
feature/cloud-integration

# Release branches
release/v3.0.0

# Hotfix branches
hotfix/security-fix
```

#### Commit Standards

```bash
# Commit message format
<type>(<scope>): <description>

# Examples
feat(auth): add multi-tenant support
fix(upload): resolve file size validation
docs(api): update endpoint documentation
refactor(db): optimize query performance
test(e2e): add document upload tests
```

#### Pull Request Process

1. Create feature branch from `develop`
2. Implement changes with tests
3. Update documentation if needed
4. Create pull request to `develop`
5. Code review and approval required
6. Merge to `develop`
7. Regular releases from `develop` to `main`

### Development Tools

#### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-playwright.playwright",
    "drizzle-team.drizzle-vscode"
  ]
}
```

#### Development Configuration

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "'([^']*)'"]
  ]
}
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues

**Problem:** Unable to connect to Supabase database
```
Error: Connection failed to Supabase database
```

**Solutions:**
```bash
# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Test connection
npm run db:push

# Verify Supabase project status in dashboard
```

#### 2. Authentication Failures

**Problem:** Login not working
```
Error: Invalid credentials
```

**Solutions:**
```bash
# Check user exists in database
psql $DATABASE_URL -c "SELECT * FROM users WHERE email = 'admin@contas-pt.com';"

# Reset password hash
node scripts/reset-password.js admin@contas-pt.com newpassword

# Clear session data
rm -rf .next/cache
```

#### 3. AI Processing Errors

**Problem:** Document processing fails
```
Error: Google AI API authentication failed
```

**Solutions:**
```bash
# Verify API keys
curl -H "Authorization: Bearer $GOOGLE_AI_API_KEY" \
     https://generativelanguage.googleapis.com/v1/models

# Check quota limits in Google AI Studio
# Test with smaller file

# Enable fallback to OpenAI
export OPENAI_API_KEY=your-openai-key
```

#### 4. File Upload Issues

**Problem:** Large files fail to upload
```
Error: File too large
```

**Solutions:**
```javascript
// Increase limits in next.config.js
module.exports = {
  experimental: {
    serverComponentsExternalPackages: [],
  },
  async headers() {
    return [
      {
        source: '/api/upload',
        headers: [
          {
            key: 'Content-Length',
            value: '52428800' // 50MB
          }
        ]
      }
    ]
  }
}
```

#### 5. Cloud Storage Issues

**Problem:** Dropbox/Google Drive sync not working
```
Error: Token expired or invalid
```

**Solutions:**
```bash
# Check token expiry
SELECT provider, created_at, last_sync_at 
FROM cloud_drive_configs 
WHERE is_active = true;

# Refresh OAuth tokens
# Re-authenticate through UI

# Check webhook endpoints
curl -X POST https://your-app.com/api/webhooks/dropbox \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
```

### Performance Issues

#### 1. Slow Database Queries

**Problem:** Dashboard loads slowly
```bash
# Add database indexes
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_date 
ON expenses(tenant_id, expense_date);

CREATE INDEX IF NOT EXISTS idx_documents_tenant_status 
ON documents(tenant_id, processing_status);
```

#### 2. Memory Usage High

**Problem:** Server consuming too much memory
```bash
# Monitor memory usage
ps aux | grep node

# Restart services
pm2 restart contas-pt

# Check for memory leaks
npm run dev -- --inspect
```

#### 3. AI Processing Slow

**Problem:** Document processing takes too long
```typescript
// Optimize file processing
async function optimizeImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(1200, 1200, { fit: 'inside' })
    .jpeg({ quality: 80 })
    .toBuffer()
}

// Implement timeout
const processWithTimeout = async (file: File) => {
  return Promise.race([
    processor.processDocument(file),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 30000)
    )
  ])
}
```

### Debugging Tools

#### 1. Database Debugging

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  most_common_vals
FROM pg_stats 
WHERE schemaname = 'public';

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM expenses 
WHERE tenant_id = 1 AND expense_date >= '2025-01-01';

-- Check locks
SELECT * FROM pg_locks 
WHERE NOT granted;
```

#### 2. API Debugging

```typescript
// Add request logging middleware
export function withLogging(handler: Function) {
  return async (request: NextRequest) => {
    const start = Date.now()
    console.log(`${request.method} ${request.url}`)
    
    try {
      const response = await handler(request)
      const duration = Date.now() - start
      console.log(`${request.method} ${request.url} - ${response.status} (${duration}ms)`)
      return response
    } catch (error) {
      console.error(`${request.method} ${request.url} - ERROR:`, error)
      throw error
    }
  }
}
```

#### 3. Frontend Debugging

```typescript
// React Query DevTools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

// Error boundary with detailed logging
export class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary:', error, errorInfo)
    
    // Send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      reportError(error, errorInfo)
    }
  }
}
```

### Log Analysis

#### 1. Application Logs

```bash
# View real-time logs
pm2 logs contas-pt --lines 100

# Search logs
pm2 logs contas-pt | grep ERROR

# Filter by timestamp
pm2 logs contas-pt --timestamp
```

#### 2. Database Logs

```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

-- View slow queries
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

#### 3. Error Monitoring

```typescript
// Custom error reporting
export function reportError(error: Error, context?: any) {
  const errorReport = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
    url: window.location.href,
    userAgent: navigator.userAgent
  }
  
  // Send to monitoring service
  fetch('/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(errorReport)
  })
}
```

---

## Contributing

### How to Contribute

We welcome contributions to Contas-PT! Here's how you can help improve the project.

#### Getting Started

1. **Fork the Repository**
   ```bash
   git clone https://github.com/your-username/contas-pt.git
   cd contas-pt
   ```

2. **Set Up Development Environment**
   ```bash
   npm install
   cp .env.example .env
   # Configure your environment
   npm run dev
   ```

3. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

#### Development Guidelines

**Code Style:**
- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for functions
- Use Prettier for code formatting
- Follow ESLint rules

**Database Changes:**
- Use Drizzle ORM for schema changes
- Add migrations for schema updates
- Update seed data if needed
- Test migrations on clean database

**API Development:**
- Follow REST conventions
- Add input validation with Zod
- Include error handling
- Add OpenAPI documentation
- Test all endpoints

**Frontend Development:**
- Use shadcn/ui components
- Implement responsive design
- Add loading states
- Handle error states
- Follow accessibility guidelines

#### Testing Requirements

**Required Tests:**
- Unit tests for utilities
- Integration tests for API routes
- E2E tests for critical flows
- Portuguese compliance validation

**Test Commands:**
```bash
# Run all tests
npm test

# Run specific test type
npm run test:unit
npm run test:integration
npm run test:e2e

# Coverage report
npm run test:coverage
```

#### Pull Request Process

1. **Before Submitting:**
   - Run all tests and ensure they pass
   - Update documentation if needed
   - Add changelog entry
   - Test in development environment

2. **PR Requirements:**
   - Clear description of changes
   - Link to related issues
   - Screenshots for UI changes
   - Breaking changes documented

3. **Review Process:**
   - Code review by maintainers
   - CI/CD checks must pass
   - Documentation review
   - Approval required before merge

#### Portuguese Compliance

When contributing features that affect Portuguese business compliance:

- **VAT Calculations:** Must use correct Portuguese rates (6%, 13%, 23%)
- **NIF Validation:** Implement proper Portuguese tax ID validation
- **SAF-T Export:** Maintain compatibility with Portuguese tax authority requirements
- **Language:** Use Portuguese terms for business concepts
- **Date Formats:** Use DD/MM/YYYY format for Portuguese users

#### Feature Requests

**High Priority Features:**
- Banking integration with Portuguese banks
- Advanced SAF-T validation
- Mobile application
- Multi-language support
- Advanced reporting and analytics

**How to Request Features:**
1. Check existing issues/discussions
2. Create detailed feature request
3. Include business justification
4. Provide mockups if applicable
5. Discuss with maintainers

#### Bug Reports

**Include in Bug Reports:**
- Environment details (OS, browser, Node.js version)
- Steps to reproduce
- Expected vs actual behavior
- Screenshots or screen recordings
- Error messages and logs
- Portuguese-specific context if applicable

#### Documentation

**Documentation Standards:**
- Keep README.md updated
- Document new API endpoints
- Update environment variables list
- Include Portuguese business context
- Add code examples
- Update troubleshooting guide

### Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation
- Annual contributor highlights

### Community Guidelines

**Be Respectful:**
- Use inclusive language
- Respect different perspectives
- Provide constructive feedback
- Help newcomers

**Be Professional:**
- Focus on code and ideas
- Avoid personal attacks
- Follow code of conduct
- Maintain high standards

### Getting Help

**Resources:**
- GitHub Discussions for questions
- Issue tracker for bugs
- Documentation for guides
- Code comments for implementation details

**Contact:**
- Create GitHub issue for bugs
- Start discussion for questions
- Email maintainers for security issues

---

## Conclusion

Contas-PT represents a comprehensive solution for Portuguese business accounting, combining modern web technologies with AI-powered document processing and full Portuguese tax compliance. This documentation provides everything needed to understand, deploy, develop, and contribute to the project.

### Key Strengths

- **AI-Powered Processing:** Dual-model approach with Gemini and OpenAI
- **Portuguese Compliance:** Full VAT, NIF, and SAF-T support
- **Modern Architecture:** Next.js 15, TypeScript, Supabase
- **Cloud Integration:** Automated Dropbox and Google Drive sync
- **Real-time Updates:** WebSocket-based live notifications
- **Multi-tenant Support:** Role-based access control
- **Comprehensive Testing:** Unit, integration, and E2E tests

### Roadmap

**Version 3.1 (Q3 2025):**
- Banking API integration
- Mobile application (React Native)
- Advanced analytics dashboard
- Multi-language support (English, Spanish)

**Version 3.2 (Q4 2025):**
- Machine learning expense categorization
- OCR improvements for handwritten documents
- Integration with Portuguese tax authority APIs
- Advanced SAF-T validation

**Version 4.0 (Q1 2026):**
- Microservices architecture
- Advanced reporting engine
- Enterprise features and scaling
- International expansion support

### Support

For support, questions, or contributions:
- **Documentation:** Complete guides in `/docs` folder
- **Issues:** GitHub issue tracker for bugs and features
- **Discussions:** GitHub discussions for questions
- **Security:** Email security issues privately

---

*This documentation was last updated on July 2, 2025. For the latest information, always refer to the project repository.*