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

    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching clients:', error)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    const formattedClients = clients?.map(client => ({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      taxId: client.tax_id,
      isActive: client.is_active,
      createdAt: client.created_at
    })) || []

    return NextResponse.json(formattedClients)
  } catch (error) {
    console.error('Clients API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate Portuguese NIF format (9 digits)
    if (body.taxId && !/^\d{9}$/.test(body.taxId)) {
      return NextResponse.json({ 
        error: 'Invalid NIF format. Must be 9 digits.' 
      }, { status: 400 })
    }
    
    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        tenant_id: 1,
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        tax_id: body.taxId,
        is_active: body.isActive ?? true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating client:', error)
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Create client error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}