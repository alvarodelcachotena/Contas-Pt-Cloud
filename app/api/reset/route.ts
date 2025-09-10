import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict } from '@/lib/env-loader'

loadEnvStrict()

export async function POST(request: Request) {
  try {
    const { tenant } = await request.json()

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Delete all expenses for tenant
    const { error: expenseError, count: expenseCount } = await supabase
      .from('expenses')
      .delete()
      .eq('tenant_id', tenant)
      .select('count')

    if (expenseError) {
      console.error('❌ Error deleting expenses:', expenseError)
      return NextResponse.json(
        { error: 'Failed to delete expenses' },
        { status: 500 }
      )
    }

    // Delete all documents for tenant
    const { error: docError, count: docCount } = await supabase
      .from('documents')
      .delete()
      .eq('tenant_id', tenant)
      .select('count')

    if (docError) {
      console.error('❌ Error deleting documents:', docError)
      return NextResponse.json(
        { error: 'Failed to delete documents' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Reset successful',
      expensesDeleted: expenseCount,
      documentsDeleted: docCount,
    })
  } catch (error) {
    console.error('❌ Error in reset endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}