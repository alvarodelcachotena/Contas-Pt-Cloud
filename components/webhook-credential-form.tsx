'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// Textarea component not available, using Input instead
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  MessageSquare, 
  Mail, 
  Cloud,
  Save,
  Eye,
  EyeOff,
  Key,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface CredentialField {
  name: string
  label: string
  type: 'text' | 'password' | 'textarea' | 'url'
  required: boolean
  placeholder: string
  description?: string
}

interface ServiceConfig {
  name: string
  icon: any
  description: string
  fields: CredentialField[]
  testEndpoint: string
}

const serviceConfigs: Record<string, ServiceConfig> = {
  whatsapp: {
    name: 'WhatsApp Business',
    icon: MessageSquare,
    description: 'WhatsApp Business API para receber faturas via mensagens',
    testEndpoint: 'https://graph.facebook.com/v17.0/',
    fields: [
      {
        name: 'access_token',
        label: 'Access Token',
        type: 'password',
        required: true,
        placeholder: 'EAAxxxxxxxxxxxxxxx',
        description: 'Token de acesso da WhatsApp Business API'
      },
      {
        name: 'phone_number_id',
        label: 'Phone Number ID',
        type: 'text',
        required: true,
        placeholder: '123456789012345',
        description: 'ID do número de telefone WhatsApp Business'
      },
      {
        name: 'verify_token',
        label: 'Verify Token',
        type: 'password',
        required: true,
        placeholder: 'webhook_verify_token_123',
        description: 'Token de verificação do webhook'
      },
      {
        name: 'business_api_url',
        label: 'API URL',
        type: 'url',
        required: false,
        placeholder: 'https://graph.facebook.com/v17.0',
        description: 'URL da API (opcional, usa padrão se vazio)'
      }
    ]
  },
  gmail: {
    name: 'Gmail',
    icon: Mail,
    description: 'Gmail IMAP para processar anexos PDF automaticamente',
    testEndpoint: 'imap.gmail.com',
    fields: [
      {
        name: 'imap_user',
        label: 'Email',
        type: 'text',
        required: true,
        placeholder: 'seu.email@gmail.com',
        description: 'Endereço de email Gmail'
      },
      {
        name: 'imap_pass',
        label: 'App Password',
        type: 'password',
        required: true,
        placeholder: 'abcd efgh ijkl mnop',
        description: 'Password de app Gmail (não a senha normal)'
      },
      {
        name: 'imap_host',
        label: 'IMAP Host',
        type: 'text',
        required: false,
        placeholder: 'imap.gmail.com',
        description: 'Servidor IMAP (padrão: imap.gmail.com)'
      },
      {
        name: 'imap_port',
        label: 'IMAP Port',
        type: 'text',
        required: false,
        placeholder: '993',
        description: 'Porta IMAP (padrão: 993)'
      }
    ]
  },
  dropbox: {
    name: 'Dropbox',
    icon: Cloud,
    description: 'Dropbox para sincronização automática de documentos',
    testEndpoint: 'https://api.dropboxapi.com/2/users/get_current_account',
    fields: [
      {
        name: 'access_token',
        label: 'Access Token',
        type: 'password',
        required: true,
        placeholder: 'sl.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        description: 'Token de acesso Dropbox (obtido na App Console)'
      },
      {
        name: 'folder_path',
        label: 'Pasta de Monitoramento',
        type: 'text',
        required: true,
        placeholder: '/input',
        description: 'Pasta no Dropbox para monitorar (ex: /input, /documentos)'
      },
      {
        name: 'webhook_secret',
        label: 'Webhook Secret',
        type: 'password',
        required: false,
        placeholder: 'webhook_secret_123',
        description: 'Segredo para validar webhooks (opcional)'
      }
    ]
  }
}

