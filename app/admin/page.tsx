'use client'

import { useState } from 'react'
import { useLanguage } from '@/hooks/useLanguage';
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import WebhookCredentials from "@/components/WebhookCredentials"
import WebhookConfigManager from "@/components/webhook-config-manager"
import WebhookTestingPanel from "@/components/webhook-testing-panel"
import WebhookAnalyticsDashboard from "@/components/webhook-analytics-dashboard"
import WebhookCredentialForm from "@/components/webhook-credential-form"
import ProcessorManagement from "@/components/processor-management"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Building2,
  Database,
  Activity,
  Settings,
  User,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  HardDrive,
  FileText,
  Webhook,
  BarChart3,
  Cpu
} from 'lucide-react'

export default function AdminPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview')

  const systemStats = {
    totalUsers: 156,
    activeUsers: 142,
    totalCompanies: 45,
    activeCompanies: 40,
    totalDocuments: 2340,
    totalStorage: 12.5,
    systemHealth: 'healthy',
    lastBackup: '2025-01-15T02:30:00'
  }

  const users = [
    {
      id: 1,
      name: 'João Silva',
      email: 'joao@exemplo.com',
      role: 'admin',
      company: 'Empresa ABC',
      status: 'active',
      lastLogin: '2025-01-15T10:30:00'
    },
    {
      id: 2,
      name: 'Maria Santos',
      email: 'maria@exemplo.com',
      role: 'user',
      company: 'Consultoria XYZ',
      status: 'active',
      lastLogin: '2025-01-14T16:45:00'
    },
    {
      id: 3,
      name: 'Carlos Oliveira',
      email: 'carlos@exemplo.com',
      role: 'user',
      company: 'Tech Solutions',
      status: 'inactive',
      lastLogin: '2025-01-10T09:15:00'
    }
  ]

  const companies = [
    {
      id: 1,
      name: 'Empresa ABC Lda',
      nif: '123456789',
      users: 12,
      documents: 456,
      storage: 2.3,
      status: 'active',
      createdAt: '2024-03-15'
    },
    {
      id: 2,
      name: 'Consultoria XYZ',
      nif: '987654321',
      users: 8,
      documents: 234,
      storage: 1.8,
      status: 'active',
      createdAt: '2024-05-20'
    },
    {
      id: 3,
      name: 'Tech Solutions',
      nif: '555666777',
      users: 5,
      documents: 123,
      storage: 0.9,
      status: 'suspended',
      createdAt: '2024-08-10'
    }
  ]

  const systemLogs = [
    {
      id: 1,
      type: 'info',
      message: 'Sistema iniciado com sucesso',
      timestamp: '2025-01-15T09:00:00',
      user: 'Sistema'
    },
    {
      id: 2,
      type: 'warning',
      message: 'Espaço de armazenamento baixo (80%)',
      timestamp: '2025-01-15T08:30:00',
      user: 'Sistema'
    },
    {
      id: 3,
      type: 'error',
      message: 'Falha no processamento do documento ID:12345',
      timestamp: '2025-01-15T08:15:00',
      user: 'maria@exemplo.com'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'suspended':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'text-blue-600'
      case 'warning':
        return 'text-yellow-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-muted-foreground'
    }
  }

  const getLogTypeIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <CheckCircle className="w-4 h-4" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />
      case 'error':
        return <XCircle className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
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
                <h1 className="text-2xl font-bold text-foreground">{t.admin.title}</h1>
                <p className="text-muted-foreground">{t.admin.subtitle}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  {t.admin.actions.exportData}
                </Button>
                <Button size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  {t.admin.actions.systemBackup}
                </Button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 bg-muted rounded-lg p-1 overflow-x-auto">
              <Button
                variant={activeTab === 'overview' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('overview')}
              >
                {t.admin.tabs.overview}
              </Button>
              <Button
                variant={activeTab === 'users' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('users')}
              >
                {t.admin.tabs.users}
              </Button>
              <Button
                variant={activeTab === 'companies' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('companies')}
              >
                {t.admin.tabs.companies}
              </Button>
              <Button
                variant={activeTab === 'system' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('system')}
              >
                {t.admin.tabs.system}
              </Button>
              <Button
                variant={activeTab === 'logs' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('logs')}
              >
                {t.admin.tabs.logs}
              </Button>
              <Button
                variant={activeTab === 'webhooks' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('webhooks')}
              >
                {t.admin.tabs.webhooks}
              </Button>
              <Button
                variant={activeTab === 'processors' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('processors')}
              >
                <Cpu className="w-4 h-4 mr-1" />
                {t.admin.tabs.processors}
              </Button>
              <Button
                variant={activeTab === 'settings' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('settings')}
              >
                {t.admin.tabs.settings}
              </Button>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t.admin.metrics.totalUsers}
                      </CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{systemStats.totalUsers}</div>
                      <p className="text-xs text-muted-foreground">
                        {systemStats.activeUsers} {t.admin.metrics.active}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t.admin.metrics.totalCompanies}
                      </CardTitle>
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{systemStats.totalCompanies}</div>
                      <p className="text-xs text-muted-foreground">
                        {systemStats.activeCompanies} {t.admin.metrics.active}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t.admin.metrics.totalDocuments}
                      </CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{systemStats.totalDocuments}</div>
                      <p className="text-xs text-muted-foreground">
                        {t.admin.metrics.processed}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t.admin.metrics.storage}
                      </CardTitle>
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{systemStats.totalStorage} GB</div>
                      <p className="text-xs text-muted-foreground">
                        {t.admin.metrics.used}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Activity className="w-5 h-5" />
                        <span>{t.admin.systemStatus.title}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t.admin.systemStatus.systemHealth}</span>
                        <Badge variant="default">
                          {systemStats.systemHealth === 'healthy' ? t.admin.systemStatus.healthy : t.admin.systemStatus.problems}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t.admin.systemStatus.lastBackup}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(systemStats.lastBackup).toLocaleString('pt-PT')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Settings className="w-5 h-5" />
                        <span>{t.admin.quickActions.title}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Plus className="w-4 h-4 mr-2" />
                        {t.admin.quickActions.createUser}
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Building2 className="w-4 h-4 mr-2" />
                        {t.admin.quickActions.addCompany}
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Database className="w-4 h-4 mr-2" />
                        {t.admin.quickActions.backup}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>{t.admin.users.title}</span>
                  </CardTitle>
                  <CardDescription>
                    {t.admin.users.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <Input placeholder={t.admin.users.searchPlaceholder} className="max-w-sm" />
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      {t.admin.users.newUser}
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t.admin.users.table.user}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t.admin.users.table.company}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t.admin.users.table.role}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t.admin.users.table.status}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t.admin.users.table.lastAccess}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t.admin.users.table.actions}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {users.map((user) => (
                          <tr key={user.id} className="border-b hover:bg-muted/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-primary" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-foreground">
                                    {user.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-foreground">{user.company}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                {user.role}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={getStatusColor(user.status)}>
                                {user.status === 'active' ? t.admin.users.status.active : t.admin.users.status.inactive}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-muted-foreground">
                                {new Date(user.lastLogin).toLocaleString('pt-PT')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'companies' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5" />
                    <span>{t.admin.companies.title}</span>
                  </CardTitle>
                  <CardDescription>
                    {t.admin.companies.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <Input placeholder={t.admin.companies.searchPlaceholder} className="max-w-sm" />
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      {t.admin.companies.newCompany}
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t.admin.companies.table.company}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t.admin.companies.table.users}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t.admin.companies.table.documents}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t.admin.companies.table.storage}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t.admin.companies.table.status}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {companies.map((company) => (
                          <tr key={company.id} className="border-b hover:bg-muted/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                  <Building2 className="w-5 h-5 text-primary" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-foreground">
                                    {company.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    NIF: {company.nif}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-foreground">{company.users}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-foreground">{company.documents}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-foreground">{company.storage} GB</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={getStatusColor(company.status)}>
                                {company.status === 'active' ? 'Ativa' :
                                  company.status === 'suspended' ? 'Suspensa' : 'Inativa'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'logs' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Logs do Sistema</span>
                  </CardTitle>
                  <CardDescription>
                    Histórico de atividades e eventos do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {systemLogs.map((log) => (
                      <div key={log.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                        <div className={`mt-1 ${getLogTypeColor(log.type)}`}>
                          {getLogTypeIcon(log.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground">
                              {log.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleString('pt-PT')}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Por: {log.user}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'webhooks' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Gestão de Webhooks</h2>
                    <p className="text-muted-foreground">Configure integrações de webhook para WhatsApp, Gmail e Dropbox</p>
                  </div>
                </div>

                {/* Webhook Testing Panel */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Webhook className="w-5 h-5" />
                      <span>Teste e Monitoramento</span>
                    </CardTitle>
                    <CardDescription>
                      Teste a conectividade e monitore a atividade dos webhooks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <WebhookTestingPanel />
                  </CardContent>
                </Card>

                {/* Webhook Credential Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="w-5 h-5" />
                      <span>Configuração de Credenciais</span>
                    </CardTitle>
                    <CardDescription>
                      Configure credenciais dos webhooks diretamente no banco de dados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <WebhookCredentialForm />
                  </CardContent>
                </Card>

                {/* Webhook Configuration Manager */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="w-5 h-5" />
                      <span>Gestão Avançada</span>
                    </CardTitle>
                    <CardDescription>
                      Configurações avançadas e gestão de webhooks existentes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <WebhookConfigManager />
                  </CardContent>
                </Card>

                {/* Webhook Analytics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5" />
                      <span>Análises e Relatórios</span>
                    </CardTitle>
                    <CardDescription>
                      Análises detalhadas de performance e uso dos webhooks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <WebhookAnalyticsDashboard />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'processors' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Cpu className="w-5 h-5" />
                    <span>Gestão de Processadores de Documentos</span>
                  </CardTitle>
                  <CardDescription>
                    Configure e teste processadores externos para melhorar a precisão da extração
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProcessorManagement />
                </CardContent>
              </Card>
            )}

            {activeTab === 'settings' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Configurações do Sistema</span>
                  </CardTitle>
                  <CardDescription>
                    Configurações avançadas do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Configurações Gerais</h3>
                        <p className="text-sm text-muted-foreground">
                          Gerir configurações do sistema e preferências
                        </p>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Configurações de Sistema</h4>
                      <p className="text-sm text-muted-foreground">
                        Configurações avançadas disponíveis em versões futuras.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}