#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Cargar variables de entorno
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createImagesTable() {
    console.log('🚀 Creando tabla images en Supabase...\n');

    try {
        // Verificar si la tabla ya existe
        const { data: existingTable, error: checkError } = await supabase
            .from('images')
            .select('id')
            .limit(1);

        if (checkError && checkError.code === 'PGRST116') {
            console.log('📋 Tabla no existe, necesitamos crearla manualmente');
            console.log('\n🔧 INSTRUCCIONES:');
            console.log('1. Ve a tu dashboard de Supabase');
            console.log('2. Ve a "SQL Editor"');
            console.log('3. Ejecuta el siguiente SQL:');
            console.log('\n' + '='.repeat(60));
            console.log(`
CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    name VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    image_data TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL DEFAULT 'image/jpeg',
    file_size INTEGER NOT NULL DEFAULT 0,
    source VARCHAR(50) NOT NULL DEFAULT 'whatsapp',
    company_name VARCHAR(255),
    document_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_images_tenant_id ON images(tenant_id);
CREATE INDEX IF NOT EXISTS idx_images_source ON images(source);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);

-- RLS (Row Level Security)
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Política RLS para tenant_id
CREATE POLICY "Users can only access their own tenant images" ON images
    FOR ALL USING (tenant_id = 1);

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
            `);
            console.log('='.repeat(60));
            console.log('\n4. Después de ejecutar el SQL, ejecuta este script nuevamente para verificar.');

        } else if (checkError) {
            console.error('❌ Error verificando tabla:', checkError);
        } else {
            console.log('✅ Tabla images ya existe y es accesible');

            // Mostrar estructura
            const { data: sample, error: sampleError } = await supabase
                .from('images')
                .select('*')
                .limit(1);

            if (!sampleError) {
                console.log('📊 Estructura verificada correctamente');
                console.log('📈 Total de imágenes:', sample.length);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createImagesTable();
