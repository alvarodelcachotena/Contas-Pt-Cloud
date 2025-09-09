import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict, getSupabaseUrl, getSupabaseAnonKey } from '../../../../lib/env-loader.js'
import { getTenantId } from '../../../../lib/tenant-utils'

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
        'x-client-info': 'delete-all-expenses-api'
      }
    }
  })
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Deleting all expenses...')
    
    // Create fresh Supabase client with service role for delete operations
    const supabase = createSupabaseClient(true)

    // Get tenant ID dynamically (multi-tenant support)
    const tenantId = await getTenantId(request)
    console.log('🏢 Using tenant ID:', tenantId)

    // Delete all expenses for this tenant
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('❌ Error deleting expenses:', error)
      return NextResponse.json({ error: 'Erro ao eliminar despesas' }, { status: 500 })
    }

    console.log('✅ All expenses deleted successfully')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Todas as despesas foram eliminadas com sucesso' 
    })
    
  } catch (error) {
    console.error('❌ Error in delete all expenses:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
