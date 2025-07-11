'use client'

import { useState } from "react"
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Bot, Send, FileText, Brain, Zap, Clock, Loader2 } from "lucide-react"

interface ChatMessage {
  id: number
  type: 'user' | 'assistant'
  message: string
  timestamp: string
}

export default function AIAssistantPage() {
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 1,
      type: 'assistant',
      message: 'Olá! Sou o seu assistente de contabilidade portuguesa. Como posso ajudá-lo hoje?',
      timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [isTyping, setIsTyping] = useState(false)

  const sendMessage = async () => {
    if (!message.trim() || isTyping) {
      return
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      type: 'user',
      message: message.trim(),
      timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    }

    setChatHistory(prev => [...prev, userMessage])
    setMessage('')
    setIsTyping(true)

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.message }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          message: data.response,
          timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
        }

        setChatHistory(prev => [...prev, assistantMessage])
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        message: 'Desculpe, ocorreu um erro ao processar a sua mensagem. Tente novamente.',
        timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
      }

      setChatHistory(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const aiModels = [
    { name: 'Google Gemini-2.5-Flash', status: 'active', usage: '75%', specialty: 'Extração de documentos' },
    { name: 'OpenAI GPT-4o-Mini', status: 'active', usage: '25%', specialty: 'Validação e fallback' }
  ]

  const recentTasks = [
    {
      id: 1,
      type: 'document_extraction',
      description: 'Extraída fatura Microsoft Office 365',
      timestamp: '2025-06-20T14:30:00',
      confidence: 0.95,
      model: 'Gemini'
    },
    {
      id: 2,
      type: 'expense_categorization',
      description: 'Categorizada despesa EDP Energia',
      timestamp: '2025-06-18T16:15:00',
      confidence: 0.92,
      model: 'Gemini'
    },
    {
      id: 3,
      type: 'validation',
      description: 'Validação NIF cliente Empresa ABC',
      timestamp: '2025-06-15T09:45:00',
      confidence: 0.98,
      model: 'GPT-4o-Mini'
    }
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Assistente IA</h1>
                <p className="text-gray-600 mt-1">Assistente inteligente para contabilidade portuguesa</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <Bot className="w-3 h-3 mr-1" />
                  Online
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Documentos Processados</h3>
                    <p className="text-3xl font-bold text-foreground mt-2">156</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Precisão IA</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">94.5%</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Brain className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Tempo Poupado</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">24h</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Modelos IA Ativos</h3>
                <div className="space-y-4">
                  {aiModels.map((model, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Brain className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{model.name}</div>
                          <div className="text-sm text-gray-500">{model.specialty}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={model.status === 'active' ? 'default' : 'secondary'}>
                          {model.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">Uso: {model.usage}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg border shadow-sm p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Tarefas Recentes</h3>
                <div className="space-y-3">
                  {recentTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border-b">
                      <div>
                        <div className="font-medium text-sm">{task.description}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(task.timestamp).toLocaleString('pt-PT')} • {task.model}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">
                          {(task.confidence * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">confiança</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border shadow-sm">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-foreground">Chat com AI Assistant</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Faça perguntas sobre contabilidade, IVA, e gestão financeira em português
                </p>
              </div>
              
              <div className="p-6 h-80 overflow-y-auto space-y-4">
                {chatHistory.map((chat) => (
                  <div key={chat.id} className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md p-3 rounded-lg ${
                      chat.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap">{chat.message}</div>
                      <div className={`text-xs mt-1 ${
                        chat.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {chat.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 max-w-md p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Assistente está digitando...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Pergunte sobre contabilidade, IVA, despesas..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                    disabled={isTyping}
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={!message.trim() || isTyping}
                    className="flex items-center space-x-2"
                  >
                    {isTyping ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Zap className="w-3 h-3" />
                    <span>Resposta rápida</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FileText className="w-3 h-3" />
                    <span>Contexto português</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Brain className="w-3 h-3" />
                    <span>IA especializada</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}