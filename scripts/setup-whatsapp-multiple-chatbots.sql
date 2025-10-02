-- ===========================================
-- CONFIGURACIÓN DE MÚLTIPLES CHATBOTS DE WHATSAPP
-- ===========================================
-- Este script configura la base de datos para soportar múltiples chatbots de WhatsApp

-- Crear tabla de configuración de chatbots si no existe
CREATE TABLE IF NOT EXISTS whatsapp_chatbots (
  id SERIAL PRIMARY KEY,
  chatbot_number VARCHAR(20) UNIQUE NOT NULL,
  tenant_id INTEGER DEFAULT 1,
  access_token TEXT,
  phone_number_id VARCHAR(50),
  business_account_id VARCHAR(50),
  app_id VARCHAR(50),
  app_secret TEXT,
  verify_token VARCHAR(100),
  webhook_url TEXT,
  display_name VARCHAR(100),
  country_code VARCHAR(5),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_whatsapp_chatbots_number ON whatsapp_chatbots(chatbot_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_chatbots_tenant ON whatsapp_chatbots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_chatbots_active ON whatsapp_chatbots(is_active);

-- Crear tabla de usuarios autorizados de WhatsApp (si no existe)
CREATE TABLE IF NOT EXISTS whatsapp_authorized_users (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id),
  tenant_id INTEGER DEFAULT 1,
  role VARCHAR(50) DEFAULT 'user', -- admin, user, readonly
  is_active BOOLEAN DEFAULT true,
  chatbot_number VARCHAR(20), -- Referencia al chatbot que maneja este número
  display_name VARCHAR(100),
  country_code VARCHAR(5),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices para la tabla de usuarios autorizados
CREATE INDEX IF NOT EXISTS idx_whatsapp_authorized_users_phone ON whatsapp_authorized_users(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_authorized_users_tenant ON whatsapp_authorized_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_authorized_users_active ON whatsapp_authorized_users(is_active);
CREATE INDEX IF NOT EXISTS idx_whatsapp_authorized_users_chatbot ON whatsapp_authorized_users(chatbot_number);

-- Insertar configuración de chatbots (estructura básica)
-- NOTA: Los valores reales de tokens deben venir de las variables de entorno
INSERT INTO whatsapp_chatbots (
  chatbot_number, 
  display_name, 
  country_code, 
  verify_token,
  webhook_url
) VALUES
-- Chatbot Principal (España)
(
  '+34613881071', 
  'Chatbot Principal España', 
  'ES', 
  '1c7eba0ef1c438301a9b0f369d6e1708',
  'https://contas-pt.netlify.app/api/webhooks/whatsapp'
),
-- Chatbot Colombia
(
  '+573014241183_2', 
  'Chatbot Colombia', 
  'CO', 
  '1c7eba0ef1c438301a9b0f369d6e1709',
  'https://contas-pt.netlify.app/api/webhooks/whatsapp'
),
-- Chatbot Secundario (España)
(
  '+34661613025_3', 
  'Chatbot Secundario España', 
  'ES', 
  '1c7eba0ef1c438301a9b0f369d6e1710',
  'https://contas-pt.netlify.app/api/webhooks/whatsapp'
)
ON CONFLICT (chatbot_number) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  country_code = EXCLUDED.country_code,
  verify_token = EXCLUDED.verify_token,
  webhook_url = EXCLUDED.webhook_url,
  updated_at = NOW();

-- Insertar números autorizados para cada chatbot
INSERT INTO whatsapp_authorized_users (
  phone_number, 
  tenant_id, 
  role, 
  chatbot_number, 
  display_name, 
  country_code
) VALUES
-- Usuarios autorizados para Chatbot Principal España
('+34613881071', 1, 'admin', '+34613881071', 'Número Principal España', 'ES'),
('34613881071', 1, 'admin', '+34613881071', 'Número Principal España (sin +)', 'ES'),

-- Usuarios autorizados para Chatbot Colombia  
('+573014241183', 1, 'admin', '+573014241183_2', 'Número Colombia', 'CO'),
('573014241183', 1, 'admin', '+573014241183_2', 'Número Colombia (sin +)', 'CO'),

-- Usuarios autorizados para Chatbot Secundario España
('+34661613025', 1, 'admin', '+34661613025_3', 'Número Secundario España', 'ES'),
('34661613025', 1, 'admin', '+34661613025_3', 'Número Secundario España (sin +)', 'ES')

ON CONFLICT (phone_number) DO UPDATE SET
  role = EXCLUDED.role,
  chatbot_number = EXCLUDED.chatbot_number,
  display_name = EXCLUDED.display_name,
  country_code = EXCLUDED.country_code,
  updated_at = NOW();

-- Crear función para verificar si un número está autorizado
CREATE OR REPLACE FUNCTION is_whatsapp_number_authorized(phone_number_param VARCHAR(20))
RETURNS BOOLEAN AS $$
DECLARE
  is_authorized BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM whatsapp_authorized_users 
    WHERE phone_number = phone_number_param 
    AND is_active = true
  ) INTO is_authorized;
  
  RETURN is_authorized;
END;
$$ LANGUAGE plpgsql;

-- Crear función para obtener configuración del chatbot
CREATE OR REPLACE FUNCTION get_chatbot_config(phone_number_param VARCHAR(20))
RETURNS TABLE (
  chatbot_id INTEGER,
  chatbot_number VARCHAR(20),
  access_token TEXT,
  phone_number_id VARCHAR(50),
  business_account_id VARCHAR(50),
  app_id VARCHAR(50),
  app_secret TEXT,
  verify_token VARCHAR(100),
  webhook_url TEXT,
  display_name VARCHAR(100),
  country_code VARCHAR(5)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.chatbot_number,
    c.access_token,
    c.phone_number_id,
    c.business_account_id,
    c.app_id,
    c.app_secret,
    c.verify_token,
    c.webhook_url,
    c.display_name,
    c.country_code
  FROM whatsapp_chatbots c
  JOIN whatsapp_authorized_users u ON c.chatbot_number = u.chatbot_number
  WHERE u.phone_number = phone_number_param 
  AND c.is_active = true
  AND u.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Crear función para obtener credenciales por número de usuario
CREATE OR REPLACE FUNCTION get_whatsapp_credentials_for_user(user_phone VARCHAR(20))
RETURNS TABLE (
  access_token TEXT,
  phone_number_id VARCHAR(50),
  business_account_id VARCHAR(50),
  app_id VARCHAR(50),
  app_secret TEXT,
  verify_token VARCHAR(100),
  webhook_url TEXT,
  display_name VARCHAR(100)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.access_token,
    c.phone_number_id,
    c.business_account_id,
    c.app_id,
    c.app_secret,
    c.verify_token,
    c.webhook_url,
    c.display_name
  FROM whatsapp_chatbots c
  JOIN whatsapp_authorized_users u ON c.chatbot_number = u.chatbot_number
  WHERE u.phone_number = user_phone 
  AND c.is_active = true
  AND u.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Agregar comentarios para documentación
COMMENT ON TABLE whatsapp_chatbots IS 'Configuración de múltiples chatbots de WhatsApp';
COMMENT ON TABLE whatsapp_authorized_users IS 'Usuarios autorizados para cada chatbot de WhatsApp';
COMMENT ON FUNCTION is_whatsapp_number_authorized(VARCHAR) IS 'Verifica si un número de teléfono está autorizado para usar WhatsApp';
COMMENT ON FUNCTION get_chatbot_config(VARCHAR) IS 'Obtiene la configuración completa de un chatbot específico';
COMMENT ON FUNCTION get_whatsapp_credentials_for_user(VARCHAR) IS 'Obtiene las credenciales de WhatsApp para un usuario específico';

-- Mostrar resumen de configuración
SELECT 
  '✅ Configuración completada' as status,
  COUNT(*) as total_chatbots
FROM whatsapp_chatbots 
WHERE is_active = true;

SELECT 
  '📋 Números autorizados configurados' as status,
  COUNT(*) as total_authorized_users
FROM whatsapp_authorized_users 
WHERE is_active = true;

-- Mostrar chatbot configuration
SELECT 
  chatbot_number,
  display_name,
  country_code,
  is_active,
  created_at
FROM whatsapp_chatbots
ORDER BY chatbot_number;
