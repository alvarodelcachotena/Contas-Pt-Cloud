'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Upload, Check, X, DollarSign, Clock, Target, Zap, FileText, Table, Eye } from 'lucide-react'

interface ProcessorCapability {
  name: string
  type: 'internal' | 'external'
  supportedFormats: string[]
  specialties: string[]
  avgProcessingTime: number
  costPerDocument: number
  accuracy: number
  isAvailable: boolean
  description: string
}

export default function ProcessorManagement() {
  const [processors, setProcessors] = useState<ProcessorCapability[]>([])
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState<string | null>(null)
  const [testFile, setTestFile] = useState<File | null>(null)
  const [testResults, setTestResults] = useState<any>(null)
  const [selectedProcessor, setSelectedProcessor] = useState<string>('')
  const [activeTab, setActiveTab] = useState('overview')
  const { toast } = useToast()

  useEffect(() => {
    fetchProcessors()
  }, [])

  const fetchProcessors = async () => {
    try {
      const response = await fetch('/api/processors?action=list')
      const data = await response.json()
      
      if (data.success) {
        setProcessors(data.processors)
      } else {
        toast({
          title: 'Erro',
          description: 'Falha ao carregar processadores',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro de conexão',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const testProcessor = async (processorName: string) => {
    setTesting(processorName)
    try {
      const response = await fetch('/api/processors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', processor: processorName })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: data.available ? 'Processador Disponível' : 'Processador Indisponível',
          description: `${processorName} ${data.available ? 'está funcionando corretamente' : 'não está disponível'}`,
          variant: data.available ? 'default' : 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro no Teste',
        description: 'Falha ao testar processador',
        variant: 'destructive'
      })
    } finally {
      setTesting(null)
    }
  }

  const processTestFile = async () => {
    if (!testFile || !selectedProcessor) {
      toast({
        title: 'Dados Insuficientes',
        description: 'Selecione um processador e arquivo de teste',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const buffer = await testFile.arrayBuffer()
      const base64Buffer = Buffer.from(buffer).toString('base64')

      const response = await fetch('/api/processors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process',
          processor: selectedProcessor,
          testFile: {
            buffer: base64Buffer,
            mimeType: testFile.type,
            filename: testFile.name
          }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setTestResults(data.result)
        toast({
          title: 'Processamento Concluído',
          description: `Documento processado com confiança de ${(data.result.confidenceScore * 100).toFixed(1)}%`,
          variant: 'default'
        })
      } else {
        toast({
          title: 'Erro no Processamento',
          description: data.error || 'Falha ao processar documento',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha no processamento do arquivo',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getSpecialtyIcon = (specialty: string) => {
    switch (specialty) {
      case 'table_extraction': return <Table className="h-4 w-4" />
      case 'invoices': return <FileText className="h-4 w-4" />
      case 'receipts': return <FileText className="h-4 w-4" />
      case 'real_time': return <Zap className="h-4 w-4" />
      case 'handwriting': return <Eye className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 3
    }).format(amount)
  }

  if (loading && processors.length === 0) {
    return <div className="flex justify-center p-8">Carregando processadores...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gerenciamento de Processadores</h2>
        <p className="text-muted-foreground">
          Configure e teste processadores de documentos externos para melhorar a precisão da extração
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="testing">Teste de Processamento</TabsTrigger>
          <TabsTrigger value="configuration">Configuração</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4">
            {processors.map((processor, index) => (
              <Card key={index} className={processor.isAvailable ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CardTitle className="text-lg">{processor.name}</CardTitle>
                      <Badge variant={processor.type === 'external' ? 'default' : 'secondary'}>
                        {processor.type === 'external' ? 'Externo' : 'Interno'}
                      </Badge>
                      <Badge variant={processor.isAvailable ? 'default' : 'destructive'}>
                        {processor.isAvailable ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                        {processor.isAvailable ? 'Disponível' : 'Indisponível'}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testProcessor(processor.name)}
                      disabled={testing === processor.name}
                    >
                      {testing === processor.name ? 'Testando...' : 'Testar'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{processor.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Precisão</p>
                        <p className="text-sm font-medium">{(processor.accuracy * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Tempo Médio</p>
                        <p className="text-sm font-medium">{(processor.avgProcessingTime / 1000).toFixed(1)}s</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Custo/Doc</p>
                        <p className="text-sm font-medium">{formatCurrency(processor.costPerDocument)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Formatos</p>
                        <p className="text-sm font-medium">{processor.supportedFormats.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Especialidades:</p>
                    <div className="flex flex-wrap gap-2">
                      {processor.specialties.map((specialty, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {getSpecialtyIcon(specialty)}
                          <span className="ml-1">{specialty.replace('_', ' ')}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="testing">
          <Card>
            <CardHeader>
              <CardTitle>Teste de Processamento</CardTitle>
              <p className="text-sm text-muted-foreground">
                Teste diferentes processadores com seus próprios documentos
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="processor-select">Processador</Label>
                  <Select value={selectedProcessor} onValueChange={setSelectedProcessor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um processador" />
                    </SelectTrigger>
                    <SelectContent>
                      {processors
                        .filter(p => p.isAvailable)
                        .map((processor, index) => (
                          <SelectItem key={index} value={processor.name}>
                            {processor.name} - {formatCurrency(processor.costPerDocument)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test-file">Arquivo de Teste</Label>
                  <Input
                    id="test-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setTestFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <Button
                onClick={processTestFile}
                disabled={!testFile || !selectedProcessor || loading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {loading ? 'Processando...' : 'Processar Arquivo de Teste'}
              </Button>

              {testResults && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Resultados do Teste</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Confiança:</p>
                          <p className="text-lg font-bold text-green-600">
                            {(testResults.confidenceScore * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Processado em:</p>
                          <p className="text-sm">{new Date(testResults.processedAt).toLocaleString('pt-PT')}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">Dados Extraídos:</p>
                        <Textarea
                          value={JSON.stringify(testResults.data, null, 2)}
                          readOnly
                          rows={10}
                          className="font-mono text-xs"
                        />
                      </div>

                      {testResults.issues?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Problemas Detectados:</p>
                          <ul className="list-disc pl-5 space-y-1">
                            {testResults.issues.map((issue: string, idx: number) => (
                              <li key={idx} className="text-sm text-muted-foreground">{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de API Keys</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure suas chaves de API para processadores externos. 
                Consulte o arquivo .env.processors.example para configuração completa.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Processadores Externos Recomendados:</h4>
                  <ul className="space-y-2 text-sm">
                    <li><strong>VisionParser:</strong> Melhor para recibos e faturas (€0.01/doc)</li>
                    <li><strong>Mindee:</strong> Especialista em faturas multi-página (€0.08/doc)</li>
                    <li><strong>Klippa:</strong> Documentos financeiros complexos (€0.05/doc)</li>
                    <li><strong>Azure Form Recognizer:</strong> Solução empresarial (€0.04/doc)</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Como Configurar:</h4>
                  <ol className="list-decimal pl-5 space-y-1 text-sm">
                    <li>Copie o arquivo .env.processors.example para .env</li>
                    <li>Registre-se nos serviços desejados e obtenha as API keys</li>
                    <li>Adicione as chaves ao arquivo .env</li>
                    <li>Reinicie a aplicação</li>
                    <li>Teste os processadores nesta página</li>
                  </ol>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {processors
                    .filter(p => p.type === 'external')
                    .map((processor, index) => (
                      <Card key={index} className={processor.isAvailable ? 'border-green-200' : 'border-yellow-200'}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">{processor.name}</h5>
                            <Badge variant={processor.isAvailable ? 'default' : 'secondary'}>
                              {processor.isAvailable ? 'Configurado' : 'Pendente'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{processor.description}</p>
                          <p className="text-xs font-medium">
                            Custo: {formatCurrency(processor.costPerDocument)} por documento
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}