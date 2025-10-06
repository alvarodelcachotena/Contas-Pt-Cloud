-- Script para configurar Row Level Security (RLS) en Supabase
-- Este script crea políticas que permiten acceso seguro sin deshabilitar RLS

-- 1. HABILITAR RLS EN TODAS LAS TABLAS (si no está habilitado)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;

-- 3. CREAR POLÍTICAS PARA CLIENTS
DROP POLICY IF EXISTS "Users can view clients from own companies" ON clients;
CREATE POLICY "Users can view clients from own companies" ON clients
    FOR SELECT USING (tenant_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can insert clients in own companies" ON clients;
CREATE POLICY "Users can insert clients in own companies" ON clients
    FOR INSERT WITH CHECK (tenant_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can update clients in own companies" ON clients;
CREATE POLICY "Users can update clients in own companies" ON clients
    FOR UPDATE USING (tenant_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    ));

-- 4. CREAR POLÍTICAS PARA INVOICES
DROP POLICY IF EXISTS "Users can view invoices from own companies" ON invoices;
CREATE POLICY "Users can view invoices from own companies" ON invoices
    FOR SELECT USING (tenant_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can insert invoices in own companies" ON invoices;
CREATE POLICY "Users can insert invoices in own companies" ON invoices
    FOR INSERT WITH CHECK (tenant_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can update invoices in own companies" ON invoices;
CREATE POLICY "Users can update invoices in own companies" ON invoices
    FOR UPDATE USING (tenant_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    ));

-- 5. CREAR POLÍTICAS PARA EXPENSES
DROP POLICY IF EXISTS "Users can view expenses from own companies" ON expenses;
CREATE POLICY "Users can view expenses from own companies" ON expenses
    FOR SELECT USING (tenant_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can insert expenses in own companies" ON expenses;
CREATE POLICY "Users can insert expenses in own companies" ON expenses
    FOR INSERT WITH CHECK (tenant_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    ));

-- 6. CREAR POLÍTICAS PARA DOCUMENTS
DROP POLICY IF EXISTS "Users can view documents from own companies" ON documents;
CREATE POLICY "Users can view documents from own companies" ON documents
    FOR SELECT USING (tenant_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    ));

-- 7. CREAR POLÍTICAS PARA BANK_ACCOUNTS
DROP POLICY IF EXISTS "Users can view bank accounts from own companies" ON bank_accounts;
CREATE POLICY "Users can view bank accounts from own companies" ON bank_accounts
    FOR SELECT USING (tenant_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    ));

-- 8. CREAR POLÍTICAS PARA BANK_TRANSACTIONS
DROP POLICY IF EXISTS "Users can view bank transactions from own companies" ON bank_transactions;
CREATE POLICY "Users can view bank transactions from own companies" ON bank_transactions
    FOR SELECT USING (tenant_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    ));

-- 9. VERIFICAR QUE RLS ESTÁ HABILITADO
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('companies', 'clients', 'invoices', 'expenses', 'documents', 'bank_accounts', 'bank_transactions');

-- 10. VERIFICAR POLÍTICAS CREADAS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;





