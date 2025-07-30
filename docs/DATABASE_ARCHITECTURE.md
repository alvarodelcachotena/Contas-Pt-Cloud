# Database Architecture - Contas-PT
*Complete Database Documentation - Version 3.0*  
*Generated: January 29, 2025*

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Table Definitions](#table-definitions)
4. [Relationships and Constraints](#relationships-and-constraints)
5. [Data Types and Validation](#data-types-and-validation)
6. [Indexes and Performance](#indexes-and-performance)
7. [Sample Data](#sample-data)
8. [Migration Scripts](#migration-scripts)
9. [Backup and Recovery](#backup-and-recovery)
10. [Portuguese Compliance](#portuguese-compliance)

---

## Overview

### Database Technology
- **Platform**: Supabase (PostgreSQL 15+)
- **ORM**: Drizzle ORM with TypeScript
- **Architecture**: Multi-tenant with row-level isolation
- **Deployment**: Cloud-native on Supabase infrastructure

### Key Design Principles
- **Multi-tenancy**: All business data is tenant-scoped
- **Portuguese Compliance**: Built-in VAT and NIF validation
- **Data Integrity**: Foreign key constraints and validation
- **Performance**: Optimized indexes for common queries
- **Security**: Row Level Security (RLS) where applicable

### Database Connection
```bash
# Environment Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
│   tenants   │◄──►│   user_tenants  │◄──►│    users    │
│     (1)     │    │       (M)       │    │     (1)     │
└─────────────┘    └─────────────────┘    └─────────────┘
       │                                           
       │ 1:M                                      
       ▼                                          
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   clients   │    │  invoices   │    │  expenses   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   
       │ 1:M               │                   
       ▼                   ▼                   
┌─────────────┐    ┌─────────────┐             
│  payments   │    │ documents   │             
└─────────────┘    └─────────────┘             
                           │                   
                           │ 1:M               
                           ▼                   
                   ┌─────────────┐             
                   │cloud_drive_ │             
                   │  configs    │             
                   └─────────────┘             
```

### Table Hierarchy

#### Core Tables
1. **tenants** - Company/Organization entities
2. **users** - System users
3. **user_tenants** - User-company relationships

#### Business Tables
4. **clients** - Customer management
5. **invoices** - Invoice management  
6. **expenses** - Expense tracking
7. **bank_accounts** - Banking information
8. **payments** - Payment transactions

#### System Tables
9. **documents** - Document storage metadata
10. **cloud_drive_configs** - Cloud storage integrations

---

## Table Definitions

### 1. tenants (Companies/Organizations)

```sql
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    nif VARCHAR(20),                    -- Portuguese Tax ID
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Constraints
ALTER TABLE tenants ADD CONSTRAINT unique_nif UNIQUE (nif);
ALTER TABLE tenants ADD CONSTRAINT valid_nif CHECK (
    nif IS NULL OR 
    (LENGTH(nif) = 9 AND nif ~ '^[0-9]+$')
);
```

**Purpose**: Stores company/organization information for multi-tenant system.

**Fields**:
- `id`: Primary key, auto-increment
- `name`: Company legal name (required)
- `nif`: Portuguese tax identification number (9 digits)
- `address`: Complete company address
- `created_at`: Record creation timestamp

**Business Rules**:
- NIF must be 9 digits if provided
- Each NIF must be unique across system
- Name is required for all tenants

### 2. users (System Users)

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

-- Constraints
ALTER TABLE users ADD CONSTRAINT valid_email CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$');
ALTER TABLE users ADD CONSTRAINT valid_role CHECK (
    role IN ('super_admin', 'admin', 'accountant', 'assistant', 'viewer', 'user')
);
```

**Purpose**: Stores user authentication and profile information.

**Fields**:
- `id`: Primary key, auto-increment
- `email`: Unique email address for login
- `password_hash`: bcrypt hashed password
- `name`: User's full name
- `role`: System-wide role (for super admins)
- `is_active`: Account status flag
- `created_at`: Account creation timestamp

**Business Rules**:
- Email must be valid format and unique
- Password must be bcrypt hashed (12 rounds)
- Role determines system-wide permissions
- Inactive users cannot login

### 3. user_tenants (User-Company Relationships)

```sql
CREATE TABLE user_tenants (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'user',    -- admin, accountant, assistant, viewer, user
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);

-- Constraints
ALTER TABLE user_tenants ADD CONSTRAINT valid_tenant_role CHECK (
    role IN ('admin', 'accountant', 'assistant', 'viewer', 'user')
);
```

**Purpose**: Many-to-many relationship between users and companies with role-based access.

**Fields**:
- `id`: Primary key, auto-increment
- `user_id`: Reference to users table
- `tenant_id`: Reference to tenants table
- `role`: Company-specific role
- `created_at`: Relationship creation timestamp

**Business Rules**:
- Each user can belong to multiple companies
- Each company can have multiple users
- Role is specific to each company
- Unique constraint prevents duplicate relationships

### 4. clients (Customer Management)

```sql
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    nif VARCHAR(20),                    -- Portuguese Tax ID
    address TEXT,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_clients_tenant ON clients(tenant_id);
CREATE INDEX idx_clients_nif ON clients(nif) WHERE nif IS NOT NULL;

-- Constraints
ALTER TABLE clients ADD CONSTRAINT valid_client_email CHECK (
    email IS NULL OR email ~ '^[^@]+@[^@]+\.[^@]+$'
);
ALTER TABLE clients ADD CONSTRAINT valid_client_nif CHECK (
    nif IS NULL OR 
    (LENGTH(nif) = 9 AND nif ~ '^[0-9]+$')
);
```

**Purpose**: Stores customer/client information for invoicing and relationship management.

**Fields**:
- `id`: Primary key, auto-increment
- `tenant_id`: Company this client belongs to
- `name`: Client company or individual name
- `email`: Contact email address
- `nif`: Portuguese tax ID for invoicing
- `address`: Client address
- `phone`: Contact phone number
- `is_active`: Client status
- `created_at`: Record creation timestamp

**Business Rules**:
- All clients are tenant-scoped
- NIF validation for Portuguese tax compliance
- Email format validation when provided
- Soft deletion via is_active flag

### 5. invoices (Invoice Management)

```sql
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id),
    number VARCHAR(100) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_tax_id VARCHAR(20),
    issue_date DATE NOT NULL,
    due_date DATE,
    amount DECIMAL(10,2) NOT NULL,
    vat_amount DECIMAL(10,2) DEFAULT 0,
    vat_rate DECIMAL(5,2) DEFAULT 23,   -- Portuguese VAT rates: 6%, 13%, 23%
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    description TEXT,
    payment_terms TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_date ON invoices(issue_date);
CREATE INDEX idx_invoices_status ON invoices(status);

-- Constraints
ALTER TABLE invoices ADD CONSTRAINT valid_vat_rate CHECK (
    vat_rate IN (6, 13, 23)
);
ALTER TABLE invoices ADD CONSTRAINT valid_status CHECK (
    status IN ('draft', 'pending', 'sent', 'paid', 'overdue', 'cancelled')
);
ALTER TABLE invoices ADD CONSTRAINT positive_amounts CHECK (
    amount >= 0 AND vat_amount >= 0 AND total_amount >= 0
);
ALTER TABLE invoices ADD CONSTRAINT valid_dates CHECK (
    due_date IS NULL OR due_date >= issue_date
);
```

**Purpose**: Manages invoice generation, tracking, and Portuguese VAT compliance.

**Fields**:
- `id`: Primary key, auto-increment
- `tenant_id`: Company issuing the invoice
- `client_id`: Reference to client (optional)
- `number`: Invoice number (company-specific format)
- `client_name`: Client name (denormalized for SAF-T)
- `client_email`: Client email (denormalized)
- `client_tax_id`: Client NIF (denormalized)
- `issue_date`: Invoice issue date
- `due_date`: Payment due date
- `amount`: Net amount (before VAT)
- `vat_amount`: VAT amount
- `vat_rate`: Portuguese VAT rate (6%, 13%, 23%)
- `total_amount`: Total amount (amount + VAT)
- `status`: Invoice status
- `description`: Invoice description/items
- `payment_terms`: Payment terms text
- `created_at`: Record creation timestamp

**Business Rules**:
- VAT rates must be valid Portuguese rates
- Total amount must equal amount + VAT amount
- Due date must be after or equal to issue date
- All amounts must be positive
- Invoice numbers should be unique per tenant

### 6. expenses (Expense Tracking)

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
    processing_method VARCHAR(100),     -- 'manual', 'ai-upload', 'dropbox-sync', etc.
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_expenses_tenant ON expenses(tenant_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category);

-- Constraints
ALTER TABLE expenses ADD CONSTRAINT valid_expense_vat_rate CHECK (
    vat_rate IS NULL OR vat_rate IN (6, 13, 23)
);
ALTER TABLE expenses ADD CONSTRAINT positive_expense_amounts CHECK (
    amount >= 0 AND (vat_amount IS NULL OR vat_amount >= 0)
);
```

**Purpose**: Tracks business expenses with Portuguese VAT handling and AI categorization.

**Fields**:
- `id`: Primary key, auto-increment
- `tenant_id`: Company this expense belongs to
- `vendor`: Vendor/supplier name
- `amount`: Expense amount (including or excluding VAT)
- `vat_amount`: VAT amount if identified
- `vat_rate`: Portuguese VAT rate if applicable
- `category`: Portuguese business category
- `description`: Expense description
- `receipt_number`: Receipt/invoice number
- `expense_date`: Date of expense
- `is_deductible`: Tax deductibility flag
- `processing_method`: How expense was created
- `created_at`: Record creation timestamp

**Business Rules**:
- All expenses are tenant-scoped
- VAT rates must be valid Portuguese rates
- Amounts must be positive
- Category should match Portuguese business classifications
- Processing method tracks data source

### 7. bank_accounts (Banking Information)

```sql
CREATE TABLE bank_accounts (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255),
    iban VARCHAR(34),                   -- Portuguese IBAN format
    account_number VARCHAR(50),
    swift_code VARCHAR(11),
    balance DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bank_accounts_tenant ON bank_accounts(tenant_id);

-- Constraints
ALTER TABLE bank_accounts ADD CONSTRAINT valid_iban CHECK (
    iban IS NULL OR 
    (iban ~ '^PT[0-9]{2}[0-9]{4}[0-9]{4}[0-9]{11}[0-9]{2}$')
);
```

**Purpose**: Manages company bank account information for Portuguese banking integration.

**Fields**:
- `id`: Primary key, auto-increment
- `tenant_id`: Company this account belongs to
- `name`: Account nickname/description
- `bank_name`: Bank institution name
- `iban`: International Bank Account Number (Portuguese format)
- `account_number`: Local account number
- `swift_code`: SWIFT/BIC code
- `balance`: Current balance
- `is_active`: Account status
- `created_at`: Record creation timestamp

**Business Rules**:
- IBAN must follow Portuguese format (PT + 23 digits)
- All accounts are tenant-scoped
- Balance can be negative (overdraft)

### 8. payments (Payment Transactions)

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
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_bank_account ON payments(bank_account_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- Constraints
ALTER TABLE payments ADD CONSTRAINT valid_payment_type CHECK (
    type IN ('income', 'expense', 'transfer')
);
ALTER TABLE payments ADD CONSTRAINT valid_payment_status CHECK (
    status IN ('pending', 'completed', 'failed', 'cancelled')
);
```

**Purpose**: Tracks payment transactions and links them to invoices and bank accounts.

### 9. documents (Document Management)

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
    processing_method VARCHAR(100),     -- 'upload-web', 'dropbox-sync', 'google-drive-sync'
    ai_model_used VARCHAR(50),          -- 'gemini', 'openai', 'consensus'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_documents_status ON documents(processing_status);
CREATE INDEX idx_documents_method ON documents(processing_method);
CREATE GIN INDEX idx_documents_extracted_data ON documents USING GIN (extracted_data);

-- Constraints
ALTER TABLE documents ADD CONSTRAINT valid_processing_status CHECK (
    processing_status IN ('pending', 'processing', 'completed', 'failed', 'manual_review')
);
ALTER TABLE documents ADD CONSTRAINT valid_confidence_score CHECK (
    confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)
);
```

**Purpose**: Stores document metadata and AI processing results.

### 10. cloud_drive_configs (Cloud Storage Integration)

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
    sync_cursor TEXT,                   -- For delta sync
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, provider)
);

-- Indexes
CREATE INDEX idx_cloud_configs_tenant ON cloud_drive_configs(tenant_id);
CREATE INDEX idx_cloud_configs_active ON cloud_drive_configs(is_active);

-- Constraints
ALTER TABLE cloud_drive_configs ADD CONSTRAINT valid_provider CHECK (
    provider IN ('dropbox', 'google_drive')
);
```

**Purpose**: Manages cloud storage integrations for automated document processing.

---

## Relationships and Constraints

### Primary Relationships

#### 1. Multi-Tenant Architecture
```sql
-- All business data is tenant-scoped
tenant (1) ←→ (M) clients
tenant (1) ←→ (M) invoices  
tenant (1) ←→ (M) expenses
tenant (1) ←→ (M) bank_accounts
tenant (1) ←→ (M) payments
tenant (1) ←→ (M) documents
tenant (1) ←→ (M) cloud_drive_configs
```

#### 2. User-Tenant Relationships
```sql
-- Many-to-many with roles
users (M) ←→ (M) tenants (via user_tenants)
```

#### 3. Business Entity Relationships
```sql
-- Client-Invoice relationship
clients (1) ←→ (M) invoices

-- Bank Account-Payment relationship
bank_accounts (1) ←→ (M) payments

-- Invoice-Payment relationship (optional)
invoices (1) ←→ (M) payments
```

### Foreign Key Constraints

```sql
-- User-Tenant relationships
ALTER TABLE user_tenants 
ADD CONSTRAINT fk_user_tenants_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_tenants 
ADD CONSTRAINT fk_user_tenants_tenant_id 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Business entity constraints
ALTER TABLE clients 
ADD CONSTRAINT fk_clients_tenant_id 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE invoices 
ADD CONSTRAINT fk_invoices_tenant_id 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE invoices 
ADD CONSTRAINT fk_invoices_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

ALTER TABLE expenses 
ADD CONSTRAINT fk_expenses_tenant_id 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE bank_accounts 
ADD CONSTRAINT fk_bank_accounts_tenant_id 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE payments 
ADD CONSTRAINT fk_payments_tenant_id 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE payments 
ADD CONSTRAINT fk_payments_bank_account_id 
FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL;

ALTER TABLE payments 
ADD CONSTRAINT fk_payments_invoice_id 
FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;

ALTER TABLE documents 
ADD CONSTRAINT fk_documents_tenant_id 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE cloud_drive_configs 
ADD CONSTRAINT fk_cloud_configs_tenant_id 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
```

### Data Integrity Rules

#### 1. Cascading Deletes
- Deleting a tenant removes all associated business data
- Deleting a user removes their tenant relationships
- Deleting a client sets invoice client_id to NULL (soft reference)

#### 2. Referential Integrity
- All tenant-scoped data must reference valid tenant
- User-tenant relationships must reference valid users and tenants
- Optional references use SET NULL on delete

#### 3. Business Logic Constraints
- Invoice totals must equal net + VAT amounts
- VAT rates must be valid Portuguese rates
- Dates must be logical (due_date >= issue_date)
- Amounts must be positive where applicable

---

## Data Types and Validation

### PostgreSQL Data Types Used

#### Numeric Types
```sql
SERIAL          -- Auto-incrementing integers (1, 2, 3...)
INTEGER         -- Standard integers
DECIMAL(10,2)   -- Fixed-point decimals for currency (10 digits, 2 decimal places)
DECIMAL(5,2)    -- Percentages (5 digits, 2 decimal places)
DECIMAL(3,2)    -- Confidence scores (0.00 to 1.00)
```

#### Text Types
```sql
VARCHAR(n)      -- Variable-length strings with limit
TEXT            -- Unlimited text
JSONB           -- Binary JSON storage (for extracted_data)
```

#### Date/Time Types
```sql
DATE            -- Date only (YYYY-MM-DD)
TIMESTAMP       -- Date and time with timezone
```

#### Boolean Types
```sql
BOOLEAN         -- TRUE/FALSE values
```

### Validation Rules

#### Portuguese NIF Validation
```sql
-- NIF must be exactly 9 digits
CONSTRAINT valid_nif CHECK (
    nif IS NULL OR 
    (LENGTH(nif) = 9 AND nif ~ '^[0-9]+$')
)
```

#### Email Validation
```sql
-- Basic email format validation
CONSTRAINT valid_email CHECK (
    email ~ '^[^@]+@[^@]+\.[^@]+$'
)
```

#### Portuguese VAT Rates
```sql
-- Only valid Portuguese VAT rates
CONSTRAINT valid_vat_rate CHECK (
    vat_rate IN (6, 13, 23)
)
```

#### Portuguese IBAN Validation
```sql
-- Portuguese IBAN format: PT + 23 digits
CONSTRAINT valid_iban CHECK (
    iban IS NULL OR 
    (iban ~ '^PT[0-9]{2}[0-9]{4}[0-9]{4}[0-9]{11}[0-9]{2}$')
)
```

#### Amount Validation
```sql
-- Ensure positive amounts
CONSTRAINT positive_amounts CHECK (
    amount >= 0 AND vat_amount >= 0 AND total_amount >= 0
)
```

#### Date Logic Validation
```sql
-- Due date must be after issue date
CONSTRAINT valid_dates CHECK (
    due_date IS NULL OR due_date >= issue_date
)
```

---

## Indexes and Performance

### Performance Indexes

#### Tenant-Based Queries
```sql
-- All tenant-scoped data should have tenant indexes
CREATE INDEX idx_clients_tenant ON clients(tenant_id);
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_expenses_tenant ON expenses(tenant_id);
CREATE INDEX idx_bank_accounts_tenant ON bank_accounts(tenant_id);
CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_cloud_configs_tenant ON cloud_drive_configs(tenant_id);
```

#### Date-Based Queries
```sql
-- Common date range queries
CREATE INDEX idx_invoices_date ON invoices(issue_date);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_payments_date ON payments(payment_date);
```

#### Status and Category Queries
```sql
-- Status filtering
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_documents_status ON documents(processing_status);

-- Category filtering
CREATE INDEX idx_expenses_category ON expenses(category);
```

#### Foreign Key Indexes
```sql
-- Improve JOIN performance
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_payments_bank_account ON payments(bank_account_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
```

#### Specialized Indexes
```sql
-- Partial indexes for performance
CREATE INDEX idx_active_clients ON clients(tenant_id) WHERE is_active = true;
CREATE INDEX idx_active_configs ON cloud_drive_configs(is_active) WHERE is_active = true;

-- GIN index for JSONB data
CREATE INDEX idx_documents_extracted_data ON documents USING GIN (extracted_data);

-- Composite indexes for common queries
CREATE INDEX idx_expenses_tenant_date ON expenses(tenant_id, expense_date);
CREATE INDEX idx_invoices_tenant_status ON invoices(tenant_id, status);
```

### Query Performance Examples

#### Optimized Dashboard Query
```sql
-- Get tenant dashboard metrics with single query
SELECT 
    COUNT(CASE WHEN i.id IS NOT NULL THEN 1 END) as total_invoices,
    COUNT(CASE WHEN e.id IS NOT NULL THEN 1 END) as total_expenses,
    COUNT(CASE WHEN d.id IS NOT NULL THEN 1 END) as total_documents,
    COUNT(CASE WHEN c.id IS NOT NULL THEN 1 END) as total_clients,
    COALESCE(SUM(i.total_amount), 0) as total_revenue,
    COALESCE(SUM(e.amount), 0) as total_expense_amount
FROM tenants t
LEFT JOIN invoices i ON t.id = i.tenant_id
LEFT JOIN expenses e ON t.id = e.tenant_id  
LEFT JOIN documents d ON t.id = d.tenant_id
LEFT JOIN clients c ON t.id = c.tenant_id AND c.is_active = true
WHERE t.id = $1;
```

#### Efficient Expense Listing
```sql
-- Get expenses with pagination and filtering
SELECT 
    id, vendor, amount, vat_amount, vat_rate, category,
    description, expense_date, is_deductible, created_at
FROM expenses 
WHERE tenant_id = $1 
    AND ($2::text IS NULL OR category = $2)
    AND ($3::date IS NULL OR expense_date >= $3)
    AND ($4::date IS NULL OR expense_date <= $4)
ORDER BY expense_date DESC, created_at DESC
LIMIT $5 OFFSET $6;
```

---

## Sample Data

### Initial Setup Data

#### Default Tenant
```sql
INSERT INTO tenants (name, nif, address) VALUES (
    'DIAMOND NXT TRADING, LDA',
    '517124548',
    'Rua das Flores, 123, 4400-000 Vila Nova de Gaia, Portugal'
);
```

#### Default Admin User
```sql
INSERT INTO users (email, password_hash, name, role) VALUES (
    'admin@contas-pt.com',
    '$2b$12$rQoOz5wD2nKp5PGzKOGYA.xQg5vKp5PGzKOGYA.xQg5vKp5PGzKOGYA',
    'Admin User',
    'super_admin'
);
```

#### User-Tenant Relationship
```sql
INSERT INTO user_tenants (user_id, tenant_id, role) VALUES (
    1, 1, 'admin'
);
```

### Sample Business Data

#### Sample Clients
```sql
INSERT INTO clients (tenant_id, name, email, nif, address, phone) VALUES 
(1, 'Empresa ABC, Lda', 'geral@empresaabc.pt', '123456789', 'Av. da República, 100, Lisboa', '+351 212 345 678'),
(1, 'Consultoria XYZ', 'info@consultoriaxyz.pt', '987654321', 'Rua do Comércio, 50, Porto', '+351 223 456 789'),
(1, 'João Silva (Individual)', 'joao.silva@email.pt', '111222333', 'Rua das Palmeiras, 25, Braga', '+351 253 123 456');
```

#### Sample Bank Accounts
```sql
INSERT INTO bank_accounts (tenant_id, name, bank_name, iban, balance) VALUES 
(1, 'Conta Principal', 'Banco Comercial Português', 'PT50000201231234567890154', 15000.00),
(1, 'Conta Poupanças', 'Caixa Geral de Depósitos', 'PT50003501231234567890187', 5000.00);
```

#### Sample Invoices
```sql
INSERT INTO invoices (tenant_id, client_id, number, client_name, issue_date, due_date, amount, vat_amount, vat_rate, total_amount, status, description) VALUES 
(1, 1, 'FAT/2025/001', 'Empresa ABC, Lda', '2025-07-01', '2025-07-31', 1000.00, 230.00, 23, 1230.00, 'sent', 'Serviços de consultoria técnica'),
(1, 2, 'FAT/2025/002', 'Consultoria XYZ', '2025-07-02', '2025-08-01', 750.00, 172.50, 23, 922.50, 'pending', 'Desenvolvimento de software personalizado'),
(1, 3, 'FAT/2025/003', 'João Silva (Individual)', '2025-07-03', '2025-07-18', 300.00, 69.00, 23, 369.00, 'paid', 'Formação em informática');
```

#### Sample Expenses
```sql
INSERT INTO expenses (tenant_id, vendor, amount, vat_amount, vat_rate, category, description, expense_date, receipt_number) VALUES 
(1, 'Galp Energia', 45.67, 10.50, 23, 'combustíveis', 'Abastecimento viatura empresa', '2025-07-01', 'GAL123456'),
(1, 'Restaurante O Fado', 25.50, 5.87, 23, 'refeições', 'Almoço de negócios com cliente', '2025-07-01', 'RF789'),
(1, 'Staples Portugal', 67.89, 15.61, 23, 'material_escritório', 'Material de escritório diverso', '2025-07-02', 'STP456123'),
(1, 'Hotel Vila Galé', 120.00, 27.60, 23, 'deslocações', 'Estadia para reunião em Lisboa', '2025-07-02', 'HVG987654');
```

#### Sample Documents
```sql
INSERT INTO documents (tenant_id, filename, processing_status, confidence_score, extracted_data, processing_method, ai_model_used) VALUES 
(1, 'fatura_galp_001.pdf', 'completed', 0.95, '{"vendor": "Galp Energia", "amount": 45.67, "vat_amount": 10.50, "nif": "500460044"}', 'upload-web', 'gemini'),
(1, 'recibo_restaurante_789.jpg', 'completed', 0.87, '{"vendor": "Restaurante O Fado", "amount": 25.50, "vat_amount": 5.87}', 'dropbox-sync', 'openai'),
(1, 'invoice_hotel_vilgale.pdf', 'completed', 0.92, '{"vendor": "Hotel Vila Galé", "amount": 120.00, "vat_amount": 27.60, "category": "alojamento"}', 'dropbox-sync', 'consensus');
```

---

## Migration Scripts

### Initial Database Setup

#### Complete Schema Creation
```sql
-- Create all tables with proper constraints
-- Run this script to set up a fresh database

BEGIN;

-- 1. Create tenants table
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    nif VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create users table  
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create user_tenants relationship table
CREATE TABLE user_tenants (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);

-- 4. Create clients table
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    nif VARCHAR(20),
    address TEXT,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create invoices table
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id),
    number VARCHAR(100) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_tax_id VARCHAR(20),
    issue_date DATE NOT NULL,
    due_date DATE,
    amount DECIMAL(10,2) NOT NULL,
    vat_amount DECIMAL(10,2) DEFAULT 0,
    vat_rate DECIMAL(5,2) DEFAULT 23,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    description TEXT,
    payment_terms TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Create expenses table
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
    processing_method VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Create bank_accounts table
CREATE TABLE bank_accounts (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255),
    iban VARCHAR(34),
    account_number VARCHAR(50),
    swift_code VARCHAR(11),
    balance DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Create payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bank_account_id INTEGER REFERENCES bank_accounts(id),
    invoice_id INTEGER REFERENCES invoices(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    description TEXT,
    reference VARCHAR(100),
    type VARCHAR(50) DEFAULT 'income',
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Create documents table
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
    ai_model_used VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 10. Create cloud_drive_configs table
CREATE TABLE cloud_drive_configs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    folder_path VARCHAR(500) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    sync_cursor TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, provider)
);

-- Add all constraints
ALTER TABLE tenants ADD CONSTRAINT valid_nif CHECK (
    nif IS NULL OR (LENGTH(nif) = 9 AND nif ~ '^[0-9]+$')
);

ALTER TABLE users ADD CONSTRAINT valid_email CHECK (
    email ~ '^[^@]+@[^@]+\.[^@]+$'
);

ALTER TABLE users ADD CONSTRAINT valid_role CHECK (
    role IN ('super_admin', 'admin', 'accountant', 'assistant', 'viewer', 'user')
);

ALTER TABLE user_tenants ADD CONSTRAINT valid_tenant_role CHECK (
    role IN ('admin', 'accountant', 'assistant', 'viewer', 'user')
);

ALTER TABLE invoices ADD CONSTRAINT valid_vat_rate CHECK (
    vat_rate IN (6, 13, 23)
);

ALTER TABLE invoices ADD CONSTRAINT positive_amounts CHECK (
    amount >= 0 AND vat_amount >= 0 AND total_amount >= 0
);

ALTER TABLE expenses ADD CONSTRAINT valid_expense_vat_rate CHECK (
    vat_rate IS NULL OR vat_rate IN (6, 13, 23)
);

ALTER TABLE bank_accounts ADD CONSTRAINT valid_iban CHECK (
    iban IS NULL OR (iban ~ '^PT[0-9]{2}[0-9]{4}[0-9]{4}[0-9]{11}[0-9]{2}$')
);

-- Create all indexes
CREATE INDEX idx_clients_tenant ON clients(tenant_id);
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_date ON invoices(issue_date);
CREATE INDEX idx_expenses_tenant ON expenses(tenant_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_bank_accounts_tenant ON bank_accounts(tenant_id);
CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_cloud_configs_tenant ON cloud_drive_configs(tenant_id);

-- Insert initial data
INSERT INTO tenants (name, nif, address) VALUES (
    'DIAMOND NXT TRADING, LDA',
    '517124548', 
    'Vila Nova de Gaia, Portugal'
);

INSERT INTO users (email, password_hash, name, role) VALUES (
    'admin@contas-pt.com',
    '$2b$10$rQoOz5wD2nKp5PGzKOGYA.xQg5vKp5PGzKOGYA.xQg5vKp5PGzKOGYA',
    'Admin User',
    'super_admin'
);

INSERT INTO user_tenants (user_id, tenant_id, role) VALUES (
    1, 1, 'admin'
);

COMMIT;

SELECT 'Database setup completed successfully! All tables created with proper relationships and indexes.' as status;
```

### Data Migration Scripts

#### Migration from Old Schema
```sql
-- Migration script for updating existing database
-- Run when upgrading from previous versions

BEGIN;

-- Add new columns if they don't exist
ALTER TABLE documents ADD COLUMN IF NOT EXISTS processing_method VARCHAR(100);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_model_used VARCHAR(50);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS processing_method VARCHAR(100);

-- Update existing data
UPDATE documents SET processing_method = 'legacy' WHERE processing_method IS NULL;
UPDATE expenses SET processing_method = 'manual' WHERE processing_method IS NULL;

-- Add new indexes
CREATE INDEX IF NOT EXISTS idx_documents_method ON documents(processing_method);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

COMMIT;
```

---

## Backup and Recovery

### Backup Strategy

#### Daily Automated Backup
```bash
#!/bin/bash
# daily-backup.sh - Run via cron every day at 2 AM

# Configuration
BACKUP_DIR="/backups/contas-pt"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="contas_pt_backup_${DATE}.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create database backup
pg_dump $DATABASE_URL > "$BACKUP_DIR/$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_DIR/$BACKUP_FILE"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Upload to cloud storage (optional)
# aws s3 cp "$BACKUP_DIR/$BACKUP_FILE.gz" s3://your-backup-bucket/daily/

echo "Backup completed: $BACKUP_FILE.gz"
```

#### Schema-Only Backup
```bash
# Export schema structure only
pg_dump --schema-only $DATABASE_URL > schema_backup.sql

# Export data only (without schema)
pg_dump --data-only $DATABASE_URL > data_backup.sql
```

#### Selective Table Backup
```bash
# Backup specific tables
pg_dump --table=tenants --table=users --table=user_tenants $DATABASE_URL > core_tables.sql

# Backup business data only
pg_dump --table=clients --table=invoices --table=expenses $DATABASE_URL > business_data.sql
```

### Recovery Procedures

#### Full Database Restore
```bash
# Restore complete database
psql $DATABASE_URL < full_backup.sql

# Or restore with specific options
pg_restore --verbose --clean --no-acl --no-owner -d $DATABASE_URL backup_file.dump
```

#### Selective Table Restore
```sql
-- Restore specific table (careful with foreign keys)
BEGIN;

-- Disable triggers temporarily
ALTER TABLE target_table DISABLE TRIGGER ALL;

-- Truncate table
TRUNCATE target_table CASCADE;

-- Restore data
\copy target_table FROM 'backup_data.csv' WITH CSV HEADER;

-- Re-enable triggers
ALTER TABLE target_table ENABLE TRIGGER ALL;

COMMIT;
```

#### Point-in-Time Recovery
```bash
# If using Supabase, use their dashboard for point-in-time recovery
# For self-hosted PostgreSQL with WAL-E:

# Restore to specific timestamp
wal-e backup-fetch /var/lib/postgresql/data LATEST
pg_ctl start -D /var/lib/postgresql/data
psql -c "SELECT pg_create_restore_point('before_recovery');"
```

### Disaster Recovery Plan

#### Recovery Time Objectives (RTO)
- **Critical**: < 4 hours (authentication, core business functions)
- **Important**: < 24 hours (full application functionality)
- **Standard**: < 72 hours (historical data, reports)

#### Recovery Point Objectives (RPO)
- **Production**: < 1 hour (automated backups)
- **Development**: < 24 hours (daily backups)

#### Recovery Checklist
1. **Assess Damage**
   - Determine scope of data loss
   - Identify affected tables/functions
   
2. **Restore Infrastructure**
   - Provision new database if needed
   - Configure networking and security
   
3. **Restore Data**
   - Apply latest backup
   - Verify data integrity
   - Test critical functions
   
4. **Update Application**
   - Update connection strings
   - Restart application services
   - Verify functionality
   
5. **Communicate Status**
   - Notify users of recovery
   - Document lessons learned

---

## Portuguese Compliance

### VAT (IVA) Implementation

#### Portuguese VAT Rates
```sql
-- Standard VAT rates in Portugal
CREATE TABLE vat_rates (
    rate DECIMAL(5,2) PRIMARY KEY,
    description VARCHAR(100) NOT NULL,
    applicable_to TEXT
);

INSERT INTO vat_rates VALUES 
(6, 'Taxa reduzida', 'Bens alimentares, medicamentos, livros'),
(13, 'Taxa intermédia', 'Restauração, hotelaria, eventos culturais'),
(23, 'Taxa normal', 'Generalidade dos bens e serviços');
```

#### VAT Calculation Functions
```sql
-- Calculate VAT amount from net amount
CREATE OR REPLACE FUNCTION calculate_vat(net_amount DECIMAL, vat_rate DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    RETURN ROUND((net_amount * vat_rate / 100), 2);
END;
$$ LANGUAGE plpgsql;

-- Reverse VAT calculation (from gross to net)
CREATE OR REPLACE FUNCTION reverse_vat(gross_amount DECIMAL, vat_rate DECIMAL)
RETURNS TABLE(net_amount DECIMAL, vat_amount DECIMAL) AS $$
BEGIN
    RETURN QUERY SELECT 
        ROUND(gross_amount / (1 + vat_rate / 100), 2),
        ROUND(gross_amount - (gross_amount / (1 + vat_rate / 100)), 2);
END;
$$ LANGUAGE plpgsql;
```

### NIF (Tax ID) Validation

#### NIF Validation Function
```sql
-- Portuguese NIF validation function
CREATE OR REPLACE FUNCTION validate_nif(nif TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    clean_nif TEXT;
    check_digit INTEGER;
    calculated_digit INTEGER;
    sum_value INTEGER;
    i INTEGER;
BEGIN
    -- Clean input (remove spaces and non-digits)
    clean_nif := regexp_replace(nif, '[^0-9]', '', 'g');
    
    -- Must be exactly 9 digits
    IF LENGTH(clean_nif) != 9 THEN
        RETURN FALSE;
    END IF;
    
    -- First digit must be valid (1, 2, 3, 5, 6, 8, 9)
    IF SUBSTRING(clean_nif, 1, 1)::INTEGER NOT IN (1, 2, 3, 5, 6, 8, 9) THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate check digit
    sum_value := 0;
    FOR i IN 1..8 LOOP
        sum_value := sum_value + (SUBSTRING(clean_nif, i, 1)::INTEGER * (10 - i));
    END LOOP;
    
    calculated_digit := 11 - (sum_value % 11);
    IF calculated_digit >= 10 THEN
        calculated_digit := 0;
    END IF;
    
    check_digit := SUBSTRING(clean_nif, 9, 1)::INTEGER;
    
    RETURN calculated_digit = check_digit;
END;
$$ LANGUAGE plpgsql;
```

#### NIF Formatting Function
```sql
-- Format NIF for display
CREATE OR REPLACE FUNCTION format_nif(nif TEXT)
RETURNS TEXT AS $$
DECLARE
    clean_nif TEXT;
BEGIN
    clean_nif := regexp_replace(nif, '[^0-9]', '', 'g');
    
    IF LENGTH(clean_nif) = 9 THEN
        RETURN SUBSTRING(clean_nif, 1, 3) || ' ' || 
               SUBSTRING(clean_nif, 4, 3) || ' ' || 
               SUBSTRING(clean_nif, 7, 3);
    END IF;
    
    RETURN nif;
END;
$$ LANGUAGE plpgsql;
```

### SAF-T Export Support

#### SAF-T Required Data Views
```sql
-- View for SAF-T header information
CREATE OR REPLACE VIEW saft_header AS
SELECT 
    t.nif as company_tax_id,
    t.name as company_name,
    t.address as company_address,
    EXTRACT(YEAR FROM NOW()) as fiscal_year,
    'EUR' as currency_code,
    '1.04_01' as audit_file_version
FROM tenants t;

-- View for SAF-T customer data
CREATE OR REPLACE VIEW saft_customers AS
SELECT 
    c.id::TEXT as customer_id,
    c.name as customer_name,
    c.nif as customer_tax_id,
    c.address as customer_address,
    c.email as customer_email,
    c.tenant_id
FROM clients c
WHERE c.is_active = true;

-- View for SAF-T invoice data
CREATE OR REPLACE VIEW saft_invoices AS
SELECT 
    i.number as invoice_no,
    i.issue_date,
    i.client_name as customer_name,
    i.client_tax_id as customer_tax_id,
    i.amount as net_total,
    i.vat_amount as tax_total,
    i.total_amount as gross_total,
    i.vat_rate as tax_rate,
    i.status as invoice_status,
    i.tenant_id
FROM invoices i;
```

#### Portuguese Business Categories
```sql
-- Portuguese expense categories for SAF-T
CREATE TABLE portuguese_categories (
    code VARCHAR(20) PRIMARY KEY,
    description VARCHAR(200) NOT NULL,
    saft_code VARCHAR(20),
    is_deductible BOOLEAN DEFAULT true,
    deduction_percentage INTEGER DEFAULT 100
);

INSERT INTO portuguese_categories VALUES
('combustíveis', 'Combustíveis e lubrificantes', '26.06.01', true, 100),
('viaturas', 'Viaturas ligeiras de passageiros', '26.06.02', true, 50),
('refeições', 'Encargos com refeições', '26.02.01', true, 100),
('representação', 'Encargos de representação', '26.02.02', true, 50),
('comunicações', 'Telefones, fax e internet', '26.03.01', true, 100),
('material_escritório', 'Material de escritório', '26.04.01', true, 100),
('consultoria', 'Honorários e consultoria', '26.08.01', true, 100),
('seguros', 'Seguros', '26.07.01', true, 100),
('rendas', 'Rendas e alugueres', '26.05.01', true, 100),
('publicidade', 'Publicidade e marketing', '26.09.01', true, 100);
```

---

*This database documentation provides comprehensive coverage of the Contas-PT database architecture, including all tables, relationships, constraints, and Portuguese compliance features. The database is designed to support multi-tenant Portuguese accounting with full VAT compliance and AI-powered document processing.*