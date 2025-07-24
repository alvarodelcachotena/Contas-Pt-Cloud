import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict } from '../../../../lib/env-loader.js'

loadEnvStrict()

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting clean sync operation...')
    
    // Create Supabase client with service role
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    const tenantId = request.headers.get('x-tenant-id') || '1'
    
    // Step 1: Clean all existing data
    console.log('🗑️ Cleaning existing documents and expenses...')
    
    const { error: expensesDeleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('tenant_id', tenantId)
    
    if (expensesDeleteError) {
      console.error('Error deleting expenses:', expensesDeleteError)
    }
    
    const { error: documentsDeleteError } = await supabase
      .from('documents')
      .delete()
      .eq('tenant_id', tenantId)
    
    if (documentsDeleteError) {
      console.error('Error deleting documents:', documentsDeleteError)
    }
    
    console.log('✅ Cleanup completed')
    
    // Step 2: Trigger manual sync
    console.log('🔄 Triggering fresh Dropbox sync...')
    
    const syncResponse = await fetch('http://localhost:5000/api/dropbox/manual-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId
      }
    })
    
    const syncResult = await syncResponse.json()
    
    // Step 3: Verify results
    const { count: finalDocsCount } = await supabase
      .from('documents')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
    
    const { count: finalExpensesCount } = await supabase
      .from('expenses')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
    
    return NextResponse.json({
      success: true,
      message: 'Clean sync completed successfully',
      results: {
        documentsProcessed: finalDocsCount || 0,
        expensesCreated: finalExpensesCount || 0,
        syncDetails: syncResult
      }
    })
    
  } catch (error) {
    console.error('❌ Clean sync error:', error)
    return NextResponse.json(
      { error: 'Clean sync failed', details: error.message },
      { status: 500 }
    )
  }
}