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
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/bmp',
  'image/webp',
  'image/tiff'
]

export async function POST(request: NextRequest) {
  console.log('📎 Nova requisição de análise de documento recebida')
  
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
          error: `Tipo de arquivo não suportado: ${file.type}. Tipos permitidos: PDF, PNG, JPG, GIF, BMP, WebP, TIFF`,
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
          error: `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Tamanho máximo: 10MB`,
          errorType: 'FILE_TOO_LARGE'
        },
        { status: 400 }
      )
    }

    console.log(`📄 Processando arquivo: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)}KB)`)

    // Verificar se pelo menos uma API está disponível
    const googleAIKey = process.env.GOOGLE_AI_API_KEY
    const openAIKey = process.env.OPENAI_API_KEY

    if (!googleAIKey && !openAIKey) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Nenhuma API de IA está configurada no servidor',
          errorType: 'NO_AI_API'
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
    
    let errorMessage = 'Erro interno do servidor'
    let errorType = 'UNKNOWN_ERROR'
    let statusCode = 500
    let userFriendlyMessage = 'Ocorreu um erro ao processar o documento. Tente novamente.'
    
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
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    )
  }
} 