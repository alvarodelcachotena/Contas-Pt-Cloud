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
    console.log('🔍 Fetching invoices for tenant:', tenantId)

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching invoices:', error)
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    console.log('✅ Found', invoices?.length || 0, 'invoices')

    const formattedInvoices = invoices?.map(invoice => ({
      id: invoice.id,
      number: invoice.number || `FAT-${invoice.id.toString().padStart(6, '0')}`,
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
      paymentType: invoice.payment_type,
      createdAt: invoice.created_at
    })) || []

    return NextResponse.json(formattedInvoices)
  } catch (error) {
    console.error('❌ Invoices API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📝 Creating invoice for tenant: 1', body)

    // Generate invoice number automatically
    const { count: invoiceCount, error: countError } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', 1)

    if (countError) {
      console.error('❌ Error counting invoices:', countError)
      return NextResponse.json({ error: 'Failed to generate invoice number' }, { status: 500 })
    }

    const nextInvoiceNumber = `FAT-${((invoiceCount || 0) + 1).toString().padStart(6, '0')}`
    console.log('📋 Generated invoice number:', nextInvoiceNumber)

    // Prepare invoice data
    const invoiceData = {
      tenant_id: 1,
      number: nextInvoiceNumber,
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
      payment_terms: body.paymentTerms || '30 dias'
    }

    console.log('📋 Invoice data to insert:', invoiceData)

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating invoice:', error)
      return NextResponse.json({
        error: 'Failed to create invoice',
        details: error.message
      }, { status: 500 })
    }

    console.log('✅ Invoice created successfully:', invoice.id)
    return NextResponse.json(invoice)
  } catch (error) {
    console.error('❌ Create invoice error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}