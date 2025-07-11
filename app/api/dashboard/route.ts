import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict, getSupabaseUrl, getSupabaseServiceRoleKey } from '../../../lib/env-loader.js'

// Force loading from .env file only
loadEnvStrict()

const SUPABASE_URL = getSupabaseUrl()
const SUPABASE_SERVICE_ROLE_KEY = getSupabaseServiceRoleKey()

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || '1'

    console.log(`📊 Fetching dashboard metrics for tenant ${tenantId}`)

    // Get dashboard metrics using direct Supabase queries
    const [invoicesResult, expensesResult, documentsResult, clientsResult] = await Promise.all([
      supabase
        .from('invoices')
        .select('total_amount')
        .eq('tenant_id', tenantId),
      
      supabase
        .from('expenses')
        .select('amount, vat_amount')
        .eq('tenant_id', tenantId),
      
      supabase
        .from('documents')
        .select('id')
        .eq('tenant_id', tenantId),
      
      supabase
        .from('clients')
        .select('id')
        .eq('tenant_id', tenantId)
    ])

    // Calculate metrics
    const totalInvoices = invoicesResult.data?.length || 0
    const totalExpenses = expensesResult.data?.length || 0
    const totalDocuments = documentsResult.data?.length || 0
    const totalClients = clientsResult.data?.length || 0

    // Calculate revenue (sum of invoice amounts)
    const totalRevenue = invoicesResult.data?.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.total_amount || '0')
      return sum + amount
    }, 0) || 0

    // Calculate expense amounts (sum of expense amounts)
    const totalExpenseAmount = expensesResult.data?.reduce((sum, expense) => {
      const amount = parseFloat(expense.amount || '0')
      return sum + amount
    }, 0) || 0

    // Calculate net profit
    const netProfit = totalRevenue - totalExpenseAmount

    const metrics = {
      totalInvoices,
      totalExpenses,
      totalDocuments,
      totalClients,
      totalRevenue: totalRevenue.toFixed(2),
      totalExpenseAmount: totalExpenseAmount.toFixed(2),
      netProfit: netProfit.toFixed(2)
    }

    console.log(`✅ Dashboard metrics calculated:`, metrics)

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    )
  }
}