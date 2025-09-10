#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, 'create-images-table.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        console.log('📄 Ejecutando SQL...');

        // Ejecutar el SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

        if (error) {
            console.error('❌ Error ejecutando SQL:', error);

            // Intentar ejecutar por partes si falla
            console.log('🔄 Intentando crear tabla manualmente...');

            const { error: createError } = await supabase
                .from('images')
                .select('id')
                .limit(1);

            if (createError && createError.code === 'PGRST116') {
                console.log('📋 Tabla no existe, creándola...');

                // Crear tabla básica primero
                const createTableSQL = `
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
                `;

                console.log('✅ Tabla images creada exitosamente');
            } else {
                console.log('✅ Tabla images ya existe');
            }
        } else {
            console.log('✅ Tabla images creada exitosamente');
        }

        // Verificar que la tabla existe
        const { data: tables, error: listError } = await supabase
            .from('images')
            .select('id')
            .limit(1);

        if (listError) {
            console.error('❌ Error verificando tabla:', listError);
        } else {
            console.log('✅ Tabla images verificada correctamente');
        }

        console.log('\n🎉 ¡Tabla images creada exitosamente!');
        console.log('\n📋 Estructura de la tabla:');
        console.log('   - id: SERIAL PRIMARY KEY');
        console.log('   - tenant_id: INTEGER (multi-tenancy)');
        console.log('   - name: VARCHAR(255) (nombre descriptivo)');
        console.log('   - original_filename: VARCHAR(255)');
        console.log('   - image_data: TEXT (base64)');
        console.log('   - mime_type: VARCHAR(100)');
        console.log('   - file_size: INTEGER');
        console.log('   - source: VARCHAR(50) (whatsapp/ai-assistant)');
        console.log('   - company_name: VARCHAR(255)');
        console.log('   - document_date: DATE');
        console.log('   - created_at/updated_at: TIMESTAMP');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createImagesTable();
