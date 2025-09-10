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

async function testImagesAPI() {
    console.log('🧪 Probando API de imágenes...\n');

    try {
        // Probar GET
        console.log('📤 Probando GET /api/images...');
        const { data: images, error: getError } = await supabase
            .from('images')
            .select('*')
            .eq('tenant_id', 1)
            .order('created_at', { ascending: false });

        if (getError) {
            console.error('❌ Error en GET:', getError);
        } else {
            console.log('✅ GET funcionando correctamente');
            console.log('📊 Total imágenes:', images.length);
        }

        // Probar POST con imagen de prueba
        console.log('\n📤 Probando POST /api/images...');
        const testImageData = {
            tenant_id: 1,
            name: 'TEST IMAGE 2025-01-15',
            original_filename: 'test.jpg',
            image_data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
            mime_type: 'image/jpeg',
            file_size: 1000,
            source: 'test',
            company_name: 'TEST COMPANY',
            document_date: '2025-01-15'
        };

        const { data: newImage, error: postError } = await supabase
            .from('images')
            .insert(testImageData)
            .select()
            .single();

        if (postError) {
            console.error('❌ Error en POST:', postError);
        } else {
            console.log('✅ POST funcionando correctamente');
            console.log('🆔 Nueva imagen ID:', newImage.id);

            // Eliminar imagen de prueba
            const { error: deleteError } = await supabase
                .from('images')
                .delete()
                .eq('id', newImage.id);

            if (deleteError) {
                console.error('❌ Error eliminando imagen de prueba:', deleteError);
            } else {
                console.log('✅ DELETE funcionando correctamente');
            }
        }

        console.log('\n🎉 ¡API de imágenes funcionando correctamente!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testImagesAPI();
