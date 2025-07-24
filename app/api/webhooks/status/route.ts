import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()

    // Get webhook activity from cloud drive configs
    const { data: configs, error: configError } = await supabase
      .from('cloud_drive_configs')
      .select('*')
      .eq('provider', 'dropbox')
      .eq('is_active', true)

    if (configError) {
      throw configError
    }

    // Get recent document processing logs
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (docError) {
      throw docError
    }

    // Get processing statistics
    const processingStats = await Promise.all(
      (configs || []).map(async (config) => {
        const { data: allDocs } = await supabase
          .from('documents')
          .select('id, processing_status, created_at')
          .eq('tenant_id', config.tenant_id)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

        const totalFiles = allDocs?.length || 0
        const processedFiles = allDocs?.filter(d => d.processing_status === 'completed').length || 0
        const errorFiles = allDocs?.filter(d => d.processing_status === 'error').length || 0
        const processingFiles = allDocs?.filter(d => d.processing_status === 'processing').length || 0

        return {
          configId: config.id,
          tenantId: config.tenant_id,
          folderPath: config.folder_path,
          lastSync: config.updated_at,
          status: config.is_active ? 'active' : 'disabled',
          totalFiles,
          processedFiles,
          duplicateFiles: 0, // Would need separate tracking
          errorFiles,
          processingFiles
        }
      })
    )

    // Mock webhook activities (in production, this would come from webhook logs)
    const mockActivities = [
      {
        id: '1',
        timestamp: new Date(),
        provider: 'dropbox',
        status: 'success',
        filesProcessed: 11,
        errors: [],
        duration: 15000
      }
    ]

    // Format document logs
    const documentLogs = (documents || []).slice(0, 20).map(doc => ({
      id: doc.id.toString(),
      filename: doc.original_filename || doc.filename,
      status: doc.processing_status || 'unknown',
      timestamp: new Date(doc.created_at),
      tenantId: doc.tenant_id,
      processingTime: null,
      errorMessage: doc.processing_error,
      confidence: doc.confidence,
      processor: 'gemini-openai'
    }))

    return NextResponse.json({
      success: true,
      data: {
        activities: mockActivities,
        processingStatus: processingStats,
        documentLogs,
        summary: {
          totalWebhooks: mockActivities.length,
          totalFilesProcessed: processingStats.reduce((sum, stat) => sum + stat.processedFiles, 0),
          totalDuplicates: processingStats.reduce((sum, stat) => sum + stat.duplicateFiles, 0),
          totalErrors: processingStats.reduce((sum, stat) => sum + stat.errorFiles, 0)
        }
      }
    })

  } catch (error) {
    console.error('Error fetching webhook status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhook status' },
      { status: 500 }
    )
  }
}