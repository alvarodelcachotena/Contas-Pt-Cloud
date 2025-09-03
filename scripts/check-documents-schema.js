// Script para verificar estructura de la tabla documents
// Ejecuta: node scripts/check-documents-schema.js

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Configurar dotenv
dotenv.config();

async function checkDocumentsSchema() {
    console.log('🔍 VERIFICANDO ESTRUCTURA DE LA TABLA DOCUMENTS\n');

    try {
        // 1. Conectar a Supabase
        console.log('1️⃣ Conectando a Supabase...');

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.log('❌ Variables de Supabase no configuradas');
            return;
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        console.log('   ✅ Conectado a Supabase');

        // 2. Obtener información de la tabla
        console.log('\n2️⃣ Verificando estructura de la tabla documents...');

        // Intentar insertar un documento mínimo para ver qué campos son requeridos
        const { data: testDoc, error: testError } = await supabase
            .from('documents')
            .insert({
                tenant_id: 1,
                filename: 'test_schema.png',
                original_filename: 'test_schema.png',
                file_size: 100,
                mime_type: 'image/png',
                processing_status: 'pending',
                confidence_score: 0
            })
            .select()
            .single();

        if (testError) {
            console.log('   ❌ Error al crear documento de prueba:', testError);
            console.log('   📋 Detalles del error:', {
                code: testError.code,
                message: testError.message,
                details: testError.details
            });
        } else {
            console.log('   ✅ Documento de prueba creado exitosamente');
            console.log('   📋 Documento:', testDoc);

            // Eliminar el documento de prueba
            await supabase
                .from('documents')
                .delete()
                .eq('id', testDoc.id);

            console.log('   🧹 Documento de prueba eliminado');
        }

        // 3. Verificar documentos existentes
        console.log('\n3️⃣ Verificando documentos existentes...');

        const { data: documents, error: docError } = await supabase
            .from('documents')
            .select('*')
            .limit(1);

        if (docError) {
            console.log('   ❌ Error al consultar documentos:', docError);
        } else if (documents && documents.length > 0) {
            console.log('   ✅ Estructura de documento existente:');
            console.log('   📋 Campos disponibles:', Object.keys(documents[0]));

            // Mostrar estructura detallada
            const sampleDoc = documents[0];
            Object.keys(sampleDoc).forEach(key => {
                console.log(`      ${key}: ${typeof sampleDoc[key]} = ${JSON.stringify(sampleDoc[key]).substring(0, 50)}...`);
            });
        }

    } catch (error) {
        console.error('❌ Error durante la verificación:', error);
    }
}

// Función principal
async function main() {
    await checkDocumentsSchema();
    console.log('\n🏁 Verificación completada');
}

// Ejecutar si se llama directamente
main().catch(console.error);
