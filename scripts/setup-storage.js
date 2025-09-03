// Script para configurar Supabase Storage
// Ejecuta: node scripts/setup-storage.js

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Configurar dotenv
dotenv.config();

async function setupStorage() {
    console.log('🔧 CONFIGURANDO SUPABASE STORAGE\n');

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

        // 2. Verificar buckets existentes
        console.log('\n2️⃣ Verificando buckets existentes...');

        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

        if (bucketsError) {
            console.log('   ❌ Error al listar buckets:', bucketsError);
            return;
        }

        console.log(`   📊 Buckets encontrados: ${buckets.length}`);
        buckets.forEach((bucket, index) => {
            console.log(`      ${index + 1}. ${bucket.name} - ${bucket.public ? 'Público' : 'Privado'}`);
        });

        // 3. Verificar si existe el bucket 'documents'
        const documentsBucket = buckets.find(b => b.name === 'documents');

        if (documentsBucket) {
            console.log('\n3️⃣ Bucket "documents" encontrado');
            console.log(`   📊 Nombre: ${documentsBucket.name}`);
            console.log(`   🔒 Público: ${documentsBucket.public ? 'Sí' : 'No'}`);
            console.log(`   📏 Límite de archivo: ${documentsBucket.file_size_limit} bytes`);

            // 4. Verificar archivos en el bucket
            console.log('\n4️⃣ Verificando archivos en el bucket...');

            const { data: files, error: filesError } = await supabase.storage
                .from('documents')
                .list('', { limit: 20 });

            if (filesError) {
                console.log('   ❌ Error al listar archivos:', filesError);
            } else {
                console.log(`   📊 Archivos encontrados: ${files.length}`);
                if (files.length > 0) {
                    files.forEach((file, index) => {
                        console.log(`      ${index + 1}. ${file.name} - ${file.metadata?.size || 'N/A'} bytes`);
                    });
                } else {
                    console.log('   ❌ No hay archivos en el bucket');
                }
            }

        } else {
            console.log('\n3️⃣ Bucket "documents" NO encontrado');
            console.log('   🔧 Creando bucket "documents"...');

            const { data: newBucket, error: createError } = await supabase.storage.createBucket('documents', {
                public: false,
                file_size_limit: 52428800, // 50MB
                allowed_mime_types: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
            });

            if (createError) {
                console.log('   ❌ Error al crear bucket:', createError);
            } else {
                console.log('   ✅ Bucket "documents" creado exitosamente');
            }
        }

        // 5. Probar subir un archivo de prueba
        console.log('\n5️⃣ Probando subida de archivo...');

        const testContent = 'Test file content';
        const testFileName = `test-${Date.now()}.txt`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(testFileName, testContent, {
                contentType: 'text/plain',
                upsert: false
            });

        if (uploadError) {
            console.log('   ❌ Error al subir archivo:', uploadError);
            console.log('   🔍 Posibles causas:');
            console.log('      - Permisos insuficientes');
            console.log('      - Bucket no configurado correctamente');
            console.log('      - Políticas RLS bloqueando la subida');
        } else {
            console.log('   ✅ Archivo subido exitosamente');
            console.log(`   📋 Archivo: ${uploadData.path}`);

            // Limpiar archivo de prueba
            const { error: deleteError } = await supabase.storage
                .from('documents')
                .remove([testFileName]);

            if (deleteError) {
                console.log('   ⚠️  No se pudo eliminar archivo de prueba');
            } else {
                console.log('   🧹 Archivo de prueba eliminado');
            }
        }

        // 6. Diagnóstico final
        console.log('\n6️⃣ DIAGNÓSTICO FINAL:');

        if (documentsBucket && files && files.length > 0) {
            console.log('   ✅ Storage funcionando correctamente');
            console.log('   📊 Hay archivos en el bucket');
        } else if (documentsBucket && files && files.length === 0) {
            console.log('   ⚠️  Bucket existe pero está vacío');
            console.log('   🔍 Posible causa: Error en el webhook al subir archivos');
        } else {
            console.log('   ❌ Problema con Storage');
            console.log('   🔧 Verificar configuración del bucket');
        }

    } catch (error) {
        console.error('❌ Error durante la configuración:', error);
    }
}

// Función principal
async function main() {
    await setupStorage();
    console.log('\n🏁 Configuración completada');
}

// Ejecutar si se llama directamente
main().catch(console.error);
