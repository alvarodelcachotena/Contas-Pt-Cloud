'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Settings, MessageSquare, Mail, Upload, Shield, AlertTriangle, Trash2 } from 'lucide-react'

interface WebhookCredential {
  id: string
  credential_name: string
  encrypted_value: string
  created_at?: string
  updated_at?: string
}

interface ServiceCredentials {
  [key: string]: WebhookCredential[]
}

export default function WebhookCredentials() {
  const [credentials, setCredentials] = useState<ServiceCredentials>({})
  const [loading, setLoading] = useState(false)
  const [activeService, setActiveService] = useState('whatsapp')
  const [newCredential, setNewCredential] = useState({ name: '', value: '' })
  const { toast } = useToast()

  const services = [
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, color: 'bg-green-500' },
    { id: 'gmail', name: 'Gmail', icon: Mail, color: 'bg-red-500' },
    { id: 'dropbox', name: 'Dropbox', icon: Upload, color: 'bg-blue-500' },
    { id: 'custom', name: 'Custom', icon: Settings, color: 'bg-muted' }
  ]

  const serviceFields = {
    whatsapp: [
      { name: 'access_token', label: 'Access Token', type: 'password' },
      { name: 'phone_number_id', label: 'Phone Number ID', type: 'text' },
      { name: 'verify_token', label: 'Verify Token', type: 'password' },
      { name: 'business_api_url', label: 'Business API URL', type: 'text' }
    ],
    gmail: [
      { name: 'imap_host', label: 'IMAP Host', type: 'text' },
      { name: 'imap_port', label: 'IMAP Port', type: 'text' },
      { name: 'imap_user', label: 'IMAP Username', type: 'text' },
      { name: 'imap_password', label: 'IMAP Password', type: 'password' },
      { name: 'webhook_secret', label: 'Webhook Secret', type: 'password' }
    ],
    dropbox: [
      { name: 'access_token', label: 'Access Token', type: 'password' },
      { name: 'refresh_token', label: 'Refresh Token', type: 'password' },
      { name: 'client_id', label: 'Client ID', type: 'text' },
      { name: 'client_secret', label: 'Client Secret', type: 'password' },
      { name: 'folder_path', label: 'Folder Path', type: 'text' }
    ],
    custom: []
  }

  useEffect(() => {
    loadCredentials()
  }, [])

  const loadCredentials = async () => {
    setLoading(true)
    try {
      const results = await Promise.all(
        services.map(async (service) => {
          const response = await fetch(`/api/webhooks/credentials?service=${service.id}`)
          if (response.ok) {
            const data = await response.json()
            return { service: service.id, credentials: data.credentials || [] }
          }
          return { service: service.id, credentials: [] }
        })
      )

      const credentialsMap: ServiceCredentials = {}
      results.forEach(({ service, credentials }) => {
        credentialsMap[service] = credentials
      })

      setCredentials(credentialsMap)
    } catch (error) {
      console.error('Error loading credentials:', error)
      toast({
        title: 'Erro',
        description: 'Falha ao carregar credenciais dos webhooks',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const saveCredential = async () => {
    if (!newCredential.name || !newCredential.value) {
      toast({
        title: 'Erro',
        description: 'Nome e valor da credencial são obrigatórios',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/webhooks/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_type: activeService,
          credential_name: newCredential.name,
          credential_value: newCredential.value
        })
      })

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Credencial guardada com sucesso',
        })
        setNewCredential({ name: '', value: '' })
        loadCredentials()
      } else {
        throw new Error('Failed to save credential')
      }
    } catch (error) {
      console.error('Error saving credential:', error)
      toast({
        title: 'Erro',
        description: 'Falha ao guardar credencial',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteCredential = async (credentialId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/webhooks/credentials?id=${credentialId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Credencial removida com sucesso',
        })
        loadCredentials()
      } else {
        throw new Error('Failed to delete credential')
      }
    } catch (error) {
      console.error('Error deleting credential:', error)
      toast({
        title: 'Erro',
        description: 'Falha ao remover credencial',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Shield className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Credenciais de Webhook</h2>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          As credenciais são encriptadas e armazenadas de forma segura por empresa. 
          Apenas utilizadores com permissões de administração podem geri-las.
        </AlertDescription>
      </Alert>

      <Tabs value={activeService} onValueChange={setActiveService}>
        <TabsList className="grid w-full grid-cols-4">
          {services.map((service) => (
            <TabsTrigger key={service.id} value={service.id} className="flex items-center space-x-2">
              <service.icon className="w-4 h-4" />
              <span>{service.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {services.map((service) => (
          <TabsContent key={service.id} value={service.id} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${service.color}`} />
                  <span>Configuração {service.name}</span>
                </CardTitle>
                <CardDescription>
                  Gerir credenciais para integração {service.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing credentials */}
                {credentials[service.id]?.length > 0 && (
                  <div className="space-y-2">
                    <Label>Credenciais Existentes</Label>
                    {credentials[service.id].map((credential) => (
                      <div key={credential.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <span className="font-medium">{credential.credential_name}</span>
                          <Badge variant="secondary" className="ml-2">Ativa</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCredential(credential.id)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new credential */}
                <div className="space-y-4 border-t pt-4">
                  <Label>Adicionar Nova Credencial</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="credential-name">Nome da Credencial</Label>
                      <Input
                        id="credential-name"
                        value={newCredential.name}
                        onChange={(e) => setNewCredential(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="ex: access_token"
                      />
                    </div>
                    <div>
                      <Label htmlFor="credential-value">Valor</Label>
                      <Input
                        id="credential-value"
                        type="password"
                        value={newCredential.value}
                        onChange={(e) => setNewCredential(prev => ({ ...prev, value: e.target.value }))}
                        placeholder="Valor da credencial"
                      />
                    </div>
                  </div>
                  <Button onClick={saveCredential} disabled={loading}>
                    Guardar Credencial
                  </Button>
                </div>

                {/* Quick setup for known services */}
                {serviceFields[service.id as keyof typeof serviceFields].length > 0 && (
                  <div className="space-y-4 border-t pt-4">
                    <Label>Configuração Rápida</Label>
                    <div className="text-sm text-muted-foreground mb-2">
                      Credenciais típicas para {service.name}:
                    </div>
                    <div className="grid gap-2">
                      {serviceFields[service.id as keyof typeof serviceFields].map((field) => (
                        <div key={field.name} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{field.label}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setNewCredential({ name: field.name, value: '' })}
                          >
                            Configurar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}