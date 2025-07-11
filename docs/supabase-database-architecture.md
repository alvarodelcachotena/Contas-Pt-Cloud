# Supabase Database Architecture - Contas-PT

*Last updated: July 1, 2025 - Version 2.4.0*

Complete database documentation for the Portuguese Accounting AI System built exclusively on Supabase PostgreSQL.

## Overview

Contas-PT uses a Supabase-only architecture with PostgreSQL as the exclusive database solution. The system features a sophisticated multi-tenant design with role-based access control, comprehensive audit trails, and specialized Portuguese business compliance.

**Recent Improvements (June 2025):**
- Enhanced multi-tenant authentication system with user_tenants relationships
- Resolved Supabase client schema access issues with service function implementations
- Improved admin panel functionality with comprehensive management capabilities
- Updated database cleanup scripts with super admin preservation
- Strengthened session management and authentication middleware

## Database Connection & Configuration

### Primary Connection
```typescript
// Supabase Client Configuration
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
```

### Environment Variables
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

### Service Functions
Due to Supabase client table access limitations, the system uses PostgreSQL functions for admin operations:

```sql
-- Enhanced admin data service function
CREATE OR REPLACE FUNCTION public.get_admin_data()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'users', (SELECT json_agg(json_build_object(
      'id', id, 'email', email, 'name', name,
      'isActive', is_active, 'createdAt', created_at
    )) FROM users),
    'tenants', (SELECT json_agg(json_build_object(
      'id', id, 'name', name, 'slug', slug,
      'taxId', tax_id, 'isActive', is_active
    )) FROM tenants),
    'assignments', (SELECT json_agg(json_build_object(
      'id', ut.id, 'userId', ut.user_id, 'tenantId', ut.tenant_id,
      'role', ut.role, 'isActive', ut.is_active,
      'userName', u.name, 'userEmail', u.email,
      'tenantName', t.name, 'tenantSlug', t.slug
    )) FROM user_tenants ut
    LEFT JOIN users u ON ut.user_id = u.id
    LEFT JOIN tenants t ON ut.tenant_id = t.id)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

## Core Database Schema

### 1. Multi-Tenant Foundation

#### Tenants Table
Primary table for business organizations with Portuguese compliance.

```sql
CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tax_id TEXT NOT NULL,           -- Portuguese NIF (9 digits)
  region TEXT NOT NULL DEFAULT 'mainland', -- mainland, azores, madeira
  address TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Business Logic:**
- Slug used for URL-friendly tenant identification
- Tax ID validation for Portuguese NIF format
- Regional settings affect VAT calculations
- Soft deletion with is_active flag

