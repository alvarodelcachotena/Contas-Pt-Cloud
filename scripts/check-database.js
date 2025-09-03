// Script para verificar documentos en la base de datos
// Ejecuta: node scripts/check-database.js

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Configurar dotenv
dotenv.config();

async function checkDatabase() {
    console.log('🔍 VERIFICANDO DOCUMENTOS EN LA BASE DE DATOS\n');

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

        // 2. Verificar tabla documents
        console.log('\n2️⃣ Verificando tabla documents...');

        const { data: documents, error: docError } = await supabase
            .from('documents')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (docError) {
            console.log('   ❌ Error al consultar documentos:', docError);
            return;
        }

        console.log(`   📊 Documentos encontrados: ${documents.length}`);

        if (documents.length > 0) {
            console.log('   📋 Últimos documentos:');
            documents.forEach((doc, index) => {
                console.log(`      ${index + 1}. ${doc.filename} - ${doc.processing_status} - ${doc.created_at}`);
            });
        } else {
            console.log('   ❌ No hay documentos en la base de datos');
        }

        // 3. Verificar tabla invoices
        console.log('\n3️⃣ Verificando tabla invoices...');

        const { data: invoices, error: invError } = await supabase
            .from('invoices')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (invError) {
            console.log('   ❌ Error al consultar facturas:', invError);
        } else {
            console.log(`   📊 Facturas encontradas: ${invoices.length}`);
        }

        // 4. Verificar tabla expenses
        console.log('\n4️⃣ Verificando tabla expenses...');

        const { data: expenses, error: expError } = await supabase
            .from('expenses')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (expError) {
            console.log('   ❌ Error al consultar gastos:', expError);
        } else {
            console.log(`   📊 Gastos encontrados: ${expenses.length}`);
        }

        // 5. Verificar Storage
        console.log('\n5️⃣ Verificando Supabase Storage...');

        const { data: storageFiles, error: storageError } = await supabase.storage
            .from('documents')
            .list('', { limit: 10 });

        if (storageError) {
            console.log('   ❌ Error al consultar Storage:', storageError);
        } else {
            console.log(`   📊 Archivos en Storage: ${storageFiles.length}`);
            if (storageFiles.length > 0) {
                console.log('   📋 Archivos:');
                storageFiles.forEach((file, index) => {
                    console.log(`      ${index + 1}. ${file.name} - ${file.metadata?.size} bytes`);
                });
            }
        }

        // 6. Diagnóstico
        console.log('\n6️⃣ DIAGNÓSTICO:');

        if (documents.length === 0 && storageFiles.length === 0) {
            console.log('   ❌ PROBLEMA: No hay documentos ni archivos');
            console.log('   🔍 Posibles causas:');
            console.log('      - Error en el procesamiento del webhook');
            console.log('      - Variables de entorno no cargadas en producción');
            console.log('      - Error en la conexión a Supabase');
            console.log('      - Error en Gemini AI');

            console.log('\n   🔧 SOLUCIÓN:');
            console.log('      1. Verificar logs de Netlify Functions');
            console.log('      2. Verificar variables de entorno en Netlify');
            console.log('      3. Verificar conexión a Supabase');
            console.log('      4. Verificar Gemini AI API Key');

        } else if (documents.length > 0 && storageFiles.length === 0) {
            console.log('   ⚠️  PROBLEMA: Documentos en BD pero no en Storage');
            console.log('   🔍 Posible causa: Error al subir archivos a Storage');

        } else if (documents.length === 0 && storageFiles.length > 0) {
            console.log('   ⚠️  PROBLEMA: Archivos en Storage pero no en BD');
            console.log('   🔍 Posible causa: Error al crear registros en BD');

        } else {
            console.log('   ✅ Todo parece estar funcionando correctamente');
        }

    } catch (error) {
        console.error('❌ Error durante la verificación:', error);
    }
}

// Función principal
async function main() {
    await checkDatabase();
    console.log('\n🏁 Verificación completada');
}

// Ejecutar si se llama directamente
main().catch(console.error);
