import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict } from '../../../../lib/env-loader.js'
import { getTenantId } from '../../../../lib/tenant-utils'

// Load environment variables
loadEnvStrict()

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  console.log('🔍 Creating Supabase client with:')
  console.log('- URL ends with:', url.slice(-12))
  console.log('- Service key ends with:', key.slice(-10))
  
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const service = searchParams.get('service')
    
    const supabase = createSupabaseClient()
    const tenantId = await getTenantId(request)

    console.log(`🔍 Fetching webhook credentials for tenant ${tenantId}, service: ${service}`)

    let query = supabase
      .from('webhook_credentials')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)

    if (service && service !== 'all') {
      query = query.eq('service_type', service)
    }

    const { data: credentials, error } = await query

    if (error) {
      console.error('Error fetching webhook credentials:', error)
      return NextResponse.json({ error: 'Erro ao buscar credenciais', details: error }, { status: 500 })
    }

    console.log(`✅ Found ${credentials?.length || 0} credentials`)
    return NextResponse.json({ credentials: credentials || [] })
  } catch (error) {
    console.error('Error in webhook credentials API:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { service_type, credential_name, credential_value } = body

    if (!service_type || !credential_name || !credential_value) {
      return NextResponse.json({ error: 'Dados obrigatórios em falta' }, { status: 400 })
    }

    const supabase = createSupabaseClient()
    const tenantId = await getTenantId(request)

    // Simple storage without encryption for now
    const { data, error } = await supabase
      .from('webhook_credentials')
      .insert({
        tenant_id: tenantId,
        service_type,
        credential_name,
        encrypted_value: credential_value, // In production, this should be encrypted
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving webhook credential:', error)
      return NextResponse.json({ error: 'Erro ao guardar credencial' }, { status: 500 })
    }

    return NextResponse.json({ success: true, credential: data })
  } catch (error) {
    console.error('Error in webhook credentials POST:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const credentialId = searchParams.get('id')

    if (!credentialId) {
      return NextResponse.json({ error: 'ID da credencial obrigatório' }, { status: 400 })
    }

    const supabase = createSupabaseClient()
    const tenantId = await getTenantId(request)

    const { error } = await supabase
      .from('webhook_credentials')
      .delete()
      .eq('id', credentialId)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('Error deleting webhook credential:', error)
      return NextResponse.json({ error: 'Erro ao remover credencial' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in webhook credentials DELETE:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}