# Database Schema - Contas-PT

## Overview
Complete PostgreSQL database schema using Supabase with Drizzle ORM for the Portuguese Accounting System.

## Core Tables

### Tenants (Companies)
```sql
CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  nif VARCHAR(9) UNIQUE, -- Portuguese tax ID
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Users
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY, -- UUID
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### User-Tenant Relationships
```sql
CREATE TABLE user_tenants (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'user', -- admin, accountant, assistant, viewer
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);
```

## Business Entities

### Clients
```sql
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  nif VARCHAR(9), -- Portuguese tax ID
  address TEXT,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Invoices
```sql
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  number VARCHAR(50) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  client_tax_id VARCHAR(20),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  vat_amount DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,2) NOT NULL, -- Portuguese IVA rates: 6%, 13%, 23%
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  description TEXT,
  payment_terms TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Expenses
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
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Documents
```sql
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(50),
  storage_path VARCHAR(500),
  processing_status VARCHAR(50) DEFAULT 'pending',
  extracted_data JSONB,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Bank Accounts
```sql
CREATE TABLE bank_accounts (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bank_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  iban VARCHAR(34),
  current_balance DECIMAL(15,2) DEFAULT 0,
  account_type VARCHAR(50) DEFAULT 'checking',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Payments
```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bank_account_id INTEGER REFERENCES bank_accounts(id),
  invoice_id INTEGER REFERENCES invoices(id),
  type VARCHAR(50) NOT NULL, -- income, expense, transfer
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Cloud Integration Tables

### Cloud Drive Configurations
```sql
CREATE TABLE cloud_drive_configs (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'dropbox', 'google_drive'
  provider_user_id VARCHAR(255),
  user_email VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  folder_path VARCHAR(500),
  sync_cursor TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, provider)
);
```

### Webhook Credentials
```sql
CREATE TABLE webhook_credentials (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  service_type VARCHAR(50) NOT NULL, -- 'whatsapp', 'gmail', 'dropbox'
  credential_name VARCHAR(100) NOT NULL,
  encrypted_value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Indexes and Constraints

### Performance Indexes
```sql
-- Tenant-based queries
CREATE INDEX idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX idx_expenses_tenant_id ON expenses(tenant_id);
CREATE INDEX idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);

-- Date-based queries
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX idx_payments_transaction_date ON payments(transaction_date);

-- Status queries
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_documents_processing_status ON documents(processing_status);

-- Cloud integration queries
CREATE INDEX idx_cloud_drive_configs_tenant_provider ON cloud_drive_configs(tenant_id, provider);
CREATE INDEX idx_webhook_credentials_tenant_service ON webhook_credentials(tenant_id, service_type);
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

-- Business entity relationships
ALTER TABLE clients ADD CONSTRAINT fk_clients_tenant_id 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE invoices ADD CONSTRAINT fk_invoices_tenant_id 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE expenses ADD CONSTRAINT fk_expenses_tenant_id 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE documents ADD CONSTRAINT fk_documents_tenant_id 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE bank_accounts ADD CONSTRAINT fk_bank_accounts_tenant_id 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE payments ADD CONSTRAINT fk_payments_tenant_id 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
```

## Row Level Security (RLS)

### Tenant Data Isolation
```sql
-- Enable RLS on all tenant-related tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_drive_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies for tenant isolation
CREATE POLICY tenant_isolation_clients ON clients
  USING (tenant_id IN (
    SELECT tenant_id FROM user_tenants 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY tenant_isolation_invoices ON invoices
  USING (tenant_id IN (
    SELECT tenant_id FROM user_tenants 
    WHERE user_id = auth.uid()
  ));

-- Similar policies for all other tenant-related tables
```

## Portuguese Business Compliance

### VAT/IVA Configuration
- Standard rates: 6% (reduced), 13% (intermediate), 23% (normal)
- NIF validation: 9-digit Portuguese tax identification format
- Euro currency with Portuguese decimal formatting

### Category Classifications
- Portuguese expense categories for tax compliance
- Deductible expense tracking for tax reporting
- SAF-T (Standard Audit File for Tax) compatibility

This schema ensures complete multi-tenant data isolation, Portuguese tax compliance, and efficient querying for the accounting system.