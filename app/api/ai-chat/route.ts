import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
          details: parseError?.message || 'Erro desconhecido no parsing' 
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
          error: 'Mensagem é obrigatória e deve ser uma string não vazia' 
        },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY não configurada')
      return NextResponse.json(
        { 
          success: false,
          error: 'API Key não configurada' 
        },
        { status: 500 }
      )
    }

    console.log('🔄 Enviando para OpenAI...')
    
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message.trim() }
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content || 'Desculpe, não consegui processar a sua pergunta.'
    
    console.log('✅ Resposta da OpenAI recebida:', response.substring(0, 100) + '...')
    
    return NextResponse.json({
      success: true,
      response: response,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Erro na API OpenAI:', error)
    
    let errorMessage = 'Erro interno do servidor'
    let statusCode = 500
    
    if (error.code === 'insufficient_quota') {
      errorMessage = 'Quota da API excedida. Contacte o administrador.'
      statusCode = 429
    } else if (error.code === 'invalid_api_key') {
      errorMessage = 'Chave API inválida'
      statusCode = 401
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage, 
        details: error.message 
      },
      { status: statusCode }
    )
  }
} 