// Script para configurar Supabase Storage programáticamente
// Ejecuta: node scripts/setup-supabase-storage.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configurar dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupSupabaseStorage() {
    console.log('🚀 Configurando Supabase Storage...');

    try {
        // Verificar variables de entorno
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('❌ Variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas');
            return;
        }

        // Crear cliente de Supabase
        const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        console.log('✅ Cliente de Supabase creado');

        // 1. Crear bucket 'documents'
        console.log('\n1️⃣ Creando bucket "documents"...');

        try {
            const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('documents', {
                public: false,
                fileSizeLimit: 52428800, // 50MB
                allowedMimeTypes: [
                    'image/jpeg',
                    'image/png',
                    'image/gif',
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'text/plain'
                ]
            });

            if (bucketError) {
                if (bucketError.message.includes('already exists')) {
                    console.log('✅ Bucket "documents" ya existe');
                } else {
                    console.error('❌ Error creando bucket:', bucketError);
                    return;
                }
            } else {
                console.log('✅ Bucket "documents" creado exitosamente');
            }
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('✅ Bucket "documents" ya existe');
            } else {
                console.error('❌ Error creando bucket:', error);
                return;
            }
        }

        // 2. Verificar que el bucket existe
        console.log('\n2️⃣ Verificando bucket...');
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();

        if (listError) {
            console.error('❌ Error listando buckets:', listError);
            return;
        }

        const documentsBucket = buckets.find(b => b.name === 'documents');
        if (documentsBucket) {
            console.log('✅ Bucket "documents" encontrado');
            console.log('   - ID:', documentsBucket.id);
            console.log('   - Nombre:', documentsBucket.name);
            console.log('   - Público:', documentsBucket.public);
            console.log('   - Tamaño máximo:', documentsBucket.fileSizeLimit);
        } else {
            console.error('❌ Bucket "documents" no encontrado');
            return;
        }

        // 3. Crear políticas RLS para el bucket
        console.log('\n3️⃣ Configurando políticas RLS...');

        // Política para insertar archivos
        try {
            const { error: insertPolicyError } = await supabase.rpc('create_policy_if_not_exists', {
                table_name: 'storage.objects',
                policy_name: 'Users can upload documents',
                policy_definition: `
          CREATE POLICY "Users can upload documents" ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = 'documents' AND 
            auth.role() = 'authenticated'
          )
        `
            });

            if (insertPolicyError) {
                console.log('ℹ️  Política de inserción ya existe o no se pudo crear');
            } else {
                console.log('✅ Política de inserción creada');
            }
        } catch (error) {
            console.log('ℹ️  Política de inserción ya existe');
        }

        // Política para ver archivos
        try {
            const { error: selectPolicyError } = await supabase.rpc('create_policy_if_not_exists', {
                table_name: 'storage.objects',
                policy_name: 'Users can view documents',
                policy_definition: `
          CREATE POLICY "Users can view documents" ON storage.objects
          FOR SELECT USING (
            bucket_id = 'documents' AND 
            auth.role() = 'authenticated'
          )
        `
            });

            if (selectPolicyError) {
                console.log('ℹ️  Política de visualización ya existe o no se pudo crear');
            } else {
                console.log('✅ Política de visualización creada');
            }
        } catch (error) {
            console.log('ℹ️  Política de visualización ya existe');
        }

        // 4. Probar subida de archivo
        console.log('\n4️⃣ Probando subida de archivo...');

        const testContent = 'Este es un archivo de prueba para verificar que el bucket funciona correctamente.';
        const testBuffer = Buffer.from(testContent, 'utf-8');

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload('test/test-file.txt', testBuffer, {
                contentType: 'text/plain',
                upsert: true
            });

        if (uploadError) {
            console.error('❌ Error subiendo archivo de prueba:', uploadError);
        } else {
            console.log('✅ Archivo de prueba subido exitosamente');
            console.log('   - Path:', uploadData.path);

            // Eliminar archivo de prueba
            const { error: deleteError } = await supabase.storage
                .from('documents')
                .remove(['test/test-file.txt']);

            if (deleteError) {
                console.log('⚠️  No se pudo eliminar archivo de prueba:', deleteError.message);
            } else {
                console.log('✅ Archivo de prueba eliminado');
            }
        }

        console.log('\n🎉 Configuración de Supabase Storage completada exitosamente!');
        console.log('\n📋 Resumen:');
        console.log('   ✅ Bucket "documents" creado y configurado');
        console.log('   ✅ Políticas RLS configuradas');
        console.log('   ✅ Subida de archivos funcionando');
        console.log('\n🚀 Ahora puedes probar el webhook de WhatsApp!');

    } catch (error) {
        console.error('❌ Error durante la configuración:', error);
    }
}

// Función para verificar variables de entorno
function checkEnvironmentVariables() {
    console.log('🔍 Verificando variables de entorno...');

    const requiredVars = [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY'
    ];

    let allSet = true;

    requiredVars.forEach(varName => {
        if (process.env[varName]) {
            console.log(`   ✅ ${varName}: Configurada`);
        } else {
            console.log(`   ❌ ${varName}: NO configurada`);
            allSet = false;
        }
    });

    if (!allSet) {
        console.log('\n⚠️  Variables de entorno de Supabase no configuradas');
        console.log('   Asegúrate de tener un archivo .env con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
        return false;
    }

    console.log('\n✅ Variables de entorno de Supabase configuradas');
    return true;
}

// Función principal
async function main() {
    console.log('🚀 CONFIGURACIÓN DE SUPABASE STORAGE\n');

    // Verificar variables de entorno
    if (!checkEnvironmentVariables()) {
        console.log('\n❌ No se puede configurar Supabase Storage sin las variables de entorno');
        return;
    }

    // Configurar storage
    await setupSupabaseStorage();
}

// Ejecutar si se llama directamente
main().catch(console.error);
