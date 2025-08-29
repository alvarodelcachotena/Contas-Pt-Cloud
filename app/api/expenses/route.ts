import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict, getSupabaseUrl, getSupabaseAnonKey } from '../../../lib/env-loader.js'

// Force loading from .env file only
loadEnvStrict()

const SUPABASE_URL = getSupabaseUrl()
const SUPABASE_ANON_KEY = getSupabaseAnonKey()

// Use anon key for API access
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || '1'
    console.log('🔍 Fetching expenses for tenant:', tenantId)

    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching expenses:', error)
      return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
    }

    console.log(`✅ Found ${expenses?.length || 0} expenses`)

    const formattedExpenses = expenses?.map(expense => ({
      id: expense.id,
      vendor: expense.vendor,
      amount: expense.amount,
      vatAmount: expense.vat_amount,
      vatRate: expense.vat_rate,
      category: expense.category,
      description: expense.description,
      receiptNumber: expense.receipt_number,
      expenseDate: expense.expense_date,
      isDeductible: expense.is_deductible,
      createdAt: expense.created_at
    })) || []

    return NextResponse.json(formattedExpenses)
  } catch (error) {
    console.error('❌ Expenses API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📝 Creating expense for tenant: 1', body)

    // Prepare expense data
    const expenseData = {
      tenant_id: 1,
      vendor: body.vendor,
      amount: body.amount,
      vat_amount: body.vatAmount,
      vat_rate: body.vatRate,
      category: body.category,
      description: body.description,
      receipt_number: body.receiptNumber,
      expense_date: body.expenseDate,
      is_deductible: body.isDeductible
    }

    console.log('📋 Expense data to insert:', expenseData)

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating expense:', error)
      return NextResponse.json({
        error: 'Failed to create expense',
        details: error.message
      }, { status: 500 })
    }

    console.log('✅ Expense created successfully:', expense.id)
    return NextResponse.json(expense)
  } catch (error) {
    console.error('❌ Create expense error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || '1'

    // Delete all expenses for the tenant
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('❌ Error deleting expenses:', error)
      return NextResponse.json({ error: 'Failed to delete expenses' }, { status: 500 })
    }

    console.log(`🗑️ Deleted all expenses for tenant ${tenantId}`)
    return NextResponse.json({ message: 'All expenses deleted successfully' })
  } catch (error) {
    console.error('❌ Delete expenses error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}