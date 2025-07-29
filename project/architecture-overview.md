# Architecture Overview - Contas-PT

*Last Updated: January 29, 2025*

## System Architecture

Contas-PT is a modern Portuguese accounting system built with Next.js and cloud-native architecture, designed for intelligent document processing and Portuguese tax compliance.

### Technology Stack

#### Frontend Architecture
- **Framework**: Next.js 15.3.4 with App Router
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state
- **Forms**: React Hook Form with Zod validation
- **Themes**: Dark/Light mode with Next.js themes

#### Backend Architecture
- **API**: Next.js API Routes with TypeScript
- **Database**: Supabase PostgreSQL (cloud-native)
- **ORM**: Drizzle ORM with TypeScript schemas
- **Authentication**: Multi-tenant session-based auth
- **Background Jobs**: Node-cron schedulers
- **Real-time**: WebSocket server integration

#### AI Processing Layer
- **Primary AI**: Google Gemini-2.5-Flash-Preview
- **Secondary AI**: OpenAI GPT-4o-Mini
- **Processing**: Multi-model consensus with validation
- **Languages**: Portuguese document optimization
- **Output**: Structured JSON with confidence scoring

#### Cloud Services
- **Database**: Supabase (PostgreSQL hosting)
- **Storage**: Dropbox API integration
- **AI**: Google AI and OpenAI APIs
- **Monitoring**: Real-time WebSocket updates
- **Deployment**: Replit with automatic scaling

### Core System Components

#### 1. Document Processing Pipeline
```
Dropbox Monitor → File Download → Duplicate Check → AI Processing → Data Extraction → Expense Creation
```

**Key Features:**
- Automatic file monitoring every 5 minutes
- Intelligent duplicate detection with database constraints
- Multi-model AI processing for maximum accuracy
- Portuguese business document optimization
- Real-time processing status updates

#### 2. Multi-Tenant Database Architecture
```
Tenants (Companies) → Users → Documents → Expenses → Invoices → Clients
```

**Security Features:**
- Row-Level Security (RLS) policies
- Tenant-scoped data isolation
- Role-based access control (admin, accountant, user)
- Encrypted credential storage for cloud services
- Session-based authentication with token refresh

#### 3. Portuguese Compliance Engine
```
Document → NIF Extraction → VAT Calculation → Category Classification → Tax Reporting
```

**Compliance Features:**
- Portuguese VAT rates (6%, 13%, 23%)
- NIF validation with European support
- SAF-T export for tax authorities
- Portuguese business expense categories
- Currency formatting with Euro standards

### Data Flow Architecture

#### Document Processing Flow
1. **Monitoring**: Dropbox folder monitored every 5 minutes
2. **Download**: Files downloaded and stored temporarily
3. **Duplicate Check**: Filename and file size validation
4. **AI Processing**: Dual-model extraction (Gemini + OpenAI)
5. **Validation**: Authentic data only, no placeholders
6. **Storage**: Document record creation with metadata
7. **Expense Creation**: Automatic expense generation
8. **Notification**: Real-time WebSocket updates

#### Authentication Flow
1. **Login**: User credentials validated via Supabase
2. **Session**: JWT token stored in localStorage
3. **Tenant Context**: Company selection and role assignment
4. **API Calls**: All requests include tenant-id header
5. **Permission Check**: Role-based access validation
6. **Data Isolation**: Tenant-scoped queries only

#### Real-time Updates Flow
1. **WebSocket Connection**: Client connects to real-time server
2. **Processing Events**: AI processing status broadcasts
3. **Data Changes**: Database changes trigger notifications
4. **UI Updates**: Frontend updates without page refresh
5. **Error Handling**: Connection failures with auto-reconnect

### Database Schema Architecture

#### Primary Tables
- **tenants**: Company information with NIF validation
- **users**: User accounts with authentication
- **user_tenants**: Many-to-many relationship with roles
- **documents**: Processed files with AI extraction
- **expenses**: Financial records with Portuguese compliance
- **invoices**: Invoice management (ready for future use)
- **clients**: Customer management with NIF validation

#### Constraints and Integrity
- **Unique Constraints**: Prevent duplicate documents per tenant
- **Foreign Keys**: Maintain referential integrity
- **Check Constraints**: VAT rate and amount validation
- **Indexes**: Optimized queries for common operations

### Security Architecture

#### Data Protection
- **Encryption**: AES-256 for sensitive credential storage
- **Authentication**: Secure session management
- **Authorization**: Role-based access with granular permissions
- **Database**: Row-Level Security policies
- **API**: Request validation and sanitization

#### Privacy Compliance
- **Data Isolation**: Complete tenant separation
- **GDPR Ready**: User data management and deletion
- **Audit Trails**: Complete transaction logging
- **Backup**: Automated Supabase backups

### Performance Architecture

#### Optimization Strategies
- **Database Indexing**: Optimized queries for large datasets
- **Caching**: TanStack Query for client-side caching
- **Lazy Loading**: Components loaded on demand
- **Code Splitting**: Reduced bundle sizes
- **CDN**: Static assets served from edge locations

#### Scalability Features
- **Multi-tenancy**: Horizontal scaling by tenant
- **API Rate Limiting**: Prevents system overload
- **Background Processing**: Async job queues for heavy tasks
- **Auto-scaling**: Cloud infrastructure adaptation

### Integration Architecture

#### External Services
- **Google AI**: Primary document processing
- **OpenAI**: Secondary processing and validation
- **Dropbox**: Cloud storage monitoring
- **Supabase**: Database and authentication
- **WebSocket**: Real-time communication

#### API Design
- **RESTful**: Standard HTTP methods and status codes
- **TypeScript**: Strongly typed request/response
- **Validation**: Zod schemas for all endpoints
- **Error Handling**: Consistent error responses
- **Documentation**: OpenAPI/Swagger ready

### Development Architecture

#### Code Organization
```
app/                 # Next.js App Router pages
├── api/            # API route handlers
├── dashboard/      # Dashboard pages
├── documents/      # Document management
└── [feature]/      # Feature-specific pages

components/         # Reusable UI components
├── ui/            # shadcn/ui components
└── [feature]/     # Feature components

lib/               # Utility libraries
├── utils.ts       # Common utilities
├── auth.ts        # Authentication helpers
└── [feature].ts   # Feature-specific utils

server/            # Backend services
├── storage.ts     # Database abstraction
└── agents/        # AI processing agents

shared/            # Shared types and schemas
└── schema.ts      # Database schemas
```

#### Development Workflow
1. **Environment**: Local development with Next.js hot reload
2. **Database**: Supabase development instance
3. **Testing**: Manual testing with real data
4. **Deployment**: Replit automatic deployment
5. **Monitoring**: Real-time logs and metrics

### Deployment Architecture

#### Production Environment
- **Platform**: Replit cloud hosting
- **Database**: Supabase production instance
- **CDN**: Global content delivery
- **SSL**: Automatic HTTPS encryption
- **Monitoring**: Application performance monitoring

#### Environment Configuration
- **Variables**: Secure environment variable management
- **Secrets**: Encrypted API key storage
- **Configuration**: Multi-environment setup
- **Backup**: Automated backup strategies

This architecture provides a robust, scalable foundation for Portuguese businesses requiring intelligent document processing with full compliance and multi-tenant support.