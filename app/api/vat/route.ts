import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict } from '../../../lib/env-loader.js'

// Force loading from .env file only
loadEnvStrict()

// Use service role key to bypass RLS and avoid infinite recursion
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
)

// Portuguese VAT rates
const PORTUGUESE_VAT_RATES = [
  { rate: 6, description: 'Taxa Reduzida', category: 'essential_goods' },
  { rate: 13, description: 'Taxa Intermédia', category: 'restaurant_hotels' },
  { rate: 23, description: 'Taxa Normal', category: 'general_goods' }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    if (type === 'rates') {
      return NextResponse.json(PORTUGUESE_VAT_RATES)
    }
    
    // Get VAT transactions/reports
    const tenantId = request.headers.get('x-tenant-id') || '1'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    let query = supabase
      .from('expenses')
      .select('*')
      .eq('tenant_id', tenantId)
      .not('vat_amount', 'is', null)
    
    if (startDate) {
      query = query.gte('expense_date', startDate)
    }
    
    if (endDate) {
      query = query.lte('expense_date', endDate)
    }
    
    const { data: expenses, error } = await query.order('expense_date', { ascending: false })
    
    if (error) {
      console.error('Error fetching VAT data:', error)
      return NextResponse.json({ error: 'Failed to fetch VAT data' }, { status: 500 })
    }

    // Calculate VAT summary
    const vatSummary = PORTUGUESE_VAT_RATES.map(rate => {
      const rateExpenses = expenses?.filter(exp => exp.vat_rate === rate.rate) || []
      const totalAmount = rateExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || '0'), 0)
      const totalVAT = rateExpenses.reduce((sum, exp) => sum + parseFloat(exp.vat_amount || '0'), 0)
      
      return {
        rate: rate.rate,
        description: rate.description,
        category: rate.category,
        transactionCount: rateExpenses.length,
        totalAmount: totalAmount.toFixed(2),
        totalVAT: totalVAT.toFixed(2)
      }
    })
    
    return NextResponse.json({
      summary: vatSummary,
      transactions: expenses?.map(exp => ({
        id: exp.id,
        vendor: exp.vendor,
        amount: exp.amount,
        vatAmount: exp.vat_amount,
        vatRate: exp.vat_rate,
        expenseDate: exp.expense_date,
        description: exp.description
      })) || []
    })
  } catch (error) {
    console.error('VAT API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}