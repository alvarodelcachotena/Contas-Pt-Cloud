-- Sample Data for Contas-PT Cloud
-- This file inserts sample data for testing and development

-- Insert sample tenants
INSERT INTO tenants (id, name, nif, address) VALUES
(1, 'DIAMOND NXT TRADING LDA', '517124548', 'Vila Nova de Gaia, Portugal'),
(2, 'GÉNERO SUMPTUOSO UNIPESSOAL LDA', '515859400', 'Lisboa, Portugal'),
(3, 'TECH SOLUTIONS PT LDA', '123456789', 'Porto, Portugal')
ON CONFLICT (id) DO NOTHING;

-- Insert sample users
INSERT INTO users (id, email, password_hash, name, role) VALUES
(1, 'admin@diamondnxt.com', '$2b$10$hashed_password_here', 'Admin User', 'admin'),
(2, 'user@diamondnxt.com', '$2b$10$hashed_password_here', 'Regular User', 'user'),
(3, 'aki@diamondnxt.com', '$2b$10$hashed_password_here', 'Aki User', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Insert user-tenant mappings
INSERT INTO user_tenants (user_id, tenant_id, role) VALUES
(1, 1, 'admin'),
(2, 1, 'user'),
(3, 1, 'admin'),
(3, 2, 'admin')
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- Insert sample clients
INSERT INTO clients (tenant_id, name, email, nif, address, phone) VALUES
(1, 'TechCorp Portugal', 'contact@techcorp.pt', '123456789', 'Lisboa, Portugal', '+351 123 456 789'),
(1, 'Digital Solutions LDA', 'info@digitalsolutions.pt', '987654321', 'Porto, Portugal', '+351 987 654 321'),
(2, 'Innovation Hub PT', 'hello@innovationhub.pt', '456789123', 'Braga, Portugal', '+351 456 789 123')
ON CONFLICT DO NOTHING;

-- Insert sample bank accounts
INSERT INTO bank_accounts (tenant_id, name, bank_name, iban, account_number, balance) VALUES
(1, 'Conta Principal', 'Millennium BCP', 'PT50 0033 0000 50123456789 01', '123456789', 50000.00),
(1, 'Conta Empresarial', 'Caixa Geral de Depósitos', 'PT50 0035 0000 00123456789 01', '987654321', 25000.00),
(2, 'Conta Principal', 'Santander Totta', 'PT50 0018 0000 00123456789 01', '456789123', 15000.00)
ON CONFLICT DO NOTHING;

-- Insert sample VAT rates
INSERT INTO vat_rates (region, category, rate, effective_date, description) VALUES
('mainland', 'normal', 23.00, '2024-01-01', 'Taxa normal'),
('mainland', 'intermediate', 13.00, '2024-01-01', 'Taxa intermédia'),
('mainland', 'reduced', 6.00, '2024-01-01', 'Taxa reduzida'),
('azores', 'normal', 18.00, '2024-01-01', 'Taxa normal Açores'),
('azores', 'intermediate', 9.00, '2024-01-01', 'Taxa intermédia Açores'),
('azores', 'reduced', 4.00, '2024-01-01', 'Taxa reduzida Açores'),
('madeira', 'normal', 22.00, '2024-01-01', 'Taxa normal Madeira'),
('madeira', 'intermediate', 12.00, '2024-01-01', 'Taxa intermédia Madeira'),
('madeira', 'reduced', 5.00, '2024-01-01', 'Taxa reduzida Madeira')
ON CONFLICT DO NOTHING;

-- Insert sample invoices
INSERT INTO invoices (tenant_id, client_id, number, client_name, client_email, issue_date, amount, vat_amount, vat_rate, total_amount, status) VALUES
(1, 1, 'INV-2025-001', 'TechCorp Portugal', 'contact@techcorp.pt', '2025-01-15', 1000.00, 230.00, 23.00, 1230.00, 'paid'),
(1, 2, 'INV-2025-002', 'Digital Solutions LDA', 'info@digitalsolutions.pt', '2025-01-20', 2500.00, 575.00, 23.00, 3075.00, 'pending'),
(2, 3, 'INV-2025-003', 'Innovation Hub PT', 'hello@innovationhub.pt', '2025-01-25', 800.00, 184.00, 23.00, 984.00, 'pending')
ON CONFLICT DO NOTHING;

-- Insert sample expenses
INSERT INTO expenses (tenant_id, vendor, amount, vat_amount, vat_rate, category, description, expense_date) VALUES
(1, 'Office Supplies PT', 150.00, 34.50, 23.00, 'Office Supplies', 'Material de escritório', '2025-01-10'),
(1, 'Internet Provider LDA', 89.99, 20.70, 23.00, 'Utilities', 'Serviço de internet', '2025-01-15'),
(2, 'Marketing Agency', 500.00, 115.00, 23.00, 'Marketing', 'Serviços de marketing', '2025-01-18')
ON CONFLICT DO NOTHING;

-- Insert sample payments
INSERT INTO payments (tenant_id, bank_account_id, invoice_id, amount, payment_date, description, type, status) VALUES
(1, 1, 1, 1230.00, '2025-01-20', 'Pagamento da fatura INV-2025-001', 'income', 'completed'),
(1, 1, NULL, 150.00, '2025-01-12', 'Pagamento de material de escritório', 'expense', 'completed'),
(2, 3, NULL, 500.00, '2025-01-20', 'Pagamento de serviços de marketing', 'expense', 'completed')
ON CONFLICT DO NOTHING;

-- Insert sample bank transactions
INSERT INTO bank_transactions (tenant_id, bank_account_id, external_id, amount, description, transaction_date, type, category) VALUES
(1, 1, 'TXN-001', 1230.00, 'Recebimento fatura TechCorp', '2025-01-20', 'credit', 'income'),
(1, 1, 'TXN-002', -150.00, 'Pagamento Office Supplies', '2025-01-12', 'debit', 'expense'),
(1, 1, 'TXN-003', -89.99, 'Pagamento internet', '2025-01-15', 'debit', 'expense'),
(2, 3, 'TXN-004', -500.00, 'Pagamento marketing', '2025-01-20', 'debit', 'expense')
ON CONFLICT DO NOTHING;

-- Insert sample documents
INSERT INTO documents (tenant_id, filename, original_filename, file_size, mime_type, processing_status, confidence_score) VALUES
(1, 'invoice_001.pdf', 'Fatura_TechCorp_2025.pdf', 1024000, 'application/pdf', 'completed', 0.95),
(1, 'expense_001.pdf', 'Recibo_OfficeSupplies.pdf', 512000, 'application/pdf', 'completed', 0.88),
(2, 'invoice_002.pdf', 'Fatura_InnovationHub.pdf', 768000, 'application/pdf', 'processing', 0.75)
ON CONFLICT DO NOTHING;

-- Insert sample SAF-T exports
INSERT INTO saft_exports (tenant_id, period_start, period_end, filename, file_size, status, generated_by) VALUES
(1, '2024-01-01', '2024-12-31', 'SAFT_2024_DiamondNXT.xml', 2048000, 'completed', 1),
(2, '2024-01-01', '2024-12-31', 'SAFT_2024_GeneroSumptuoso.xml', 1536000, 'completed', 3)
ON CONFLICT DO NOTHING;

-- Insert sample extracted invoice data
INSERT INTO extracted_invoice_data (tenant_id, document_id, issuer, issuer_tax_id, invoice_number, invoice_date, total_amount, vat_amount, vat_rate, confidence, processing_method) VALUES
(1, 1, 'TechCorp Portugal', '123456789', 'INV-2025-001', '2025-01-15', 1230.00, 230.00, 23.00, 0.95, 'gemini'),
(1, 2, 'Office Supplies PT', '987654321', 'REC-001', '2025-01-10', 150.00, 34.50, 23.00, 0.88, 'gemini')
ON CONFLICT DO NOTHING;

-- Insert sample monthly statement entries
INSERT INTO monthly_statement_entries (tenant_id, statement_period, year, month, entry_date, entry_type, reference_id, description, amount, vat_amount, vat_rate, category) VALUES
(1, '2025-01', 2025, 1, '2025-01-15', 'invoice', 1, 'Fatura TechCorp Portugal', 1230.00, 230.00, 23.00, 'Services'),
(1, '2025-01', 2025, 1, '2025-01-10', 'expense', 1, 'Material de escritório', -150.00, -34.50, 23.00, 'Office Supplies'),
(1, '2025-01', 2025, 1, '2025-01-15', 'expense', 2, 'Serviço de internet', -89.99, -20.70, 23.00, 'Utilities')
ON CONFLICT DO NOTHING;

-- Log successful data insertion
DO $$
BEGIN
    RAISE NOTICE '✅ Sample data inserted successfully';
END $$;






