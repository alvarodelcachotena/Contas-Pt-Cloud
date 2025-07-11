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
    const { webhook_type, configuration, is_active = true } = body

    if (!webhook_type || !configuration) {
      return NextResponse.json({ error: 'Webhook type and configuration required' }, { status: 400 })
    }

    const supabase = createSupabaseClient()
    const tenantId = await getTenantId(request)

    // Save webhook configuration
    const { data: config, error } = await supabase
      .from('webhook_configs')
      .insert({
        tenant_id: tenantId,
        webhook_type,
        configuration,
        is_active,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving webhook configuration:', error)
      return NextResponse.json({ error: 'Failed to save webhook configuration' }, { status: 500 })
    }

    console.log(`✅ Webhook configuration saved: ${webhook_type} for tenant ${tenantId}`)

    return NextResponse.json({ 
      success: true, 
      config_id: config.id,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/api/webhooks/${webhook_type}`
    })

  } catch (error) {
    console.error('Error in webhook configure:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    const tenantId = await getTenantId(request)

    const { data: configs, error } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching webhook configurations:', error)
      return NextResponse.json({ error: 'Failed to fetch configurations' }, { status: 500 })
    }

    return NextResponse.json({ configurations: configs || [] })

  } catch (error) {
    console.error('Error in webhook configure GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('id')

    if (!configId) {
      return NextResponse.json({ error: 'Configuration ID required' }, { status: 400 })
    }

    const supabase = createSupabaseClient()
    const tenantId = await getTenantId(request)

    const { error } = await supabase
      .from('webhook_configs')
      .delete()
      .eq('id', configId)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('Error deleting webhook configuration:', error)
      return NextResponse.json({ error: 'Failed to delete configuration' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in webhook configure DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}