-- Script para verificar la estructura real de la base de datos
-- Ejecuta esto primero para ver qué tablas tienes

-- 1. VER TODAS LAS TABLAS PÚBLICAS
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. VER SI RLS ESTÁ HABILITADO EN LAS TABLAS EXISTENTES
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. VER POLÍTICAS EXISTENTES (si las hay)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. VER ESTRUCTURA DE LA TABLA user_companies (si existe)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_companies'
AND table_schema = 'public';

-- 5. VER ALGUNOS DATOS DE EJEMPLO (si las tablas existen)
-- SELECT * FROM clients LIMIT 3;
-- SELECT * FROM invoices LIMIT 3;
-- SELECT * FROM expenses LIMIT 3;

