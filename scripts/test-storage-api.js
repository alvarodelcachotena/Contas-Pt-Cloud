#!/usr/bin/env node

import fetch from 'node-fetch';

async function testAPI() {
    try {
        console.log('🔍 Probando API de archivos...');

        const response = await fetch('http://localhost:3000/api/storage/files', {
            headers: {
                'x-tenant-id': '1'
            }
        });

        if (!response.ok) {
            console.error('❌ Error en la respuesta:', response.status, response.statusText);
            return;
        }

        const data = await response.json();
        console.log('✅ Respuesta recibida:');
        console.log('📊 Total archivos:', data.files?.length || 0);

        if (data.files && data.files.length > 0) {
            console.log('\n🔍 Primeros 5 archivos:');
            data.files.slice(0, 5).forEach((file, index) => {
                console.log(`${index + 1}. ${file.name}`);
                console.log(`   MIME: ${file.mimeType}`);
                console.log(`   URL: ${file.url}`);
                console.log(`   Tamaño: ${file.size} bytes`);
                console.log('');
            });

            const images = data.files.filter(file => file.mimeType.startsWith('image/'));
            console.log(`🖼️ Imágenes encontradas: ${images.length}`);

            if (images.length > 0) {
                console.log('\n🖼️ Primeras 3 imágenes:');
                images.slice(0, 3).forEach((file, index) => {
                    console.log(`${index + 1}. ${file.name}`);
                    console.log(`   MIME: ${file.mimeType}`);
                    console.log(`   URL: ${file.url}`);
                    console.log('');
                });
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testAPI();
