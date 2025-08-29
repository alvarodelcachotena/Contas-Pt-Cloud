'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { MessageSquare, Mail, FolderGit2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Service {
  id: string;
  name: string;
  icon: any;
  description: string;
  fields: {
    id: string;
    label: string;
    type: string;
    placeholder: string;
    required: boolean;
  }[];
}

const services: Service[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: MessageSquare,
    description: 'Receba documentos via WhatsApp Business API',
    fields: [
      {
        id: 'apiKey',
        label: 'API Key',
        type: 'text',
        placeholder: 'Chave da API do WhatsApp Business',
        required: true,
      },
      {
        id: 'phoneNumber',
        label: 'Número de Telefone',
        type: 'text',
        placeholder: '+351912345678',
        required: true,
      },
    ],
  },
  {
    id: 'gmail',
    name: 'Gmail',
    icon: Mail,
    description: 'Monitore uma caixa de email Gmail',
    fields: [
      {
        id: 'clientId',
        label: 'Client ID',
        type: 'text',
        placeholder: 'ID do cliente OAuth',
        required: true,
      },
      {
        id: 'clientSecret',
        label: 'Client Secret',
        type: 'text',
        placeholder: 'Chave secreta do cliente OAuth',
        required: true,
      },
      {
        id: 'refreshToken',
        label: 'Refresh Token',
        type: 'text',
        placeholder: 'Token de atualização OAuth',
        required: true,
      },
    ],
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    icon: FolderGit2,
    description: 'Sincronize documentos de uma pasta Dropbox',
    fields: [
      {
        id: 'accessToken',
        label: 'Access Token',
        type: 'text',
        placeholder: 'Token de acesso do Dropbox',
        required: true,
      },
      {
        id: 'refreshToken',
        label: 'Refresh Token',
        type: 'text',
        placeholder: 'Token de atualização do Dropbox',
        required: true,
      },
      {
        id: 'folderId',
        label: 'ID da Pasta',
        type: 'text',
        placeholder: 'ID da pasta a monitorar',
        required: true,
      },
    ],
  },
]

export default function WebhookConfigManager() {
  const [selectedService, setSelectedService] = useState('whatsapp')
  const [isEnabled, setIsEnabled] = useState(false)
  const [formData, setFormData] = useState<{ [key: string]: string }>({})
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/webhooks/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: selectedService,
          enabled: isEnabled,
          config: formData,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Configuração Salva',
          description: 'Webhook configurado com sucesso',
        })
      } else {
        throw new Error('Falha ao salvar configuração')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configuração do webhook',
        variant: 'destructive',
      })
    }
  }

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value,
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuração de Webhooks</h2>
          <p className="text-muted-foreground">
            Configure os webhooks para receber documentos automaticamente
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
            id="webhook-status"
          />
          <Label htmlFor="webhook-status">
            {isEnabled ? 'Ativo' : 'Inativo'}
          </Label>
        </div>
      </div>

      <Tabs value={selectedService} onValueChange={setSelectedService} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {services.map(service => {
            const Icon = service.icon
            return (
              <TabsTrigger key={service.id} value={service.id}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {service.name}
                </div>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {services.map(service => (
          <TabsContent key={service.id} value={service.id}>
            <Card>
              <CardHeader>
                <CardTitle>{service.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {service.fields.map(field => (
                    <div key={field.id}>
                      <Label htmlFor={field.id}>{field.label}</Label>
                      <Input
                        id={field.id}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formData[field.id] || ''}
                        onChange={e => handleFieldChange(field.id, e.target.value)}
                        required={field.required}
                      />
                    </div>
                  ))}

                  <Button type="submit">
                    Salvar Configuração
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}