'use client'

import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useQuery } from '@tanstack/react-query'
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  MessageSquare,
  Image,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  Download
} from "lucide-react"

interface WhatsAppDocument {
  id: number
  filename: string
  source: string
  processing_status: string
  confidence_score: number
  created_at: string
  extracted_data: any
  mime_type: string
  file_size: number
}

export default function WebhooksMonitoringPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [selectedDocument, setSelectedDocument] = useState<WhatsAppDocument | null>(null)

  // Fetch WhatsApp documents
  const { data: documents, isLoading: documentsLoading, refetch } = useQuery<WhatsAppDocument[]>({
    queryKey: ['whatsapp-documents'],
    queryFn: async () => {
      const response = await fetch('/api/documents?source=whatsapp_webhook', {
        headers: {
          'x-tenant-id': '1'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch WhatsApp documents')
      return response.json()
    },
    refetchInterval: 10000 // Refresh every 10 seconds
  })

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Calculate metrics
  const totalDocuments = documents?.length || 0
  const pendingDocuments = documents?.filter(d => d.processing_status === 'pending').length || 0
  const processingDocuments = documents?.filter(d => d.processing_status === 'processing').length || 0
  const completedDocuments = documents?.filter(d => d.processing_status === 'completed').length || 0
  const failedDocuments = documents?.filter(d => d.processing_status === 'failed').length || 0

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-600" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <FileText className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado'
      case 'processing':
        return 'Processando'
      case 'pending':
        return 'Pendente'
      case 'failed':
        return 'Falhou'
      default:
        return status
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getDocumentTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  const viewDocumentDetails = (document: WhatsAppDocument) => {
    setSelectedDocument(document)
  }

  const closeDocumentDetails = () => {
    setSelectedDocument(null)
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
                <h1 className="text-3xl font-bold text-foreground">Monitoreo de WhatsApp</h1>
                <p className="text-gray-600 mt-1">Documentos recibidos y procesados via WhatsApp</p>
              </div>
              <Button onClick={() => refetch()} className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4" />
                <span>Actualizar</span>
              </Button>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalDocuments}</div>
                  <p className="text-xs text-muted-foreground">Documentos recibidos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{pendingDocuments}</div>
                  <p className="text-xs text-muted-foreground">Aguardando processamento</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Processando</CardTitle>
                  <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{processingDocuments}</div>
                  <p className="text-xs text-muted-foreground">Em processamento</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completados</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{completedDocuments}</div>
                  <p className="text-xs text-muted-foreground">Processados com sucesso</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Falharam</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{failedDocuments}</div>
                  <p className="text-xs text-muted-foreground">Erros no processamento</p>
                </CardContent>
              </Card>
            </div>

            {/* Documents Table */}
            {documentsLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-12 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Documentos WhatsApp</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Nome do Arquivo</TableHead>
                        <TableHead>Tamanho</TableHead>
                        <TableHead>Confiança</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            Nenhum documento WhatsApp encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        documents?.map((document) => (
                          <TableRow key={document.id}>
                            <TableCell>
                              {getDocumentTypeIcon(document.mime_type)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(document.processing_status)}
                                <Badge variant={
                                  document.processing_status === 'completed' ? 'default' :
                                    document.processing_status === 'failed' ? 'destructive' : 'secondary'
                                }>
                                  {getStatusLabel(document.processing_status)}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{document.filename}</TableCell>
                            <TableCell>{formatFileSize(document.file_size)}</TableCell>
                            <TableCell>
                              {document.confidence_score ?
                                `${(document.confidence_score * 100).toFixed(1)}%` :
                                '-'
                              }
                            </TableCell>
                            <TableCell>
                              {new Date(document.created_at).toLocaleDateString('pt-PT')}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => viewDocumentDetails(document)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Document Details Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Detalhes do Documento</h2>
              <Button variant="ghost" onClick={closeDocumentDetails}>
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Informações Básicas</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <span className="text-sm text-gray-600">Nome:</span>
                    <p className="font-medium">{selectedDocument.filename}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Tamanho:</span>
                    <p className="font-medium">{formatFileSize(selectedDocument.file_size)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Tipo:</span>
                    <p className="font-medium">{selectedDocument.mime_type}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Status:</span>
                    <p className="font-medium">{getStatusLabel(selectedDocument.processing_status)}</p>
                  </div>
                </div>
              </div>

              {selectedDocument.extracted_data?.ai_analysis && (
                <div>
                  <h3 className="font-semibold">Análise de IA</h3>
                  <div className="bg-gray-50 p-4 rounded-lg mt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Tipo:</span>
                        <p className="font-medium">{selectedDocument.extracted_data.ai_analysis.document_type}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Confiança:</span>
                        <p className="font-medium">
                          {(selectedDocument.extracted_data.ai_analysis.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {selectedDocument.extracted_data.ai_analysis.extracted_data && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Dados Extraídos:</h4>
                        <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                          {JSON.stringify(selectedDocument.extracted_data.ai_analysis.extracted_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedDocument.extracted_data?.processing_notes && (
                <div>
                  <h3 className="font-semibold">Notas de Processamento</h3>
                  <div className="bg-blue-50 p-4 rounded-lg mt-2">
                    <ul className="list-disc list-inside space-y-1">
                      {selectedDocument.extracted_data.processing_notes.map((note: string, index: number) => (
                        <li key={index} className="text-sm">{note}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={closeDocumentDetails}>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}