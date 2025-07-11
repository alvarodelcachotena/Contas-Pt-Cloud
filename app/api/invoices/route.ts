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
    // For now, get all invoices without tenant filtering
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invoices:', error)
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    const formattedInvoices = invoices?.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      clientName: invoice.client_name,
      clientEmail: invoice.client_email,
      clientTaxId: invoice.client_tax_id,
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      amount: invoice.amount,
      vatAmount: invoice.vat_amount,
      vatRate: invoice.vat_rate,
      totalAmount: invoice.total_amount,
      status: invoice.status,
      description: invoice.description,
      paymentTerms: invoice.payment_terms,
      createdAt: invoice.created_at
    })) || []

    return NextResponse.json(formattedInvoices)
  } catch (error) {
    console.error('Invoices API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        tenant_id: 1, // Default tenant for now
        number: body.number,
        client_name: body.clientName,
        client_email: body.clientEmail,
        client_tax_id: body.clientTaxId,
        issue_date: body.issueDate,
        due_date: body.dueDate,
        amount: body.amount,
        vat_amount: body.vatAmount,
        vat_rate: body.vatRate,
        total_amount: body.totalAmount,
        status: body.status,
        description: body.description,
        payment_terms: body.paymentTerms
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating invoice:', error)
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Create invoice error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}