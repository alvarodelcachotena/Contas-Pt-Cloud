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

    // Obtener datos reales de facturas emitidas (ingresos)
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select('total_amount, vat_amount, vat_rate, amount, issue_date, status')
      .eq('tenant_id', tenantId)
      .not('description', 'ilike', '%WhatsApp%') // Excluir facturas de WhatsApp (son gastos)

    if (invoicesError) {
      console.error('❌ Error fetching invoices:', invoicesError)
    }

    // Obtener datos reales de gastos (facturas recibidas)
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('amount, vat_amount, vat_rate, expense_date, is_deductible')
      .eq('tenant_id', tenantId)

    if (expensesError) {
      console.error('❌ Error fetching expenses:', expensesError)
    }

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

      // Facturas emitidas del mes actual
      const currentMonthInvoices = invoicesData?.filter(invoice => {
        const invoiceDate = new Date(invoice.issue_date)
        return invoiceDate >= new Date(monthStart) && invoiceDate <= new Date(monthEnd)
      }) || []

      // Gastos del mes actual
      const currentMonthExpenses = expensesData?.filter(expense => {
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

      const monthInvoices = invoicesData?.filter(invoice => {
        const invoiceDate = new Date(invoice.issue_date)
        return invoiceDate >= new Date(monthStart) && invoiceDate <= new Date(monthEnd)
      }) || []

      const monthExpenses = expensesData?.filter(expense => {
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
    console.log(`🔍 VAT calculation details:`)
    console.log(`   - Facturas procesadas: ${invoicesData?.length || 0}`)
    console.log(`   - Gastos procesados: ${expensesData?.length || 0}`)
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
        invoicesProcessed: invoicesData?.length || 0,
        expensesProcessed: expensesData?.length || 0,
        vatCalculationMethod: 'Real percentage per invoice/expense'
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