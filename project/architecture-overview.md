# Architecture Overview - Contas-PT

## System Architecture

### Technology Stack
- **Frontend**: Next.js 15.3.4 with TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes with TypeScript
- **Database**: Supabase PostgreSQL with Drizzle ORM
- **Authentication**: Multi-tenant session-based with role-based access control
- **AI Processing**: Google Gemini-2.5-Flash-Preview + OpenAI GPT-4o-Mini
- **Real-time**: WebSocket server for live updates
- **Cloud Storage**: Dropbox and Google Drive integration with automated monitoring

### Core Components

#### Frontend Architecture
```
app/                    # Next.js App Router pages
├── layout.tsx         # Root layout with providers
├── page.tsx           # Dashboard homepage
└── (auth)/            # Authentication routes

components/            # Reusable UI components
├── ui/               # shadcn/ui base components
├── dashboard.tsx     # Main dashboard
├── invoices-table.tsx
├── expenses-table.tsx
└── webhook-config-manager.tsx

lib/                  # Frontend utilities
├── queryClient.ts    # TanStack Query configuration
├── utils.ts          # Utility functions
└── theme.tsx         # Theme provider
```

#### Backend Architecture
```
server/
├── index.ts          # Server entry point
├── routes.ts         # API route definitions
├── storage.ts        # Database interface
├── supabase-storage.ts # Supabase implementation
├── auth/            # Authentication middleware
├── controllers/     # Business logic
├── agents/          # AI processing agents
└── websocket-server.ts # Real-time updates
```

### Database Design

#### Multi-Tenancy
- **Tenants**: Company/organization entities
- **Users**: Individual user accounts
- **User-Tenants**: Many-to-many relationship with roles

#### Core Business Entities
- **Clients**: Customer management with Portuguese NIF validation
- **Invoices**: Portuguese invoice format with IVA compliance
- **Expenses**: Expense tracking with AI categorization
- **Documents**: AI-processed document storage
- **Bank Accounts**: Financial account management

### AI Processing Pipeline

#### Document Processing Flow
1. **Input**: PDF, JPG, PNG documents via upload or cloud sync
2. **Primary Processing**: Google Gemini-2.5-Flash-Preview extraction
3. **Fallback Processing**: OpenAI GPT-4o-Mini for validation
4. **Validation**: Multi-model consensus with confidence scoring
5. **Storage**: Structured data with Portuguese business compliance

#### Portuguese Compliance
- **IVA Rates**: 6%, 13%, 23% VAT support
- **NIF Validation**: 9-digit Portuguese tax ID format
- **Currency**: Euro formatting with Portuguese locale
- **Categories**: Portuguese business expense categories

### Cloud Integration

#### Automated Document Processing
- **Dropbox**: Real-time webhook notifications + scheduled monitoring
- **Google Drive**: OAuth2 integration with file change detection
- **Multi-Tenant**: Complete isolation per user/tenant
- **Duplicate Prevention**: Content-based deduplication

#### Webhook System
- **WhatsApp**: Business API for invoice receipt via messages
- **Gmail**: IMAP-based PDF attachment processing
- **Encrypted Storage**: AES-256 credential encryption per tenant

### Security & Authentication

#### Multi-Tenant Security
- **Row Level Security**: Supabase RLS policies
- **Role-Based Access**: Admin, Accountant, Assistant, Viewer roles
- **Session Management**: Secure session-based authentication
- **Credential Encryption**: AES-256 encryption for API keys

### Real-time Features

#### WebSocket Integration
- **Document Processing**: Live processing status updates
- **Expense Creation**: Real-time notifications
- **Tenant Isolation**: User-specific notification channels
- **Connection Management**: Automatic reconnection handling

## Deployment Architecture

### Development Environment
- **Next.js Dev Server**: Hot reload with Fast Refresh
- **Supabase**: Cloud database with development credentials
- **Environment**: Local development with .env configuration

### Production Deployment
- **Next.js**: Production build with optimizations
- **Supabase**: Production database with proper credentials
- **SSL/TLS**: HTTPS enforcement
- **Process Management**: PM2 or similar for process supervision

## Data Flow

### User Request Flow
1. **Authentication**: Session validation and tenant context
2. **API Route**: Next.js API route processing
3. **Business Logic**: Controller layer with validation
4. **Database**: Supabase with RLS enforcement
5. **Response**: JSON response with proper error handling

### Document Processing Flow
1. **Upload/Sync**: File received via web upload or cloud sync
2. **AI Processing**: Multi-model extraction with Portuguese context
3. **Data Validation**: Portuguese business rule validation
4. **Storage**: Document and extracted data persistence
5. **Notification**: Real-time WebSocket updates
6. **Integration**: Automatic expense/invoice creation

This architecture ensures scalability, security, and compliance with Portuguese accounting requirements while providing a modern, responsive user experience.