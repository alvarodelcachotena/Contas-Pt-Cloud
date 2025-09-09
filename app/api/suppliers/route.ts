import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict, getSupabaseUrl, getSupabaseAnonKey } from '../../../lib/env-loader.js'
import { getTenantId } from '../../../lib/tenant-utils'

// Load environment variables strictly from .env file
loadEnvStrict()

// Create a fresh Supabase client for each request to avoid caching issues
function createSupabaseClient(useServiceRole = false) {
  // Force reload environment variables
  loadEnvStrict()

  const url = getSupabaseUrl()
  const key = useServiceRole ? process.env.SUPABASE_SERVICE_ROLE_KEY : getSupabaseAnonKey()

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-client-info': 'suppliers-api'
      }
    }
  })
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching suppliers...')
    
    // Create fresh Supabase client
    const supabase = createSupabaseClient()

    // Get tenant ID dynamically (multi-tenant support)
    const tenantId = await getTenantId(request)
    console.log('🏢 Using tenant ID:', tenantId)

    // Fetch suppliers from database
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('❌ Error fetching suppliers:', error)
      return NextResponse.json({ error: 'Erro ao buscar fornecedores' }, { status: 500 })
    }

    console.log(`✅ Found ${suppliers?.length || 0} suppliers`)
    
    return NextResponse.json(suppliers || [])
    
  } catch (error) {
    console.error('❌ Error in suppliers GET:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('➕ Creating new supplier...')
    
    // Create fresh Supabase client with service role for write operations
    const supabase = createSupabaseClient(true)

    // Get tenant ID dynamically (multi-tenant support)
    const tenantId = await getTenantId(request)
    console.log('🏢 Using tenant ID:', tenantId)

    // Parse request body
    const body = await request.json()
    console.log('📝 Request body:', body)

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    // Prepare supplier data
    const supplierData = {
      tenant_id: tenantId,
      name: body.name,
      tax_id: body.tax_id || null,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      postal_code: body.postal_code || null,
      city: body.city || null,
      contact_person: body.contact_person || null,
      payment_terms: body.payment_terms || null,
      notes: body.notes || null,
      is_active: true
    }

    // Insert supplier into database
    const { data: newSupplier, error } = await supabase
      .from('suppliers')
      .insert([supplierData])
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating supplier:', error)
      return NextResponse.json({ error: 'Erro ao criar fornecedor' }, { status: 500 })
    }

    console.log('✅ Supplier created successfully:', newSupplier.id)
    
    return NextResponse.json(newSupplier, { status: 201 })
    
  } catch (error) {
    console.error('❌ Error in suppliers POST:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('✏️ Updating supplier...')
    
    // Create fresh Supabase client with service role for write operations
    const supabase = createSupabaseClient(true)

    // Get tenant ID dynamically (multi-tenant support)
    const tenantId = await getTenantId(request)
    console.log('🏢 Using tenant ID:', tenantId)

    // Parse request body
    const body = await request.json()
    console.log('📝 Request body:', body)

    // Validate required fields
    if (!body.id) {
      return NextResponse.json({ error: 'ID do fornecedor é obrigatório' }, { status: 400 })
    }

    if (!body.name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    // Prepare supplier data for update
    const supplierData = {
      name: body.name,
      tax_id: body.tax_id || null,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      postal_code: body.postal_code || null,
      city: body.city || null,
      contact_person: body.contact_person || null,
      payment_terms: body.payment_terms || null,
      notes: body.notes || null,
      is_active: body.is_active !== undefined ? body.is_active : true
    }

    // Update supplier in database
    const { data: updatedSupplier, error } = await supabase
      .from('suppliers')
      .update(supplierData)
      .eq('id', body.id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating supplier:', error)
      return NextResponse.json({ error: 'Erro ao atualizar fornecedor' }, { status: 500 })
    }

    console.log('✅ Supplier updated successfully:', updatedSupplier.id)
    
    return NextResponse.json(updatedSupplier)
    
  } catch (error) {
    console.error('❌ Error in suppliers PUT:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Deleting supplier...')
    
    // Create fresh Supabase client with service role for write operations
    const supabase = createSupabaseClient(true)

    // Get tenant ID dynamically (multi-tenant support)
    const tenantId = await getTenantId(request)
    console.log('🏢 Using tenant ID:', tenantId)

    // Get supplier ID from URL
    const url = new URL(request.url)
    const supplierId = url.searchParams.get('id')

    if (!supplierId) {
      return NextResponse.json({ error: 'ID do fornecedor é obrigatório' }, { status: 400 })
    }

    // Soft delete supplier (set is_active to false)
    const { error } = await supabase
      .from('suppliers')
      .update({ is_active: false })
      .eq('id', supplierId)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('❌ Error deleting supplier:', error)
      return NextResponse.json({ error: 'Erro ao eliminar fornecedor' }, { status: 500 })
    }

    console.log('✅ Supplier deleted successfully:', supplierId)
    
    return NextResponse.json({ success: true, message: 'Fornecedor eliminado com sucesso' })
    
  } catch (error) {
    console.error('❌ Error in suppliers DELETE:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