#### Users Table
User accounts with enhanced authentication support.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password TEXT NOT NULL,         -- bcrypt hashed
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);
```

**Features:**
- Bcrypt password hashing for security
- Login tracking with last_login_at
- Email uniqueness enforcement
- Soft deletion support

#### User-Tenant Relationships
Many-to-many mapping with role-based access control.

```sql
CREATE TABLE user_tenants (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  tenant_id INTEGER NOT NULL,
  role TEXT NOT NULL,             -- admin, accountant, assistant, viewer
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Role Permissions:**
- **Admin**: Full system access, user management, settings
- **Accountant**: Financial data, reports, client management
- **Assistant**: Data entry, document processing, basic reporting
- **Viewer**: Read-only access to financial data

### 2. Financial Management Tables

#### Bank Accounts
Business banking information with Portuguese IBAN support.

```sql
CREATE TABLE bank_accounts (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  iban TEXT NOT NULL,             -- Portuguese IBAN format
  account_type TEXT NOT NULL DEFAULT 'checking',
  balance NUMERIC(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Clients
Customer management with Portuguese business compliance.

```sql
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  tax_id TEXT,                    -- Portuguese NIF
  tax_id_validated BOOLEAN DEFAULT false,
  primary_email TEXT,
  accounting_email TEXT,
  project_email TEXT,
  other_emails TEXT[],            -- Array of additional emails
  address TEXT,
  phone TEXT,
  default_payment_terms INTEGER DEFAULT 30,
  payment_terms_type TEXT DEFAULT 'standard',
  custom_payment_conditions TEXT,
  manager_approval_required BOOLEAN DEFAULT false,
  contract_number TEXT,
  purchase_order_required BOOLEAN DEFAULT false,
  confirmation_order_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Portuguese Compliance Features:**
- NIF validation with algorithm verification
- Multiple email types for different business functions
- Flexible payment terms matching Portuguese business practices
- Contract and purchase order tracking

#### Invoices
Portuguese invoice management with legal compliance.

```sql
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  client_id INTEGER,
  number TEXT NOT NULL,           -- Sequential numbering (legal requirement)
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_tax_id TEXT,
  client_address TEXT,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  vat_amount NUMERIC(10,2) NOT NULL,
  vat_rate NUMERIC(5,2) NOT NULL, -- 6%, 13%, 23%
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  description TEXT,
  notes TEXT,
  payment_terms TEXT,
  payment_method TEXT,
  invoice_items JSONB,            -- Structured invoice line items
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Status Values:**
- draft, sent, paid, overdue, cancelled, awaiting_payment, payment_received

**Portuguese VAT Rates:**
- 6%: Essential goods and services
- 13%: Reduced rate items
- 23%: Standard rate (most common)

#### Expenses
Expense tracking with AI-extracted data and Portuguese categorization.

```sql
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  vendor TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  vat_amount NUMERIC(10,2),
  vat_rate NUMERIC(5,2),
  total_amount NUMERIC(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  category TEXT NOT NULL,         -- Portuguese expense categories
  subcategory TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending',  -- pending, approved, rejected
  extracted_data JSONB,           -- AI-extracted invoice data
  confidence_score NUMERIC(3,2),  -- AI confidence (0.00-1.00)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**AI Integration:**
- Extracted data stored as structured JSON
- Confidence scoring for data quality assessment
- Automatic categorization based on Portuguese accounting standards

### 3. Document Management & AI Processing

#### Documents
Comprehensive document storage with AI processing metadata.

```sql
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,        -- PDF, JPEG, PNG
  file_path TEXT,
  storage_provider TEXT DEFAULT 'local', -- local, supabase, google_drive, dropbox
  processing_status TEXT DEFAULT 'pending',
  processing_method TEXT,         -- upload, google_drive, dropbox, webhook
  extracted_data JSONB,           -- Complete AI extraction results
  confidence_score NUMERIC(3,2),
  ai_model_used TEXT,             -- gemini-2.5-flash-preview, gpt-4o-mini
  processing_error TEXT,
  processing_started_at TIMESTAMP,
  processing_completed_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Processing Status Values:**
- pending, processing, completed, failed, manual_review_required

**AI Models:**
- Primary: Google Gemini-2.5-Flash-Preview
- Fallback: OpenAI GPT-4o-Mini

#### Extracted Invoice Data
Structured storage for AI-extracted invoice information.

```sql
CREATE TABLE extracted_invoice_data (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL,
  vendor TEXT,
  vendor_nif TEXT,
  vendor_address TEXT,
  vendor_phone TEXT,
  invoice_number TEXT,
  invoice_date DATE,
  due_date DATE,
  subtotal NUMERIC(10,2),
  vat_amount NUMERIC(10,2),
  vat_rate NUMERIC(5,2),
  total_amount NUMERIC(10,2),
  currency TEXT DEFAULT 'EUR',
  confidence_score NUMERIC(3,2),
  extraction_method TEXT,         -- gemini, openai, consensus
  raw_extraction_data JSONB,      -- Complete AI response
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Cloud Storage Integration

#### Cloud Drive Configurations
OAuth2 integrations for Google Drive and Dropbox.

```sql
CREATE TABLE cloud_drive_configs (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  provider TEXT NOT NULL,         -- google_drive, dropbox
  folder_id TEXT NOT NULL,        -- Drive folder ID or Dropbox path
  folder_name TEXT NOT NULL,
  access_token TEXT NOT NULL,     -- Encrypted OAuth2 token
  refresh_token TEXT,             -- For token renewal
  token_expires_at TIMESTAMP,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP,
  sync_cursor TEXT,               -- For delta sync
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Security Features:**
- Encrypted token storage
- Automatic token refresh handling
- Delta sync cursors for efficiency
- Per-tenant isolation

### 5. Financial Reporting & Compliance

#### Monthly Statement Entries
Day-by-day financial organization for Portuguese compliance.

```sql
CREATE TABLE monthly_statement_entries (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  month INTEGER NOT NULL,         -- 1-12
  year INTEGER NOT NULL,
  day INTEGER NOT NULL,           -- 1-31
  description TEXT NOT NULL,
  debit_amount NUMERIC(10,2),
  credit_amount NUMERIC(10,2),
  balance NUMERIC(10,2) NOT NULL,
  document_reference TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### SAF-T Export Records
Portuguese tax authority file generation tracking.

```sql
CREATE TABLE saft_exports (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  export_type TEXT NOT NULL,      -- monthly, yearly, custom
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  export_status TEXT DEFAULT 'pending',
  export_started_at TIMESTAMP,
  export_completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 6. Additional Features

#### AI Chat Messages
Conversational AI support for accounting questions.

```sql
CREATE TABLE ai_chat_messages (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  response TEXT,
  message_type TEXT DEFAULT 'user', -- user, assistant, system
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Manager Approvals
Workflow management for expense and invoice approvals.

```sql
CREATE TABLE manager_approvals (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  client_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,       -- Requesting user
  manager_id INTEGER,             -- Approving manager
  approval_type TEXT NOT NULL,    -- expense, invoice, payment
  entity_id INTEGER NOT NULL,     -- ID of expense/invoice being approved
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  request_notes TEXT,
  approval_notes TEXT,
  requested_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP
);
```

## Database Relationships

### Primary Foreign Key Relationships

```sql
-- User-Tenant Many-to-Many
ALTER TABLE user_tenants ADD CONSTRAINT fk_user_tenants_user 
  FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE user_tenants ADD CONSTRAINT fk_user_tenants_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Tenant-scoped Tables
ALTER TABLE bank_accounts ADD CONSTRAINT fk_bank_accounts_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE clients ADD CONSTRAINT fk_clients_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE expenses ADD CONSTRAINT fk_expenses_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Document Relationships
ALTER TABLE documents ADD CONSTRAINT fk_documents_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE extracted_invoice_data ADD CONSTRAINT fk_extracted_data_document 
  FOREIGN KEY (document_id) REFERENCES documents(id);

-- Cloud Integration
ALTER TABLE cloud_drive_configs ADD CONSTRAINT fk_cloud_configs_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id);
```

### Cascading Deletion Rules

```sql
-- Preserve data integrity with careful cascading
ALTER TABLE user_tenants ADD CONSTRAINT fk_user_tenants_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Soft deletion for business records
ALTER TABLE documents ADD CONSTRAINT fk_documents_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT;
```

## Data Access Patterns

### Multi-Tenant Data Isolation

```typescript
// All queries must include tenant filtering
const getExpenses = async (tenantId: number) => {
  const { data } = await supabase
    .from('expenses')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);
  return data;
};
```

### Role-Based Access Control

```typescript
// Check user permissions before data access
const hasPermission = async (userId: number, tenantId: number, action: string) => {
  const { data } = await supabase
    .from('user_tenants')
    .select('role')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .single();
  
  return checkRolePermissions(data?.role, action);
};
```

## Database Administration

### Super Admin Preservation

The system maintains a super admin user for system management:

```typescript
// Super Admin Details
{
  email: "aki@diamondnxt.com",
  name: "Aki Super Admin",
  role: "admin",
  tenantId: 1,
  isActive: true
}
```

### Database Cleanup Script

The `db-clean.ts` script safely cleans data while preserving admin access:

```bash
npm run db:clean  # Preserves super admin and permissions
```

### Backup and Maintenance

```sql
-- Regular maintenance queries
VACUUM ANALYZE;  -- Optimize database performance
REINDEX DATABASE postgres;  -- Rebuild indexes

-- Data integrity checks
SELECT COUNT(*) FROM users WHERE is_active = true;
SELECT COUNT(*) FROM tenants WHERE is_active = true;
SELECT COUNT(*) FROM user_tenants WHERE is_active = true;
```

## Performance Optimization

### Indexes

```sql
-- Essential indexes for performance
CREATE INDEX idx_user_tenants_user_id ON user_tenants(user_id);
CREATE INDEX idx_user_tenants_tenant_id ON user_tenants(tenant_id);
CREATE INDEX idx_expenses_tenant_date ON expenses(tenant_id, expense_date);
CREATE INDEX idx_invoices_tenant_status ON invoices(tenant_id, status);
CREATE INDEX idx_documents_tenant_status ON documents(tenant_id, processing_status);
CREATE INDEX idx_clients_tenant_active ON clients(tenant_id, is_active);
```

### Query Optimization

```sql
-- Optimized queries with proper indexing
EXPLAIN ANALYZE SELECT * FROM expenses 
WHERE tenant_id = 1 AND expense_date >= '2025-01-01'
ORDER BY expense_date DESC;
```

## Security Considerations

### Data Encryption
- Passwords: bcrypt hashing with salt rounds
- OAuth tokens: AES encryption at rest
- Sensitive data: Application-level encryption for PII

### Access Control
- Row Level Security (RLS) policies for tenant isolation
- API authentication middleware for all routes
- Session-based authentication with secure cookies

### Audit Trail
- All tables include created_at and updated_at timestamps
- Soft deletion preserves audit history
- Document processing logs maintain complete workflow tracking

## Monitoring and Diagnostics

### Health Checks

```sql
-- Database health monitoring
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count,
  n_dead_tup as dead_rows
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

### Performance Metrics

```sql
-- Query performance analysis
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

This documentation reflects the current state of the Supabase database architecture as of June 23, 2025, including all recent improvements and enhancements to the multi-tenant authentication system and admin panel functionality.