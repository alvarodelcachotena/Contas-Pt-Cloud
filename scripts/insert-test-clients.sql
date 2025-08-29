-- Script para insertar clientes de prueba
-- Ejecutar después de corregir la tabla clients

-- 1. Insertar tenant si no existe
INSERT INTO tenants (id, name, nif, address) 
VALUES (1, 'Contas-PT Cloud', '123456789', 'Lisboa, Portugal')
ON CONFLICT (id) DO NOTHING;

-- 2. Insertar user si no existe
INSERT INTO users (id, email, password_hash, name, role) 
VALUES (1, 'admin@contas-pt.com', 'hash_placeholder', 'Admin User', 'admin')
ON CONFLICT (id) DO NOTHING;

-- 3. Insertar user_tenant mapping
INSERT INTO user_tenants (user_id, tenant_id, role) 
VALUES (1, 1, 'admin')
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- 4. Insertar clientes de prueba
INSERT INTO clients (tenant_id, name, email, phone, address, tax_id, postal_code, city, is_active) VALUES
(1, 'João Silva', 'joao.silva@empresa.pt', '+351 912 345 678', 'Rua das Flores, 123', '123456789', '1000-001', 'Lisboa', true),
(1, 'Maria Santos', 'maria.santos@consultoria.pt', '+351 923 456 789', 'Avenida da Liberdade, 456', '987654321', '4000-001', 'Porto', true),
(1, 'Pedro Costa', 'pedro.costa@tech.pt', '+351 934 567 890', 'Rua do Comércio, 789', '456789123', '3000-001', 'Coimbra', true),
(1, 'Ana Oliveira', 'ana.oliveira@design.pt', '+351 945 678 901', 'Travessa dos Artistas, 321', '789123456', '2000-001', 'Santarém', true),
(1, 'Carlos Ferreira', 'carlos.ferreira@engenharia.pt', '+351 956 789 012', 'Largo da Universidade, 654', '321654987', '5000-001', 'Braga', true)
ON CONFLICT DO NOTHING;

-- 5. Verificar la inserción
SELECT 
    '📊 RESUMEN DE CLIENTES INSERTADOS' as info,
    COUNT(*) as total_clients,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_clients
FROM clients 
WHERE tenant_id = 1;

-- 6. Mostrar los clientes insertados
SELECT 
    id,
    name,
    email,
    phone,
    tax_id,
    city,
    postal_code,
    is_active,
    created_at
FROM clients 
WHERE tenant_id = 1
ORDER BY created_at DESC;
