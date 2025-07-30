import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict } from '../../../lib/env-loader.js'

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
    const { action, tenantId } = body
    
    if (action !== 'reset_documents_and_expenses') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    const supabase = createSupabaseClient()
    const tenant = tenantId || 1
    
    console.log(`🗑️ RESETTING all documents and expenses for tenant ${tenant}`)
    
    // Delete expenses first (due to foreign key constraints)
    const { error: expenseError, count: expenseCount } = await supabase
      .from('expenses')
      .delete()
      .eq('tenant_id', tenant)
      .select('*', { count: 'exact' })
    
    if (expenseError) {
      console.error('❌ Error deleting expenses:', expenseError)
      return NextResponse.json({ error: 'Failed to delete expenses' }, { status: 500 })
    }
    
    // Delete documents
    const { error: docError, count: docCount } = await supabase
      .from('documents')
      .delete()
      .eq('tenant_id', tenant)
      .select('*', { count: 'exact' })
    
    if (docError) {
      console.error('❌ Error deleting documents:', docError)
      return NextResponse.json({ error: 'Failed to delete documents' }, { status: 500 })
    }
    
    // Delete extracted invoice data
    const { error: extractedError } = await supabase
      .from('extracted_invoice_data')
      .delete()
      .eq('tenant_id', tenant)
    
    console.log(`✅ RESET COMPLETED:`)
    console.log(`   - Deleted ${expenseCount || 0} expenses`)
    console.log(`   - Deleted ${docCount || 0} documents`)
    console.log(`   - Cleared extracted invoice data`)
    
    return NextResponse.json({ 
      success: true,
      deletedExpenses: expenseCount || 0,
      deletedDocuments: docCount || 0,
      message: 'Database reset completed successfully'
    })
    
  } catch (error) {
    console.error('❌ Reset error:', error)
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 })
  }
}