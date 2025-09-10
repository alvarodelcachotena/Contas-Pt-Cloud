#!/usr/bin/env node

const fetch = require('node-fetch');

async function testStorageAPI() {
    console.log('🔍 Probando API de Storage...\n');

    try {
        const response = await fetch('http://localhost:3000/api/storage/files', {
            headers: {
                'x-tenant-id': '1'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ API Response Status:', response.status);
        console.log('📊 Total archivos:', data.files?.length || 0);

        if (data.files && data.files.length > 0) {
            console.log('\n🔍 Primeros 10 archivos:');
            data.files.slice(0, 10).forEach((file, index) => {
                console.log(`${index + 1}. ${file.name}`);
                console.log(`   MIME: ${file.mimeType}`);
                console.log(`   Size: ${file.size} bytes`);
                console.log(`   URL: ${file.url}`);
                console.log(`   Es imagen: ${file.mimeType.startsWith('image/')}`);
                console.log('');
            });

            const imageFiles = data.files.filter(file => file.mimeType.startsWith('image/'));
            console.log(`🖼️ Archivos de imagen encontrados: ${imageFiles.length}`);

            if (imageFiles.length > 0) {
                console.log('\n📸 Primeras 5 imágenes:');
                imageFiles.slice(0, 5).forEach((file, index) => {
                    console.log(`${index + 1}. ${file.name} (${file.mimeType})`);
                });
            }
        } else {
            console.log('❌ No se encontraron archivos');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testStorageAPI();
