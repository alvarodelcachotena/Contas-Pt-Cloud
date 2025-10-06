'use client'

import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '@/hooks/useLanguage';
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
  filePreview?: string
  extractedData?: any
}

export default function AIAssistantPage() {
  const { t } = useLanguage();
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 1,
      type: 'assistant',
      message: t.aiAssistant.welcomeMessage,
      timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [processingFileId, setProcessingFileId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  // Evitar hidratación hasta que el componente esté montado
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const saveChatMessage = async (message: string, response: string | null, isFromUser: boolean, context?: any) => {
    try {
      await fetch('/api/ai-chat-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '1'
        },
        body: JSON.stringify({
          message,
          response,
          isFromUser,
          context
        })
      })
    } catch (error) {
      console.error('Error saving chat message:', error)
    }
  }

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

    // Guardar mensaje del usuario
    await saveChatMessage(userMessage.message, null, true)

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

        // Guardar respuesta del asistente
        await saveChatMessage(userMessage.message, data.response, false, {
          timestamp: new Date().toISOString(),
          success: true
        })
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)

      let errorText = t.aiAssistant.errors.generic;

      // Tentar obter mais detalhes do erro
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorText = t.aiAssistant.errors.auth;
        } else if (error.message.includes('429')) {
          errorText = t.aiAssistant.errors.rateLimit;
        } else if (error.message.includes('timeout')) {
          errorText = t.aiAssistant.errors.timeout;
        } else if (error.message.includes('500')) {
          errorText = t.aiAssistant.errors.server;
        } else if (error.message.includes('Failed to fetch')) {
          errorText = t.aiAssistant.errors.connection;
        }
      }

      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        message: errorText,
        timestamp: isMounted ? new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : ''
      }

      setChatHistory(prev => [...prev, errorMessage])

      // Guardar mensaje de error del asistente
      await saveChatMessage(userMessage.message, errorText, false, {
        timestamp: new Date().toISOString(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
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
      'image/tiff',
      'image/svg+xml',
      'image/heic',
      'image/heif',
      'image/avif',
      'image/x-icon',
      'image/vnd.microsoft.icon'
    ]

    if (!allowedTypes.includes(file.type)) {
      alert(t.aiAssistant.fileErrors.unsupportedType);
      return
    }

    // Verificar tamanho do arquivo (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(t.aiAssistant.fileErrors.tooLarge);
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

    // Generar ID único del archivo para evitar procesamiento múltiple
    const fileId = `${selectedFile.name}-${selectedFile.size}-${selectedFile.lastModified}`

    // Verificar si ya se está procesando este archivo
    if (processingFileId === fileId) {
      console.log('⚠️ Archivo ya se está procesando, ignorando solicitud duplicada')
      return
    }

    setIsProcessingFile(true)
    setIsTyping(true)
    setProcessingFileId(fileId)

    console.log(`🚀 Iniciando análisis de archivo: ${selectedFile.name} (ID: ${fileId})`)

    // Convertir archivo a base64 UNA SOLA VEZ para vista previa y envío
    const { filePreview, base64 } = await new Promise<{ filePreview: string, base64: string }>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64Data = result.split(',')[1]
        resolve({
          filePreview: result,
          base64: base64Data
        })
      }
      reader.onerror = reject
      reader.readAsDataURL(selectedFile)
    })

    // Añadir mensaje del usuario mostrando el archivo
    const userMessage: ChatMessage = {
      id: Date.now(),
      type: 'user',
      message: t.aiAssistant.analyzingFile.replace('{fileName}', selectedFile.name),
      timestamp: isMounted ? new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '',
      hasFile: true,
      fileName: selectedFile.name,
      fileType: selectedFile.type,
      filePreview: filePreview
    }

    setChatHistory(prev => [...prev, userMessage])

    // Guardar mensaje del usuario con archivo (en paralelo)
    const saveMessagePromise = saveChatMessage(userMessage.message, null, true, {
      fileName: selectedFile.name,
      fileType: selectedFile.type,
      fileSize: selectedFile.size
    })

    try {

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('base64', base64)
      formData.append('fileName', selectedFile.name)
      formData.append('fileType', selectedFile.type)

      // Enviar análisis y guardar mensaje en paralelo
      const [response] = await Promise.all([
        fetch('/api/ai-document-analysis', {
          method: 'POST',
          body: formData,
        }),
        saveMessagePromise // Esperar que se guarde el mensaje
      ])

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ Response data:', data)

        if (data.success) {
          // Mensaje simple de confirmación
          const responseMessage = "✅ *Documento procesado*"

        const assistantMessage: ChatMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          message: responseMessage,
          timestamp: isMounted ? new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '',
          extractedData: data.extractedData
        }

        setChatHistory(prev => [...prev, assistantMessage])

        // Guardar automáticamente como factura si hay datos extraídos (en paralelo)
        if (data.extractedData) {
          // Generar nombre personalizado para la factura
          const vendorName = data.extractedData.vendor || 'Factura'
          const issueDate = data.extractedData.issueDate || new Date().toISOString().split('T')[0]
          const date = new Date(issueDate)
          const formattedDate = date.toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }).replace(/\//g, '-')

          const customInvoiceNumber = `${vendorName.toUpperCase().replace(/[^A-Z0-9\s]/g, '').trim()} ${formattedDate}`

          // Crear factura en paralelo (no esperar)
          fetch('/api/invoices', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customNumber: customInvoiceNumber,
              clientName: data.extractedData.vendor,
              clientEmail: '',
              clientTaxId: data.extractedData.nif ? data.extractedData.nif.replace(/^ES/, '') : '',
              issueDate: issueDate,
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días
              amount: data.extractedData.netAmount || 0,
              vatAmount: data.extractedData.vatAmount || 0,
              vatRate: data.extractedData.vatRate || 0.23,
              totalAmount: data.extractedData.total || 0,
              status: 'paid',
              description: data.extractedData.description || 'Factura creada desde análisis de documento',
              paymentTerms: '30 dias',
              paymentType: 'tarjeta'
            })
          })
            .then(async (invoiceResponse) => {
              if (invoiceResponse.ok) {
                const invoice = await invoiceResponse.json()
                const successMessage: ChatMessage = {
                  id: Date.now() + 2,
                  type: 'assistant',
                  message: `✅ **${t.aiAssistant.autoSave.success}**\n\n📋 **${t.aiAssistant.invoiceDetails.number}:** ${invoice.number}\n🏪 **${t.aiAssistant.invoiceDetails.vendor}:** ${data.extractedData.vendor}\n💰 **${t.aiAssistant.invoiceDetails.total}:** €${invoice.total_amount}`,
                  timestamp: isMounted ? new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : ''
                }
                setChatHistory(prev => [...prev, successMessage])
              } else {
                throw new Error('Error al crear la factura')
              }
            })
            .catch((error) => {
              console.error('Error saving invoice automatically:', error)
              const errorMessage: ChatMessage = {
                id: Date.now() + 2,
                type: 'assistant',
                message: `❌ **${t.aiAssistant.autoSave.error}**\n\n${error instanceof Error ? error.message : 'Error desconocido'}`,
                timestamp: isMounted ? new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : ''
              }
              setChatHistory(prev => [...prev, errorMessage])
            })
        }

        // Guardar respuesta del análisis de archivo
        await saveChatMessage(userMessage.message, responseMessage, false, {
          timestamp: new Date().toISOString(),
          success: true,
          extractedData: data.extractedData,
          fileName: selectedFile.name,
          fileType: selectedFile.type
        })
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (error) {
      console.error('❌ Erro ao processar arquivo:', error)
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })

      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        message: `${t.aiAssistant.fileProcessingError}\n\n🔍 Error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: isMounted ? new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : ''
      }

      setChatHistory(prev => [...prev, errorMessage])

      // Guardar mensaje de error del análisis de archivo
      await saveChatMessage(userMessage.message, t.aiAssistant.fileProcessingError, false, {
        timestamp: new Date().toISOString(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName: selectedFile.name,
        fileType: selectedFile.type
      })
    } finally {
      setIsProcessingFile(false)
      setIsTyping(false)
      setProcessingFileId(null)
      removeSelectedFile()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }



  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t.aiAssistant.title}</h1>
                <p className="text-gray-600 mt-1">{t.aiAssistant.subtitle}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <Bot className="w-3 h-3 mr-1" />
                  {t.aiAssistant.status.online}
                </Badge>
              </div>
            </div>


            <div className="bg-white rounded-lg border shadow-sm">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-foreground">{t.aiAssistant.chat.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {t.aiAssistant.chat.description}
                </p>
              </div>

              <div className="p-6 h-80 overflow-y-auto space-y-4">
                {chatHistory.map((chat) => (
                  <div key={chat.id} className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md p-3 rounded-lg ${chat.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                      }`}>
                      {/* Mostrar vista previa de imagen si existe */}
                      {chat.hasFile && chat.filePreview && chat.fileType?.startsWith('image/') && (
                        <div className="mb-2">
                          <img
                            src={chat.filePreview}
                            alt={chat.fileName || 'Archivo'}
                            className="max-w-full h-auto rounded border"
                            style={{ maxHeight: '200px' }}
                          />
                        </div>
                      )}
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
                        <span className="text-sm">{t.aiAssistant.typing}</span>
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
                  accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp,.webp,.tiff,.svg,.heic,.heif,.avif,.ico"
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
                              {t.aiAssistant.analyze}
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
                    placeholder={t.aiAssistant.inputPlaceholder}
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
                    title={t.aiAssistant.uploadTooltip}
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
                    <span>{t.aiAssistant.features.fastResponse}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FileText className="w-3 h-3" />
                    <span>{t.aiAssistant.features.portugueseContext}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Brain className="w-3 h-3" />
                    <span>{t.aiAssistant.features.specializedAI}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Upload className="w-3 h-3" />
                    <span>{t.aiAssistant.features.pdfAnalysis}</span>
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