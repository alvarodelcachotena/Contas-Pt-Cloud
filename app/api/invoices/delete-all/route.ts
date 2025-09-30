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
        'x-client-info': 'delete-all-invoices-api'
      }
    }
  })
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Deleting all invoices...')

    // Create fresh Supabase client with service role for delete operations
    const supabase = createSupabaseClient(true)

    // Get tenant ID dynamically (multi-tenant support)
    const tenantId = await getTenantId(request)
    console.log('🏢 Using tenant ID:', tenantId)

    // First, check if there are any invoices to delete
    const { count, error: countError } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    if (countError) {
      console.error('❌ Error counting invoices:', countError)
      return NextResponse.json({ error: 'Erro ao contar faturas' }, { status: 500 })
    }

    console.log(`📊 Found ${count} invoices to delete`)

    if (count === 0) {
      return NextResponse.json({
        success: true,
        message: 'Não há faturas para eliminar',
        deletedCount: 0
      })
    }

    // First, delete related records that reference invoices
    console.log('🗑️ Deleting related records...')

    // Get invoice IDs first
    const { data: invoiceIds, error: invoiceIdsError } = await supabase
      .from('invoices')
      .select('id')
      .eq('tenant_id', tenantId)

    if (invoiceIdsError) {
      console.error('❌ Error getting invoice IDs:', invoiceIdsError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao obter IDs das faturas',
        details: invoiceIdsError.message
      }, { status: 500 })
    }

    const ids = invoiceIds?.map(inv => inv.id) || []
    console.log(`📋 Found ${ids.length} invoice IDs to process`)

    // Delete whatsapp_vat_data records
    if (ids.length > 0) {
      const { error: vatDataError } = await supabase
        .from('whatsapp_vat_data')
        .delete()
        .in('invoice_id', ids)

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
    // For example, if there are invoice_line_items or other related tables

    // Now delete all invoices for this tenant
    const { error, count: deletedCount } = await supabase
      .from('invoices')
      .delete({ count: 'exact' })
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('❌ Error deleting invoices:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao eliminar faturas',
        details: error.message
      }, { status: 500 })
    }

    console.log(`✅ ${deletedCount} invoices deleted successfully`)

    return NextResponse.json({
      success: true,
      message: `${deletedCount} faturas foram eliminadas com sucesso`,
      deletedCount: deletedCount || 0
    })

  } catch (error) {
    console.error('❌ Error in delete all invoices:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
