-- Core Tables for Contas-PT Cloud
-- This file creates the main business tables

-- Tenants (Multi-tenant support)
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    nif TEXT, -- Portuguese NIF
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Users 
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User-Tenant Mapping (Many-to-Many with roles)
CREATE TABLE IF NOT EXISTS user_tenants (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);

-- Bank Accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    bank_name TEXT,
    iban TEXT,
    account_number TEXT,
    swift_code TEXT,
    balance NUMERIC(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    nif TEXT, -- Portuguese NIF
    address TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    number TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_tax_id TEXT,
    issue_date DATE NOT NULL,
    due_date DATE,
    amount NUMERIC(10,2) NOT NULL,
    vat_amount NUMERIC(10,2) DEFAULT 0,
    vat_rate NUMERIC(5,2) DEFAULT 23,
    total_amount NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    description TEXT,
    payment_terms TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vendor TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    vat_amount NUMERIC(10,2),
    vat_rate NUMERIC(5,2),
    category TEXT NOT NULL,
    description TEXT,
    receipt_number TEXT,
    expense_date DATE NOT NULL,
    is_deductible BOOLEAN DEFAULT TRUE,
    processing_method TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bank_account_id INTEGER REFERENCES bank_accounts(id) ON DELETE SET NULL,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    description TEXT,
    reference TEXT,
    type TEXT DEFAULT 'income',
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bank Transactions
CREATE TABLE IF NOT EXISTS bank_transactions (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bank_account_id INTEGER NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    external_id TEXT,
    amount NUMERIC(10,2) NOT NULL,
    description TEXT NOT NULL,
    transaction_date DATE NOT NULL,
    value_date DATE,
    reference TEXT,
    counterparty TEXT,
    counterparty_account TEXT,
    type TEXT NOT NULL, -- debit, credit
    category TEXT,
    is_reconciled BOOLEAN DEFAULT FALSE,
    reconciled_with TEXT,
    reconciled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- VAT Rates
CREATE TABLE IF NOT EXISTS vat_rates (
    id SERIAL PRIMARY KEY,
    region TEXT NOT NULL, -- mainland, azores, madeira
    category TEXT NOT NULL, -- normal, intermediate, reduced
    rate NUMERIC(5,2) NOT NULL,
    effective_date DATE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- SAF-T Exports
CREATE TABLE IF NOT EXISTS saft_exports (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    filename TEXT NOT NULL,
    file_size INTEGER,
    status TEXT NOT NULL DEFAULT 'generating', -- generating, completed, failed
    download_url TEXT,
    generated_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Manager Approvals
CREATE TABLE IF NOT EXISTS manager_approvals (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL, -- payment_terms, expedition_override, special_conditions
    requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    request_details JSONB NOT NULL,
    approval_notes TEXT,
    is_one_time BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    decided_at TIMESTAMP
);

-- Extracted Invoice Data
CREATE TABLE IF NOT EXISTS extracted_invoice_data (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_id INTEGER NOT NULL,
    issuer TEXT,
    issuer_tax_id TEXT,
    issuer_country TEXT,
    issuer_address TEXT,
    issuer_phone TEXT,
    invoice_number TEXT,
    invoice_date DATE,
    due_date DATE,
    total_amount NUMERIC(10,2),
    vat_amount NUMERIC(10,2),
    vat_rate NUMERIC(5,2),
    currency TEXT DEFAULT 'EUR',
    category TEXT,
    description TEXT,
    confidence NUMERIC(5,2),
    processing_method TEXT, -- gemini, openai, hybrid
    extracted_at TIMESTAMP DEFAULT NOW()
);

-- Monthly Statement Entries
CREATE TABLE IF NOT EXISTS monthly_statement_entries (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    statement_period TEXT NOT NULL, -- YYYY-MM format
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    entry_date DATE NOT NULL,
    entry_type TEXT NOT NULL, -- invoice, expense, payment
    reference_id INTEGER, -- Links to invoice/expense/payment ID
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    vat_amount NUMERIC(10,2),
    vat_rate NUMERIC(5,2),
    category TEXT,
    client_supplier TEXT,
    document_number TEXT,
    is_deductible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Log successful table creation
DO $$
BEGIN
    RAISE NOTICE '✅ Core tables created successfully';
END $$;



