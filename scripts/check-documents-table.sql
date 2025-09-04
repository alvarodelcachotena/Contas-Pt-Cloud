-- Script para verificar la estructura actual de la tabla documents

-- 1. Verificar que la tabla existe
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'documents';

-- 2. Ver todas las columnas de la tabla documents
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'documents'
ORDER BY ordinal_position;

-- 3. Ver algunos registros de ejemplo (si existen)
SELECT * FROM documents LIMIT 3;

-- 4. Verificar si hay datos en la tabla
SELECT COUNT(*) as total_documents FROM documents;


