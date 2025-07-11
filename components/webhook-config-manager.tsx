'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { 
  MessageSquare, 
  Mail, 
  Cloud,
  Settings,
  Check,
  X,
  Save,
  RefreshCw
} from 'lucide-react'

interface WebhookConfig {
  tenantId: number
  serviceType: string
  hasCredentials: boolean
  credentialNames: string[]
  isActive: boolean
}

interface ServiceCredentials {
  [key: string]: string
}

export default function WebhookConfigManager() {
  const [configs, setConfigs] = useState<Record<string, WebhookConfig>>({})
  const [credentials, setCredentials] = useState<Record<string, ServiceCredentials>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const { toast } = useToast()

  const services = [
    {
      key: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageSquare,
      description: 'Receba faturas e documentos via WhatsApp',
      fields: [
        { name: 'access_token', label: 'Access Token', required: true },
        { name: 'phone_number_id', label: 'Phone Number ID', required: true },
        { name: 'verify_token', label: 'Verify Token', required: true },
        { name: 'business_api_url', label: 'Business API URL', required: false, default: 'https://graph.facebook.com/v17.0' }
      ]
    },
    {
      key: 'gmail',
      name: 'Gmail',
      icon: Mail,
      description: 'Processe anexos PDF do Gmail automaticamente',
      fields: [
        { name: 'imap_user', label: 'Email', required: true },
        { name: 'imap_pass', label: 'App Password', required: true },
        { name: 'imap_host', label: 'IMAP Host', required: false, default: 'imap.gmail.com' },
        { name: 'imap_port', label: 'IMAP Port', required: false, default: '993' }
      ]
    },
    {
      key: 'dropbox',
      name: 'Dropbox',
      icon: Cloud,
      description: 'Sincronize documentos da pasta Dropbox',
      fields: [
        { name: 'access_token', label: 'Access Token', required: true },
        { name: 'refresh_token', label: 'Refresh Token', required: false },
        { name: 'client_id', label: 'Client ID', required: false },
        { name: 'client_secret', label: 'Client Secret', required: false },
        { name: 'folder_path', label: 'Folder Path', required: false, default: '/input' }
      ]
    }
  ]

  const loadConfigurations = async () => {
    setLoading(true)
    try {
      const newConfigs: Record<string, WebhookConfig> = {}
      
      for (const service of services) {
        const response = await fetch(`/api/webhooks/manage?service=${service.key}`)
        if (response.ok) {
          const config = await response.json()
          newConfigs[service.key] = config
        }
      }
      
      setConfigs(newConfigs)
    } catch (error) {
      console.error('Error loading configurations:', error)
      toast({
        title: 'Erro',
        description: 'Falha ao carregar configurações',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const saveConfiguration = async (serviceKey: string) => {
    setSaving(serviceKey)
    try {
      const serviceCredentials = credentials[serviceKey] || {}
      
      // Fill in default values
      const service = services.find(s => s.key === serviceKey)
      if (service) {
        service.fields.forEach(field => {
          if (field.default && !serviceCredentials[field.name]) {
            serviceCredentials[field.name] = field.default
          }
        })
      }

      const response = await fetch('/api/webhooks/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceType: serviceKey,
          credentials: serviceCredentials
        })
      })

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: `Configuração ${serviceKey} salva com sucesso`
        })
        await loadConfigurations()
      } else {
        throw new Error('Failed to save configuration')
      }
    } catch (error) {
      console.error('Error saving configuration:', error)
      toast({
        title: 'Erro',
        description: 'Falha ao salvar configuração',
        variant: 'destructive'
      })
    } finally {
      setSaving(null)
    }
  }

  const handleCredentialChange = (serviceKey: string, fieldName: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [serviceKey]: {
        ...prev[serviceKey],
        [fieldName]: value
      }
    }))
  }

  useEffect(() => {
    loadConfigurations()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando configurações...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Configurações de Webhook</h1>
        <p className="text-gray-600">
          Configure as integrações para receber documentos automaticamente de diferentes fontes
        </p>
      </div>

      <Tabs defaultValue="whatsapp" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {services.map(service => {
            const Icon = service.icon
            const config = configs[service.key]
            return (
              <TabsTrigger key={service.key} value={service.key} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {service.name}
                {config?.hasCredentials && (
                  <Badge variant="secondary" className="ml-1">
                    <Check className="h-3 w-3" />
                  </Badge>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {services.map(service => {
          const Icon = service.icon
          const config = configs[service.key]
          
          return (
            <TabsContent key={service.key} value={service.key}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {service.name}
                    {config?.hasCredentials ? (
                      <Badge variant="secondary" className="ml-2">
                        <Check className="h-3 w-3 mr-1" />
                        Configurado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="ml-2">
                        <X className="h-3 w-3 mr-1" />
                        Não configurado
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {config?.hasCredentials && (
                    <Alert>
                      <Settings className="h-4 w-4" />
                      <AlertDescription>
                        Este serviço está configurado e ativo. Tenant ID: {config.tenantId}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.fields.map(field => (
                      <div key={field.name} className="space-y-2">
                        <Label htmlFor={`${service.key}-${field.name}`}>
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Input
                          id={`${service.key}-${field.name}`}
                          type={field.name.includes('password') || field.name.includes('token') || field.name.includes('secret') ? 'password' : 'text'}
                          placeholder={field.default || `Enter ${field.label.toLowerCase()}`}
                          value={credentials[service.key]?.[field.name] || ''}
                          onChange={(e) => handleCredentialChange(service.key, field.name, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={() => saveConfiguration(service.key)}
                      disabled={saving === service.key}
                    >
                      {saving === service.key ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Salvar Configuração
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Status das Integrações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {services.map(service => {
                const Icon = service.icon
                const config = configs[service.key]
                
                return (
                  <div key={service.key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <div>
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-gray-500">
                          {config?.hasCredentials ? 'Ativo' : 'Inativo'}
                        </div>
                      </div>
                    </div>
                    {config?.hasCredentials ? (
                      <Badge variant="secondary">
                        <Check className="h-3 w-3" />
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <X className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}