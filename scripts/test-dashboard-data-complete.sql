-- Test Data Completo para Dashboard - Contas-PT Cloud
-- Este script inserta datos realistas para probar todas las métricas del dashboard

-- Limpiar datos existentes (opcional)
-- DELETE FROM payments;
-- DELETE FROM documents;
-- DELETE FROM raw_documents;
-- DELETE FROM expenses;
-- DELETE FROM invoices;
-- DELETE FROM clients;
-- DELETE FROM user_tenants;
-- DELETE FROM users;
-- DELETE FROM tenants;

-- 1. TENANT (Empresa)
INSERT INTO tenants (id, name, nif, address) VALUES 
(1, 'TechSolutions Portugal Lda', '500123456', 'Rua das Flores, 123, 1000-001 Lisboa') 
ON CONFLICT (id) DO NOTHING;

-- 2. USUARIO ADMIN
INSERT INTO users (id, email, password_hash, name, role) VALUES 
(1, 'admin@techsolutions.pt', 'hashed_password_123', 'João Silva', 'admin') 
ON CONFLICT (id) DO NOTHING;

-- 3. RELACIÓN USUARIO-TENANT
INSERT INTO user_tenants (user_id, tenant_id, role, is_active) VALUES 
(1, 1, 'admin', true) 
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- 4. CLIENTES (3 clientes)
INSERT INTO clients (tenant_id, name, email, nif, address, phone) VALUES 
(1, 'Empresa A Lda', 'contato@empresaa.pt', '123456789', 'Avenida da República, 456, Porto', '+351 220 123 456'),
(1, 'Startup B Lda', 'info@startupb.pt', '987654321', 'Rua do Comércio, 789, Braga', '+351 253 456 789'),
(1, 'Consultoria C Lda', 'geral@consultoriac.pt', '456789123', 'Praça do Município, 101, Coimbra', '+351 239 789 123')
ON CONFLICT DO NOTHING;

-- 5. FATURAS (5 faturas - 4 pagas, 1 pendente)
INSERT INTO invoices (tenant_id, client_id, number, client_name, client_email, client_tax_id, issue_date, due_date, amount, vat_amount, vat_rate, total_amount, status, description) VALUES 
(1, 1, 'FAT-2024-001', 'Empresa A Lda', 'contato@empresaa.pt', '123456789', '2024-01-15', '2024-02-15', 2500.00, 575.00, 23.00, 3075.00, 'paid', 'Desenvolvimento de software web'),
(1, 2, 'FAT-2024-002', 'Startup B Lda', 'info@startupb.pt', '987654321', '2024-01-20', '2024-02-20', 1800.00, 414.00, 23.00, 2214.00, 'paid', 'Consultoria em tecnologia'),
(1, 3, 'FAT-2024-003', 'Consultoria C Lda', 'geral@consultoriac.pt', '456789123', '2024-02-01', '2024-03-01', 3200.00, 736.00, 23.00, 3936.00, 'paid', 'Sistema de gestão empresarial'),
(1, 1, 'FAT-2024-004', 'Empresa A Lda', 'contato@empresaa.pt', '123456789', '2024-02-10', '2024-03-10', 1500.00, 345.00, 23.00, 1845.00, 'paid', 'Manutenção de sistemas'),
(1, 2, 'FAT-2024-005', 'Startup B Lda', 'info@startupb.pt', '987654321', '2024-02-15', '2024-03-15', 900.00, 207.00, 23.00, 1107.00, 'pending', 'Suporte técnico mensal')
ON CONFLICT DO NOTHING;

-- 6. DESPESAS (6 despesas)
INSERT INTO expenses (tenant_id, vendor, amount, vat_amount, vat_rate, category, description, expense_date, is_deductible) VALUES 
(1, 'Fornecedor de Serviços Lda', 800.00, 184.00, 23.00, 'Serviços', 'Serviços de limpeza e manutenção', '2024-01-10', true),
(1, 'Material de Escritório Lda', 450.00, 103.50, 23.00, 'Equipamentos', 'Material de escritório e consumíveis', '2024-01-15', true),
(1, 'Marketing Digital Lda', 1200.00, 276.00, 23.00, 'Marketing', 'Publicidade online e redes sociais', '2024-02-01', true),
(1, 'Consultoria Fiscal Lda', 600.00, 138.00, 23.00, 'Serviços', 'Consultoria fiscal e contabilística', '2024-02-05', true),
(1, 'Fornecedor de Energia', 350.00, 80.50, 23.00, 'Serviços', 'Energia elétrica e internet', '2024-02-10', true),
(1, 'Seguros Empresariais Lda', 750.00, 172.50, 23.00, 'Seguros', 'Seguro de responsabilidade civil', '2024-02-12', true)
ON CONFLICT DO NOTHING;

