'use client'

import { useState, useEffect } from "react"
import { useLanguage } from '@/hooks/useLanguage';
import { useBrowserExtensionCleanup } from "@/components/hydration-boundary"

interface CloudIntegration {
  id: string
  provider: string
  provider_user_id: string
  user_email: string
  access_token?: string
  refresh_token?: string
  status: string
  created_at: string
  updated_at: string
  folder_path?: string
}
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import DropboxFolderSelector from "@/components/dropbox-folder-selector"
import DropboxManager from "@/components/dropbox-manager"
import {
  Cloud,
  Plus,
  Search,
  Settings,
  Folder,
  File,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  X,
  CheckCircle,
  Play,
  FolderOpen
} from "lucide-react"

export default function CloudDrivesPage() {
  const { t } = useLanguage();
  // Clean up browser extension attributes to prevent hydration mismatches
  useBrowserExtensionCleanup()

  const [searchTerm, setSearchTerm] = useState('')
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'completed' | 'error'>('completed')
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [integrations, setIntegrations] = useState<CloudIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [showFolderSelector, setShowFolderSelector] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<CloudIntegration | null>(null)
  const [testResults, setTestResults] = useState<any>(null)
  const [showDropboxManager, setShowDropboxManager] = useState(false)
  const [activeDropboxIntegration, setActiveDropboxIntegration] = useState<CloudIntegration | null>(null)

  // Carregar integrações ao montar o componente
  useEffect(() => {
    loadIntegrations()
    checkUrlParams()
  }, [])

  // Auto-activate Dropbox manager when Dropbox integration is available
  useEffect(() => {
    const dropboxIntegration = integrations.find(integration =>
      integration.provider === 'dropbox' &&
      integration.status === 'connected' &&
      integration.access_token
    )

    if (dropboxIntegration && !activeDropboxIntegration) {
      setActiveDropboxIntegration(dropboxIntegration)
    } else if (!dropboxIntegration && activeDropboxIntegration) {
      setActiveDropboxIntegration(null)
    }
  }, [integrations, activeDropboxIntegration])

  const checkUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')

    if (success) {
      const messages = {
        'dropbox_connected': t.cloudDrives.messages.dropboxConnected,
        'googledrive_connected': t.cloudDrives.messages.googleDriveConnected,
        'onedrive_connected': t.cloudDrives.messages.oneDriveConnected
      }
      setNotification({
        type: 'success',
        message: messages[success as keyof typeof messages] || t.cloudDrives.messages.connectionSuccessful
      })
      // Limpar URL
      window.history.replaceState({}, '', '/cloud-drives')
      // Recarregar integrações
      loadIntegrations()
    }

    if (error) {
      const messages = {
        'auth_failed': t.cloudDrives.errors.authFailed,
        'token_failed': t.cloudDrives.errors.tokenFailed,
        'user_failed': t.cloudDrives.errors.userFailed,
        'save_failed': t.cloudDrives.errors.saveFailed,
        'callback_failed': t.cloudDrives.errors.callbackFailed,
        'config_missing': t.cloudDrives.errors.configMissing,
        'token_exchange_failed': t.cloudDrives.errors.tokenExchangeFailed
      }
      setNotification({
        type: 'error',
        message: messages[error as keyof typeof messages] || t.cloudDrives.errors.connectionError
      })
      // Limpar URL
      window.history.replaceState({}, '', '/cloud-drives')
    }
  }

  const loadIntegrations = async () => {
    try {
      const response = await fetch('/api/cloud-integrations')

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()
      console.log('Dados recebidos da API:', data)

      if (data.integrations && Array.isArray(data.integrations)) {
        // Validar cada integração antes de definir
        const validIntegrations = data.integrations.filter((integration: any) =>
          integration &&
          integration.id &&
          integration.provider &&
          integration.user_email &&
          integration.status
        )

        console.log('Integrações válidas:', validIntegrations)
        setIntegrations(validIntegrations)
      } else {
        console.log('Não foram encontradas integrações válidas')
        setIntegrations([])
      }
    } catch (error) {
      console.error('Erro ao carregar integrações:', error)
      setNotification({
        type: 'error',
        message: t.cloudDrives.errors.loadingError
      })
      setIntegrations([])
    } finally {
      setLoading(false)
    }
  }

  const handleManualSync = () => {
    setSyncStatus('syncing')
    // Simulate sync process
    setTimeout(() => {
      setSyncStatus('completed')
    }, 3000)
  }

  const handleConnectProvider = (provider: string) => {
    if (provider === 'dropbox') {
      handleDropboxAuth()
    } else {
      window.location.href = `/api/auth/${provider}?action=connect`
    }
  }

  const handleDropboxAuth = () => {
    // Redirect to the same tab instead of opening a popup
    window.location.href = `/api/auth/dropbox?action=connect`
  }

  const handleDisconnectProvider = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/cloud-integrations?id=${integrationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setNotification({
          type: 'success',
          message: t.cloudDrives.messages.disconnectSuccess
        })
        loadIntegrations()
      } else {
        throw new Error('Erro ao desconectar fornecedor')
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: t.cloudDrives.errors.disconnectError
      })
    }
  }

  const dismissNotification = () => {
    setNotification(null)
  }

  const checkDropboxConfig = async () => {
    try {
      const response = await fetch('/api/check-dropbox-config')
      const result = await response.json()

      if (result.success) {
        const { config } = result
        let message = 'Configuración de Dropbox:\n'
        message += `• CLIENT_ID: ${config.hasClientId ? '✅ Configurado' : '❌ No configurado'}\n`
        message += `• CLIENT_SECRET: ${config.hasClientSecret ? '✅ Configurado' : '❌ No configurado'}\n`

        if (config.hasClientId) {
          message += `• CLIENT_ID Preview: ${config.clientIdPreview}\n`
        }

        if (config.hasClientSecret) {
          message += `• CLIENT_SECRET Preview: ${config.clientSecretPreview}\n`
        }

        setNotification({
          type: config.hasClientId && config.hasClientSecret ? 'success' : 'error',
          message: message
        })
      } else {
        setNotification({
          type: 'error',
          message: 'Error verificando configuración: ' + result.error
        })
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Error verificando configuración de Dropbox'
      })
    }
  }

  const testCloudIntegrationsAPI = async () => {
    try {
      const response = await fetch('/api/test-cloud-integrations-api')
      const result = await response.json()

      if (result.success) {
        const { summary, data } = result
        let message = 'Test API Cloud Integrations:\n'
        message += `• Status API: ${result.apiStatus}\n`
        message += `• API OK: ${result.apiOk ? '✅' : '❌'}\n`
        message += `• Tiene integraciones: ${summary.hasIntegrations ? '✅' : '❌'}\n`
        message += `• Cantidad: ${summary.integrationsCount}\n`
        message += `• Tiene error: ${summary.hasError ? '❌' : '✅'}\n`

        if (summary.hasError) {
          message += `• Error: ${summary.error}\n`
        }

        if (data.integrations && data.integrations.length > 0) {
          message += `\nPrimera integración:\n`
          message += `• ID: ${data.integrations[0].id}\n`
          message += `• Provider: ${data.integrations[0].provider}\n`
          message += `• Status: ${data.integrations[0].status}\n`
        }

        setNotification({
          type: summary.hasIntegrations ? 'success' : 'error',
          message: message
        })
      } else {
        setNotification({
          type: 'error',
          message: 'Error en test API: ' + result.error
        })
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Error ejecutando test API'
      })
    }
  }

  const debugCloudIntegrations = async () => {
    try {
      const response = await fetch('/api/debug-cloud-integrations')
      const result = await response.json()

      if (result.success) {
        const { debug } = result
        let message = 'Debug Cloud Integrations:\n'
        message += `• Tenant ID usado: ${debug.tenantId}\n`
        message += `• Total configuraciones: ${debug.summary.totalConfigs}\n`
        message += `• Configuraciones activas: ${debug.summary.activeConfigs}\n`
        message += `• Tenants disponibles: ${debug.summary.tenantsCount}\n\n`

        if (debug.allConfigs.length > 0) {
          message += 'Configuraciones encontradas:\n'
          debug.allConfigs.forEach((config: any, index: number) => {
            message += `${index + 1}. ${config.provider} (Tenant: ${config.tenant_id}, Activo: ${config.is_active})\n`
          })
        }

        setNotification({
          type: 'success',
          message: message
        })
      } else {
        setNotification({
          type: 'error',
          message: 'Error en debug: ' + result.error
        })
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Error ejecutando debug'
      })
    }
  }

  const testNetlifyDropbox = async () => {
    try {
      const response = await fetch('/api/test-netlify-dropbox')
      const result = await response.json()

      if (result.success) {
        const { config } = result
        let message = 'Configuración de Dropbox en Netlify:\n'
        message += `• CLIENT_ID: ${config.hasClientId ? '✅ Configurado' : '❌ No configurado'}\n`
        message += `• SERVICE_ROLE_KEY: ${config.hasClientSecret ? '✅ Configurado' : '❌ No configurado'}\n`
        message += `• Entorno: ${config.environment}\n`
        message += `• Es Netlify: ${config.isNetlify ? '✅ Sí' : '❌ No'}\n`
        message += `• URL Netlify: ${config.netlifyUrl}\n`

        setNotification({
          type: 'success',
          message: message
        })
      } else {
        setNotification({
          type: 'error',
          message: 'Error verificando configuración en Netlify: ' + result.error
        })
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Error verificando configuración en Netlify'
      })
    }
  }

  const checkDropboxRedirectUri = async () => {
    try {
      const response = await fetch('/api/dropbox-redirect-uri')
      const result = await response.json()

      if (result.success) {
        setNotification({
          type: 'success',
          message: `URL de redirección: ${result.redirectUri}\n\nCopia esta URL y añádela en tu aplicación de Dropbox en:\nhttps://www.dropbox.com/developers/apps`
        })
      } else {
        setNotification({
          type: 'error',
          message: 'Error obteniendo URL de redirección: ' + result.error
        })
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Error obteniendo URL de redirección'
      })
    }
  }

  const openDropboxManager = (integration: CloudIntegration) => {
    if (integration.provider === 'dropbox' && integration.access_token) {
      setSelectedIntegration(integration)
      setActiveDropboxIntegration(integration)
      setShowDropboxManager(true)
    }
  }

  const closeDropboxManager = () => {
    setActiveDropboxIntegration(null)
    setShowDropboxManager(false)
  }

  const handleTestProcessing = async (integration: CloudIntegration) => {
    try {
      console.log('🧪 Testing document processing for integration:', integration.id)

      const response = await fetch('/api/dropbox/test-processing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integrationId: integration.id
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setTestResults(result)
        setNotification({
          type: 'success',
          message: `Teste concluído: ${result.files.documents} documentos encontrados`
        })
      } else {
        setNotification({
          type: 'error',
          message: `Erro no teste: ${result.error}`
        })
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Erro ao testar o processamento de documentos'
      })
    }
  }

  const handleSelectFolder = (integration: CloudIntegration) => {
    setSelectedIntegration(integration)
    setShowFolderSelector(true)
  }

  const handleFolderSelected = async (folderPath: string) => {
    if (!selectedIntegration) return

    try {
      // Update the integration with the new folder path
      const response = await fetch('/api/cloud-integrations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedIntegration.id,
          folder_path: folderPath
        }),
      })

      if (response.ok) {
        setNotification({
          type: 'success',
          message: `Pasta atualizada para: ${folderPath}`
        })
        loadIntegrations()
      } else {
        throw new Error('Erro ao atualizar pasta')
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Erro ao atualizar a pasta selecionada'
      })
    } finally {
      setShowFolderSelector(false)
      setSelectedIntegration(null)
    }
  }

  // Mapear integraciones a formato esperado
  const cloudDrives = integrations
    .filter(integration => integration && integration.provider && integration.user_email)
    .map(integration => {
      try {
        const providerName = integration.provider.charAt(0).toUpperCase() + integration.provider.slice(1)
        return {
          id: integration.id,
          name: `${providerName} - ${integration.user_email}`,
          type: integration.provider,
          status: integration.status || 'unknown',
          lastSync: integration.updated_at || new Date().toISOString(),
          filesCount: 247, // Simulado por ahora
          folderPath: integration.provider === 'dropbox' ? '/Documentos' :
            integration.provider === 'googledrive' ? '/Contabilidade' : '/Empresa',
          userEmail: integration.user_email,
          integrationId: integration.id
        }
      } catch (error) {
        console.error('Erro ao mapear integração:', integration, error)
        // Retornar um objeto padrão em caso de erro
        return {
          id: integration.id || 'unknown',
          name: 'Erro - Integração inválida',
          type: integration.provider || 'unknown',
          status: 'error',
          lastSync: new Date().toISOString(),
          filesCount: 0,
          folderPath: '/Erro',
          userEmail: integration.user_email || 'unknown@example.com',
          integrationId: integration.id || 'unknown'
        }
      }
    })




  return (
    <div className="flex h-screen bg-background" suppressHydrationWarning>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t.cloudDrives.title}</h1>
                <p className="text-gray-600 mt-1">{t.cloudDrives.subtitle}</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  className="flex items-center space-x-2"
                  onClick={() => setShowConnectModal(true)}
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.cloudDrives.connectDrive}</span>
                </Button>
              </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t.cloudDrives.metrics.connectedDrives}</h3>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {cloudDrives.filter(d => d.status === 'connected').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Cloud className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t.cloudDrives.metrics.totalFiles}</h3>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {cloudDrives.reduce((sum, drive) => sum + drive.filesCount, 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <File className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t.cloudDrives.metrics.processedToday}</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">24</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Upload className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t.cloudDrives.metrics.pending}</h3>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">3</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Connected Drives or Dropbox Manager */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              {activeDropboxIntegration ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">{t.cloudDrives.dropboxManager.title}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-green-100 text-green-800">
                        {t.cloudDrives.status.connected}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={closeDropboxManager}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <X className="w-4 h-4 mr-1" />
                        {t.cloudDrives.actions.close}
                      </Button>
                    </div>
                  </div>
                  <DropboxManager
                    accessToken={activeDropboxIntegration.access_token!}
                    refreshToken={activeDropboxIntegration.refresh_token}
                  />
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-foreground mb-4">{t.cloudDrives.dropboxManager.title}</h3>
                  {loading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">{t.cloudDrives.loading}</p>
                    </div>
                  ) : cloudDrives.length === 0 ? (
                    <div className="text-center py-8">
                      <Cloud className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">{t.cloudDrives.emptyState.title}</h4>
                      <p className="text-gray-500 mb-4">{t.cloudDrives.emptyState.description}</p>
                      <Button
                        onClick={() => setShowConnectModal(true)}
                        className="flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{t.cloudDrives.connectDrive}</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cloudDrives.map((drive) => (
                        <div key={drive.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Cloud className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium">{drive.name}</div>
                              <div className="text-sm text-gray-500">{drive.folderPath}</div>
                              <div className="text-xs text-gray-400">
                                Última sincronização: {new Date(drive.lastSync).toLocaleString('pt-PT')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <Badge className={
                                drive.status === 'connected' ? 'bg-green-100 text-green-800' :
                                  drive.status === 'error' ? 'bg-red-100 text-red-800' :
                                    drive.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                              }>
                                {drive.status === 'connected' ? t.cloudDrives.status.connected :
                                  drive.status === 'error' ? t.cloudDrives.status.error :
                                    drive.status === 'pending' ? t.cloudDrives.status.pending :
                                      t.cloudDrives.status.unknown}
                              </Badge>
                              <div className="text-sm text-gray-500 mt-1">{drive.filesCount} arquivos</div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTestProcessing(integrations.find(i => i.id === drive.integrationId)!)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex items-center space-x-1"
                              >
                                <Play className="w-4 h-4" />
                                <span>{t.cloudDrives.actions.test}</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelectFolder(integrations.find(i => i.id === drive.integrationId)!)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 flex items-center space-x-1"
                              >
                                <FolderOpen className="w-4 h-4" />
                                <span>{t.cloudDrives.actions.folder}</span>
                              </Button>
                              {drive.name.toLowerCase().includes('dropbox') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDropboxManager(integrations.find(i => i.id === drive.integrationId)!)}
                                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 flex items-center space-x-1"
                                >
                                  <Settings className="w-4 h-4" />
                                  <span>{t.cloudDrives.actions.manage}</span>
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDisconnectProvider(drive.integrationId)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center space-x-1"
                              >
                                <X className="w-4 h-4" />
                                <span>{t.cloudDrives.actions.disconnect}</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal para conectar fornecedor */}
      <Modal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        title={t.cloudDrives.modal.connectTitle}
      >
        <div>
          <p className="text-gray-600 mb-6">{t.cloudDrives.modal.selectProvider}</p>

          <div className="space-y-3">
            <Button
              onClick={() => {
                setShowConnectModal(false)
                handleConnectProvider('dropbox')
              }}
              className="w-full flex items-center justify-center space-x-3 p-4 border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              variant="outline"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Cloud className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-medium text-gray-900">{t.cloudDrives.providers.dropbox}</span>
            </Button>

            <Button
              onClick={() => {
                setShowConnectModal(false)
                handleConnectProvider('google-drive')
              }}
              className="w-full flex items-center justify-center space-x-3 p-4 border border-gray-200 hover:border-red-500 hover:bg-red-50 transition-colors"
              variant="outline"
            >
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Cloud className="w-5 h-5 text-red-600" />
              </div>
              <span className="font-medium text-gray-900">{t.cloudDrives.providers.googleDrive}</span>
            </Button>

            <Button
              onClick={() => {
                setShowConnectModal(false)
                handleConnectProvider('onedrive')
              }}
              className="w-full flex items-center justify-center space-x-3 p-4 border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-colors"
              variant="outline"
            >
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Cloud className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-medium text-gray-900">{t.cloudDrives.providers.oneDrive}</span>
            </Button>
          </div>

          <div className="mt-6 pt-4 border-t">
            <Button
              onClick={() => setShowConnectModal(false)}
              variant="outline"
              className="w-full"
            >
              {t.cloudDrives.actions.cancel}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Notificaciones */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`flex items-center p-4 rounded-lg shadow-lg ${notification.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-3" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-3" />
            )}
            <span className="font-medium">{notification.message}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissNotification}
              className="ml-4 p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Folder Selector Modal */}
      {showFolderSelector && selectedIntegration && (
        <DropboxFolderSelector
          isOpen={showFolderSelector}
          onClose={() => {
            setShowFolderSelector(false)
            setSelectedIntegration(null)
          }}
          onSelectFolder={handleFolderSelected}
          accessToken={selectedIntegration.access_token || ''}
          refreshToken={selectedIntegration.refresh_token}
          initialFolder={selectedIntegration.folder_path || '/input'}
        />
      )}

      {/* Test Results Modal */}
      {testResults && (
        <Modal isOpen={!!testResults} onClose={() => setTestResults(null)} title="Resultados do Teste de Processamento">
          <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Resultados do Teste de Processamento
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTestResults(null)}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Informações da Integração</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Fornecedor:</span>
                    <span className="ml-2 text-blue-600">{testResults.integration?.provider}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Email:</span>
                    <span className="ml-2 text-blue-600">{testResults.integration?.userEmail}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-blue-700 font-medium">Pasta:</span>
                    <span className="ml-2 text-blue-600">{testResults.integration?.folderPath}</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Resumo dos Arquivos</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-700 font-medium">Total de Arquivos:</span>
                    <span className="ml-2 text-green-600">{testResults.files?.total || 0}</span>
                  </div>
                  <div>
                    <span className="text-green-700 font-medium">Documentos:</span>
                    <span className="ml-2 text-green-600">{testResults.files?.documents || 0}</span>
                  </div>
                </div>
              </div>

              {testResults.files?.documentList && testResults.files.documentList.length > 0 && (
                <div className="bg-muted border border-border rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-3">Documentos Encontrados</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {testResults.files.documentList.map((doc: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-card rounded border">
                        <div className="flex items-center space-x-3">
                          <File className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-sm">{doc.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {doc.size} • {doc.modified ? new Date(doc.modified).toLocaleString('pt-PT') : 'Data desconhecida'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}