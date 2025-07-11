'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare, 
  Mail, 
  Cloud,
  Monitor,
  Activity,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'

interface TestResult {
  service: string
  tenantId: number
  testType: string
  timestamp: string
  results: {
    credentialsFound: boolean
    requiredFields: string[]
    missingFields: string[]
    connectionTest: boolean
    apiEndpoint: string
    error?: string
  }
}

interface MonitoringData {
  configs: any[]
  logs: any[]
  stats: {
    totalEvents: number
    recentEvents: number
    eventsByType: Record<string, number>
    successRate: number
    lastActivity: string | null
  }
}

export default function WebhookTestingPanel() {
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({})
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const services = [
    {
      key: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageSquare,
      description: 'WhatsApp Business API webhook'
    },
    {
      key: 'gmail',
      name: 'Gmail',
      icon: Mail,
      description: 'Gmail IMAP webhook'
    },
    {
      key: 'dropbox',
      name: 'Dropbox',
      icon: Cloud,
      description: 'Dropbox file sync webhook'
    }
  ]

  const runTest = async (service: string, testType: string = 'connection') => {
    setTesting(service)
    try {
      const response = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ service, testType })
      })

      const data = await response.json()

      if (data.success) {
        setTestResults(prev => ({
          ...prev,
          [service]: data.testResults
        }))
        
        toast({
          title: 'Teste Concluído',
          description: `Teste do ${service} executado com sucesso`
        })
      } else {
        toast({
          title: 'Teste Falhou',
          description: data.error || 'Erro desconhecido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Test error:', error)
      toast({
        title: 'Erro de Teste',
        description: 'Falha na execução do teste',
        variant: 'destructive'
      })
    } finally {
      setTesting(null)
    }
  }

  const loadMonitoringData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/webhooks/monitor')
      const data = await response.json()

      if (data.success) {
        setMonitoringData(data)
      } else {
        toast({
          title: 'Erro',
          description: 'Falha ao carregar dados de monitoramento',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Monitoring error:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar monitoramento',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (result: TestResult['results']) => {
    if (result.error) return <XCircle className="w-4 h-4 text-red-500" />
    if (!result.credentialsFound) return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    if (result.missingFields.length > 0) return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    if (result.connectionTest) return <CheckCircle className="w-4 h-4 text-green-500" />
    return <Clock className="w-4 h-4 text-gray-500" />
  }

  const getStatusText = (result: TestResult['results']) => {
    if (result.error) return 'Erro'
    if (!result.credentialsFound) return 'Sem Credenciais'
    if (result.missingFields.length > 0) return 'Credenciais Incompletas'
    if (result.connectionTest) return 'Conectado'
    return 'Não Testado'
  }

  return (
    <div className="space-y-6">
      {/* Service Testing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((service) => {
          const ServiceIcon = service.icon
          const result = testResults[service.key]
          
          return (
            <Card key={service.key}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ServiceIcon className="w-5 h-5" />
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                  </div>
                  {result && getStatusIcon(result.results)}
                </div>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <Badge variant={result.results.connectionTest ? 'default' : 'secondary'}>
                        {getStatusText(result.results)}
                      </Badge>
                    </div>
                    
                    {result.results.missingFields.length > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Campos em falta: {result.results.missingFields.join(', ')}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      Último teste: {new Date(result.timestamp).toLocaleString('pt-PT')}
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={() => runTest(service.key)}
                  disabled={testing === service.key}
                  className="w-full"
                  size="sm"
                >
                  {testing === service.key ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Testar Conexão
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Monitoring Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Monitor className="w-5 h-5" />
                <span>Monitoramento de Webhooks</span>
              </CardTitle>
              <CardDescription>
                Atividade e estatísticas dos webhooks em tempo real
              </CardDescription>
            </div>
            <Button 
              onClick={loadMonitoringData}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Activity className="w-4 h-4" />
              )}
              {loading ? 'Carregando...' : 'Atualizar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {monitoringData ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{monitoringData.stats.totalEvents}</div>
                  <p className="text-xs text-muted-foreground">Total de Eventos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{monitoringData.stats.recentEvents}</div>
                  <p className="text-xs text-muted-foreground">Últimas 24h</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{monitoringData.stats.successRate}%</div>
                  <p className="text-xs text-muted-foreground">Taxa de Sucesso</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{monitoringData.configs.length}</div>
                  <p className="text-xs text-muted-foreground">Configurações Ativas</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Clique em "Atualizar" para carregar dados de monitoramento
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {monitoringData && monitoringData.logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Últimos eventos dos webhooks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {monitoringData.logs.slice(0, 10).map((log, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{log.service_type}</Badge>
                    <span className="text-sm">{log.activity_type}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString('pt-PT')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}