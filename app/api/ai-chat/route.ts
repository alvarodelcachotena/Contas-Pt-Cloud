import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import { db } from '../../../server/db'
import { sql } from 'drizzle-orm'
import { createTransporter, generateInvoicePDF } from '@/lib/email-config'

// Initialize both AI clients
const googleAI = process.env.GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY) : null
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

// Función para obtener datos de la base de datos usando APIs REST de Supabase
async function getBusinessData(tenantId: number = 1) {
  try {
    console.log('🔍 Obtendo dados da base de dados via APIs REST...')

    // Usar APIs REST de Supabase en lugar de Drizzle
    const baseUrl = process.env.SUPABASE_URL
    const anonKey = process.env.SUPABASE_ANON_KEY

    if (!baseUrl || !anonKey) {
      throw new Error('SUPABASE_URL ou SUPABASE_ANON_KEY não configurados')
    }

    // Función helper para fazer requisições
    const fetchFromSupabase = async (endpoint: string) => {
      const response = await fetch(`${baseUrl}/rest/v1/${endpoint}`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro na API ${endpoint}: ${response.status}`)
      }

      return response.json()
    }

    // Buscar dados via APIs REST
    const [clients, invoices, expenses] = await Promise.allSettled([
      fetchFromSupabase(`clients?select=*&tenant_id=eq.${tenantId}`),
      fetchFromSupabase(`invoices?select=*&tenant_id=eq.${tenantId}`),
      fetchFromSupabase(`expenses?select=*&tenant_id=eq.${tenantId}`)
    ])

    // Processar resultados
    const clientsData = clients.status === 'fulfilled' ? clients.value : []
    const invoicesData = invoices.status === 'fulfilled' ? invoices.value : []
    const expensesData = expenses.status === 'fulfilled' ? expenses.value : []

    console.log(`✅ Dados obtidos via APIs REST: ${clientsData.length} clientes, ${invoicesData.length} faturas, ${expensesData.length} despesas`)

    // Calcular métricas
    const totalRevenue = invoicesData.reduce((sum: number, inv: any) => sum + (Number(inv.total_amount) || 0), 0)
    const totalExpenses = expensesData.reduce((sum: number, exp: any) => sum + (Number(exp.amount) || 0), 0)
    const profit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

    // Calcular estadísticas de tipos de pago
    const paymentTypeStats = invoicesData.reduce((stats: any, inv: any) => {
      const paymentType = inv.payment_type || 'unknown'
      stats[paymentType] = (stats[paymentType] || 0) + 1
      return stats
    }, {})

    const businessData = {
      stats: {
        total_invoices: invoicesData.length,
        total_expenses: expensesData.length,
        total_clients: clientsData.length,
        total_revenue: totalRevenue,
        total_expenses_amount: totalExpenses,
        profit: profit,
        profitMargin: profitMargin.toFixed(2),
        payment_type_stats: paymentTypeStats
      },
      recentInvoices: invoicesData.slice(0, 5).map((inv: any) => ({
        number: inv.number || 'N/A',
        client_name: inv.client_name || 'N/A',
        total_amount: inv.total_amount || 0,
        status: inv.status || 'N/A',
        payment_type: inv.payment_type || 'N/A',
        issue_date: inv.issue_date || 'N/A'
      })),
      recentExpenses: expensesData.slice(0, 5).map((exp: any) => ({
        vendor: exp.vendor || 'N/A',
        amount: exp.amount || 0,
        category: exp.category || 'N/A',
        expense_date: exp.expense_date || 'N/A'
      })),
      clients: clientsData.slice(0, 5).map((client: any) => ({
        name: client.name || 'N/A',
        nif: client.nif || 'N/A',
        email: client.email || 'N/A'
      })),
      tenantId,

      // Métricas simples do RAG
      ragMetrics: {
        totalDocuments: 0,
        totalBankTransactions: 0,
        totalBankAccounts: 0,
        multiAgentResultsCount: 0,
        averageConfidence: 0
      }
    }

    console.log('✅ Dados obtidos via APIs REST:', {
      invoices: businessData.stats.total_invoices,
      expenses: businessData.stats.total_expenses,
      clients: businessData.stats.total_clients,
      revenue: businessData.stats.total_revenue,
      profit: businessData.stats.profit
    })

    return businessData

  } catch (error) {
    console.error('❌ Erro ao obter dados via APIs REST:', error)
    throw error
  }
}

// Función para analizar la pregunta y determinar si necesita datos da BD
function needsDatabaseData(message: string): boolean {
  const keywords = [
    'profit', 'lucro', 'receita', 'despesas', 'faturas', 'invoices', 'clientes', 'clients',
    'quantos', 'how many', 'total', 'estatísticas', 'statistics', 'resumo', 'summary',
    'documentos', 'documents', 'processados', 'processed', 'base de dados', 'database'
  ]

  return keywords.some(keyword =>
    message.toLowerCase().includes(keyword.toLowerCase())
  )
}

// Función para crear clientes automáticamente desde el chatbot
async function createClientFromAI(clientData: any, tenantId: number = 1) {
  try {
    console.log('🤖 AI está creando un nuevo cliente:', clientData)

    const baseUrl = process.env.SUPABASE_URL
    const anonKey = process.env.SUPABASE_ANON_KEY

    if (!baseUrl || !anonKey) {
      throw new Error('SUPABASE_URL ou SUPABASE_ANON_KEY não configurados')
    }

    // Preparar datos del cliente
    const clientToInsert = {
      tenant_id: tenantId,
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone || null,
      address: clientData.address || null,
      nif: clientData.nif || null,
      is_active: true
    }

    console.log('📋 Dados do cliente para inserir:', clientToInsert)

    // Crear cliente via API REST
    const response = await fetch(`${baseUrl}/rest/v1/clients`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(clientToInsert)
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Erro ao criar cliente: ${response.status} - ${errorData}`)
    }

    const createdClient = await response.json()
    console.log('✅ Cliente criado com sucesso:', createdClient)

    return {
      success: true,
      client: createdClient[0], // A API retorna um array
      message: `Cliente "${clientData.name}" criado com sucesso!`
    }

  } catch (error) {
    console.error('❌ Erro ao criar cliente:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      message: `Falha ao criar cliente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }
  }
}

// Función para extraer información de cliente de un mensaje de texto
function extractClientInfo(message: string) {
  const clientInfo: any = {}

  console.log('🔍 Extraindo informações do cliente da mensagem:', message)

  // Extraer nombre - múltiples idiomas
  const namePatterns = [
    /nome\s+(?:é\s+)?([a-zA-ZÀ-ÿ\s]+?)(?:\s+email|\s+nif|\s+telefone|\s+endereço|$)/i,
    /se\s+llama\s+([a-zA-ZÀ-ÿ\s]+?)(?:\s+es\s+de|\s+email|\s+nif|\s+telefone|\s+endereço|$)/i,
    /llama\s+([a-zA-ZÀ-ÿ\s]+?)(?:\s+es\s+de|\s+email|\s+nif|\s+telefone|\s+endereço|$)/i,
    /nombre\s+(?:es\s+)?([a-zA-ZÀ-ÿ\s]+?)(?:\s+email|\s+nif|\s+telefone|\s+endereço|$)/i,
    /se\s+llama\s+([a-zA-ZÀ-ÿ\s]+?)(?:\s+email|\s+nif|\s+telefone|\s+endereço|$)/i,
    /llama\s+([a-zA-ZÀ-ÿ\s]+?)(?:\s+email|\s+nif|\s+telefone|\s+endereço|$)/i,
    // Patrón específico para "se llama manuel"
    /se\s+llama\s+([a-zA-Z]+)/i,
    /llama\s+([a-zA-Z]+)/i
  ]

  for (const pattern of namePatterns) {
    const match = message.match(pattern)
    if (match) {
      clientInfo.name = match[1].trim()
      console.log('✅ Nome extraído:', clientInfo.name)
      break
    }
  }

  // Extraer email
  const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
  if (emailMatch) {
    clientInfo.email = emailMatch[1].trim()
    console.log('✅ Email extraído:', clientInfo.email)
  }

  // Extraer NIF - múltiples formatos
  const nifPatterns = [
    /nif\s+(?:é\s+)?(\d{9})/i,
    /nif\s+(\d{9})/i,
    /(\d{9})/i  // Buscar cualquier secuencia de 9 dígitos
  ]

  for (const pattern of nifPatterns) {
    const match = message.match(pattern)
    if (match) {
      clientInfo.nif = match[1].trim()
      console.log('✅ NIF extraído:', clientInfo.nif)
      break
    }
  }

  // Extraer teléfono
  const phoneMatch = message.match(/([+\d\s\-\(\)]+)/i)
  if (phoneMatch && phoneMatch[1].length > 8) {
    clientInfo.phone = phoneMatch[1].trim()
    console.log('✅ Telefone extraído:', clientInfo.phone)
  }

  // Extraer dirección/ciudad
  const addressPatterns = [
    /endereço\s+(?:é\s+)?([^,]+)/i,
    /es\s+de\s+([^,]+)/i,
    /de\s+([^,]+)/i
  ]

  for (const pattern of addressPatterns) {
    const match = message.match(pattern)
    if (match) {
      clientInfo.address = match[1].trim()
      console.log('✅ Endereço extraído:', clientInfo.address)
      break
    }
  }

  console.log('📋 Informações extraídas:', clientInfo)
  return clientInfo
}

// Función para verificar si el mensaje es una solicitud para crear cliente
function isClientCreationRequest(message: string): boolean {
  const clientKeywords = [
    'criar cliente', 'crear cliente', 'novo cliente', 'nuevo cliente',
    'adicionar cliente', 'agregar cliente', 'inserir cliente', 'insertar cliente',
    'registar cliente', 'registrar cliente', 'cadastrar cliente',
    'criar cliente:', 'crear cliente:', 'novo cliente:', 'nuevo cliente:',
    'adicionar cliente:', 'agregar cliente:', 'inserir cliente:', 'insertar cliente:'
  ]

  // Verificar si contiene palabras clave de creación
  const hasCreationKeyword = clientKeywords.some(keyword =>
    message.toLowerCase().includes(keyword.toLowerCase())
  )

  // Verificar si contiene información de cliente (nombre/llama y email)
  const hasClientInfo = (
    (message.toLowerCase().includes('nome') ||
      message.toLowerCase().includes('llama') ||
      message.toLowerCase().includes('nombre')) &&
    message.toLowerCase().includes('email')
  )

  // Verificar si es un comando directo (contiene ":")
  const isDirectCommand = message.includes(':')

  console.log('🔍 Analisando mensagem para criação de cliente:', {
    message: message.substring(0, 100) + '...',
    hasCreationKeyword,
    hasClientInfo,
    isDirectCommand,
    result: hasCreationKeyword && (hasClientInfo || isDirectCommand)
  })

  return hasCreationKeyword && (hasClientInfo || isDirectCommand)
}

// Función para detectar solicitudes de creación de facturas
function isInvoiceCreationRequest(message: string): boolean {
  console.log('🔍 DEBUG: Analisando mensagem para criação de fatura:', message)

  const invoiceKeywords = [
    'crear factura', 'crear fatura', 'nueva factura', 'nova fatura',
    'creale factura', 'creale fatura', 'hacer factura', 'fazer fatura',
    'emitir factura', 'emitir fatura', 'generar factura', 'gerar fatura',
    'crear factura:', 'crear fatura:', 'nueva factura:', 'nova fatura:',
    'creale factura:', 'creale fatura:', 'hacer factura:', 'fazer fatura:',
    // Patrones más flexibles
    'factura', 'fatura', 'creale', 'crear', 'nueva', 'nova'
  ]

  const hasCreationKeyword = invoiceKeywords.some(keyword => {
    const includes = message.toLowerCase().includes(keyword.toLowerCase())
    console.log(`🔍 DEBUG: Keyword "${keyword}" - Includes: ${includes}`)
    return includes
  })

  const hasClient = message.toLowerCase().includes('cliente')
  const hasValue = message.toLowerCase().includes('valor')
  const hasTax = message.toLowerCase().includes('tax')
  const hasIva = message.toLowerCase().includes('iva')
  const hasBase = message.toLowerCase().includes('base')

  const hasInvoiceInfo = hasClient && (hasValue || hasTax || hasIva || hasBase)

  console.log('🔍 DEBUG: Análisis detalhado:', {
    message: message.substring(0, 100) + '...',
    hasCreationKeyword,
    hasClient,
    hasValue,
    hasTax,
    hasIva,
    hasBase,
    hasInvoiceInfo,
    result: hasCreationKeyword && hasInvoiceInfo
  })

  return hasCreationKeyword && hasInvoiceInfo
}

// Función para extraer información de factura del mensaje
function extractInvoiceInfo(message: string) {
  const invoiceInfo: any = {}
  console.log('🔍 DEBUG: Extraindo informações da fatura da mensagem:', message)

  // Extraer nombre del cliente - patrones simplificados
  const clientPatterns = [
    // "cliente manuel", "al cliente manuel", etc.
    /cliente\s+([a-zA-Z]+)/i,
    // Nombres comunes directamente
    /(manuel|pepo|alvaro|maria|jose|ana|carlos|luis)/i
  ]

  for (const pattern of clientPatterns) {
    console.log(`🔍 DEBUG: Testando padrão: ${pattern}`)
    const match = message.match(pattern)
    if (match) {
      invoiceInfo.clientName = match[1].trim().toLowerCase()
      console.log('✅ DEBUG: Nome do cliente extraído:', invoiceInfo.clientName)
      break
    } else {
      console.log('❌ DEBUG: Padrão não encontrou match')
    }
  }

  // Extraer valor base
  console.log('🔍 DEBUG: Extraindo valor base...')
  const valueMatch = message.match(/(?:valor\s+)?(?:base\s+)?(?:de\s+)?(\d+(?:\.\d+)?)/i)
  if (valueMatch) {
    invoiceInfo.baseValue = parseFloat(valueMatch[1])
    console.log('✅ DEBUG: Valor base extraído:', invoiceInfo.baseValue)
  } else {
    console.log('❌ DEBUG: Valor base não encontrado')
  }

  // Extraer tasa de IVA
  console.log('🔍 DEBUG: Extraindo taxa de IVA...')
  const taxMatch = message.match(/(?:tax\s+de\s+|iva\s+de\s+|taxa\s+de\s+)?(\d+)%/i)
  if (taxMatch) {
    invoiceInfo.taxRate = parseInt(taxMatch[1])
    console.log('✅ DEBUG: Taxa de IVA extraída:', invoiceInfo.taxRate)
  } else {
    console.log('❌ DEBUG: Taxa de IVA não encontrada')
  }

  // Calcular valores derivados
  if (invoiceInfo.baseValue && invoiceInfo.taxRate) {
    invoiceInfo.taxAmount = (invoiceInfo.baseValue * invoiceInfo.taxRate) / 100
    invoiceInfo.totalValue = invoiceInfo.baseValue + invoiceInfo.taxAmount
    console.log('✅ DEBUG: Valores calculados:', {
      taxAmount: invoiceInfo.taxAmount,
      totalValue: invoiceInfo.totalValue
    })
  } else {
    console.log('❌ DEBUG: Não foi possível calcular valores derivados')
  }

  console.log('📋 DEBUG: Informações da fatura extraídas:', invoiceInfo)
  return invoiceInfo
}

// Función para crear factura desde la IA
async function createInvoiceFromAI(invoiceData: any, tenantId: number = 1) {
  try {
    console.log('🤖 AI está criando uma nova fatura:', invoiceData)

    const baseUrl = process.env.SUPABASE_URL
    const anonKey = process.env.SUPABASE_ANON_KEY

    if (!baseUrl || !anonKey) {
      throw new Error('SUPABASE_URL ou SUPABASE_ANON_KEY não configurados')
    }

    // First, search for the client by name (more flexible search)
    const clientResponse = await fetch(`${baseUrl}/rest/v1/clients?select=*&tenant_id=eq.${tenantId}`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!clientResponse.ok) {
      throw new Error(`Erro ao buscar cliente: ${clientResponse.status}`)
    }

    const allClients = await clientResponse.json()

    // Buscar cliente por nombre (búsqueda flexible)
    const client = allClients.find((c: any) =>
      c.name.toLowerCase().includes(invoiceData.clientName.toLowerCase()) ||
      invoiceData.clientName.toLowerCase().includes(c.name.toLowerCase())
    )

    if (!client) {
      throw new Error(`Cliente "${invoiceData.clientName}" não encontrado. Clientes disponíveis: ${allClients.map((c: any) => c.name).join(', ')}`)
    }

    // Generar número de factura único
    const invoiceNumber = `FAT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    const invoiceToInsert = {
      // Usar EXACTAMENTE las columnas que existen en la base de datos
      tenant_id: tenantId, // AÑADIR ESTE CAMPO OBLIGATORIO
      number: invoiceNumber,
      client_name: client.name,
      client_email: client.email,
      client_tax_id: client.nif,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: invoiceData.baseValue,
      vat_rate: invoiceData.taxRate,
      vat_amount: invoiceData.taxAmount,
      total_amount: invoiceData.totalValue,
      status: 'pending',
      description: `Fatura gerada automaticamente pela IA para ${client.name}`,
      payment_terms: '30 dias'
    }

    console.log('📋 Dados da fatura para inserir:', invoiceToInsert)

    const response = await fetch(`${baseUrl}/rest/v1/invoices`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(invoiceToInsert)
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Erro ao criar fatura: ${response.status} - ${errorData}`)
    }

    const createdInvoice = await response.json()

    // DEBUG: Ver qué datos devuelve la base de datos
    console.log('📋 DEBUG: Dados retornados pela base de datos:', JSON.stringify(createdInvoice, null, 2))

    // La base de datos devuelve un array, tomar el primer elemento
    const invoiceFromDB = Array.isArray(createdInvoice) ? createdInvoice[0] : createdInvoice

    // Enviar email con la factura
    const emailResult = await sendInvoiceEmail(invoiceFromDB, client)

    return {
      success: true,
      invoice: invoiceFromDB,
      message: `Fatura criada com sucesso! Número: ${invoiceFromDB.number}`,
      emailSent: emailResult.success,
      emailMessage: emailResult.message
    }

  } catch (error) {
    console.error('❌ Erro ao criar fatura:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      message: `Falha ao criar fatura: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }
  }
}

