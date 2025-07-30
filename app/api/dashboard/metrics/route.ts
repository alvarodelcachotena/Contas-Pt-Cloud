import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict } from '../../../../lib/env-loader.js'

// Force loading from .env file only
loadEnvStrict()

// Use service role key to bypass RLS and avoid infinite recursion
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
console.log(`🔧 Using Supabase URL: ${process.env.SUPABASE_URL}`)
console.log(`🔑 Using Service Role Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'}`)

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || '1'
    console.log(`📊 Dashboard metrics requested for tenant: ${tenantId}`)

    // Force a fresh connection by creating a new client
    const freshSupabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    console.log(`🔄 Created fresh Supabase connection`)

    // Get current month metrics for comparison
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format

    // Total invoices (all time)
    const invoicesQuery = await freshSupabase
      .from('invoices')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
    console.log(`📈 Invoices query result:`, invoicesQuery)

    // Total expenses (all time)
    const expensesQuery = await freshSupabase
      .from('expenses')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
    console.log(`💰 Expenses query result:`, expensesQuery)

    // Total documents processed
    const documentsQuery = await freshSupabase
      .from('documents')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
    console.log(`📄 Documents query result:`, documentsQuery)

    // Total clients
    const clientsQuery = await freshSupabase
      .from('clients')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
    console.log(`👥 Clients query result:`, clientsQuery)

    // Revenue calculation (sum of all invoice amounts)
    const revenueQuery = await freshSupabase
      .from('invoices')
      .select('total_amount')
      .eq('tenant_id', tenantId)
    console.log(`💵 Revenue data:`, revenueQuery)

    const totalRevenue = revenueQuery.data?.reduce((sum, invoice) => 
      sum + (parseFloat(invoice.total_amount) || 0), 0) || 0

    // Expenses calculation (all expenses)
    const expenseQuery = await freshSupabase
      .from('expenses')
      .select('amount')
      .eq('tenant_id', tenantId)
    console.log(`💸 Expense data:`, expenseQuery)

    const totalExpenses = expenseQuery.data?.reduce((sum, expense) => 
      sum + (parseFloat(expense.amount) || 0), 0) || 0

    const metrics = {
      totalInvoices: invoicesQuery.count || 0,
      totalExpenses: expensesQuery.count || 0,
      totalDocuments: documentsQuery.count || 0,
      totalClients: clientsQuery.count || 0,
      totalRevenue: totalRevenue,
      totalExpenseAmount: totalExpenses,
      netProfit: totalRevenue - totalExpenses
    }
    
    console.log(`📊 Final metrics for tenant ${tenantId}:`, metrics)

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Dashboard metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}