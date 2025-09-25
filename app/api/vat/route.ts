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
    console.log('💰 Fetching VAT data for tenant:', tenantId)

    // Obtener datos de la tabla whatsapp_vat_data (datos reales procesados por WhatsApp)
    const { data: whatsappVATData, error: whatsappVATError } = await supabase
      .from('whatsapp_vat_data')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('processing_date', { ascending: false })

    if (whatsappVATError) {
      console.error('❌ Error fetching WhatsApp VAT data:', whatsappVATError)
      // Si la tabla no existe, crear datos vacíos
      console.log('📝 Table whatsapp_vat_data might not exist yet, returning empty data')
      // Retornar datos vacíos inmediatamente si la tabla no existe
      return NextResponse.json({
        records: [],
        currentMonth: {
          totalSales: 0,
          totalPurchases: 0,
          vatCollected: 0,
          vatPaid: 0,
          vatDue: 0
        },
        summary: {
          totalVatToPay: 0,
          totalVatCollected: 0,
          totalVatPaid: 0,
          declarationsCount: 0
        },
        calculationDetails: {
          whatsappVATRecords: 0,
          vatCalculationMethod: 'Table not created yet',
          dataSource: 'whatsapp_vat_data table (not created)',
          error: 'Table whatsapp_vat_data does not exist. Please create it first.'
        }
      })
    }

    console.log(`📱 WhatsApp VAT records found: ${whatsappVATData?.length || 0}`)

    // Función auxiliar para calcular IVA correctamente
    const calculateVAT = (amount: number, vatRate: number): number => {
      if (!amount || !vatRate) return 0
      return Math.round((amount * vatRate / 100) * 100) / 100 // Redondear a 2 decimales
    }

    // Función auxiliar para obtener el IVA real de una factura
    const getRealVAT = (invoice: any): number => {
      // Si ya tiene vat_amount calculado, usarlo
      if (invoice.vat_amount && parseFloat(invoice.vat_amount) > 0) {
        return parseFloat(invoice.vat_amount)
      }

      // Si no, calcularlo basado en el porcentaje y el importe base
      const amount = parseFloat(invoice.amount || invoice.total_amount || '0')
      const vatRate = parseFloat(invoice.vat_rate || '23') // Default 23% si no especificado

      return calculateVAT(amount, vatRate)
    }

    // Calcular totales por mes
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1

    // Función para obtener datos del mes actual
    const getCurrentMonthData = () => {
      const monthStart = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`
      const monthEnd = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-31`

      // Filtrar datos de WhatsApp del mes actual
      const currentMonthData = whatsappVATData?.filter(record => {
        const recordDate = new Date(record.processing_date)
        return recordDate >= new Date(monthStart) && recordDate <= new Date(monthEnd)
      }) || []

      // Separar facturas y gastos
      const invoices = currentMonthData.filter(record => record.document_type === 'invoice')
      const expenses = currentMonthData.filter(record => record.document_type === 'expense')

      // Calcular totales
      const totalSales = invoices.reduce((sum, record) => sum + parseFloat(record.total_amount || '0'), 0)
      const totalPurchases = expenses.reduce((sum, record) => sum + parseFloat(record.total_amount || '0'), 0)
      const vatCollected = invoices.reduce((sum, record) => sum + parseFloat(record.vat_amount || '0'), 0)
      const vatPaid = expenses.reduce((sum, record) => sum + parseFloat(record.vat_amount || '0'), 0)

      return {
        totalSales,
        totalPurchases,
        vatCollected,
        vatPaid,
        vatDue: vatCollected - vatPaid
      }
    }

    // Función para obtener datos de meses anteriores
    const getPreviousMonthData = (monthsBack: number) => {
      const targetDate = new Date(currentYear, currentMonth - 1 - monthsBack, 1)
      const year = targetDate.getFullYear()
      const month = targetDate.getMonth() + 1
      const monthStart = `${year}-${month.toString().padStart(2, '0')}-01`
      const monthEnd = `${year}-${month.toString().padStart(2, '0')}-31`

      // Filtrar datos de WhatsApp del mes específico
      const monthData = whatsappVATData?.filter(record => {
        const recordDate = new Date(record.processing_date)
        return recordDate >= new Date(monthStart) && recordDate <= new Date(monthEnd)
      }) || []

      // Separar facturas y gastos
      const invoices = monthData.filter(record => record.document_type === 'invoice')
      const expenses = monthData.filter(record => record.document_type === 'expense')

      // Calcular totales
      const totalSales = invoices.reduce((sum, record) => sum + parseFloat(record.total_amount || '0'), 0)
      const totalPurchases = expenses.reduce((sum, record) => sum + parseFloat(record.total_amount || '0'), 0)
      const vatCollected = invoices.reduce((sum, record) => sum + parseFloat(record.vat_amount || '0'), 0)
      const vatPaid = expenses.reduce((sum, record) => sum + parseFloat(record.vat_amount || '0'), 0)

      return {
        period: `${year}-${month.toString().padStart(2, '0')}`,
        totalSales,
        totalPurchases,
        vatCollected,
        vatPaid,
        vatDue: vatCollected - vatPaid,
        status: vatCollected - vatPaid > 0 ? 'pendente' : 'pago'
      }
    }

    // Generar datos solo para meses que tienen datos reales
    const vatRecords = []

    if (whatsappVATData && whatsappVATData.length > 0) {
      // Obtener todos los períodos únicos que tienen datos
      const uniquePeriods = [...new Set(whatsappVATData.map(record => {
        const date = new Date(record.processing_date)
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
      }))]

      // Generar datos solo para períodos con datos reales
      for (const period of uniquePeriods) {
        const [year, month] = period.split('-').map(Number)
        const monthsBack = (currentYear - year) * 12 + (currentMonth - month)
        vatRecords.push(getPreviousMonthData(monthsBack))
      }

      // Ordenar por período (más reciente primero)
      vatRecords.sort((a, b) => b.period.localeCompare(a.period))
    }

    // Datos del mes actual
    const currentMonthData = getCurrentMonthData()

    console.log(`✅ Generated VAT data for ${vatRecords.length} months`)
    console.log(`📊 Current month data:`, currentMonthData)
    console.log(`🔍 VAT calculation details (WhatsApp VAT table):`)
    console.log(`   - WhatsApp VAT records: ${whatsappVATData?.length || 0}`)
    console.log(`   - IVA cobrado (mes actual): €${currentMonthData.vatCollected.toFixed(2)}`)
    console.log(`   - IVA pagado (mes actual): €${currentMonthData.vatPaid.toFixed(2)}`)
    console.log(`   - IVA a pagar (mes actual): €${currentMonthData.vatDue.toFixed(2)}`)

    return NextResponse.json({
      records: vatRecords,
      currentMonth: currentMonthData,
      summary: {
        totalVatToPay: currentMonthData.vatDue,
        totalVatCollected: currentMonthData.vatCollected,
        totalVatPaid: currentMonthData.vatPaid,
        declarationsCount: vatRecords.length
      },
      calculationDetails: {
        whatsappVATRecords: whatsappVATData?.length || 0,
        vatCalculationMethod: 'WhatsApp VAT table - Real data per invoice/expense',
        dataSource: 'whatsapp_vat_data table'
      }
    })
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

