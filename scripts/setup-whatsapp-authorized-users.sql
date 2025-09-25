-- Script para configurar usuarios autorizados de WhatsApp
-- Ejecutar este script en la base de datos para configurar los números autorizados

-- Crear tabla de usuarios autorizados de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_authorized_users (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id),
  tenant_id INTEGER REFERENCES tenants(id),
  role VARCHAR(50) DEFAULT 'user', -- admin, user, readonly
  is_active BOOLEAN DEFAULT true,
  whatsapp_number_id VARCHAR(50), -- ID del número de WhatsApp Business
  display_name VARCHAR(100), -- Nombre para mostrar
  country_code VARCHAR(5), -- Código de país
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_whatsapp_authorized_users_phone ON whatsapp_authorized_users(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_authorized_users_tenant ON whatsapp_authorized_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_authorized_users_active ON whatsapp_authorized_users(is_active);

-- Insertar los números autorizados
INSERT INTO whatsapp_authorized_users (phone_number, tenant_id, role, whatsapp_number_id, display_name, country_code) VALUES
-- Número principal (España)
('+34613881071', 1, 'admin', 'PRIMARY', 'Número Principal España', 'ES'),
-- Número secundario (Colombia)
('+573014241183', 1, 'admin', 'SECONDARY', 'Número Colombia', 'CO'),
-- Número terciario (España)
('+34661613025', 1, 'admin', 'TERTIARY', 'Número Secundario España', 'ES')
ON CONFLICT (phone_number) DO UPDATE SET
  role = EXCLUDED.role,
  whatsapp_number_id = EXCLUDED.whatsapp_number_id,
  display_name = EXCLUDED.display_name,
  country_code = EXCLUDED.country_code,
  updated_at = NOW();

-- Crear función para verificar si un número está autorizado
CREATE OR REPLACE FUNCTION is_whatsapp_number_authorized(phone_number_param VARCHAR(20))
RETURNS TABLE(
  is_authorized BOOLEAN,
  tenant_id_result INTEGER,
  role_result VARCHAR(50),
  display_name_result VARCHAR(100)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wau.is_active as is_authorized,
    wau.tenant_id as tenant_id_result,
    wau.role as role_result,
    wau.display_name as display_name_result
  FROM whatsapp_authorized_users wau
  WHERE wau.phone_number = phone_number_param
  AND wau.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Crear función para obtener configuración de WhatsApp por número
CREATE OR REPLACE FUNCTION get_whatsapp_config_by_number(phone_number_param VARCHAR(20))
RETURNS TABLE(
  whatsapp_number_id_result VARCHAR(50),
  tenant_id_result INTEGER,
  role_result VARCHAR(50),
  display_name_result VARCHAR(100),
  country_code_result VARCHAR(5)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wau.whatsapp_number_id as whatsapp_number_id_result,
    wau.tenant_id as tenant_id_result,
    wau.role as role_result,
    wau.display_name as display_name_result,
    wau.country_code as country_code_result
  FROM whatsapp_authorized_users wau
  WHERE wau.phone_number = phone_number_param
  AND wau.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_whatsapp_authorized_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_whatsapp_authorized_users_updated_at
  BEFORE UPDATE ON whatsapp_authorized_users
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_authorized_users_updated_at();

-- Crear vista para facilitar consultas
CREATE OR REPLACE VIEW whatsapp_users_view AS
SELECT 
  wau.id,
  wau.phone_number,
  wau.display_name,
  wau.country_code,
  wau.role,
  wau.is_active,
  wau.whatsapp_number_id,
  t.name as tenant_name,
  u.name as user_name,
  u.email as user_email,
  wau.created_at,
  wau.updated_at
FROM whatsapp_authorized_users wau
LEFT JOIN tenants t ON wau.tenant_id = t.id
LEFT JOIN users u ON wau.user_id = u.id;

-- Mostrar los números configurados
SELECT 
  phone_number,
  display_name,
  country_code,
  role,
  is_active,
  whatsapp_number_id
FROM whatsapp_authorized_users
ORDER BY created_at;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Tabla whatsapp_authorized_users creada exitosamente';
  RAISE NOTICE '✅ Números autorizados configurados:';
  RAISE NOTICE '   - +34613881071 (Número Principal España)';
  RAISE NOTICE '   - +573014241183 (Número Colombia)';
  RAISE NOTICE '   - +34661613025 (Número Secundario España)';
  RAISE NOTICE '✅ Funciones y triggers creados';
  RAISE NOTICE '✅ Vista whatsapp_users_view creada';
END $$;