// Función para enviar email con la factura
async function sendInvoiceEmail(invoiceData: any, client: any) {
  try {
    // Crear transporter de Gmail
    const transporter = createTransporter()

    // Generar contenido HTML de la factura
    const invoiceHTML = generateInvoicePDF(invoiceData, client)

    // Configurar opciones del email
    const mailOptions = {
      from: process.env.GMAIL_USER || 'tu-email@gmail.com',
      to: client.email,
      cc: process.env.GMAIL_USER, // Enviar copia a tu email
      subject: `Fatura ${invoiceData.number} - ${client.name}`,
      html: `
        <h2>Olá ${client.name}!</h2>
        <p>Em anexo, segue a fatura referente aos serviços prestados.</p>
        
        <h3>Resumo da Fatura:</h3>
        <ul>
          <li><strong>Número:</strong> ${invoiceData.number}</li>
          <li><strong>Data:</strong> ${invoiceData.issue_date}</li>
          <li><strong>Vencimento:</strong> ${invoiceData.due_date}</li>
          <li><strong>Valor Base:</strong> €${invoiceData.amount.toFixed(2)}</li>
          <li><strong>IVA (${invoiceData.vat_rate}%):</strong> €${invoiceData.vat_amount.toFixed(2)}</li>
          <li><strong>Total:</strong> €${invoiceData.total_amount.toFixed(2)}</li>
        </ul>
        
        <p><strong>Termos de Pagamento:</strong> ${invoiceData.payment_terms}</p>
        
        <p>Agradecemos a sua preferência!</p>
        
        <hr>
        <p><em>Esta fatura foi gerada automaticamente pelo sistema.</em></p>
      `,
      attachments: [
        {
          filename: `Fatura-${invoiceData.number}.html`,
          content: invoiceHTML,
          contentType: 'text/html'
        }
      ]
    }

    // Enviar email
    const info = await transporter.sendMail(mailOptions)

    console.log('📧 Email enviado com sucesso!')
    console.log('📋 Message ID:', info.messageId)
    console.log('📬 Para:', client.email)

    return {
      success: true,
      message: `Email enviado com sucesso para ${client.email}`,
      messageId: info.messageId
    }

  } catch (error) {
    console.error('❌ Erro ao enviar email:', error)
    return {
      success: false,
      message: `Erro ao enviar email: ${error}`,
      error: error
    }
  }
}

