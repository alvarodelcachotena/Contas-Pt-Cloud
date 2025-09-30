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

    // First, check if there are any expenses to delete
    const { count, error: countError } = await supabase
      .from('expenses')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    if (countError) {
      console.error('❌ Error counting expenses:', countError)
      return NextResponse.json({ error: 'Erro ao contar despesas' }, { status: 500 })
    }

    console.log(`📊 Found ${count} expenses to delete`)

    if (count === 0) {
      return NextResponse.json({
        success: true,
        message: 'Não há despesas para eliminar',
        deletedCount: 0
      })
    }

    // First, delete related records that reference expenses
    console.log('🗑️ Deleting related records...')

    // Get expense IDs first
    const { data: expenseIds, error: expenseIdsError } = await supabase
      .from('expenses')
      .select('id')
      .eq('tenant_id', tenantId)

    if (expenseIdsError) {
      console.error('❌ Error getting expense IDs:', expenseIdsError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao obter IDs das despesas',
        details: expenseIdsError.message
      }, { status: 500 })
    }

    const ids = expenseIds?.map(exp => exp.id) || []
    console.log(`📋 Found ${ids.length} expense IDs to process`)

    // Delete whatsapp_vat_data records
    if (ids.length > 0) {
      const { error: vatDataError } = await supabase
        .from('whatsapp_vat_data')
        .delete()
        .in('expense_id', ids)

      if (vatDataError) {
        console.error('❌ Error deleting whatsapp_vat_data:', vatDataError)
        return NextResponse.json({
          success: false,
          error: 'Erro ao eliminar dados relacionados',
          details: vatDataError.message
        }, { status: 500 })
      }
      console.log('✅ Related whatsapp_vat_data records deleted')
    }

    // Delete any other related records (add more as needed)

    // Now delete all expenses for this tenant
    const { error, count: deletedCount } = await supabase
      .from('expenses')
      .delete({ count: 'exact' })
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('❌ Error deleting expenses:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao eliminar despesas',
        details: error.message
      }, { status: 500 })
    }

    console.log(`✅ ${deletedCount} expenses deleted successfully`)

    return NextResponse.json({
      success: true,
      message: `${deletedCount} despesas foram eliminadas com sucesso`,
      deletedCount: deletedCount || 0
    })

  } catch (error) {
    console.error('❌ Error in delete all expenses:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