export default function WebhookCredentialForm() {
  const [selectedService, setSelectedService] = useState<string>('')
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const { toast } = useToast()

  const handleServiceChange = (service: string) => {
    setSelectedService(service)
    setCredentials({})
    setShowPasswords({})
  }

  const handleCredentialChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const validateCredentials = (): boolean => {
    if (!selectedService) {
      toast({
        title: 'Erro',
        description: 'Selecione um serviço primeiro',
        variant: 'destructive'
      })
      return false
    }

    const config = serviceConfigs[selectedService]
    const requiredFields = config.fields.filter(f => f.required)
    
    for (const field of requiredFields) {
      if (!credentials[field.name]?.trim()) {
        toast({
          title: 'Campo Obrigatório',
          description: `O campo "${field.label}" é obrigatório`,
          variant: 'destructive'
        })
        return false
      }
    }

    return true
  }

  const saveCredentials = async () => {
    if (!validateCredentials()) return

    setSaving(true)
    try {
      const response = await fetch('/api/webhooks/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceType: selectedService,
          credentials
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Sucesso',
          description: `Credenciais do ${serviceConfigs[selectedService].name} salvas com sucesso`,
        })
        
        // Clear sensitive data from memory
        setCredentials({})
      } else {
        toast({
          title: 'Erro',
          description: data.error || 'Falha ao salvar credenciais',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao salvar credenciais',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    if (!validateCredentials()) return

    setTesting(true)
    try {
      // First save the credentials
      await fetch('/api/webhooks/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceType: selectedService,
          credentials
        })
      })

      // Then test the connection
      const response = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          service: selectedService, 
          testType: 'connection' 
        })
      })

      const data = await response.json()

      if (data.success && data.testResults) {
        const result = data.testResults.results
        
        if (result.connectionTest) {
          toast({
            title: 'Conexão Bem-sucedida',
            description: `${serviceConfigs[selectedService].name} conectado com sucesso`,
          })
        } else if (result.credentialsFound) {
          toast({
            title: 'Credenciais Salvas',
            description: 'Credenciais salvas mas a conexão falhou. Verifique os dados.',
            variant: 'destructive'
          })
        } else {
          toast({
            title: 'Teste Falhou',
            description: 'Falha na conexão. Verifique as credenciais.',
            variant: 'destructive'
          })
        }
      } else {
        toast({
          title: 'Teste Falhou',
          description: data.error || 'Erro no teste de conexão',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Test error:', error)
      toast({
        title: 'Erro de Teste',
        description: 'Erro ao testar conexão',
        variant: 'destructive'
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Service Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <span>Configurar Credenciais de Webhook</span>
          </CardTitle>
          <CardDescription>
            Configure as credenciais para conectar os serviços de webhook
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service">Selecionar Serviço</Label>
              <Select value={selectedService} onValueChange={handleServiceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um serviço para configurar" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(serviceConfigs).map(([key, config]) => {
                    const ServiceIcon = config.icon
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center space-x-2">
                          <ServiceIcon className="w-4 h-4" />
                          <span>{config.name}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedService && (
              <div className="p-4 rounded-lg border bg-muted/50">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Sobre este serviço</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {serviceConfigs[selectedService].description}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Credential Fields */}
      {selectedService && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {(() => {
                const ServiceIcon = serviceConfigs[selectedService].icon
                return <ServiceIcon className="w-5 h-5" />
              })()}
              <span>Credenciais do {serviceConfigs[selectedService].name}</span>
            </CardTitle>
            <CardDescription>
              Preencha as credenciais necessárias para conectar ao serviço
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {serviceConfigs[selectedService].fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor={field.name}>{field.label}</Label>
                  {field.required && (
                    <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                  )}
                </div>
                
                <div className="relative">
                  {field.type === 'textarea' ? (
                    <Input
                      id={field.name}
                      placeholder={field.placeholder}
                      value={credentials[field.name] || ''}
                      onChange={(e) => handleCredentialChange(field.name, e.target.value)}
                      className="min-h-[80px]"
                    />
                  ) : (
                    <div className="relative">
                      <Input
                        id={field.name}
                        type={field.type === 'password' && !showPasswords[field.name] ? 'password' : 'text'}
                        placeholder={field.placeholder}
                        value={credentials[field.name] || ''}
                        onChange={(e) => handleCredentialChange(field.name, e.target.value)}
                        className={field.type === 'password' ? 'pr-10' : ''}
                      />
                      {field.type === 'password' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility(field.name)}
                        >
                          {showPasswords[field.name] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                
                {field.description && (
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                )}
              </div>
            ))}

            <div className="flex space-x-4 pt-4">
              <Button onClick={saveCredentials} disabled={saving} className="flex-1">
                {saving ? (
                  <>Salvando...</>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Credenciais
                  </>
                )}
              </Button>
              
              <Button 
                onClick={testConnection} 
                disabled={testing || saving}
                variant="outline"
                className="flex-1"
              >
                {testing ? (
                  <>Testando...</>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Salvar e Testar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}