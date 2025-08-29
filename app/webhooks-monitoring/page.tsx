'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import WebhookAnalyticsDashboard from '@/components/webhook-analytics-dashboard'
import WebhookCredentialForm from '@/components/webhook-credential-form'
import WebhookTestingPanel from '@/components/webhook-testing-panel'
import WebhookConfigManager from '@/components/webhook-config-manager'

export default function WebhooksMonitoringPage() {
  const [selectedTab, setSelectedTab] = useState('overview')

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">Monitoramento de Webhooks</h1>

      <div className="grid gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Status dos Webhooks</CardTitle>
          </CardHeader>
          <CardContent>
            <WebhookAnalyticsDashboard />
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="activity">Atividade dos Webhooks</TabsTrigger>
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="test">Testes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Visão Geral dos Webhooks</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Visão geral do sistema de webhooks e suas integrações.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Atividade dos Webhooks</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Histórico de atividades e eventos dos webhooks.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Configuração dos Webhooks</CardTitle>
            </CardHeader>
            <CardContent>
              <WebhookConfigManager />
              <WebhookCredentialForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Testes dos Webhooks</CardTitle>
            </CardHeader>
            <CardContent>
              <WebhookTestingPanel />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}