// Función para detectar solicitudes de búsqueda de cliente por nombre
function isClientSearchRequest(message: string): boolean {
  console.log('🔍 DEBUG: Analisando mensagem para busca de cliente:', message)

  const searchKeywords = [
    'cliente', 'dados do cliente', 'información del cliente', 'dados de', 'información de',
    'mostrar cliente', 'ver cliente', 'buscar cliente', 'encontrar cliente',
    'quem é', 'quien es'
  ]

  const hasSearchKeyword = searchKeywords.some(keyword => {
    const includes = message.toLowerCase().includes(keyword.toLowerCase())
    console.log(`🔍 DEBUG: Search Keyword "${keyword}" - Includes: ${includes}`)
    return includes
  })

  // Verificar si hay un nombre de persona (palabra que empiece con mayúscula o nombres comunes)
  const commonNames = ['manuel', 'pepo', 'alvaro', 'maria', 'jose', 'ana', 'carlos', 'luis']
  const hasPersonName = commonNames.some(name =>
    message.toLowerCase().includes(name.toLowerCase())
  ) || /\b[A-Z][a-z]+\b/.test(message)

  console.log('🔍 DEBUG: Análisis de busca de cliente:', {
    message: message.substring(0, 100) + '...',
    hasSearchKeyword,
    hasPersonName,
    result: hasSearchKeyword && hasPersonName
  })

  return hasSearchKeyword && hasPersonName
}

