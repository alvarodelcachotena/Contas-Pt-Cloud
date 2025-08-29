import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict, getSupabaseUrl } from '../../../lib/env-loader.js'

// Force loading from .env file only
loadEnvStrict()

const SUPABASE_URL = getSupabaseUrl()
// Usar ANON_KEY si no hay SERVICE_ROLE_KEY
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!SUPABASE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is required')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || '1'
    console.log('🔍 Fetching clients for tenant:', tenantId)

    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching clients:', error)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    console.log('✅ Found', clients?.length || 0, 'clients')

    const formattedClients = clients?.map(client => ({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      taxId: client.nif, // Usar 'nif' que es la columna real en la BD
      postalCode: null, // No existe en la BD
      city: null, // No existe en la BD
      isActive: client.is_active,
      createdAt: client.created_at
    })) || []

    return NextResponse.json(formattedClients)
  } catch (error) {
    console.error('❌ Clients API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📝 Creating client for tenant: 1', body)

    // Validación más flexible del NIF
    if (body.taxId) {
      // Remover espacios y caracteres especiales, solo mantener números
      const cleanTaxId = body.taxId.replace(/[^0-9]/g, '')

      if (cleanTaxId.length !== 9) {
        console.log('❌ NIF validation failed:', {
          original: body.taxId,
          cleaned: cleanTaxId,
          length: cleanTaxId.length
        })
        return NextResponse.json({
          error: `Invalid NIF format. Must be 9 digits. Received: ${body.taxId} (${cleanTaxId.length} digits after cleaning)`
        }, { status: 400 })
      }

      // Usar el NIF limpio
      body.taxId = cleanTaxId
    }

    // Preparar datos para insertar - usar solo columnas que existen en la BD
    const clientData = {
      tenant_id: 1,
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      nif: body.taxId, // Usar 'nif' que es la columna real en la BD
      is_active: true
    }

    console.log('📋 Client data to insert:', clientData)

    const { data: client, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating client:', error)
      return NextResponse.json({
        error: 'Failed to create client',
        details: error.message
      }, { status: 500 })
    }

    console.log('✅ Client created successfully:', client.id)
    return NextResponse.json(client)
  } catch (error) {
    console.error('❌ Create client error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}