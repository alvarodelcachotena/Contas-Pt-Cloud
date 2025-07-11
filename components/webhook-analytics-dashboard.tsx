'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Activity, 
  AlertCircle,
  Download,
  RefreshCw,
  Target,
  Zap
} from 'lucide-react'

interface AnalyticsData {
  summary: {
    totalEvents: number
    successfulEvents: number
    failedEvents: number
    documentsProcessed: number
    averageResponseTime: number
    uptime: number
  }
  timeSeriesData: Array<{
    date: string
    events: number
    success: number
    errors: number
  }>
  serviceBreakdown: Record<string, number>
  activityBreakdown: Record<string, number>
  errorAnalysis: Record<string, number>
  performanceMetrics: {
    peakHours: Array<{ hour: number; events: number }>
    slowestOperations: Array<any>
    mostActiveServices: Array<{ service: string; events: number }>
  }
  trends: {
    dailyGrowth: number
    weeklyGrowth: number
    errorRate: number
    successRate: number
  }
}

export default function WebhookAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('7d')
  const [selectedService, setSelectedService] = useState<string>('')
  const { toast } = useToast()

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ period })
      if (selectedService) {
        params.append('service', selectedService)
      }

      const response = await fetch(`/api/webhooks/analytics?${params}`)
      const data = await response.json()

      if (data.success) {
        setAnalytics(data.analytics)
      } else {
        toast({
          title: 'Erro',
          description: 'Falha ao carregar análises',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Analytics error:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar análises',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const exportAnalytics = async () => {
    try {
      const response = await fetch('/api/webhooks/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'export', period })
      })

      const data = await response.json()

      if (data.success) {
        // Create and download CSV file
        const blob = new Blob([data.exportData], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = data.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        toast({
          title: 'Sucesso',
          description: 'Dados exportados com sucesso'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha na exportação',
        variant: 'destructive'
      })
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [period, selectedService])

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Activity className="w-4 h-4 text-gray-500" />
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  const services = ['whatsapp', 'gmail', 'dropbox']

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">1 Dia</SelectItem>
              <SelectItem value="7d">7 Dias</SelectItem>
              <SelectItem value="30d">30 Dias</SelectItem>
              <SelectItem value="90d">90 Dias</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Todos os serviços" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os serviços</SelectItem>
              {services.map(service => (
                <SelectItem key={service} value={service}>
                  {service.charAt(0).toUpperCase() + service.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button 
            onClick={loadAnalytics}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
          
          <Button 
            onClick={exportAnalytics}
            disabled={!analytics}
            variant="outline"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {analytics && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Eventos</p>
                    <p className="text-2xl font-bold">{formatNumber(analytics.summary.totalEvents)}</p>
                  </div>
                  <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex items-center mt-2">
                  {getTrendIcon(analytics.trends.dailyGrowth)}
                  <span className="text-sm text-muted-foreground ml-1">
                    {analytics.trends.dailyGrowth}% vs ontem
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Taxa de Sucesso</p>
                    <p className="text-2xl font-bold">{analytics.trends.successRate}%</p>
                  </div>
                  <Target className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex items-center mt-2">
                  <Badge variant={analytics.trends.successRate >= 95 ? "default" : "secondary"}>
                    {analytics.trends.successRate >= 95 ? "Excelente" : "Boa"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Documentos Processados</p>
                    <p className="text-2xl font-bold">{formatNumber(analytics.summary.documentsProcessed)}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex items-center mt-2">
                  {getTrendIcon(analytics.trends.weeklyGrowth)}
                  <span className="text-sm text-muted-foreground ml-1">
                    {analytics.trends.weeklyGrowth}% vs semana passada
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                    <p className="text-2xl font-bold">{analytics.summary.uptime}%</p>
                  </div>
                  <Zap className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex items-center mt-2">
                  <Badge variant={analytics.summary.uptime >= 99 ? "default" : "destructive"}>
                    {analytics.summary.uptime >= 99 ? "Estável" : "Instável"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Service Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Breakdown por Serviço</CardTitle>
                <CardDescription>
                  Distribuição de eventos por webhook
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics.serviceBreakdown).map(([service, count]) => (
                    <div key={service} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{service}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {service.charAt(0).toUpperCase() + service.slice(1)}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{count}</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round((count / analytics.summary.totalEvents) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Horas de Pico</CardTitle>
                <CardDescription>
                  Horários com maior atividade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.performanceMetrics.peakHours.map((peak, index) => (
                    <div key={peak.hour} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{peak.hour}:00h - {peak.hour + 1}:00h</span>
                      </div>
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {peak.events} eventos
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Analysis */}
          {Object.keys(analytics.errorAnalysis).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>Análise de Erros</span>
                </CardTitle>
                <CardDescription>
                  Tipos de erros mais comuns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.errorAnalysis).map(([error, count]) => (
                    <div key={error} className="flex items-center justify-between p-3 rounded border">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{error}</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round((count / analytics.summary.failedEvents) * 100)}% dos erros
                        </p>
                      </div>
                      <Badge variant="destructive">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="ml-2">Carregando análises...</span>
        </div>
      )}
    </div>
  )
}