import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict, getSupabaseUrl, getSupabaseServiceRoleKey } from '@/lib/env-loader'

loadEnvStrict()

export async function GET(request: NextRequest) {
    try {
        const supabaseUrl = getSupabaseUrl()
        const supabaseServiceRoleKey = getSupabaseServiceRoleKey()
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

        const tenantId = request.headers.get('x-tenant-id')
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 })
        }

        console.log('📁 Fetching files from storage for tenant:', tenantId)

        // List files from the documents/whatsapp folder in storage
        const { data: files, error } = await supabase.storage
            .from('documents')
            .list('whatsapp', {
                limit: 1000,
                sortBy: { column: 'created_at', order: 'desc' }
            })

        if (error) {
            console.error('❌ Error fetching files from storage:', error)
            return NextResponse.json({ error: 'Error fetching files from storage' }, { status: 500 })
        }

        console.log('✅ Found files in storage:', files?.length || 0)

        // Helper function to detect MIME type from file extension
        const getMimeTypeFromExtension = (filename: string): string => {
            const extension = filename.toLowerCase().split('.').pop()

            // If no extension, try to detect from filename patterns
            if (!extension || extension === filename.toLowerCase()) {
                // Common WhatsApp image patterns
                if (filename.match(/^\d+$/)) {
                    // Files with just numbers are often images from WhatsApp
                    return 'image/jpeg' // Default to JPEG for WhatsApp images
                }
                return 'unknown'
            }

            switch (extension) {
                case 'jpg':
                case 'jpeg':
                    return 'image/jpeg'
                case 'png':
                    return 'image/png'
                case 'gif':
                    return 'image/gif'
                case 'webp':
                    return 'image/webp'
                case 'pdf':
                    return 'application/pdf'
                case 'doc':
                    return 'application/msword'
                case 'docx':
                    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                default:
                    return 'unknown'
            }
        }

        // Get public URLs for each file
        const filesWithUrls = await Promise.all(
            (files || []).map(async (file) => {
                const { data: urlData } = supabase.storage
                    .from('documents')
                    .getPublicUrl(`whatsapp/${file.name}`)

                const detectedMimeType = getMimeTypeFromExtension(file.name)

                console.log(`📁 File: ${file.name} -> MIME: ${detectedMimeType}`)

                return {
                    name: file.name,
                    size: file.metadata?.size || 0,
                    lastModified: file.updated_at || file.created_at,
                    url: urlData.publicUrl,
                    mimeType: detectedMimeType
                }
            })
        )

        return NextResponse.json({ files: filesWithUrls }, { status: 200 })
    } catch (error) {
        console.error('❌ Error in GET /api/storage/files:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
