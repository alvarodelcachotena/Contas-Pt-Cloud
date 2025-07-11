import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict } from '../../../../lib/env-loader.js'
import { getTenantId } from '../../../../lib/tenant-utils'

loadEnvStrict()

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider, access_token, refresh_token, user_email } = body

    if (!provider || !user_email) {
      return NextResponse.json({ error: 'Provider and user email required' }, { status: 400 })
    }

    const supabase = createSupabaseClient()
    const tenantId = await getTenantId(request, user_email)

    const configData = {
      tenant_id: tenantId,
      provider: provider,
      folder_path: provider === 'dropbox' ? '/input' : '/Documents',
      access_token: access_token,
      refresh_token: refresh_token,
      is_active: true
    }

    // Check for existing config and update, or create new
    const { data: existingConfig } = await supabase
      .from('cloud_drive_configs')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('provider', provider)
      .single()

    let result
    if (existingConfig) {
      const { data, error } = await supabase
        .from('cloud_drive_configs')
        .update(configData)
        .eq('id', existingConfig.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      const { data, error } = await supabase
        .from('cloud_drive_configs')
        .insert(configData)
        .select()
        .single()

      if (error) throw error
      result = data
    }

    console.log(`✅ Webhook save-config: Saved ${provider} configuration for tenant ${tenantId}`)

    return NextResponse.json({ 
      success: true, 
      integration: result
    })

  } catch (error) {
    console.error('Error in webhook save-config:', error)
    return NextResponse.json({ 
      error: 'Failed to save configuration',
      success: false 
    }, { status: 500 })
  }
}