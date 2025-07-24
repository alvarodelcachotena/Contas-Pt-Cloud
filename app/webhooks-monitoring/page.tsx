'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, CheckCircle, Clock, RefreshCw, ExternalLink, FileText, Upload, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface WebhookActivity {
  id: string
  timestamp: Date
  provider: string
  status: 'success' | 'error' | 'processing'
  filesProcessed: number
  errors: string[]
  duration: number
}

interface DropboxProcessingStatus {
  configId: number
  tenantId: number
  folderPath: string
  lastSync: Date
  status: 'active' | 'error' | 'disabled'
  totalFiles: number
  processedFiles: number
  duplicateFiles: number
  errorFiles: number
}

interface DocumentProcessingLog {
  id: string
  filename: string
  status: 'processing' | 'completed' | 'error' | 'duplicate'
  timestamp: Date
  tenantId: number
  processingTime?: number
  errorMessage?: string
  confidence?: number
  processor: string
}

export default function WebhooksMonitoring() {
  const [activities, setActivities] = useState<WebhookActivity[]>([])
  const [processingStatus, setProcessingStatus] = useState<DropboxProcessingStatus[]>([])
  const [documentLogs, setDocumentLogs] = useState<DocumentProcessingLog[]>([])
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchWebhookData()
    const interval = setInterval(fetchWebhookData, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchWebhookData = async () => {
    try {
      const response = await fetch('/api/webhooks/status')
      const result = await response.json()
      
      if (result.success) {
        setActivities(result.data.activities)
        setProcessingStatus(result.data.processingStatus)
        setDocumentLogs(result.data.documentLogs)
      } else {
        throw new Error(result.error || 'Failed to fetch data')
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching webhook data:', error)
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados dos webhooks',
        variant: 'destructive'
      })
      setLoading(false)
    }
  }

  const testDropboxSync = async () => {
    setTesting(true)
    try {
      const response = await fetch('/api/dropbox/test-processing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId: 8 })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: 'Teste Concluído',
          description: `Encontrados ${result.files.documents} documentos na pasta Dropbox`
        })
      } else {
        toast({
          title: 'Erro no Teste',
          description: result.error || 'Falha no teste de sincronização',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao testar sincronização Dropbox',
        variant: 'destructive'
      })
    } finally {
      setTesting(false)
    }
  }

  const triggerManualSync = async () => {
    try {
      const response = await fetch('/api/dropbox/manual-sync', {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: 'Sincronização Iniciada',
          description: 'Sincronização manual do Dropbox iniciada com sucesso'
        })
        fetchWebhookData()
      } else {
        throw new Error('Falha na sincronização')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao iniciar sincronização manual',
        variant: 'destructive'
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'duplicate':
        return <FileText className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'duplicate':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Monitoramento de Webhooks</h1>
          <p className="text-muted-foreground">
            Acompanhe a sincronização automática de documentos do Dropbox e outros serviços
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchWebhookData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button 
            onClick={testDropboxSync}
            disabled={testing}
            className="flex items-center gap-2"
          >
            {testing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            Testar Dropbox
          </Button>
          <Button 
            onClick={triggerManualSync}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Sincronização Manual
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="activity">Atividade dos Webhooks</TabsTrigger>
          <TabsTrigger value="processing">Status de Processamento</TabsTrigger>
          <TabsTrigger value="logs">Logs de Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Webhooks</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activities.length}</div>
                <p className="text-xs text-muted-foreground">últimas 24 horas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Arquivos Processados</CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {processingStatus.reduce((sum, status) => sum + status.processedFiles, 0)}
                </div>
                <p className="text-xs text-muted-foreground">documentos sincronizados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Arquivos Duplicados</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {processingStatus.reduce((sum, status) => sum + status.duplicateFiles, 0)}
                </div>
                <p className="text-xs text-muted-foreground">já existentes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Erros de Processamento</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {processingStatus.reduce((sum, status) => sum + status.errorFiles, 0)}
                </div>
                <p className="text-xs text-muted-foreground">falhas recentes</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Status das Configurações Dropbox</CardTitle>
              <CardDescription>Monitoramento em tempo real das pastas sincronizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {processingStatus.map((status) => (
                  <div key={status.configId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(status.status)}
                      <div>
                        <p className="font-medium">Tenant {status.tenantId} - {status.folderPath}</p>
                        <p className="text-sm text-muted-foreground">
                          Última sincronização: {status.lastSync.toLocaleString('pt-PT')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="font-medium">{status.processedFiles}</span> processados
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{status.duplicateFiles}</span> duplicados
                      </div>
                      <Badge className={getStatusColor(status.status)}>
                        {status.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente dos Webhooks</CardTitle>
              <CardDescription>Histórico de chamadas de webhook recebidas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Provedor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Arquivos</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Erros</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        {activity.timestamp.toLocaleString('pt-PT')}
                      </TableCell>
                      <TableCell className="capitalize">
                        {activity.provider}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(activity.status)}
                          <Badge className={getStatusColor(activity.status)}>
                            {activity.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{activity.filesProcessed}</TableCell>
                      <TableCell>{activity.duration}ms</TableCell>
                      <TableCell>
                        {activity.errors.length > 0 && (
                          <div className="max-w-md">
                            {activity.errors.map((error, index) => (
                              <p key={index} className="text-sm text-red-600">{error}</p>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status de Processamento por Configuração</CardTitle>
              <CardDescription>Detalhamento do status de cada pasta monitorizada</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {processingStatus.map((status) => (
                  <div key={status.configId} className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(status.status)}
                        <h3 className="font-semibold">Configuração {status.configId}</h3>
                      </div>
                      <Badge className={getStatusColor(status.status)}>
                        {status.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="text-2xl font-bold">{status.totalFiles}</div>
                        <div className="text-sm text-muted-foreground">Total</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded">
                        <div className="text-2xl font-bold text-green-600">{status.processedFiles}</div>
                        <div className="text-sm text-muted-foreground">Processados</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <div className="text-2xl font-bold text-blue-600">{status.duplicateFiles}</div>
                        <div className="text-sm text-muted-foreground">Duplicados</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded">
                        <div className="text-2xl font-bold text-red-600">{status.errorFiles}</div>
                        <div className="text-sm text-muted-foreground">Erros</div>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p><strong>Tenant:</strong> {status.tenantId}</p>
                      <p><strong>Pasta:</strong> {status.folderPath}</p>
                      <p><strong>Última Sincronização:</strong> {status.lastSync.toLocaleString('pt-PT')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Processamento de Documentos</CardTitle>
              <CardDescription>Histórico detalhado de cada documento processado</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Processador</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Tempo/Confiança</TableHead>
                    <TableHead>Erro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium max-w-xs truncate">
                        {log.filename}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <Badge className={getStatusColor(log.status)}>
                            {log.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{log.processor}</TableCell>
                      <TableCell>
                        {log.timestamp.toLocaleString('pt-PT')}
                      </TableCell>
                      <TableCell>{log.tenantId}</TableCell>
                      <TableCell>
                        {log.processingTime && `${log.processingTime}ms`}
                        {log.confidence && ` (${Math.round(log.confidence * 100)}%)`}
                      </TableCell>
                      <TableCell>
                        {log.errorMessage && (
                          <span className="text-sm text-red-600 max-w-md truncate block">
                            {log.errorMessage}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}