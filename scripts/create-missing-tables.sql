-- Script para crear las tablas faltantes para conectar todas las views a la base de datos

-- 1. TABLA DE TRANSACCIONES BANCARIAS
CREATE TABLE IF NOT EXISTS banking_transactions (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    account_number VARCHAR(50) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('credit', 'debit', 'transfer')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    transaction_date DATE NOT NULL,
    balance DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA DE REGISTROS DE IVA
CREATE TABLE IF NOT EXISTS vat_records (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    period VARCHAR(7) NOT NULL, -- Formato: YYYY-MM
    total_sales DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_purchases DECIMAL(12,2) NOT NULL DEFAULT 0,
    vat_collected DECIMAL(12,2) NOT NULL DEFAULT 0,
    vat_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
    vat_due DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
    due_date DATE,
    submitted_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE DOCUMENTOS SAFT
CREATE TABLE IF NOT EXISTS saft_documents (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    period VARCHAR(7) NOT NULL, -- Formato: YYYY-MM
    generated_date DATE NOT NULL,
    records INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'validated', 'submitted', 'approved')),
    file_path VARCHAR(500),
    file_size BIGINT,
    checksum VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE REPORTES
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    generated_date DATE NOT NULL,
    period VARCHAR(7), -- Formato: YYYY-MM
    status VARCHAR(20) NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'processing', 'completed', 'failed')),
    file_path VARCHAR(500),
    file_size BIGINT,
    parameters JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA DE DOCUMENTOS (NUEVA)
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_type VARCHAR(50),
    file_size BIGINT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    document_type VARCHAR(100),
    extracted_data JSONB,
    confidence DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_banking_transactions_tenant_date ON banking_transactions(tenant_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_vat_records_tenant_period ON vat_records(tenant_id, period);
CREATE INDEX IF NOT EXISTS idx_saft_documents_tenant_period ON saft_documents(tenant_id, period);
CREATE INDEX IF NOT EXISTS idx_reports_tenant_type_date ON reports(tenant_id, type, generated_date);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_status ON documents(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_uploaded ON documents(tenant_id, uploaded_at);

-- Insertar datos de ejemplo para testing

-- Datos de ejemplo para banking_transactions
INSERT INTO banking_transactions (tenant_id, account_number, transaction_type, amount, description, transaction_date, balance, category, reference) VALUES
(1, 'PT50000123456789012345', 'credit', 2500.00, 'Recebimento de fatura FAT-2024-001', '2024-01-15', 2500.00, 'Receitas', 'REF001'),
(1, 'PT50000123456789012345', 'debit', -150.00, 'Pagamento de material de escritório', '2024-01-16', 2350.00, 'Despesas', 'REF002'),
(1, 'PT50000123456789012345', 'credit', 1800.00, 'Recebimento de fatura FAT-2024-002', '2024-01-17', 4150.00, 'Receitas', 'REF003'),
(1, 'PT50000123456789012345', 'debit', -75.50, 'Pagamento de serviços de internet', '2024-01-18', 4074.50, 'Serviços', 'REF004'),
(1, 'PT50000123456789012345', 'credit', 3200.00, 'Recebimento de fatura FAT-2024-003', '2024-01-19', 7274.50, 'Receitas', 'REF005')
ON CONFLICT DO NOTHING;

-- Datos de ejemplo para vat_records
INSERT INTO vat_records (tenant_id, period, total_sales, total_purchases, vat_collected, vat_paid, vat_due, status, due_date) VALUES
(1, '2024-01', 7500.00, 225.50, 1725.00, 51.87, 1673.13, 'submitted', '2024-02-20'),
(1, '2024-02', 8200.00, 300.00, 1886.00, 69.00, 1817.00, 'pending', '2024-03-20'),
(1, '2024-03', 6800.00, 450.00, 1564.00, 103.50, 1460.50, 'pending', '2024-04-20')
ON CONFLICT DO NOTHING;

-- Datos de ejemplo para saft_documents
INSERT INTO saft_documents (tenant_id, period, generated_date, records, status, file_path, file_size) VALUES
(1, '2024-01', '2024-02-01', 45, 'submitted', '/saft/2024-01/saft_2024_01.xml', 156789),
(1, '2024-02', '2024-03-01', 52, 'generated', '/saft/2024-02/saft_2024_02.xml', 178234),
(1, '2024-03', '2024-04-01', 38, 'generated', '/saft/2024-03/saft_2024_03.xml', 145678)
ON CONFLICT DO NOTHING;

-- Datos de ejemplo para reports
INSERT INTO reports (tenant_id, name, type, generated_date, period, status, file_path, file_size) VALUES
(1, 'Relatório Mensal - Janeiro 2024', 'monthly', '2024-02-01', '2024-01', 'completed', '/reports/monthly/2024-01.pdf', 234567),
(1, 'Relatório de IVA - Q1 2024', 'vat_quarterly', '2024-04-01', '2024-Q1', 'completed', '/reports/vat/2024-Q1.pdf', 189234),
(1, 'Relatório Anual 2024', 'annual', '2024-12-31', '2024', 'generated', '/reports/annual/2024.pdf', 567890),
(1, 'Relatório de Clientes Ativos', 'clients', '2024-01-15', NULL, 'completed', '/reports/clients/active.pdf', 98765)
ON CONFLICT DO NOTHING;

-- Datos de ejemplo para documents
INSERT INTO documents (tenant_id, filename, file_path, file_type, file_size, status, document_type, confidence) VALUES
(1, 'fatura_001.pdf', '/uploads/fatura_001.pdf', 'pdf', 245760, 'completed', 'invoice', 95.5),
(1, 'recibo_001.pdf', '/uploads/recibo_001.pdf', 'pdf', 189440, 'completed', 'receipt', 92.3),
(1, 'contrato_001.pdf', '/uploads/contrato_001.pdf', 'pdf', 512000, 'processing', 'contract', 0),
(1, 'relatorio_001.pdf', '/uploads/relatorio_001.pdf', 'pdf', 1024000, 'pending', 'report', 0),
(1, 'fatura_002.pdf', '/uploads/fatura_002.pdf', 'pdf', 307200, 'failed', 'invoice', 0)
ON CONFLICT DO NOTHING;

-- Comentarios sobre las tablas
COMMENT ON TABLE banking_transactions IS 'Transacciones bancarias para la view de Banking';
COMMENT ON TABLE vat_records IS 'Registros de IVA para la view de VAT';
COMMENT ON TABLE saft_documents IS 'Documentos SAFT para la view de SAFT';
COMMENT ON TABLE reports IS 'Reportes generados para la view de Reports';
COMMENT ON TABLE documents IS 'Documentos para la view de Documents';

-- Verificar que las tablas se crearon correctamente
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name IN ('banking_transactions', 'vat_records', 'saft_documents', 'reports', 'documents')
ORDER BY table_name;
