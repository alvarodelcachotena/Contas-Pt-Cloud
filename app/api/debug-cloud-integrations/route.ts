import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict, getSupabaseUrl, getSupabaseAnonKey } from '../../../lib/env-loader.js'
import { getTenantId } from '../../../lib/tenant-utils'

// Load environment variables strictly from .env file
loadEnvStrict()

// Create a fresh Supabase client for each request to avoid caching issues
function createSupabaseClient(useServiceRole = false) {
  // Force reload environment variables
  loadEnvStrict()

  const url = getSupabaseUrl()
  const key = useServiceRole ? process.env.SUPABASE_SERVICE_ROLE_KEY : getSupabaseAnonKey()

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
        'x-client-info': 'cloud-integrations-debug-api'
      }
    }
  })
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugging cloud integrations data...')
    
    // Create fresh Supabase client
    const supabase = createSupabaseClient(true) // Use service role for debugging

    // Get tenant ID dynamically (multi-tenant support)
    const tenantId = await getTenantId(request)
    console.log('🏢 Using tenant ID:', tenantId)

    // Get ALL cloud drive configurations (not just active ones)
    const { data: allConfigs, error: allError } = await supabase
      .from('cloud_drive_configs')
      .select('*')
      .order('created_at', { ascending: false })

    if (allError) {
      console.error('Error fetching all cloud drive configs:', allError)
      return NextResponse.json({ error: 'Erro ao buscar todas as configurações' }, { status: 500 })
    }

    // Get active cloud drive configurations for this tenant
    const { data: activeConfigs, error: activeError } = await supabase
      .from('cloud_drive_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)

    if (activeError) {
      console.error('Error fetching active cloud drive configs:', activeError)
      return NextResponse.json({ error: 'Erro ao buscar configurações ativas' }, { status: 500 })
    }

    // Get all tenants for reference
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name')

    console.log('📊 Debug data:')
    console.log('- Tenant ID used:', tenantId)
    console.log('- All configs count:', allConfigs?.length || 0)
    console.log('- Active configs count:', activeConfigs?.length || 0)
    console.log('- Tenants available:', tenants?.length || 0)

    return NextResponse.json({
      success: true,
      debug: {
        tenantId,
        allConfigs: allConfigs || [],
        activeConfigs: activeConfigs || [],
        tenants: tenants || [],
        summary: {
          totalConfigs: allConfigs?.length || 0,
          activeConfigs: activeConfigs?.length || 0,
          tenantsCount: tenants?.length || 0
        }
      }
    })
  } catch (error) {
    console.error('Erro na API debug cloud integrations:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