export async function DELETE(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || '1'
    const url = new URL(request.url)
    const deleteType = url.searchParams.get('type') // 'all' or 'individual'
    const period = url.searchParams.get('period') // For individual deletion

    console.log(`🗑️ Deleting VAT data for tenant: ${tenantId}, type: ${deleteType}`)

    if (deleteType === 'all') {
      // Eliminar todos los datos de la tabla whatsapp_vat_data
      const { error: vatDataError } = await supabase
        .from('whatsapp_vat_data')
        .delete()
        .eq('tenant_id', tenantId)

      if (vatDataError) {
        console.error('❌ Error deleting WhatsApp VAT data:', vatDataError)
        // Si la tabla no existe, no es un error real
        if (vatDataError.code === 'PGRST205') {
          console.log('📝 Table whatsapp_vat_data does not exist, nothing to delete')
          return NextResponse.json({ message: 'No VAT data to delete (table does not exist)' })
        }
        return NextResponse.json({ error: 'Failed to delete VAT data' }, { status: 500 })
      }

      console.log('✅ All WhatsApp VAT data deleted successfully')
      return NextResponse.json({ message: 'All WhatsApp VAT data deleted successfully' })

    } else if (deleteType === 'individual' && period) {
      // Eliminar datos de un período específico
      const year = parseInt(period.split('-')[0])
      const month = parseInt(period.split('-')[1])
      const monthStart = `${year}-${month.toString().padStart(2, '0')}-01`
      const monthEnd = `${year}-${month.toString().padStart(2, '0')}-31`

      // Eliminar datos del período
      const { error: vatDataError } = await supabase
        .from('whatsapp_vat_data')
        .delete()
        .eq('tenant_id', tenantId)
        .gte('processing_date', monthStart)
        .lte('processing_date', monthEnd)

      if (vatDataError) {
        console.error('❌ Error deleting VAT data for period:', vatDataError)
        // Si la tabla no existe, no es un error real
        if (vatDataError.code === 'PGRST205') {
          console.log('📝 Table whatsapp_vat_data does not exist, nothing to delete')
          return NextResponse.json({ message: `No VAT data to delete for period ${period} (table does not exist)` })
        }
        return NextResponse.json({ error: 'Failed to delete VAT data for period' }, { status: 500 })
      }

      console.log(`✅ VAT data for period ${period} deleted successfully`)
      return NextResponse.json({ message: `VAT data for period ${period} deleted successfully` })

    } else {
      return NextResponse.json({ error: 'Invalid delete request' }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ VAT DELETE API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}