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
    console.log(`📊 Dashboard metrics requested for tenant: ${tenantId}`)

    // Get current month metrics for comparison
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
    const currentYear = new Date().getFullYear()

    // 1. Total invoices (all time)
    const { count: totalInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    if (invoicesError) {
      console.error('❌ Error fetching invoices:', invoicesError)
    }

    // 2. Total expenses (all time)
    const { count: totalExpenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    if (expensesError) {
      console.error('❌ Error fetching expenses:', expensesError)
    }

    // 3. Total documents (all time)
    const { count: totalDocuments, error: documentsError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    if (documentsError) {
      console.error('❌ Error fetching documents:', documentsError)
    }

    // 4. Total raw documents (uploaded but not processed)
    const { count: totalRawDocuments, error: rawDocsError } = await supabase
      .from('raw_documents')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    if (rawDocsError) {
      console.error('❌ Error fetching raw documents:', rawDocsError)
    }

    // 5. Total clients
    const { count: totalClients, error: clientsError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    if (clientsError) {
      console.error('❌ Error fetching clients:', clientsError)
    }

    // 6. Revenue calculation (sum of all invoice amounts)
    const { data: revenueData, error: revenueError } = await supabase
      .from('invoices')
      .select('total_amount, status')
      .eq('tenant_id', tenantId)
      .eq('status', 'paid') // Only count paid invoices

    if (revenueError) {
      console.error('❌ Error fetching revenue:', revenueError)
    }

    const totalRevenue = revenueData?.reduce((sum, invoice) =>
      sum + (parseFloat(invoice.total_amount?.toString() || '0') || 0), 0) || 0

    // 7. Expenses calculation (sum of all expense amounts + VAT)
    const { data: expenseData, error: expenseAmountError } = await supabase
      .from('expenses')
      .select('amount, vat_amount, is_deductible')
      .eq('tenant_id', tenantId)

    if (expenseAmountError) {
      console.error('❌ Error fetching expense amounts:', expenseAmountError)
    }

    const totalExpenseAmount = expenseData?.reduce((sum, expense) => {
      const baseAmount = parseFloat(expense.amount?.toString() || '0') || 0
      const vatAmount = parseFloat(expense.vat_amount?.toString() || '0') || 0
      return sum + baseAmount + vatAmount
    }, 0) || 0

    // 8. Current month metrics
    const { data: currentMonthInvoices, error: monthInvoicesError } = await supabase
      .from('invoices')
      .select('total_amount, status')
      .eq('tenant_id', tenantId)
      .gte('issue_date', `${currentMonth}-01`)
      .lte('issue_date', `${currentMonth}-31`)

    if (monthInvoicesError) {
      console.error('❌ Error fetching current month invoices:', monthInvoicesError)
    }

    const currentMonthRevenue = currentMonthInvoices?.reduce((sum, invoice) =>
      sum + (parseFloat(invoice.total_amount?.toString() || '0') || 0), 0) || 0

    const { data: currentMonthExpenses, error: monthExpensesError } = await supabase
      .from('expenses')
      .select('amount, vat_amount')
      .eq('tenant_id', tenantId)
      .gte('expense_date', `${currentMonth}-01`)
      .lte('expense_date', `${currentMonth}-31`)

    if (monthExpensesError) {
      console.error('❌ Error fetching current month expenses:', monthExpensesError)
    }

    const currentMonthExpenseAmount = currentMonthExpenses?.reduce((sum, expense) => {
      const baseAmount = parseFloat(expense.amount?.toString() || '0') || 0
      const vatAmount = parseFloat(expense.vat_amount?.toString() || '0') || 0
      return sum + baseAmount + vatAmount
    }, 0) || 0

    // 9. Calculate net profit
    const netProfit = totalRevenue - totalExpenseAmount
    const currentMonthNetProfit = currentMonthRevenue - currentMonthExpenseAmount

    // 10. Document processing status
    const totalUploadedDocuments = (totalDocuments || 0) + (totalRawDocuments || 0)
    const processedDocuments = totalDocuments || 0
    const pendingDocuments = totalRawDocuments || 0

    const metrics = {
      // Counts
      totalInvoices: totalInvoices || 0,
      totalExpenses: totalExpenses || 0,
      totalDocuments: totalUploadedDocuments, // Total uploaded documents
      processedDocuments: processedDocuments, // Successfully processed
      pendingDocuments: pendingDocuments, // Waiting to be processed
      totalClients: totalClients || 0,

      // Financial totals (all time)
      totalRevenue: totalRevenue,
      totalExpenseAmount: totalExpenseAmount,
      netProfit: netProfit,

      // Current month metrics
      currentMonthRevenue: currentMonthRevenue,
      currentMonthExpenseAmount: currentMonthExpenseAmount,
      currentMonthNetProfit: currentMonthNetProfit,

      // Processing stats
      processingSuccessRate: totalUploadedDocuments > 0 ?
        Math.round((processedDocuments / totalUploadedDocuments) * 100) : 0
    }

    console.log(`📊 Final metrics for tenant ${tenantId}:`, metrics)

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('❌ Dashboard metrics error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}