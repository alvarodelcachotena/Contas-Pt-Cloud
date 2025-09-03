// Script para crear documento directamente en la base de datos
// Ejecuta: node scripts/create-document-direct.js

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configurar dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createDocumentDirect() {
    console.log('📄 CREANDO DOCUMENTO DIRECTAMENTE EN LA BASE DE DATOS\n');

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

        // 2. Crear imagen de prueba
        console.log('\n2️⃣ Creando imagen de prueba...');

        const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        const testImagePath = path.join(__dirname, 'test-direct-document.png');

        fs.writeFileSync(testImagePath, Buffer.from(testImageData, 'base64'));
        console.log('   ✅ Imagen de prueba creada');

        // 3. Crear documento en la base de datos
        console.log('\n3️⃣ Creando documento en la base de datos...');

        const { data: document, error: docError } = await supabase
            .from('documents')
            .insert({
                tenant_id: 1,
                filename: 'test_direct_document.png',
                original_filename: 'test_direct_document.png',
                file_size: testImageData.length * 0.75, // Aproximado
                mime_type: 'image/png',
                processing_status: 'pending',
                source: 'direct_test',
                extracted_data: {
                    test: true,
                    created_at: new Date().toISOString()
                },
                confidence_score: 0
            })
            .select()
            .single();

        if (docError) {
            console.log('   ❌ Error creando documento:', docError);
            return;
        }

        console.log('   ✅ Documento creado:', document.id);

        // 4. Subir archivo a Storage
        console.log('\n4️⃣ Subiendo archivo a Storage...');

        const fileName = `direct/${document.id}/test_direct_document.png`;
        const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, fs.readFileSync(testImagePath), {
                contentType: 'image/png',
                upsert: false
            });

        if (uploadError) {
            console.log('   ❌ Error subiendo archivo:', uploadError);
        } else {
            console.log('   ✅ Archivo subido exitosamente');
        }

        // 5. Actualizar documento con file_path
        console.log('\n5️⃣ Actualizando documento con file_path...');

        const { error: updateError } = await supabase
            .from('documents')
            .update({
                file_path: fileName,
                processing_status: 'completed'
            })
            .eq('id', document.id);

        if (updateError) {
            console.log('   ❌ Error actualizando documento:', updateError);
        } else {
            console.log('   ✅ Documento actualizado exitosamente');
        }

        // 6. Verificar resultado
        console.log('\n6️⃣ Verificando resultado...');

        const { data: finalDoc } = await supabase
            .from('documents')
            .select('*')
            .eq('id', document.id)
            .single();

        if (finalDoc) {
            console.log('   ✅ Documento final:', {
                id: finalDoc.id,
                filename: finalDoc.filename,
                processing_status: finalDoc.processing_status,
                file_path: finalDoc.file_path
            });
        }

        // 7. Limpiar archivo de prueba
        try {
            fs.unlinkSync(testImagePath);
            console.log('\n🧹 Archivo de prueba eliminado');
        } catch (error) {
            console.log('⚠️  No se pudo eliminar archivo de prueba');
        }

        console.log('\n🎉 ¡Documento creado exitosamente!');
        console.log('\n📱 AHORA VERIFICA:');
        console.log('   1. Ve a tu aplicación > Documents');
        console.log('   2. Debería aparecer el documento');
        console.log('   3. Verifica en Supabase > Storage > documents');

    } catch (error) {
        console.error('❌ Error durante la creación:', error);
    }
}

// Función principal
async function main() {
    await createDocumentDirect();
    console.log('\n🏁 Proceso completado');
}

// Ejecutar si se llama directamente
main().catch(console.error);
