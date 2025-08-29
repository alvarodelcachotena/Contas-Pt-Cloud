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
    console.log('💰 Fetching VAT records for tenant:', tenantId)

    const { data: vatRecords, error } = await supabase
      .from('vat_records')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('period', { ascending: false })

    if (error) {
      console.error('❌ Error fetching VAT records:', error)
      return NextResponse.json({ error: 'Failed to fetch VAT records' }, { status: 500 })
    }

    console.log(`✅ Found ${vatRecords?.length || 0} VAT records`)

    const formattedVatRecords = vatRecords?.map(record => ({
      id: record.id,
      period: record.period,
      totalSales: record.total_sales,
      totalPurchases: record.total_purchases,
      vatCollected: record.vat_collected,
      vatPaid: record.vat_paid,
      vatDue: record.vat_due,
      status: record.status,
      dueDate: record.due_date,
      submittedDate: record.submitted_date,
      createdAt: record.created_at
    })) || []

    return NextResponse.json(formattedVatRecords)
  } catch (error) {
    console.error('❌ VAT API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('💰 Creating VAT record for tenant: 1', body)

    // Prepare VAT record data
    const vatData = {
      tenant_id: 1,
      period: body.period,
      total_sales: body.totalSales,
      total_purchases: body.totalPurchases,
      vat_collected: body.vatCollected,
      vat_paid: body.vatPaid,
      vat_due: body.vatDue,
      status: body.status || 'pending',
      due_date: body.dueDate,
      submitted_date: body.submittedDate
    }

    console.log('📋 VAT data to insert:', vatData)

    const { data: vatRecord, error } = await supabase
      .from('vat_records')
      .insert(vatData)
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating VAT record:', error)
      return NextResponse.json({
        error: 'Failed to create VAT record',
        details: error.message
      }, { status: 500 })
    }

    console.log('✅ VAT record created successfully:', vatRecord.id)
    return NextResponse.json(vatRecord)
  } catch (error) {
    console.error('❌ Create VAT record error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}