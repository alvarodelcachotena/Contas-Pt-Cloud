import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict, getSupabaseUrl, getSupabaseServiceRoleKey } from '../../../lib/env-loader.js'

// Load environment variables strictly from .env file
loadEnvStrict()

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = getSupabaseUrl()
    const supabaseKey = getSupabaseServiceRoleKey()
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase credentials not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verificar documentos recientes
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('processing_method', 'whatsapp_webhook')
      .order('created_at', { ascending: false })
      .limit(5)

    if (docError) {
      return NextResponse.json({ error: `Error obteniendo documentos: ${docError.message}` }, { status: 500 })
    }

    // Verificar facturas recientes
    const { data: invoices, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (invError) {
      return NextResponse.json({ error: `Error obteniendo facturas: ${invError.message}` }, { status: 500 })
    }

    // Verificar despesas recientes
    const { data: expenses, error: expError } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (expError) {
      return NextResponse.json({ error: `Error obteniendo despesas: ${expError.message}` }, { status: 500 })
    }

    // Verificar clientes recientes
    const { data: clients, error: cliError } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (cliError) {
      return NextResponse.json({ error: `Error obteniendo clientes: ${cliError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        documents: documents || [],
        invoices: invoices || [],
        expenses: expenses || [],
        clients: clients || [],
        summary: {
          totalDocuments: documents?.length || 0,
          totalInvoices: invoices?.length || 0,
          totalExpenses: expenses?.length || 0,
          totalClients: clients?.length || 0
        }
      }
    })

  } catch (error) {
    console.error('❌ Error en debug endpoint:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}