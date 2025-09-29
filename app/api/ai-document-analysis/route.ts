import { NextRequest, NextResponse } from 'next/server'
import { AgentExtractorGemini } from '@/server/agents/AgentExtractorGemini'
import { AgentExtractorOpenAI } from '@/server/agents/AgentExtractorOpenAI'

// Tipo extendido para incluir información de empresa
interface ExtendedExtractionData {
  invoiceNumber?: string;
  vendor?: string;
  nif?: string;
  nifCountry?: string;
  vendorAddress?: string;
  vendorPhone?: string;
  total?: number;
  netAmount?: number;
  vatAmount?: number;
  vatRate?: number;
  issueDate?: string;
  dueDate?: string;
  category?: string;
  description?: string;
  // Propiedades adicionales
  isMyCompany?: boolean;
  companyType?: string;
  confidence?: number;
}

// Configuración de límites
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB (reducido para Netlify)
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/webp',
  'image/tiff',
  'image/svg+xml',
  'image/heic',
  'image/heif',
  'image/avif',
  'image/x-icon',
  'image/vnd.microsoft.icon'
]

export async function POST(request: NextRequest) {
  console.log('📎 Nova requisição de análise de documento recebida')
  console.log('🌍 Environment:', process.env.NODE_ENV)
  console.log('🌍 Platform:', process.env.VERCEL ? 'Vercel' : process.env.NETLIFY ? 'Netlify' : 'Local')
  console.log('🔑 API Keys disponibles:')
  console.log('  - GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? '✅ Set' : '❌ Not set')
  console.log('  - OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set')
  console.log('  - GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Not set')

  // Debug adicional para Netlify
  if (process.env.NETLIFY) {
    console.log('🔍 Netlify Environment Variables:')
    console.log('  - NODE_ENV:', process.env.NODE_ENV)
    console.log('  - NETLIFY:', process.env.NETLIFY)
    console.log('  - CONTEXT:', process.env.CONTEXT)
    console.log('  - BRANCH:', process.env.BRANCH)
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nenhum arquivo foi enviado',
          errorType: 'NO_FILE'
        },
        { status: 400 }
      )
    }

    // Verificar tipo de arquivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.log(`❌ Tipo de arquivo não suportado: ${file.type}`)
      return NextResponse.json(
        {
          success: false,
          error: `Tipo de arquivo não suportado: ${file.type}. Tipos permitidos: PDF, PNG, JPG, JPEG, GIF, BMP, WebP, TIFF, SVG, HEIC, HEIF, AVIF, ICO`,
          errorType: 'UNSUPPORTED_FILE_TYPE'
        },
        { status: 400 }
      )
    }

    // Verificar tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      console.log(`❌ Arquivo muito grande: ${file.size} bytes`)
      return NextResponse.json(
        {
          success: false,
          error: `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Tamanho máximo: 5MB`,
          errorType: 'FILE_TOO_LARGE'
        },
        { status: 400 }
      )
    }

    console.log(`📄 Processando arquivo: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)}KB)`)

    // Verificar se pelo menos una API está disponible
    const googleAIKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY
    const openAIKey = process.env.OPENAI_API_KEY

    console.log('🔍 Verificando APIs disponibles:')
    console.log('  - Google AI Key:', googleAIKey ? `✅ ${googleAIKey.substring(0, 10)}...` : '❌ No disponible')
    console.log('  - OpenAI Key:', openAIKey ? `✅ ${openAIKey.substring(0, 10)}...` : '❌ No disponible')

    if (!googleAIKey && !openAIKey) {
      console.error('❌ No hay APIs de IA configuradas')
      console.error('❌ Variables de entorno disponibles:', Object.keys(process.env).filter(key =>
        key.includes('API') || key.includes('KEY') || key.includes('GEMINI') || key.includes('GOOGLE') || key.includes('OPENAI')
      ))

      return NextResponse.json(
        {
          success: false,
          error: 'Nenhuma API de IA está configurada no servidor',
          errorType: 'NO_AI_API',
          details: 'Verifique as variáveis de ambiente GOOGLE_AI_API_KEY, GEMINI_API_KEY ou OPENAI_API_KEY',
          availableEnvVars: Object.keys(process.env).filter(key =>
            key.includes('API') || key.includes('KEY') || key.includes('GEMINI') || key.includes('GOOGLE') || key.includes('OPENAI')
          )
        },
        { status: 500 }
      )
    }

    let extractedData = null
    let extendedData: ExtendedExtractionData | null = null
    let usedModel = ''
    let fallbackUsed = false
    let ocrText = ''

    // Converter arquivo para buffer
    const fileBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(fileBuffer)

    // PRIMEIRA TENTATIVA: Google AI (Gemini) - PRINCIPAL
    if (googleAIKey) {
      try {
        console.log('🔄 Tentando extração com Google AI (Gemini)...')
        console.log('🔑 API Key length:', googleAIKey.length)
        console.log('🔑 API Key starts with:', googleAIKey.substring(0, 10))

        const geminiExtractor = new AgentExtractorGemini(googleAIKey)

        if (file.type === 'application/pdf') {
          // Processar PDF
          const result = await geminiExtractor.extractFromPDF(buffer, file.name)
          extractedData = result.data
          ocrText = 'PDF processado via Gemini Vision'
          usedModel = 'Google AI (Gemini-1.5-Flash) - PDF Vision'
          console.log('✅ Extração PDF com Google AI concluída')
        } else {
          // Processar imagem
          const result = await geminiExtractor.extractFromImage(buffer, file.type, file.name)
          extractedData = result.data
          ocrText = 'Imagem processada via Gemini Vision'
          usedModel = 'Google AI (Gemini-1.5-Flash) - Image Vision'
          console.log('✅ Extração de imagem com Google AI concluída')
        }

        // Adicionar detecção de empresa própria
        if (extractedData && extractedData.nif) {
          const nif = extractedData.nif.toString().replace(/[^0-9]/g, '')
          if (nif === '517124548') {
            extendedData = {
              ...extractedData,
              isMyCompany: true,
              companyType: 'PRÓPRIA'
            }
            console.log('🏢 Empresa própria detectada (NIF: 517124548)')
          } else {
            extendedData = {
              ...extractedData,
              isMyCompany: false,
              companyType: 'EXTERNA'
            }
            console.log('🏪 Empresa externa detectada')
          }
        } else {
          extendedData = {
            ...extractedData,
            isMyCompany: false,
            companyType: 'EXTERNA'
          }
        }

      } catch (googleError: any) {
        console.error('❌ Erro na Google AI, tentando fallback para OpenAI:', googleError.message)
        console.error('❌ Google AI Error details:', {
          name: googleError.name,
          message: googleError.message,
          code: googleError.code,
          status: googleError.status
        })
        fallbackUsed = true

        // SEGUNDA TENTATIVA: OpenAI (Fallback)
        if (openAIKey) {
          try {
            console.log('🔄 Usando OpenAI como fallback...')

            const openAIExtractor = new AgentExtractorOpenAI(openAIKey)

            if (file.type === 'application/pdf') {
              // Para PDF, primeiro converter a OCR e depois processar
              // Por ahora, simplificamos usando solo el texto
              const result = await openAIExtractor.extract('Documento PDF - processamento limitado', file.name)
              extractedData = result.data
              ocrText = 'PDF processado via OpenAI (limitado)'
              usedModel = 'OpenAI (GPT-4o-Mini) - Fallback PDF'
            } else {
              // Para imagem, usar GPT-4 Vision
              const result = await openAIExtractor.extractFromImage(buffer, file.type, file.name)
              extractedData = result.data
              ocrText = 'Imagem processada via OpenAI Vision'
              usedModel = 'OpenAI (GPT-4o-Mini) - Fallback Image Vision'
            }

            console.log('✅ Extração com OpenAI (fallback) concluída')

            // Adicionar detecção de empresa própria
            if (extractedData && extractedData.nif) {
              const nif = extractedData.nif.toString().replace(/[^0-9]/g, '')
              if (nif === '517124548') {
                extendedData = {
                  ...extractedData,
                  isMyCompany: true,
                  companyType: 'PRÓPRIA'
                }
                console.log('🏢 Empresa própria detectada (NIF: 517124548)')
              } else {
                extendedData = {
                  ...extractedData,
                  isMyCompany: false,
                  companyType: 'EXTERNA'
                }
                console.log('🏪 Empresa externa detectada')
              }
            } else {
              extendedData = {
                ...extractedData,
                isMyCompany: false,
                companyType: 'EXTERNA'
              }
            }

          } catch (openAIError: any) {
            console.error('❌ Erro também na OpenAI (fallback):', openAIError)
            console.error('❌ OpenAI Error details:', {
              name: openAIError.name,
              message: openAIError.message,
              code: openAIError.code,
              status: openAIError.status
            })
            throw new Error(`Ambas as APIs falharam - Google AI: ${googleError.message}, OpenAI: ${openAIError.message}`)
          }
        } else {
          throw new Error(`Google AI falhou e OpenAI não está configurada: ${googleError.message}`)
        }
      }
    } else {
      // Se Google AI não está configurada, usar OpenAI diretamente
      if (openAIKey) {
        try {
          console.log('🔄 Google AI não configurada, usando OpenAI...')

          const openAIExtractor = new AgentExtractorOpenAI(openAIKey)

          if (file.type === 'application/pdf') {
            const result = await openAIExtractor.extract('Documento PDF - processamento limitado', file.name)
            extractedData = result.data
            ocrText = 'PDF processado via OpenAI (limitado)'
            usedModel = 'OpenAI (GPT-4o-Mini) - Única disponível PDF'
          } else {
            const result = await openAIExtractor.extractFromImage(buffer, file.type, file.name)
            extractedData = result.data
            ocrText = 'Imagem processada via OpenAI Vision'
            usedModel = 'OpenAI (GPT-4o-Mini) - Única disponível Image Vision'
          }

          console.log('✅ Extração com OpenAI concluída')

          // Adicionar detecção de empresa própria
          if (extractedData && extractedData.nif) {
            const nif = extractedData.nif.toString().replace(/[^0-9]/g, '')
            if (nif === '517124548') {
              extendedData = {
                ...extractedData,
                isMyCompany: true,
                companyType: 'PRÓPRIA'
              }
              console.log('🏢 Empresa própria detectada (NIF: 517124548)')
            } else {
              extendedData = {
                ...extractedData,
                isMyCompany: false,
                companyType: 'EXTERNA'
              }
              console.log('🏪 Empresa externa detectada')
            }
          } else {
            extendedData = {
              ...extractedData,
              isMyCompany: false,
              companyType: 'EXTERNA'
            }
          }

        } catch (openAIError: any) {
          throw openAIError
        }
      }
    }

    if (!extendedData) {
      throw new Error('Falha na extração de dados do documento')
    }

    console.log(`✅ Análise concluída com ${usedModel}`)

    return NextResponse.json({
      success: true,
      extractedData: extendedData,
      metadata: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        model: usedModel,
        fallbackUsed: fallbackUsed,
        primaryAPI: 'Google AI',
        ocrText: ocrText.substring(0, 200) + '...',
        processedAt: new Date().toISOString()
      },
      availableAPIs: {
        googleAI: !!googleAIKey,
        openAI: !!openAIKey
      }
    })

  } catch (error: any) {
    console.error('❌ Erro geral na análise de documento:', error)
    console.error('❌ Stack trace:', error.stack)

    let errorMessage = 'Erro interno do servidor'
    let errorType = 'UNKNOWN_ERROR'
    let statusCode = 500
    let userFriendlyMessage = 'Ocorreu um erro ao processar o documento. Tente novamente.'

    // Log más detalles del error para debugging
    if (error.message) {
      console.error('❌ Error message:', error.message)
    }
    if (error.code) {
      console.error('❌ Error code:', error.code)
    }

    if (error.message?.includes('Ambas as APIs falharam')) {
      errorMessage = error.message
      errorType = 'ALL_APIS_FAILED'
      userFriendlyMessage = 'Todas as APIs de IA estão temporariamente indisponíveis. Tente novamente mais tarde.'
      statusCode = 503
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Timeout no processamento'
      errorType = 'TIMEOUT_ERROR'
      userFriendlyMessage = 'O processamento demorou muito. Tente com um arquivo menor.'
      statusCode = 408
    } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
      errorMessage = 'Limite de API excedido'
      errorType = 'QUOTA_EXCEEDED'
      userFriendlyMessage = 'Limite de uso da API atingido. Contacte o administrador.'
      statusCode = 429
    } else if (error.message?.includes('Failed to fetch')) {
      errorMessage = 'Erro de conexão com API'
      errorType = 'CONNECTION_ERROR'
      userFriendlyMessage = 'Erro de conexão. Verifique a configuração da API.'
      statusCode = 502
    } else if (error.message?.includes('Invalid API key')) {
      errorMessage = 'API key inválida'
      errorType = 'INVALID_API_KEY'
      userFriendlyMessage = 'Configuração de API inválida. Contacte o administrador.'
      statusCode = 401
    } else if (error.message) {
      errorMessage = error.message
      userFriendlyMessage = 'Erro no processamento do documento. Verifique o arquivo e tente novamente.'
    }

    return NextResponse.json(
      {
        success: false,
        error: userFriendlyMessage,
        details: errorMessage,
        errorType: errorType,
        timestamp: new Date().toISOString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: statusCode }
    )
  }
} 