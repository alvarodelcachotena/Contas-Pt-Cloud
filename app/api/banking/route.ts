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

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || '1'

    const { data: bankAccounts, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bank accounts:', error)
      return NextResponse.json({ error: 'Failed to fetch bank accounts' }, { status: 500 })
    }

    const formattedAccounts = bankAccounts?.map(account => ({
      id: account.id,
      bankName: account.bank_name,
      accountName: account.account_name,
      accountNumber: account.account_number,
      iban: account.iban,
      swift: account.swift,
      balance: account.balance,
      currency: account.currency,
      isActive: account.is_active,
      createdAt: account.created_at
    })) || []

    return NextResponse.json(formattedAccounts)
  } catch (error) {
    console.error('Banking API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate Portuguese IBAN format
    if (body.iban && !body.iban.startsWith('PT50')) {
      return NextResponse.json({ 
        error: 'Invalid Portuguese IBAN format' 
      }, { status: 400 })
    }
    
    const { data: account, error } = await supabase
      .from('bank_accounts')
      .insert({
        tenant_id: 1,
        bank_name: body.bankName,
        account_name: body.accountName,
        account_number: body.accountNumber,
        iban: body.iban,
        swift: body.swift,
        balance: body.balance || '0.00',
        currency: body.currency || 'EUR',
        is_active: body.isActive ?? true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating bank account:', error)
      return NextResponse.json({ error: 'Failed to create bank account' }, { status: 500 })
    }

    return NextResponse.json(account)
  } catch (error) {
    console.error('Create bank account error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}