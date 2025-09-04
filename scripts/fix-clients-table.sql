-- Script para corregir la tabla clients
-- Agregar las columnas faltantes para que coincida con el frontend

-- 1. Agregar columnas faltantes
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

-- 2. Renombrar la columna nif existente a tax_id si existe
DO $$
BEGIN
    -- Verificar si existe la columna nif
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'nif'
    ) THEN
        -- Copiar datos de nif a tax_id
        UPDATE clients SET tax_id = nif WHERE tax_id IS NULL;
        
        -- Eliminar la columna nif (opcional, comentar si quieres mantener ambas)
        -- ALTER TABLE clients DROP COLUMN nif;
    END IF;
END $$;

-- 3. Verificar la estructura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Mostrar datos de ejemplo (si existen)
SELECT * FROM clients LIMIT 3;


