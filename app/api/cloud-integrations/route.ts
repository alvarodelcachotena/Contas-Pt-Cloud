import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict, getSupabaseUrl, getSupabaseAnonKey } from '../../../lib/env-loader.js'
import { getTenantId, getTenantInfo } from '../../../lib/tenant-utils'

// Load environment variables strictly from .env file
loadEnvStrict()

// Create a fresh Supabase client for each request to avoid caching issues
function createSupabaseClient() {
  // Force reload environment variables
  loadEnvStrict()

  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()

  console.log('🔍 Creating Supabase client with:')
  console.log('- URL ends with:', url?.slice(-10) || 'MISSING')
  console.log('- Anon key ends with:', key?.slice(-10) || 'MISSING')

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-client-info': 'cloud-integrations-api'
      }
    }
  })
}

export async function GET(request: NextRequest) {
  try {
    // Create fresh Supabase client
    const supabase = createSupabaseClient()

    // Get tenant ID dynamically (multi-tenant support)
    const tenantId = await getTenantId(request)

    // Get cloud drive configurations from database
    const { data: configs, error } = await supabase
      .from('cloud_drive_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching cloud drive configs:', error)
      return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 })
    }

    // Transform database records to match the expected frontend format
    const integrations = configs?.map(config => ({
      id: config.id.toString(),
      provider: config.provider,
      provider_user_id: config.id.toString(),
      user_email: 'aki.diamondnxt@gmail.com', // You might want to get this from user session
      access_token: config.access_token,
      refresh_token: config.refresh_token,
      status: config.is_active ? 'connected' : 'disconnected',
      created_at: config.created_at,
      updated_at: config.created_at,
      folder_path: config.folder_path
    })) || []

    return NextResponse.json({ integrations })
  } catch (error) {
    console.error('Erro na API cloud integrations:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider, provider_user_id, user_email, access_token, refresh_token } = body

    if (!provider || !user_email) {
      return NextResponse.json({ error: 'Dados obrigatórios em falta' }, { status: 400 })
    }

    console.log(`✅ Nova integração ${provider} recebida para ${user_email}`)
    console.log('Access token length:', access_token?.length || 0)
    console.log('Refresh token length:', refresh_token?.length || 0)

    // Create fresh Supabase client for this request
    const supabase = createSupabaseClient()

    // Get tenant ID dynamically using utility function
    const tenantId = await getTenantId(request, user_email)
    const tenantInfo = await getTenantInfo(tenantId)
    const tenantName = tenantInfo?.name || "Unknown Tenant"

    console.log(`✅ Using tenant: ${tenantName} (ID: ${tenantId})`)

    // Actually save to database using service role key with better error handling
    const configData = {
      tenant_id: tenantId, // Use the known tenant ID
      provider: provider,
      folder_path: provider === 'dropbox' ? '/input' : '/Documents',
      access_token: access_token,
      refresh_token: refresh_token,
      is_active: true
    }

    console.log('💾 Attempting to save config data:', {
      tenant_id: configData.tenant_id,
      provider: configData.provider,
      folder_path: configData.folder_path
    })

    // Use webhook save endpoint to maintain consistency with webhook system
    let config: any
    try {
      const saveResponse = await fetch('http://localhost:5000/api/webhooks/save-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: configData.provider,
          access_token: configData.access_token,
          refresh_token: configData.refresh_token,
          user_email: user_email
        })
      })

      const saveResult = await saveResponse.json()

      if (!saveResult.success) {
        console.error('❌ Failed to save via webhook:', saveResult.error)
        return NextResponse.json({ error: saveResult.error }, { status: 500 })
      }

      config = saveResult.integration
      console.log(`✅ Successfully saved ${provider} configuration via webhook`)
    } catch (webhookError) {
      console.error('❌ Webhook save failed:', webhookError)
      return NextResponse.json({ error: 'Erro ao guardar configuração via webhook' }, { status: 500 })
    }

    console.log(`✅ Configuração ${provider} guardada com ID: ${config.id}`)

    // Return success with actual database data
    const newIntegration = {
      id: config.id.toString(),
      provider: config.provider,
      provider_user_id: provider_user_id || config.id.toString(),
      user_email: user_email,
      access_token: config.access_token,
      refresh_token: config.refresh_token,
      status: 'connected',
      created_at: config.created_at,
      updated_at: config.created_at,
      folder_path: config.folder_path
    }

    return NextResponse.json({ success: true, integration: newIntegration })
  } catch (error) {
    console.error('Erro no POST cloud integrations:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Force load environment variables
    loadEnvStrict()

    const body = await request.json()
    const { id, folder_path } = body

    if (!id || !folder_path) {
      return NextResponse.json({ error: 'ID e pasta são obrigatórios' }, { status: 400 })
    }

    // Initialize Supabase client
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get current tenant ID (you might want to get this from session/auth)
    const tenantId = 1 // Using DIAMOND NXT TRADING tenant

    console.log(`📁 Updating folder path for integration ${id} to: ${folder_path}`)

    // Update the folder path in the database
    const { error } = await supabase
      .from('cloud_drive_configs')
      .update({ folder_path: folder_path })
      .eq('id', parseInt(id))
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('Error updating folder path:', error)
      return NextResponse.json({ error: 'Erro ao atualizar pasta' }, { status: 500 })
    }

    console.log(`✅ Folder path updated successfully for integration ${id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PATCH cloud integrations:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Force load environment variables
    loadEnvStrict()

    const { searchParams } = new URL(request.url)
    const integrationId = searchParams.get('id')

    if (!integrationId) {
      return NextResponse.json({ error: 'ID de integração obrigatório' }, { status: 400 })
    }

    // Initialize Supabase client
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get current tenant ID (you might want to get this from session/auth)
    const tenantId = 1 // Using DIAMOND NXT TRADING tenant

    // Delete from database
    const { error } = await supabase
      .from('cloud_drive_configs')
      .delete()
      .eq('id', parseInt(integrationId))
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('Error deleting cloud drive config:', error)
      return NextResponse.json({ error: 'Erro ao eliminar configuração' }, { status: 500 })
    }

    console.log(`🗑️ Integração ${integrationId} eliminada`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro no DELETE cloud integrations:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}