-- Script de Verificación Completa para Dashboard - Contas-PT Cloud
-- Este script verifica que todos los datos estén correctamente insertados

-- 1. VERIFICAR TENANT
SELECT '🏢 TENANT' as section, COUNT(*) as count, 'TechSolutions Portugal Lda' as expected_name
FROM tenants WHERE id = 1;

-- 2. VERIFICAR USUARIO
SELECT '👤 USUARIO' as section, COUNT(*) as count, 'João Silva' as expected_name
FROM users WHERE id = 1;

-- 3. VERIFICAR RELACIÓN USUARIO-TENANT
SELECT '🔗 USUARIO-TENANT' as section, COUNT(*) as count, 'admin' as expected_role
FROM user_tenants WHERE user_id = 1 AND tenant_id = 1;

-- 4. VERIFICAR CLIENTES
SELECT '👥 CLIENTES' as section, COUNT(*) as count, '3' as expected_count
FROM clients WHERE tenant_id = 1;

-- 5. VERIFICAR FATURAS
SELECT '🧾 FATURAS' as section, COUNT(*) as count, '5' as expected_count
FROM invoices WHERE tenant_id = 1;

-- 6. VERIFICAR FATURAS PAGAS (para receita)
SELECT '💰 FATURAS PAGAS' as section, COUNT(*) as count, '4' as expected_count
FROM invoices WHERE tenant_id = 1 AND status = 'paid';

-- 7. VERIFICAR RECEITA TOTAL
SELECT '📈 RECEITA TOTAL' as section, 
       COALESCE(SUM(total_amount), 0) as total_revenue, 
       '12177.00' as expected_amount
FROM invoices WHERE tenant_id = 1 AND status = 'paid';

-- 8. VERIFICAR DESPESAS
SELECT '💸 DESPESAS' as section, COUNT(*) as count, '6' as expected_count
FROM expenses WHERE tenant_id = 1;

-- 9. VERIFICAR DESPESAS TOTAL
SELECT '📉 DESPESAS TOTAL' as section, 
       COALESCE(SUM(amount), 0) as total_expenses, 
       '4150.00' as expected_amount
FROM expenses WHERE tenant_id = 1;

-- 10. VERIFICAR DOCUMENTOS PROCESSADOS
SELECT '📄 DOCUMENTOS PROCESSADOS' as section, COUNT(*) as count, '8' as expected_count
FROM documents WHERE tenant_id = 1;

-- 11. VERIFICAR DOCUMENTOS PENDENTES
SELECT '⏳ DOCUMENTOS PENDENTES' as section, COUNT(*) as count, '3' as expected_count
FROM raw_documents WHERE tenant_id = 1;

-- 12. VERIFICAR PAGAMENTOS
SELECT '💳 PAGAMENTOS' as section, COUNT(*) as count, '4' as expected_count
FROM payments WHERE tenant_id = 1;

-- 13. VERIFICAR CONTAS BANCÁRIAS
SELECT '🏦 CONTAS BANCÁRIAS' as section, COUNT(*) as count, '2' as expected_count
FROM bank_accounts WHERE tenant_id = 1;

-- 14. VERIFICAR LUCRO LÍQUIDO
SELECT '💚 LUCRO LÍQUIDO' as section,
       (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE tenant_id = 1 AND status = 'paid') -
       (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE tenant_id = 1) as net_profit,
       '8027.00' as expected_amount;

-- 15. VERIFICAR DATOS ESPECÍFICOS
SELECT '🔍 DETALLES ESPECÍFICOS' as section;

-- Verificar primera fatura
SELECT '   Fatura 1:' as detail, 
       number, total_amount, status, client_name
FROM invoices WHERE tenant_id = 1 AND number = 'FAT-2024-001';

-- Verificar primera despesa
SELECT '   Despesa 1:' as detail, 
       vendor, amount, category
FROM expenses WHERE tenant_id = 1 LIMIT 1;

-- Verificar primer cliente
SELECT '   Cliente 1:' as detail, 
       name, email, nif
FROM clients WHERE tenant_id = 1 LIMIT 1;

-- 16. RESUMEN FINAL
SELECT '🎯 RESUMEN FINAL' as section;

SELECT 
    'Total de registros por tabla:' as summary,
    (SELECT COUNT(*) FROM tenants WHERE id = 1) as tenants,
    (SELECT COUNT(*) FROM users WHERE id = 1) as users,
    (SELECT COUNT(*) FROM clients WHERE tenant_id = 1) as clients,
    (SELECT COUNT(*) FROM invoices WHERE tenant_id = 1) as invoices,
    (SELECT COUNT(*) FROM expenses WHERE tenant_id = 1) as expenses,
    (SELECT COUNT(*) FROM documents WHERE tenant_id = 1) as documents,
    (SELECT COUNT(*) FROM raw_documents WHERE tenant_id = 1) as raw_documents,
    (SELECT COUNT(*) FROM payments WHERE tenant_id = 1) as payments;

-- 17. VERIFICAR INTEGRIDAD REFERENCIAL
SELECT '🔗 VERIFICAR INTEGRIDAD REFERENCIAL' as section;

-- Verificar que todas las facturas tengan clientes válidos
SELECT '   Faturas con clientes válidos:' as check_item,
       COUNT(*) as count
FROM invoices i
JOIN clients c ON i.client_id = c.id
WHERE i.tenant_id = 1;

-- Verificar que todos los pagos tengan facturas válidas
SELECT '   Pagos con facturas válidas:' as check_item,
       COUNT(*) as count
FROM payments p
JOIN invoices i ON p.invoice_id = i.id
WHERE p.tenant_id = 1;

-- 18. VERIFICAR FECHAS
SELECT '📅 VERIFICAR FECHAS' as section;

SELECT '   Faturas del mes actual:' as check_item,
       COUNT(*) as count
FROM invoices 
WHERE tenant_id = 1 
  AND issue_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND issue_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

SELECT '   Despesas del mes actual:' as check_item,
       COUNT(*) as count
FROM expenses 
WHERE tenant_id = 1 
  AND expense_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND expense_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

-- 19. VERIFICAR ESTADOS
SELECT '📊 VERIFICAR ESTADOS' as section;

SELECT '   Faturas por estado:' as check_item,
       status, COUNT(*) as count
FROM invoices WHERE tenant_id = 1
GROUP BY status;

SELECT '   Documentos por estado:' as check_item,
       processing_status, COUNT(*) as count
FROM documents WHERE tenant_id = 1
GROUP BY processing_status;

-- 20. MENSAJE FINAL
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 VERIFICACIÓN COMPLETADA!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Si todos los números coinciden con los esperados,';
    RAISE NOTICE '   el dashboard debería funcionar correctamente.';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Próximo paso: Probar el dashboard en el navegador';
    RAISE NOTICE '   URL: http://localhost:5000/dashboard';
    RAISE NOTICE '';
END $$;
