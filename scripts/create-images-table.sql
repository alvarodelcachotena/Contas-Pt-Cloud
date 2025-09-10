-- Tabla para almacenar imágenes en base64
-- Esta tabla almacenará todas las imágenes subidas desde WhatsApp y AI Assistant

CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    name VARCHAR(255) NOT NULL, -- Nombre descriptivo como "STREET FISH BARCELONASL 2025-09-10"
    original_filename VARCHAR(255) NOT NULL, -- Nombre original del archivo
    image_data TEXT NOT NULL, -- Imagen en base64
    mime_type VARCHAR(100) NOT NULL DEFAULT 'image/jpeg', -- Tipo MIME de la imagen
    file_size INTEGER NOT NULL DEFAULT 0, -- Tamaño del archivo en bytes
    source VARCHAR(50) NOT NULL DEFAULT 'whatsapp', -- 'whatsapp' o 'ai-assistant'
    company_name VARCHAR(255), -- Nombre de la empresa extraído
    document_date DATE, -- Fecha del documento si se puede extraer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_images_tenant_id ON images(tenant_id);
CREATE INDEX IF NOT EXISTS idx_images_source ON images(source);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);
CREATE INDEX IF NOT EXISTS idx_images_company_name ON images(company_name);

-- Comentarios para documentación
COMMENT ON TABLE images IS 'Tabla para almacenar imágenes en formato base64 desde WhatsApp y AI Assistant';
COMMENT ON COLUMN images.name IS 'Nombre descriptivo de la imagen (ej: STREET FISH BARCELONASL 2025-09-10)';
COMMENT ON COLUMN images.image_data IS 'Datos de la imagen codificados en base64';
COMMENT ON COLUMN images.source IS 'Origen de la imagen: whatsapp o ai-assistant';
COMMENT ON COLUMN images.company_name IS 'Nombre de la empresa extraído del documento';
COMMENT ON COLUMN images.document_date IS 'Fecha del documento si se puede extraer';

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_update_images_updated_at
    BEFORE UPDATE ON images
    FOR EACH ROW
    EXECUTE FUNCTION update_images_updated_at();

-- RLS (Row Level Security) para multi-tenancy
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Política RLS para tenant_id
CREATE POLICY "Users can only access their own tenant images" ON images
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::integer);

-- Función helper para generar nombres descriptivos
CREATE OR REPLACE FUNCTION generate_image_name(
    p_company_name VARCHAR(255),
    p_document_date DATE DEFAULT NULL
)
RETURNS VARCHAR(255) AS $$
DECLARE
    v_date_str VARCHAR(10);
    v_name VARCHAR(255);
BEGIN
    -- Formatear fecha
    IF p_document_date IS NOT NULL THEN
        v_date_str := TO_CHAR(p_document_date, 'YYYY-MM-DD');
    ELSE
        v_date_str := TO_CHAR(NOW(), 'YYYY-MM-DD');
    END IF;
    
    -- Limpiar nombre de empresa (quitar espacios y caracteres especiales)
    v_name := REGEXP_REPLACE(UPPER(COALESCE(p_company_name, 'UNKNOWN')), '[^A-Z0-9]', '', 'g');
    
    -- Combinar nombre y fecha
    RETURN v_name || ' ' || v_date_str;
END;
$$ LANGUAGE plpgsql;

-- Insertar datos de ejemplo (opcional)
-- INSERT INTO images (tenant_id, name, original_filename, image_data, mime_type, file_size, source, company_name, document_date)
-- VALUES (1, 'STREET FISH BARCELONASL 2025-01-15', 'invoice_001.jpg', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...', 'image/jpeg', 12345, 'whatsapp', 'STREET FISH BARCELONA S.L.', '2025-01-15');
