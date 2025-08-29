'use client'

import { useState, useRef, useEffect } from "react"
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Bot, Send, FileText, Brain, Zap, Clock, Loader2, Upload, X, Image, File } from "lucide-react"
import { ProvenanceViewer } from '@/components/ui/provenance-viewer';
import { useQuery, useQueryClient } from '@tanstack/react-query'

interface ChatMessage {
  id: number
  type: 'user' | 'assistant'
  message: string
  timestamp: string
  hasFile?: boolean
  fileName?: string
  fileType?: string
  extractedData?: any
}

export default function AIAssistantPage() {
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 1,
      type: 'assistant',
      message: 'Olá! Sou o seu assistente de contabilidade portuguesa. Como posso ajudá-lo hoje? Pode enviar mensagens ou subir imagens/PDFs de faturas para análise.',
      timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  // Evitar hidratación hasta que el componente esté montado
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const sendMessage = async () => {
    if (!message.trim() || isTyping) {
      return
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      type: 'user',
      message: message.trim(),
      timestamp: isMounted ? new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : ''
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
          timestamp: isMounted ? new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : ''
        }

        setChatHistory(prev => [...prev, assistantMessage])
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)

      let errorText = 'Desculpe, ocorreu um erro ao processar a sua mensagem. Tente novamente.'

      // Tentar obter mais detalhes do erro
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorText = '🔑 Problema de autenticação da API. Contacte o administrador.'
        } else if (error.message.includes('429')) {
          errorText = '⏳ Limite de uso da API atingido. Tente novamente mais tarde.'
        } else if (error.message.includes('timeout')) {
          errorText = '⏱️ A resposta demorou muito. Tente uma pergunta mais simples.'
        } else if (error.message.includes('500')) {
          errorText = '🔧 Erro interno do servidor. Verifique se o servidor está a funcionar.'
        } else if (error.message.includes('Failed to fetch')) {
          errorText = '🌐 Erro de conexão. Verifique se o servidor está a executar na porta 5000.'
        }
      }

      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        message: errorText,
        timestamp: isMounted ? new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : ''
      }

      setChatHistory(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Verificar tipos de archivo permitidos
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp',
      'image/tiff'
    ]

    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de arquivo não suportado. Por favor, selecione um PDF ou imagem (PNG, JPG, GIF, BMP, WebP, TIFF).')
      return
    }

    // Verificar tamanho do arquivo (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Arquivo muito grande. Tamanho máximo: 10MB.')
      return
    }

    setSelectedFile(file)
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const sendFileForAnalysis = async () => {
    if (!selectedFile || isProcessingFile) return

    setIsProcessingFile(true)
    setIsTyping(true)

    // Añadir mensaje del usuario mostrando el archivo
    const userMessage: ChatMessage = {
      id: Date.now(),
      type: 'user',
      message: `Analisando arquivo: ${selectedFile.name}`,
      timestamp: isMounted ? new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '',
      hasFile: true,
      fileName: selectedFile.name,
      fileType: selectedFile.type
    }

    setChatHistory(prev => [...prev, userMessage])

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/ai-document-analysis', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Crear mensaje de respuesta con datos extraídos
        let responseMessage = '📄 **Análise do documento concluída!**\n\n'

        if (data.extractedData) {
          const extracted = data.extractedData
          responseMessage += '**Dados extraídos:**\n'

          // Verificar se é da nossa empresa
          const isMyCompany = extracted.nif === 'PT517124548' || extracted.nif === '517124548'

          if (isMyCompany) {
            responseMessage += '🏢 **EMPRESA PRÓPRIA DETECTADA** (NIF: 517124548)\n\n'
          } else {
            responseMessage += '🏪 **EMPRESA EXTERNA**\n\n'
          }

          responseMessage += `• **Fornecedor:** ${extracted.vendor || 'N/A'}\n`
          responseMessage += `• **NIF:** ${extracted.nif || 'N/A'}\n`
          responseMessage += `• **País:** ${extracted.nifCountry || 'N/A'}\n`
          responseMessage += `• **Endereço:** ${extracted.vendorAddress || 'N/A'}\n`
          responseMessage += `• **Nº Fatura:** ${extracted.invoiceNumber || 'N/A'}\n`
          responseMessage += `• **Data:** ${extracted.issueDate || 'N/A'}\n`
          responseMessage += `• **Valor sem IVA:** €${extracted.netAmount || '0.00'}\n`
          responseMessage += `• **IVA:** €${extracted.vatAmount || '0.00'} (${(extracted.vatRate * 100).toFixed(1)}%)\n`
          responseMessage += `• **Total:** €${extracted.total || '0.00'}\n`
          responseMessage += `• **Categoria:** ${extracted.category || 'N/A'}\n`
          responseMessage += `• **Descrição:** ${extracted.description || 'N/A'}\n`
          responseMessage += `• **Confiança:** ${(extracted.confidence * 100).toFixed(1)}%\n`

          if (extracted.extractionIssues && extracted.extractionIssues.length > 0) {
            responseMessage += `\n⚠️  **Problemas detectados:**\n${extracted.extractionIssues.map((issue: string) => `• ${issue}`).join('\n')}`
          }
        }

        const assistantMessage: ChatMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          message: responseMessage,
          timestamp: isMounted ? new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '',
          extractedData: data.extractedData
        }

        setChatHistory(prev => [...prev, assistantMessage])
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error)

      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        message: '❌ Erro ao processar o arquivo. Verifique se é um PDF ou imagem válida e tente novamente.',
        timestamp: isMounted ? new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : ''
      }

      setChatHistory(prev => [...prev, errorMessage])
    } finally {
      setIsProcessingFile(false)
      setIsTyping(false)
      removeSelectedFile()
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
                    <div className={`max-w-md p-3 rounded-lg ${chat.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                      }`}>
                      <div className="text-sm whitespace-pre-wrap">{chat.message}</div>
                      <div className={`text-xs mt-1 ${chat.type === 'user' ? 'text-blue-100' : 'text-gray-500'
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
                {/* Input file oculto */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp,.webp,.tiff"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Mostrar archivo seleccionado */}
                {selectedFile && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {selectedFile.type.startsWith('image/') ? (
                          <Image className="w-4 h-4 text-blue-600" />
                        ) : (
                          <File className="w-4 h-4 text-red-600" />
                        )}
                        <span className="text-sm font-medium text-gray-700">
                          {selectedFile.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={sendFileForAnalysis}
                          disabled={isProcessingFile}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isProcessingFile ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Brain className="w-3 h-3 mr-1" />
                              Analisar
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={removeSelectedFile}
                          disabled={isProcessingFile}
                          size="sm"
                          variant="outline"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

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
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isTyping || selectedFile !== null}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                    title="Subir PDF ou imagem"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
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
                  <div className="flex items-center space-x-1">
                    <Upload className="w-3 h-3" />
                    <span>Análise de PDF/imagens</span>
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