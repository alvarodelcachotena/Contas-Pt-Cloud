import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict } from '../../../lib/env-loader.js'

// Load environment variables strictly from .env file
loadEnvStrict()

// Use service role key to bypass RLS and avoid infinite recursion
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId') || '1'

    console.log('💰 Fetching payments for tenant:', tenantId)

    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('tenant_id', parseInt(tenantId))
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching payments:', error)
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
    }

    console.log('✅ Payments fetched successfully:', payments?.length || 0)
    return NextResponse.json({ payments: payments || [] })

  } catch (error) {
    console.error('❌ Payments API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      tenantId = 1, 
      description, 
      amount, 
      method, 
      type, 
      date, 
      status = 'completed',
      category,
      reference,
      notes
    } = body

    console.log('💰 Creating payment:', { tenantId, description, amount, method, type })

    // Validate required fields
    if (!description || amount === undefined || !method || !type) {
      return NextResponse.json({ 
        error: 'Missing required fields: description, amount, method, type' 
      }, { status: 400 })
    }

    // Validate amount
    if (typeof amount !== 'number' || isNaN(amount)) {
      return NextResponse.json({ 
        error: 'Amount must be a valid number' 
      }, { status: 400 })
    }

    // Note: method field is not stored in the database schema, but we keep it for frontend compatibility

    // Validate type
    const validTypes = ['income', 'expense']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ 
        error: `Invalid payment type. Must be one of: ${validTypes.join(', ')}` 
      }, { status: 400 })
    }

    // Create payment record
    const paymentData = {
      tenant_id: parseInt(tenantId.toString()),
      description: description.trim(),
      amount: parseFloat(amount.toString()),
      payment_date: date || new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
      reference: reference || null,
      type,
      status
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating payment:', error)
      return NextResponse.json({ 
        error: 'Failed to create payment',
        details: error.message 
      }, { status: 500 })
    }

    console.log('✅ Payment created successfully:', payment.id)
    return NextResponse.json({ 
      success: true, 
      payment,
      message: 'Payment created successfully' 
    })

  } catch (error) {
    console.error('❌ Payments API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })
    }

    console.log('💰 Updating payment:', id)

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString()

    const { data: payment, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating payment:', error)
      return NextResponse.json({ 
        error: 'Failed to update payment',
        details: error.message 
      }, { status: 500 })
    }

    console.log('✅ Payment updated successfully:', payment.id)
    return NextResponse.json({ 
      success: true, 
      payment,
      message: 'Payment updated successfully' 
    })

  } catch (error) {
    console.error('❌ Payments API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })
    }

    console.log('💰 Deleting payment:', id)

    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ Error deleting payment:', error)
      return NextResponse.json({ 
        error: 'Failed to delete payment',
        details: error.message 
      }, { status: 500 })
    }

    console.log('✅ Payment deleted successfully:', id)
    return NextResponse.json({ 
      success: true,
      message: 'Payment deleted successfully' 
    })

  } catch (error) {
    console.error('❌ Payments API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