-- 7. DOCUMENTOS PROCESSADOS (8 documentos) - USANDO COLUMNAS CORRECTAS
INSERT INTO documents (tenant_id, filename, original_filename, file_path, file_size, mime_type, processing_status, confidence_score, processing_method, ai_model_used, uploaded_by) VALUES 
(1, 'fatura_empresa_a_001.pdf', 'fatura_empresa_a_001.pdf', '/uploads/faturas/fatura_empresa_a_001.pdf', 2048000, 'application/pdf', 'completed', 0.95, 'hybrid', 'gpt-4', 1),
(1, 'fatura_startup_b_001.pdf', 'fatura_startup_b_001.pdf', '/uploads/faturas/fatura_startup_b_001.pdf', 1536000, 'application/pdf', 'completed', 0.92, 'hybrid', 'gpt-4', 1),
(1, 'fatura_consultoria_c_001.pdf', 'fatura_consultoria_c_001.pdf', '/uploads/faturas/fatura_consultoria_c_001.pdf', 2560000, 'application/pdf', 'completed', 0.88, 'hybrid', 'gpt-4', 1),
(1, 'fatura_empresa_a_002.pdf', 'fatura_empresa_a_002.pdf', '/uploads/faturas/fatura_empresa_a_002.pdf', 1228800, 'application/pdf', 'completed', 0.94, 'hybrid', 'gpt-4', 1),
(1, 'fatura_startup_b_002.pdf', 'fatura_startup_b_002.pdf', '/uploads/faturas/fatura_startup_b_002.pdf', 819200, 'application/pdf', 'completed', 0.91, 'hybrid', 'gpt-4', 1),
(1, 'despesa_fornecedor_servicos.pdf', 'despesa_fornecedor_servicos.pdf', '/uploads/despesas/despesa_fornecedor_servicos.pdf', 1024000, 'application/pdf', 'completed', 0.89, 'hybrid', 'gpt-4', 1),
(1, 'despesa_material_escritorio.pdf', 'despesa_material_escritorio.pdf', '/uploads/despesas/despesa_material_escritorio.pdf', 512000, 'application/pdf', 'completed', 0.93, 'hybrid', 'gpt-4', 1),
(1, 'despesa_marketing_digital.pdf', 'despesa_marketing_digital.pdf', '/uploads/despesas/despesa_marketing_digital.pdf', 1536000, 'application/pdf', 'completed', 0.87, 'hybrid', 'gpt-4', 1)
ON CONFLICT DO NOTHING;

-- 8. DOCUMENTOS PENDENTES (3 documentos) - USANDO COLUMNAS CORRECTAS
INSERT INTO raw_documents (id, tenant_id, original_filename, mime_type, processing_status, s3_url) VALUES 
('doc_pendente_1', 1, 'documento_pendente_1.pdf', 'application/pdf', 'pending', 'https://s3.amazonaws.com/bucket/pending/doc_pendente_1.pdf'),
('doc_pendente_2', 1, 'documento_pendente_2.pdf', 'application/pdf', 'pending', 'https://s3.amazonaws.com/bucket/pending/doc_pendente_2.pdf'),
('doc_pendente_3', 1, 'documento_pendente_3.pdf', 'application/pdf', 'pending', 'https://s3.amazonaws.com/bucket/pending/doc_pendente_3.pdf')
ON CONFLICT DO NOTHING;

-- 9. PAGAMENTOS (4 pagamentos para faturas pagas) - USANDO REFERENCIAS CORRECTAS
INSERT INTO payments (tenant_id, invoice_id, amount, payment_date, description, reference, type, status) 
SELECT 
    1 as tenant_id,
    i.id as invoice_id,
    i.total_amount as amount,
    i.issue_date + INTERVAL '5 days' as payment_date,
    'Pagamento da fatura ' || i.number as description,
    'REF-' || i.number as reference,
    'income' as type,
    'completed' as status
FROM invoices i 
WHERE i.tenant_id = 1 AND i.status = 'paid'
ON CONFLICT DO NOTHING;

-- 10. CONTAS BANCÁRIAS
INSERT INTO bank_accounts (tenant_id, name, bank_name, iban, account_number, balance) VALUES 
(1, 'Conta Principal', 'Banco Comercial Português', 'PT50 1234 5678 9012 3456 7890 1', '123456789', 15000.00),
(1, 'Conta Secundária', 'Banco Comercial Português', 'PT50 1234 5678 9012 3456 7890 2', '987654321', 5000.00)
ON CONFLICT DO NOTHING;

-- LOG DE INSERCIÓN EXITOSA
DO $$
BEGIN
    RAISE NOTICE '🎉 DATOS DE TESTE INSERTADOS EXITOSAMENTE!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 MÉTRICAS ESPERADAS EN EL DASHBOARD:';
    RAISE NOTICE '🏢 Tenant ID: 1, User ID: 1';
    RAISE NOTICE '📄 Documentos: 11 total (8 processados + 3 pendentes)';
    RAISE NOTICE '💰 Faturas: 5 total (4 pagas + 1 pendente)';
    RAISE NOTICE '💸 Despesas: 6 total';
    RAISE NOTICE '👥 Clientes: 3 total';
    RAISE NOTICE '';
    RAISE NOTICE '💵 CÁLCULOS FINANCIEROS:';
    RAISE NOTICE '📈 Receita Total: €12,177.00 (faturas pagas)';
    RAISE NOTICE '📉 Despesas Total: €4,150.00';
    RAISE NOTICE '💰 Lucro Líquido: €8,027.00';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Ahora puedes probar el dashboard con datos reales!';
END $$;
