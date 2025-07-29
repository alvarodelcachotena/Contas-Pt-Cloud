import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict } from '../../../../lib/env-loader.js'

// Force loading from .env file only
loadEnvStrict()

// Use service role key to bypass RLS and avoid infinite recursion
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || '1'

    // Get current month metrics for comparison
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format

    // Total invoices (all time)
    const { count: invoicesCount } = await supabase
      .from('invoices')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)

    // Total expenses (all time)
    const { count: expensesCount } = await supabase
      .from('expenses')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)

    // Total documents processed
    const { count: documentsCount } = await supabase
      .from('documents')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)

    // Total clients
    const { count: clientsCount } = await supabase
      .from('clients')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)

    // Revenue calculation (sum of all invoice amounts)
    const { data: revenueData } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('tenant_id', tenantId)

    const totalRevenue = revenueData?.reduce((sum, invoice) => 
      sum + (parseFloat(invoice.total_amount) || 0), 0) || 0

    // Expenses calculation (all expenses)
    const { data: expenseData } = await supabase
      .from('expenses')
      .select('amount')
      .eq('tenant_id', tenantId)

    const totalExpenses = expenseData?.reduce((sum, expense) => 
      sum + (parseFloat(expense.amount) || 0), 0) || 0

    const metrics = {
      totalInvoices: invoicesCount || 0,
      totalExpenses: expensesCount || 0,
      totalDocuments: documentsCount || 0,
      totalClients: clientsCount || 0,
      totalRevenue: totalRevenue,
      totalExpenseAmount: totalExpenses,
      netProfit: totalRevenue - totalExpenses
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Dashboard metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}