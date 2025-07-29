import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import OpenAI from 'openai'

// Initialize both AI clients
const googleAI = process.env.GOOGLE_AI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY }) : null
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

export async function POST(request: NextRequest) {
  console.log('📨 Nova requisição recebida em /api/ai-chat')
  
  try {
    let body;
    try {
      body = await request.json()
      console.log('📋 Body da requisição:', JSON.stringify(body))
    } catch (parseError: any) {
      console.error('❌ Erro ao parsear JSON:', parseError)
      return NextResponse.json(
        { 
          success: false,
          error: 'JSON inválido na requisição', 
          details: parseError?.message || 'Erro desconhecido no parsing',
          errorType: 'PARSE_ERROR'
        },
        { status: 400 }
      )
    }
    
    const { message } = body
    console.log('📤 Mensagem extraída:', message)
    
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

    const systemPrompt = `
      Você é um assistente especializado em contabilidade portuguesa. 
      Seu conhecimento inclui:
      - IVA (Imposto sobre o Valor Acrescentado) português
      - Validação de NIF (Número de Identificação Fiscal)
      - Regras contábeis portuguesas
      - SAFT-PT (Standard Audit File for Tax purposes)
      - Categorização de despesas
      - Processamento de faturas
      - Gestão financeira para empresas portuguesas
      
      Responda sempre em português e seja específico sobre as regras portuguesas.
      Mantenha as respostas claras e práticas.
    `

    let response = ''
    let usedModel = ''
    let fallbackUsed = false

    // PRIMEIRA TENTATIVA: Google AI (Gemini) - PRINCIPAL
    if (googleAI) {
      try {
        console.log('🔄 Tentando Google AI (Gemini) como resposta principal...')
        
        const fullPrompt = `${systemPrompt}\n\nPergunta do utilizador: ${message.trim()}`
        
        const result = await googleAI.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: [{ text: fullPrompt }]
        })
        response = result.text || ''
        
        if (response.trim()) {
          usedModel = 'Google AI (Gemini-1.5-Flash)'
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
              max_tokens: 500,
              temperature: 0.7,
            })

            response = completion.choices[0]?.message?.content || ''
            usedModel = 'OpenAI (GPT-4o-Mini) - Fallback'
            console.log('✅ Resposta da OpenAI (fallback) recebida:', response.substring(0, 100) + '...')
            
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
      if (openai) {
        try {
          console.log('🔄 Google AI não configurada, usando OpenAI...')
          
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: message.trim() }
            ],
            max_tokens: 500,
            temperature: 0.7,
          })

          response = completion.choices[0]?.message?.content || ''
          usedModel = 'OpenAI (GPT-4o-Mini) - Única disponível'
          console.log('✅ Resposta da OpenAI recebida:', response.substring(0, 100) + '...')
          
        } catch (openAIError: any) {
          throw openAIError
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
      }
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