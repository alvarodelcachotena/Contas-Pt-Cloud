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
    console.log('🏦 Fetching banking transactions for tenant:', tenantId)

    const { data: transactions, error } = await supabase
      .from('banking_transactions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('transaction_date', { ascending: false })

    if (error) {
      console.error('❌ Error fetching banking transactions:', error)
      return NextResponse.json({ error: 'Failed to fetch banking transactions' }, { status: 500 })
    }

    console.log(`✅ Found ${transactions?.length || 0} banking transactions`)

    const formattedTransactions = transactions?.map(transaction => ({
      id: transaction.id,
      accountNumber: transaction.account_number,
      transactionType: transaction.transaction_type,
      amount: transaction.amount,
      description: transaction.description,
      transactionDate: transaction.transaction_date,
      balance: transaction.balance,
      category: transaction.category,
      reference: transaction.reference,
      createdAt: transaction.created_at
    })) || []

    return NextResponse.json(formattedTransactions)
  } catch (error) {
    console.error('❌ Banking API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🏦 Creating banking transaction for tenant: 1', body)

    // Prepare transaction data
    const transactionData = {
      tenant_id: 1,
      account_number: body.accountNumber,
      transaction_type: body.transactionType,
      amount: body.amount,
      description: body.description,
      transaction_date: body.transactionDate,
      balance: body.balance,
      category: body.category,
      reference: body.reference
    }

    console.log('📋 Transaction data to insert:', transactionData)

    const { data: transaction, error } = await supabase
      .from('banking_transactions')
      .insert(transactionData)
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating banking transaction:', error)
      return NextResponse.json({
        error: 'Failed to create banking transaction',
        details: error.message
      }, { status: 500 })
    }

    console.log('✅ Banking transaction created successfully:', transaction.id)
    return NextResponse.json(transaction)
  } catch (error) {
    console.error('❌ Create banking transaction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}