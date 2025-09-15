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

    // Obtener datos SOLO de WhatsApp (facturas procesadas desde WhatsApp)
    const { data: whatsappInvoicesData, error: whatsappInvoicesError } = await supabase
      .from('invoices')
      .select('total_amount, vat_amount, vat_rate, amount, issue_date, status, description')
      .eq('tenant_id', tenantId)
      .ilike('description', '%WhatsApp%') // SOLO facturas de WhatsApp

    if (whatsappInvoicesError) {
      console.error('❌ Error fetching WhatsApp invoices:', whatsappInvoicesError)
    }

    // Obtener datos SOLO de gastos de WhatsApp (facturas recibidas desde WhatsApp)
    const { data: whatsappExpensesData, error: whatsappExpensesError } = await supabase
      .from('expenses')
      .select('amount, vat_amount, vat_rate, expense_date, is_deductible, description')
      .eq('tenant_id', tenantId)
      .ilike('description', '%WhatsApp%') // SOLO gastos de WhatsApp

    if (whatsappExpensesError) {
      console.error('❌ Error fetching WhatsApp expenses:', whatsappExpensesError)
    }

    console.log(`📱 WhatsApp invoices found: ${whatsappInvoicesData?.length || 0}`)
    console.log(`📱 WhatsApp expenses found: ${whatsappExpensesData?.length || 0}`)

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

      // Facturas de WhatsApp del mes actual
      const currentMonthInvoices = whatsappInvoicesData?.filter(invoice => {
        const invoiceDate = new Date(invoice.issue_date)
        return invoiceDate >= new Date(monthStart) && invoiceDate <= new Date(monthEnd)
      }) || []

      // Gastos de WhatsApp del mes actual
      const currentMonthExpenses = whatsappExpensesData?.filter(expense => {
        const expenseDate = new Date(expense.expense_date)
        return expenseDate >= new Date(monthStart) && expenseDate <= new Date(monthEnd)
      }) || []

      // Calcular totales
      const totalSales = currentMonthInvoices.reduce((sum, invoice) =>
        sum + (parseFloat(invoice.total_amount?.toString() || '0') || 0), 0)

      const totalPurchases = currentMonthExpenses.reduce((sum, expense) =>
        sum + (parseFloat(expense.amount?.toString() || '0') || 0), 0)

      // Calcular IVA usando el porcentaje real de cada factura
      const vatCollected = currentMonthInvoices.reduce((sum, invoice) =>
        sum + getRealVAT(invoice), 0)

      const vatPaid = currentMonthExpenses.reduce((sum, expense) => {
        // Para gastos, usar el IVA calculado o el almacenado
        if (expense.vat_amount && parseFloat(expense.vat_amount) > 0) {
          return sum + parseFloat(expense.vat_amount)
        }

        // Si no tiene IVA calculado, calcularlo
        const amount = parseFloat(expense.amount || '0')
        const vatRate = parseFloat(expense.vat_rate || '23')
        return sum + calculateVAT(amount, vatRate)
      }, 0)

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

      const monthInvoices = whatsappInvoicesData?.filter(invoice => {
        const invoiceDate = new Date(invoice.issue_date)
        return invoiceDate >= new Date(monthStart) && invoiceDate <= new Date(monthEnd)
      }) || []

      const monthExpenses = whatsappExpensesData?.filter(expense => {
        const expenseDate = new Date(expense.expense_date)
        return expenseDate >= new Date(monthStart) && expenseDate <= new Date(monthEnd)
      }) || []

      const totalSales = monthInvoices.reduce((sum, invoice) =>
        sum + (parseFloat(invoice.total_amount?.toString() || '0') || 0), 0)

      const totalPurchases = monthExpenses.reduce((sum, expense) =>
        sum + (parseFloat(expense.amount?.toString() || '0') || 0), 0)

      // Calcular IVA usando el porcentaje real de cada factura
      const vatCollected = monthInvoices.reduce((sum, invoice) =>
        sum + getRealVAT(invoice), 0)

      const vatPaid = monthExpenses.reduce((sum, expense) => {
        // Para gastos, usar el IVA calculado o el almacenado
        if (expense.vat_amount && parseFloat(expense.vat_amount) > 0) {
          return sum + parseFloat(expense.vat_amount)
        }

        // Si no tiene IVA calculado, calcularlo
        const amount = parseFloat(expense.amount || '0')
        const vatRate = parseFloat(expense.vat_rate || '23')
        return sum + calculateVAT(amount, vatRate)
      }, 0)

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

    // Generar datos para los últimos 12 meses
    const vatRecords = []
    for (let i = 0; i < 12; i++) {
      vatRecords.push(getPreviousMonthData(i))
    }

    // Datos del mes actual
    const currentMonthData = getCurrentMonthData()

    console.log(`✅ Generated VAT data for ${vatRecords.length} months`)
    console.log(`📊 Current month data:`, currentMonthData)
    console.log(`🔍 VAT calculation details (WhatsApp only):`)
    console.log(`   - Facturas WhatsApp procesadas: ${whatsappInvoicesData?.length || 0}`)
    console.log(`   - Gastos WhatsApp procesados: ${whatsappExpensesData?.length || 0}`)
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
        whatsappInvoicesProcessed: whatsappInvoicesData?.length || 0,
        whatsappExpensesProcessed: whatsappExpensesData?.length || 0,
        vatCalculationMethod: 'WhatsApp data only - Real percentage per invoice/expense',
        dataSource: 'WhatsApp webhook'
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
      // Eliminar todas las facturas de WhatsApp
      const { error: invoicesError } = await supabase
        .from('invoices')
        .delete()
        .eq('tenant_id', tenantId)
        .ilike('description', '%WhatsApp%')

      if (invoicesError) {
        console.error('❌ Error deleting WhatsApp invoices:', invoicesError)
        return NextResponse.json({ error: 'Failed to delete invoices' }, { status: 500 })
      }

      // Eliminar todos los gastos de WhatsApp
      const { error: expensesError } = await supabase
        .from('expenses')
        .delete()
        .eq('tenant_id', tenantId)
        .ilike('description', '%WhatsApp%')

      if (expensesError) {
        console.error('❌ Error deleting WhatsApp expenses:', expensesError)
        return NextResponse.json({ error: 'Failed to delete expenses' }, { status: 500 })
      }

      console.log('✅ All WhatsApp VAT data deleted successfully')
      return NextResponse.json({ message: 'All WhatsApp VAT data deleted successfully' })

    } else if (deleteType === 'individual' && period) {
      // Eliminar datos de un período específico
      const year = parseInt(period.split('-')[0])
      const month = parseInt(period.split('-')[1])
      const monthStart = `${year}-${month.toString().padStart(2, '0')}-01`
      const monthEnd = `${year}-${month.toString().padStart(2, '0')}-31`

      // Eliminar facturas del período
      const { error: invoicesError } = await supabase
        .from('invoices')
        .delete()
        .eq('tenant_id', tenantId)
        .ilike('description', '%WhatsApp%')
        .gte('issue_date', monthStart)
        .lte('issue_date', monthEnd)

      if (invoicesError) {
        console.error('❌ Error deleting invoices for period:', invoicesError)
        return NextResponse.json({ error: 'Failed to delete invoices for period' }, { status: 500 })
      }

      // Eliminar gastos del período
      const { error: expensesError } = await supabase
        .from('expenses')
        .delete()
        .eq('tenant_id', tenantId)
        .ilike('description', '%WhatsApp%')
        .gte('expense_date', monthStart)
        .lte('expense_date', monthEnd)

      if (expensesError) {
        console.error('❌ Error deleting expenses for period:', expensesError)
        return NextResponse.json({ error: 'Failed to delete expenses for period' }, { status: 500 })
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