// Función para extraer nombre del cliente del mensaje
function extractClientNameFromMessage(message: string): string | null {
  console.log('🔍 Extraindo nome do cliente da mensagem:', message)

  // Patrones para extraer nombres de personas
  const namePatterns = [
    // "cliente pepo", "dados do cliente manuel", etc.
    /(?:cliente|dados\s+do\s+cliente|información\s+del\s+cliente|dados\s+de|información\s+de)\s+([A-Za-z]+)/i,
    // "quem é pepo", "quien es manuel", etc.
    /(?:quem\s+é|quién\s+es|quien\s+es)\s+([A-Za-z]+)/i,
    // "mostrar pepo", "ver manuel", etc.
    /(?:mostrar|ver|buscar|encontrar)\s+([A-Za-z]+)/i,
    // Solo el nombre si está solo en el mensaje
    /^([A-Za-z]+)$/,
    // Nombre después de "es" o "é"
    /(?:es|é)\s+([A-Za-z]+)/i
  ]

  for (const pattern of namePatterns) {
    const match = message.match(pattern)
    if (match) {
      const clientName = match[1].trim()
      console.log('✅ Nome do cliente extraído:', clientName)
      return clientName
    }
  }

  // Si no encuentra con patrones, buscar nombres comunes directamente
  const commonNames = ['manuel', 'pepo', 'alvaro', 'maria', 'jose', 'ana', 'carlos', 'luis']
  for (const name of commonNames) {
    if (message.toLowerCase().includes(name.toLowerCase())) {
      console.log('✅ Nome comum encontrado:', name)
      return name
    }
  }

  console.log('❌ Nome do cliente não encontrado')
  return null
}

