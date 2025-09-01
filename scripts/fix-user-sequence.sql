-- Script para corregir la secuencia de ID de la tabla users
-- Ejecutar este script en tu base de datos Supabase si hay problemas con IDs duplicados

-- 1. Verificar el estado actual de la secuencia
SELECT 
    sequence_name,
    last_value,
    start_value,
    increment_by
FROM users_id_seq;

-- 2. Verificar el máximo ID actual en la tabla users
SELECT MAX(id) as max_id FROM users;

-- 3. Resetear la secuencia para que comience después del máximo ID existente
-- Reemplaza 'X' con el valor real del máximo ID encontrado en el paso 2
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users), true);

-- 4. Verificar que la secuencia esté correctamente configurada
SELECT 
    sequence_name,
    last_value,
    start_value,
    increment_by
FROM users_id_seq;

-- 5. Opcional: Insertar un usuario de prueba para verificar
-- INSERT INTO users (email, password_hash, name, role) 
-- VALUES ('test@example.com', 'test_hash', 'Test User', 'user')
-- RETURNING id;
