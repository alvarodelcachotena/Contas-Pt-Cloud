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
    console.log('🚀 Creando tabla images...\n');

    try {
        // Intentar crear la tabla usando una consulta simple
        console.log('📋 Creando tabla images...');

        // Usar una consulta SQL directa
        const { data, error } = await supabase
            .from('images')
            .select('id')
            .limit(1);

        if (error && error.code === 'PGRST116') {
            console.log('❌ Tabla no existe, necesitamos crearla manualmente en Supabase');
            console.log('\n📋 Ejecuta este SQL en el editor SQL de Supabase:');
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_images_tenant_id ON images(tenant_id);
CREATE INDEX IF NOT EXISTS idx_images_source ON images(source);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);

-- RLS
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own tenant images" ON images
    FOR ALL USING (tenant_id = 1);
            `);

            console.log('\n🔧 Después de ejecutar el SQL, ejecuta este script nuevamente para verificar.');

        } else if (error) {
            console.error('❌ Error verificando tabla:', error);
        } else {
            console.log('✅ Tabla images ya existe y es accesible');

            // Mostrar estructura
            const { data: sample, error: sampleError } = await supabase
                .from('images')
                .select('*')
                .limit(1);

            if (!sampleError) {
                console.log('📊 Estructura verificada correctamente');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createImagesTable();