// Función para buscar cliente por nombre y retornar todos sus datos
async function searchClientByName(clientName: string, tenantId: number = 1) {
  try {
    console.log('🔍 Buscando cliente por nome:', clientName)

    const baseUrl = process.env.SUPABASE_URL
    const anonKey = process.env.SUPABASE_ANON_KEY

    if (!baseUrl || !anonKey) {
      throw new Error('SUPABASE_URL ou SUPABASE_ANON_KEY não configurados')
    }

    // Buscar cliente por nombre (case-insensitive)
    const response = await fetch(`${baseUrl}/rest/v1/clients?select=*&name=ilike.${encodeURIComponent(clientName)}&tenant_id=eq.${tenantId}`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Erro ao buscar cliente: ${response.status}`)
    }

    const clients = await response.json()

    if (!clients || clients.length === 0) {
      return {
        success: false,
        message: `Cliente "${clientName}" não encontrado na base de dados.`
      }
    }

    const client = clients[0]
    console.log('✅ Cliente encontrado:', client)

    // Buscar facturas del cliente
    const invoicesResponse = await fetch(`${baseUrl}/rest/v1/invoices?select=*&client_id=eq.${client.id}&tenant_id=eq.${tenantId}`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    })

    let invoices = []
    if (invoicesResponse.ok) {
      invoices = await invoicesResponse.json()
    }

    return {
      success: true,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        nif: client.nif,
        isActive: client.is_active,
        createdAt: client.created_at
      },
      invoices: invoices.map((inv: any) => ({
        number: inv.number || 'N/A',
        total: inv.totalAmount || inv.total_amount || 0,
        status: inv.status || 'N/A',
        issueDate: inv.issueDate || inv.issue_date || 'N/A',
        dueDate: inv.dueDate || inv.due_date || 'N/A'
      })),
      message: `Cliente "${client.name}" encontrado com sucesso!`
    }

  } catch (error) {
    console.error('❌ Erro ao buscar cliente:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      message: `Falha ao buscar cliente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message: originalMessage } = await request.json()
    let message = originalMessage.trim()

    console.log('📨 Nova requisição recebida em /api/ai-chat')
    console.log('📋 Body da requisição:', { message })
    console.log('📤 Mensagem extraída:', message)

    // Detectar idioma del mensaje
    const detectLanguage = (message: string): string => {
      const spanishWords = ['cuantas', 'facturas', 'despesas', 'tengo', 'con', 'credito', 'transferencia', 'cuando', 'hable', 'español', 'contestar', 'idioma', 'cuántas', 'cuántos', 'cuánto', 'cuánta']
      const englishWords = ['how', 'many', 'invoices', 'expenses', 'have', 'with', 'credit', 'transfer', 'when', 'speak', 'english', 'answer', 'language', 'what', 'where', 'when', 'why']

      const messageLower = message.toLowerCase()
      const spanishCount = spanishWords.filter(word => messageLower.includes(word)).length
      const englishCount = englishWords.filter(word => messageLower.includes(word)).length

      return spanishCount > englishCount ? 'spanish' : 'english'
    }

    const detectedLanguage = detectLanguage(message)
    console.log(`🌍 Idioma detectado: ${detectedLanguage}`)

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      console.log('❌ Mensagem inválida:', { message, type: typeof message })
      return NextResponse.json(
        {
          success: false,
          error: 'Mensagem é obrigatória e deve ser uma string não vazia',
          errorType: 'VALIDATION_ERROR'
        },
        { status: 400 }
      )
    }

    let clientCreationResult = null
    let invoiceCreationResult = null
    let searchResult = null

    // Detectar y procesar creación de clientes
    console.log('🔍 DEBUG: Verificando se é solicitação de criação de cliente...')
    if (isClientCreationRequest(message)) {
      console.log('🤖 Detected client creation request, extracting info...')
      const clientInfo = extractClientInfo(message)
      if (clientInfo.name && clientInfo.email) {
        console.log('✅ Client info extracted, creating client...')
        clientCreationResult = await createClientFromAI(clientInfo, 1)
        if (clientCreationResult.success) {
          message += `\n\n[CLIENTE CRIADO: ${clientInfo.name} - ${clientInfo.email} - NIF: ${clientInfo.nif || 'N/A'}]`
        }
      }
    } else {
      console.log('❌ DEBUG: NÃO é solicitação de criação de cliente')
    }

    // Si es solicitud de creación de factura, crear la factura
    if (isInvoiceCreationRequest(message)) {
      console.log('🤖 Detected invoice creation request, extracting info...')
      const invoiceData = extractInvoiceInfo(message)

      if (invoiceData) {
        console.log('✅ Invoice info extracted, creating invoice...')
        const invoiceResult = await createInvoiceFromAI(invoiceData)

        if (invoiceResult.success) {
          message += `\n\n[FATURA CRIADA: ${invoiceData.clientName} - Valor: €${invoiceData.baseValue} - IVA: ${invoiceData.taxRate}% - Total: €${invoiceData.totalValue}]\n\n📧 Email: ${invoiceResult.emailSent ? '✅ Enviado com sucesso!' : '❌ Erro ao enviar email'}\n\n${invoiceResult.emailMessage}`

          // Guardar resultado para el response final
          invoiceCreationResult = {
            success: true,
            invoiceNumber: invoiceResult.invoice.number,
            clientName: invoiceResult.invoice.client_name,
            totalValue: invoiceResult.invoice.total_amount,
            message: invoiceResult.message,
            emailSent: invoiceResult.emailSent,
            emailMessage: invoiceResult.emailMessage
          }
        } else {
          message += `\n\n❌ Erro ao criar fatura: ${invoiceResult.message}`
          invoiceCreationResult = {
            success: false,
            message: invoiceResult.message
          }
        }
      }
    } else {
      console.log('❌ DEBUG: NÃO é solicitação de criação de fatura')
    }

    // Detectar y procesar búsqueda de cliente por nombre
    console.log('🔍 DEBUG: Verificando se é solicitação de busca de cliente...')
    if (isClientSearchRequest(message)) {
      console.log('🤖 Detected client search request, extracting name...')
      const clientName = extractClientNameFromMessage(message)
      if (clientName) {
        console.log('✅ Client name extracted, searching...')
        searchResult = await searchClientByName(clientName, 1)
        if (searchResult.success && searchResult.client) {
          message += `\n\n[CLIENTE ENCONTRADO: ${searchResult.client.name} - Email: ${searchResult.client.email || 'N/A'} - NIF: ${searchResult.client.nif || 'N/A'}]`
          // Si el cliente ya existe, no crearlo de nuevo
          if (searchResult.client.id) {
            const baseUrl = process.env.SUPABASE_URL
            const anonKey = process.env.SUPABASE_ANON_KEY
            if (baseUrl && anonKey) {
              const existingClient = await fetch(`${baseUrl}/rest/v1/clients?select=*&id=eq.${searchResult.client.id}&tenant_id=eq.1`, {
                headers: {
                  'apikey': anonKey,
                  'Authorization': `Bearer ${anonKey}`,
                  'Content-Type': 'application/json'
                }
              }).then(res => res.ok ? res.json() : null)
              if (existingClient && existingClient.length > 0) {
                message += `\n\n[CLIENTE JÁ EXISTENTE: ${existingClient[0].name}]`
              }
            }
          }
        }
      }
    } else {
      console.log('❌ DEBUG: NÃO é solicitação de busca de cliente')
    }

    // Obtener datos de la base de datos para el contexto
    let businessData = null
    try {
      businessData = await getBusinessData(1)
    } catch (dbError) {
      console.error('❌ Erro ao obter dados da base de dados:', dbError)
      // Continuar sin datos de la BD
    }

    // Check if at least one API is available
    if (!googleAI && !openai) {
      console.error('❌ Nenhuma API de IA configurada')
      return NextResponse.json(
        {
          success: false,
          error: 'Nenhuma API de IA está configurada no servidor',
          details: 'Configure GOOGLE_AI_API_KEY ou OPENAI_API_KEY no arquivo .env',
          errorType: 'CONFIG_ERROR'
        },
        { status: 500 }
      )
    }

    // Construir prompt do sistema com dados da BD se necessário
    let systemPrompt = `
      Você é um assistente especializado em contabilidade portuguesa. 
      Seu conhecimento inclui:
      - IVA (Imposto sobre o Valor Acrescentado) português
      - Validação de NIF (Número de Identificação Fiscal)
      - Regras contábeis portuguesas
      - SAFT-PT (Standard Audit File for Tax purposes)
      - Categorização de despesas
      - Processamento de faturas
      - Gestão financeira para empresas portuguesas
      
      ${detectedLanguage === 'spanish' ?
        'IMPORTANTE: Responde SIEMPRE en español cuando el usuario te hable en español. Mantén las respuestas claras y prácticas sobre las reglas portuguesas.' :
        'IMPORTANTE: Answer ALWAYS in English when the user speaks to you in English. Keep responses clear and practical about Portuguese rules.'
      }
    `

    // Adicionar dados da BD ao prompt se disponível
    if (businessData) {
      systemPrompt += `\n\nDADOS DO SEU NEGÓCIO (OBTIDOS DA BASE DE DADOS):

📊 ESTATÍSTICAS FINANCEIRAS:
• Total de Faturas: ${businessData.stats?.total_invoices || 0}
• Total de Despesas: ${businessData.stats?.total_expenses || 0}
• Total de Clientes: ${businessData.stats?.total_clients || 0}
• Receita Total: €${(businessData.stats?.total_revenue || 0).toFixed(2)}
• Total de Despesas: €${(businessData.stats?.total_expenses_amount || 0).toFixed(2)}
• Lucro: €${businessData.stats?.profit || 0}
• Margem de Lucro: ${businessData.stats?.profitMargin || '0.00'}%

💳 ESTATÍSTICAS DE MÉTODOS DE PAGAMENTO:
${Object.entries(businessData.stats?.payment_type_stats || {}).map(([type, count]) => {
        const typeName = type === 'card' ? 'Crédito (Cartão)' :
          type === 'bank_transfer' ? 'Transferência Bancária' :
            type === 'cash' ? 'Dinheiro' :
              type === 'credit' ? 'Crédito' : type
        return `• ${typeName}: ${count} faturas`
      }).join('\n') || 'Nenhuma informação de método de pagamento disponível'}

📄 FATURAS RECENTES (últimas 5):
${businessData.recentInvoices?.map((inv: any) =>
        `• ${inv.number} (${inv.client_name}): €${inv.total_amount} - ${inv.status} - Método de Pagamento: ${inv.payment_type} - ${inv.issue_date}`
      ).join('\n') || 'Nenhuma fatura encontrada'}

💰 DESPESAS RECENTES (últimas 5):
${businessData.recentExpenses?.map((exp: any) =>
        `• ${exp.vendor}: €${exp.amount} (${exp.category}) - ${exp.expense_date}`
      ).join('\n') || 'Nenhuma despesa encontrada'}

👥 CLIENTES:
${businessData.clients?.map((client: any) =>
        `• ${client.name} (NIF: ${client.nif || 'N/A'}) - ${client.email || 'Sem email'}`
      ).join('\n') || 'Nenhum cliente encontrado'}

INSTRUÇÕES PARA A IA:
1. Use estes dados REAIS da base de dados para responder
2. Forneça análises específicas baseadas nos números apresentados
3. Identifique padrões nos dados disponíveis
4. Sugira melhorias baseadas na situação atual
5. Sempre mencione os valores específicos dos dados
6. Seja prático e específico sobre o negócio`
    }

    let response = ''
    let usedModel = ''
    let fallbackUsed = false

    // PRIMEIRA TENTATIVA: Google AI (Gemini) - PRINCIPAL
    if (googleAI) {
      try {
        console.log('🔄 Tentando Google AI (Gemini) como resposta principal...')

        const fullPrompt = `${systemPrompt}\n\nPergunta do utilizador: ${message.trim()}`

        const model = googleAI.getGenerativeModel({ model: 'gemini-1.0-pro' })
        const result = await model.generateContent(fullPrompt)
        response = result.response.text() || ''

        if (response.trim()) {
          usedModel = 'Google AI (Gemini-1.0-Pro)'
          console.log('✅ Resposta da Google AI recebida:', response.substring(0, 100) + '...')
        } else {
          throw new Error('Resposta vazia da Google AI')
        }

      } catch (googleError: any) {
        console.error('❌ Erro na Google AI, tentando fallback para OpenAI:', googleError.message)
        fallbackUsed = true

        // SEGUNDA TENTATIVA: OpenAI (Fallback)
        if (openai) {
          try {
            console.log('🔄 Usando OpenAI como fallback...')

            const completion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message.trim() }
              ],
              max_tokens: 1000,
              temperature: 0.7,
            })

            response = completion.choices[0]?.message?.content || ''
            usedModel = 'OpenAI (GPT-4o-Mini) - Fallback'
            console.log('✅ Resposta da OpenAI (fallback) recebida:', response.substring(0, 100) + '...')

          } catch (openAIError: any) {
            console.error('❌ Erro também na OpenAI (fallback):', openAIError)

            // Se ambas as APIs falharam, SEMPRE tentar responder com dados da BD
            console.log('🔄 Ambas as APIs falharam, usando dados da BD...')
            if (businessData) {
              response = `Desculpe, as APIs de IA estão temporariamente indisponíveis, mas posso responder com base nos dados atuais do seu negócio:

📊 RESUMO COMPLETO DO NEGÓCIO (RAG INTEGRADO):

💰 FINANCEIRO:
• Total de Faturas: ${businessData.stats?.total_invoices || 0}
• Total de Despesas: ${businessData.stats?.total_expenses || 0}
• Receita Total: €${(businessData.stats?.total_revenue || 0).toFixed(2)}
• Total de Despesas: €${(businessData.stats?.total_expenses_amount || 0).toFixed(2)}
• Lucro Atual: €${businessData.stats?.profit || 0}
• Margem de Lucro: ${businessData.stats?.profitMargin || '0.00'}%

👥 CLIENTES E RELACIONAMENTO:
• Total de Clientes: ${businessData.stats?.total_clients || 0}
• Top Cliente: ${businessData.clients?.[0]?.name || 'N/A'} (€${businessData.clients?.[0]?.total_billed || 0})

🏦 INFRAESTRUTURA:
• Contas Bancárias: ${businessData.ragMetrics?.totalBankAccounts || 0}
• Transações Bancárias: ${businessData.ragMetrics?.totalBankTransactions || 0}
• Documentos Processados: ${businessData.ragMetrics?.totalDocuments || 0}

🤖 SISTEMA RAG:
• Resultados Multi-Agente: ${businessData.ragMetrics?.multiAgentResultsCount || 0}
• Confiança Média: ${businessData.ragMetrics?.averageConfidence || 0}%

${businessData.stats?.profit >= 0 ? '✅ Seu negócio está com lucro!' : '⚠️ Seu negócio está com prejuízo no momento.'}

💡 INSIGHTS BASEADOS NOS DADOS:
• Análise de IVA: Não disponível na versão atual
• Categorias de despesas: Não disponível na versão atual

Para análises mais detalhadas e insights avançados, aguarde a restauração das APIs de IA.`
              usedModel = 'Dados da Base de Dados (Fallback)'
            } else {
              throw new Error(`Ambas as APIs falharam e não foi possível obter dados da BD - Google AI: ${googleError.message}, OpenAI: ${openAIError.message}`)
            }
          }
        }
      }
    } else {
      // Se Google AI não está configurada, usar OpenAI diretamente
      if (openai) {
        try {
          console.log('🔄 Google AI não configurada, usando OpenAI...')

          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: message.trim() }
            ],
            max_tokens: 1000,
            temperature: 0.7,
          })

          response = completion.choices[0]?.message?.content || ''
          usedModel = 'OpenAI (GPT-4o-Mini) - Única disponível'
          console.log('✅ Resposta da OpenAI recebida:', response.substring(0, 100) + '...')

        } catch (openAIError: any) {
          // Se OpenAI falhar, SEMPRE tentar com dados da BD
          console.log('🔄 OpenAI falhou, usando dados da BD...')
          if (businessData) {
            response = `📊 INFORMAÇÕES DO SEU NEGÓCIO:

• Faturas: ${businessData.stats?.total_invoices || 0}
• Despesas: ${businessData.stats?.total_expenses || 0}
• Clientes: ${businessData.stats?.total_clients || 0}
• Receita: €${(businessData.stats?.total_revenue || 0).toFixed(2)}
• Despesas: €${(businessData.stats?.total_expenses_amount || 0).toFixed(2)}
• Lucro: €${businessData.stats?.profit || 0}

As APIs de IA estão indisponíveis, mas aqui estão os seus dados atuais.`
            usedModel = 'Dados da Base de Dados (Fallback)'
          } else {
            throw openAIError
          }
        }
      }
    }

    if (!response.trim()) {
      response = 'Desculpe, não consegui processar a sua pergunta.'
    }

    return NextResponse.json({
      success: true,
      response: response,
      timestamp: new Date().toISOString(),
      model: usedModel,
      fallbackUsed: fallbackUsed,
      primaryAPI: 'Google AI',
      availableAPIs: {
        googleAI: !!googleAI,
        openAI: !!openai
      },
      databaseDataUsed: !!businessData,
      clientCreated: clientCreationResult?.success ? {
        name: clientCreationResult.client.name,
        email: clientCreationResult.client.email,
        nif: clientCreationResult.client.nif,
        message: clientCreationResult.message
      } : null,
      invoiceCreated: invoiceCreationResult?.success ? {
        clientName: invoiceCreationResult.clientName,
        invoiceNumber: invoiceCreationResult.invoiceNumber,
        totalValue: invoiceCreationResult.totalValue,
        message: invoiceCreationResult.message,
        emailSent: invoiceCreationResult.emailSent,
        emailMessage: invoiceCreationResult.emailMessage
      } : null,
      clientFound: searchResult?.success && searchResult.client ? {
        name: searchResult.client.name,
        email: searchResult.client.email,
        nif: searchResult.client.nif,
        phone: searchResult.client.phone,
        address: searchResult.client.address,
        invoices: searchResult.invoices,
        message: searchResult.message
      } : null
    })

  } catch (error: any) {
    console.error('❌ Erro geral na API:', error)

    let errorMessage = 'Erro interno do servidor'
    let errorType = 'UNKNOWN_ERROR'
    let statusCode = 500
    let userFriendlyMessage = 'Ocorreu um erro inesperado. Tente novamente.'

    if (error.code === 'insufficient_quota') {
      errorMessage = 'Quota da API excedida'
      errorType = 'QUOTA_EXCEEDED'
      userFriendlyMessage = 'Limite de uso da API atingido. Contacte o administrador.'
      statusCode = 429
    } else if (error.code === 'invalid_api_key') {
      errorMessage = 'Chave API inválida'
      errorType = 'INVALID_API_KEY'
      userFriendlyMessage = 'Problema de configuração da API. Contacte o administrador.'
      statusCode = 401
    } else if (error.code === 'model_not_found') {
      errorMessage = 'Modelo não encontrado'
      errorType = 'MODEL_ERROR'
      userFriendlyMessage = 'Modelo de IA não disponível temporariamente.'
      statusCode = 400
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Timeout na API'
      errorType = 'TIMEOUT_ERROR'
      userFriendlyMessage = 'A resposta demorou muito. Tente uma pergunta mais simples.'
      statusCode = 408
    } else if (error.message?.includes('Ambas as APIs falharam')) {
      errorMessage = error.message
      errorType = 'ALL_APIS_FAILED'
      userFriendlyMessage = 'Todas as APIs de IA estão temporariamente indisponíveis. Tente novamente mais tarde.'
      statusCode = 503
    } else if (error.message) {
      errorMessage = error.message
      userFriendlyMessage = 'Erro na comunicação com a IA. Verifique sua conexão e tente novamente.'
    }

    return NextResponse.json(
      {
        success: false,
        error: userFriendlyMessage,
        details: errorMessage,
        errorType: errorType,
        timestamp: new Date().toISOString(),
        availableAPIs: {
          googleAI: !!googleAI,
          openAI: !!openai
        }
      },
      { status: statusCode }
    )
  }
} 