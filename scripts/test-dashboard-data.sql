-- Test Data for Dashboard Metrics
-- This script inserts sample data to test the dashboard functionality

-- Insert test tenant
INSERT INTO tenants (id, name, nif, address) VALUES 
(1, 'Empresa Teste Lda', '123456789', 'Rua Teste, 123, Lisboa') 
ON CONFLICT (id) DO NOTHING;

-- Insert test user
INSERT INTO users (id, email, password_hash, name, role) VALUES 
(1, 'admin@teste.pt', 'hashed_password', 'Admin Teste', 'admin') 
ON CONFLICT (id) DO NOTHING;

-- Insert user-tenant mapping
INSERT INTO user_tenants (user_id, tenant_id, role, is_active) VALUES 
(1, 1, 'admin', true) 
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- Insert test clients
INSERT INTO clients (tenant_id, name, email, nif, address) VALUES 
(1, 'Cliente A Lda', 'clientea@email.pt', '987654321', 'Rua Cliente A, 456, Porto'),
(1, 'Cliente B Lda', 'clienteb@email.pt', '987654322', 'Rua Cliente B, 789, Braga'),
(1, 'Cliente C Lda', 'clientec@email.pt', '987654323', 'Rua Cliente C, 101, Coimbra')
ON CONFLICT DO NOTHING;

-- Insert test invoices
INSERT INTO invoices (tenant_id, client_id, number, client_name, client_email, client_tax_id, issue_date, due_date, amount, vat_amount, vat_rate, total_amount, status, description) VALUES 
(1, 1, 'FAT-2024-001', 'Cliente A Lda', 'clientea@email.pt', '987654321', '2024-01-15', '2024-02-15', 1000.00, 230.00, 23.00, 1230.00, 'paid', 'Serviços de consultoria'),
(1, 2, 'FAT-2024-002', 'Cliente B Lda', 'clienteb@email.pt', '987654322', '2024-01-20', '2024-02-20', 1500.00, 345.00, 23.00, 1845.00, 'paid', 'Desenvolvimento de software'),
(1, 3, 'FAT-2024-003', 'Cliente C Lda', 'clientec@email.pt', '987654323', '2024-02-01', '2024-03-01', 800.00, 184.00, 23.00, 984.00, 'pending', 'Manutenção de sistemas'),
(1, 1, 'FAT-2024-004', 'Cliente A Lda', 'clientea@email.pt', '987654321', '2024-02-10', '2024-03-10', 1200.00, 276.00, 23.00, 1476.00, 'paid', 'Suporte técnico')
ON CONFLICT DO NOTHING;

-- Insert test expenses
INSERT INTO expenses (tenant_id, vendor, amount, vat_amount, vat_rate, category, description, expense_date, is_deductible) VALUES 
(1, 'Fornecedor A Lda', 500.00, 115.00, 23.00, 'Serviços', 'Serviços de limpeza', '2024-01-10', true),
(1, 'Fornecedor B Lda', 300.00, 69.00, 23.00, 'Equipamentos', 'Material de escritório', '2024-01-15', true),
(1, 'Fornecedor C Lda', 750.00, 172.50, 23.00, 'Marketing', 'Publicidade online', '2024-02-01', true),
(1, 'Fornecedor D Lda', 400.00, 92.00, 23.00, 'Serviços', 'Manutenção de equipamentos', '2024-02-05', true)
ON CONFLICT DO NOTHING;

-- Insert test documents
INSERT INTO documents (tenant_id, filename, file_path, file_type, file_size, status, uploaded_at, processed_at) VALUES 
(1, 'fatura_cliente_a.pdf', '/uploads/faturas/fatura_cliente_a.pdf', 'application/pdf', 1024000, 'processed', '2024-01-15 10:00:00', '2024-01-15 10:05:00'),
(1, 'fatura_cliente_b.pdf', '/uploads/faturas/fatura_cliente_b.pdf', 'application/pdf', 1536000, 'processed', '2024-01-20 11:00:00', '2024-01-20 11:03:00'),
(1, 'fatura_cliente_c.pdf', '/uploads/faturas/fatura_cliente_c.pdf', 'application/pdf', 819200, 'processed', '2024-02-01 09:00:00', '2024-02-01 09:02:00'),
(1, 'fatura_cliente_a_2.pdf', '/uploads/faturas/fatura_cliente_a_2.pdf', 'application/pdf', 1228800, 'processed', '2024-02-10 14:00:00', '2024-02-10 14:04:00')
ON CONFLICT DO NOTHING;

-- Insert test raw documents (pending processing)
INSERT INTO raw_documents (tenant_id, filename, file_path, file_type, file_size, status, uploaded_at) VALUES 
(1, 'documento_pendente_1.pdf', '/uploads/pending/doc1.pdf', 'application/pdf', 2048000, 'pending', '2024-02-15 16:00:00'),
(1, 'documento_pendente_2.pdf', '/uploads/pending/doc2.pdf', 'application/pdf', 1536000, 'pending', '2024-02-16 10:00:00')
ON CONFLICT DO NOTHING;

-- Insert test bank accounts
INSERT INTO bank_accounts (tenant_id, name, bank_name, iban, account_number, balance) VALUES 
(1, 'Conta Principal', 'Banco Teste', 'PT50 1234 5678 9012 3456 7890 1', '123456789', 5000.00),
(1, 'Conta Secundária', 'Banco Teste', 'PT50 1234 5678 9012 3456 7890 2', '987654321', 2500.00)
ON CONFLICT DO NOTHING;

-- Insert test payments
INSERT INTO payments (tenant_id, invoice_id, amount, payment_date, payment_method, reference) VALUES 
(1, 1, 1230.00, '2024-01-20', 'bank_transfer', 'REF-001'),
(1, 2, 1845.00, '2024-01-25', 'bank_transfer', 'REF-002'),
(1, 4, 1476.00, '2024-02-15', 'bank_transfer', 'REF-004')
ON CONFLICT DO NOTHING;

-- Log successful data insertion
DO $$
BEGIN
    RAISE NOTICE '✅ Test data inserted successfully for dashboard testing!';
    RAISE NOTICE '📊 You can now test the dashboard with real data';
    RAISE NOTICE '🏢 Tenant ID: 1, User ID: 1';
    RAISE NOTICE '📄 Documents: 4 processed + 2 pending = 6 total';
    RAISE NOTICE '💰 Invoices: 4 total (3 paid, 1 pending)';
    RAISE NOTICE '💸 Expenses: 4 total';
    RAISE NOTICE '👥 Clients: 3 total';
END $$;


