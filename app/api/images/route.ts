import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

let supabase: any = null;

// Initialize Supabase client with validation
try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('tu_supabase_url_aqui')) {
        supabase = createClient(supabaseUrl, supabaseKey);
    } else {
        console.warn('⚠️ Supabase not properly configured for images API');
    }
} catch (error) {
    console.warn('⚠️ Failed to initialize Supabase client for images API:', error);
}

// GET - Obtener todas las imágenes del tenant
export async function GET(request: NextRequest) {
    try {
        const tenantId = request.headers.get('x-tenant-id') || '1'

        console.log('🖼️ Fetching images for tenant:', tenantId)

        if (!supabase) {
            return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
        }

        const { data: images, error } = await supabase
            .from('images')
            .select('*')
            .eq('tenant_id', parseInt(tenantId))
            .order('created_at', { ascending: false })

        if (error) {
            console.error('❌ Error fetching images:', error)
            return NextResponse.json({ error: 'Error fetching images' }, { status: 500 })
        }

        console.log('✅ Found images:', images?.length || 0)

        return NextResponse.json({ images: images || [] }, { status: 200 })

    } catch (error) {
        console.error('❌ Error in GET /api/images:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Guardar una nueva imagen
export async function POST(request: NextRequest) {
    try {
        const tenantId = request.headers.get('x-tenant-id') || '1'
        const body = await request.json()

        const {
            name,
            originalFilename,
            imageData,
            mimeType = 'image/jpeg',
            fileSize = 0,
            source = 'whatsapp',
            companyName,
            documentDate
        } = body

        console.log('💾 Saving image:', { name, originalFilename, source, companyName })

        // Validar datos requeridos
        if (!name || !originalFilename || !imageData) {
            return NextResponse.json(
                { error: 'Missing required fields: name, originalFilename, imageData' },
                { status: 400 }
            )
        }

        if (!supabase) {
            return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
        }

        // Insertar imagen en la base de datos
        const { data: newImage, error } = await supabase
            .from('images')
            .insert({
                tenant_id: parseInt(tenantId),
                name,
                original_filename: originalFilename,
                image_data: imageData,
                mime_type: mimeType,
                file_size: fileSize,
                source,
                company_name: companyName,
                document_date: documentDate ? new Date(documentDate) : null
            })
            .select()
            .single()

        if (error) {
            console.error('❌ Error saving image:', error)
            return NextResponse.json({ error: 'Error saving image' }, { status: 500 })
        }

        console.log('✅ Image saved successfully:', newImage.id)

        return NextResponse.json({ image: newImage }, { status: 201 })

    } catch (error) {
        console.error('❌ Error in POST /api/images:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE - Eliminar una imagen
export async function DELETE(request: NextRequest) {
    try {
        const tenantId = request.headers.get('x-tenant-id') || '1'
        const url = new URL(request.url)
        const imageId = url.searchParams.get('id')

        if (!imageId) {
            return NextResponse.json({ error: 'Image ID is required' }, { status: 400 })
        }

        console.log('🗑️ Deleting image:', imageId)

        if (!supabase) {
            return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
        }

        const { error } = await supabase
            .from('images')
            .delete()
            .eq('id', parseInt(imageId))
            .eq('tenant_id', parseInt(tenantId))

        if (error) {
            console.error('❌ Error deleting image:', error)
            return NextResponse.json({ error: 'Error deleting image' }, { status: 500 })
        }

        console.log('✅ Image deleted successfully')

        return NextResponse.json({ success: true }, { status: 200 })

    } catch (error) {
        console.error('❌ Error in DELETE /api/images:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
