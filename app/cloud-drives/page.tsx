'use client'

import { useState, useEffect } from "react"

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
  const [searchTerm, setSearchTerm] = useState('')
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'completed' | 'error'>('completed')
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [integrations, setIntegrations] = useState<CloudIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const [showFolderSelector, setShowFolderSelector] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<CloudIntegration | null>(null)
  const [testResults, setTestResults] = useState<any>(null)

  // Carregar integrações ao montar o componente
  useEffect(() => {
    loadIntegrations()
    checkUrlParams()
  }, [])

  const checkUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')

    if (success) {
      const messages = {
        'dropbox_connected': 'Dropbox conectado com sucesso',
        'googledrive_connected': 'Google Drive conectado com sucesso',
        'onedrive_connected': 'OneDrive conectado com sucesso'
      }
      setNotification({
        type: 'success',
        message: messages[success as keyof typeof messages] || 'Conexão bem-sucedida'
      })
      // Limpar URL
      window.history.replaceState({}, '', '/cloud-drives')
      // Recarregar integrações
      loadIntegrations()
    }

    if (error) {
      const messages = {
        'auth_failed': 'Erro na autenticação',
        'token_failed': 'Erro ao obter token de acesso',
        'user_failed': 'Erro ao obter dados do usuário',
        'save_failed': 'Erro ao guardar a configuração',
        'callback_failed': 'Erro no processo de autenticação'
      }
      setNotification({
        type: 'error',
        message: messages[error as keyof typeof messages] || 'Erro na conexão'
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
        message: 'Erro ao carregar configurações de cloud drives'
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
    const popup = window.open(
      `/api/auth/dropbox?action=connect`,
      'dropbox-auth',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    )

    // Listen for popup completion
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed)
        // Reload integrations after auth
        loadIntegrations()
        setNotification({
          type: 'success',
          message: 'Verificando conexão Dropbox...'
        })
      }
    }, 1000)

    // Listen for messages from popup
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      
      if (event.data.type === 'DROPBOX_AUTH_SUCCESS') {
        popup?.close()
        setNotification({
          type: 'success',
          message: 'Dropbox conectado com sucesso!'
        })
        loadIntegrations()
        window.removeEventListener('message', handleMessage)
      } else if (event.data.type === 'DROPBOX_AUTH_ERROR') {
        popup?.close()
        setNotification({
          type: 'error',
          message: 'Erro ao conectar Dropbox: ' + event.data.error
        })
        window.removeEventListener('message', handleMessage)
      }
    }

    window.addEventListener('message', handleMessage)
  }

  const handleDisconnectProvider = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/cloud-integrations?id=${integrationId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setNotification({
          type: 'success',
          message: 'Fornecedor desconectado com sucesso'
        })
        loadIntegrations()
      } else {
        throw new Error('Erro ao desconectar fornecedor')
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Erro ao desconectar o fornecedor'
      })
    }
  }

  const dismissNotification = () => {
    setNotification(null)
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

  const recentFiles = [
    {
      id: 1,
      name: 'Fatura_Microsoft_Office_2025.pdf',
      source: 'Dropbox',
      uploadDate: '2025-06-20T14:30:00',
      size: '245 KB',
      status: 'processed',
      category: 'Despesa'
    },
    {
      id: 2,
      name: 'Recibo_EDP_Energia_Junho.pdf',
      source: 'Google Drive',
      uploadDate: '2025-06-19T16:20:00',
      size: '189 KB',
      status: 'processing',
      category: 'Utilidade'
    },
    {
      id: 3,
      name: 'Fatura_Fornecedor_ABC_Lda.pdf',
      source: 'OneDrive',
      uploadDate: '2025-06-18T11:45:00',
      size: '387 KB',
      status: 'pending',
      category: 'Despesa'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'processed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado'
      case 'error': return 'Erro'
      case 'pending': return 'Pendente'
      case 'processing': return 'Processando'
      case 'processed': return 'Processado'
      default: return 'Desconhecido'
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
                <h1 className="text-3xl font-bold text-foreground">Drives na Nuvem</h1>
                <p className="text-gray-600 mt-1">Gestão de armazenamento em nuvem e sincronização automática</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  className="bg-white flex items-center space-x-2"
                  onClick={handleManualSync}
                  disabled={syncStatus === 'syncing'}
                >
                  <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  <span>{syncStatus === 'syncing' ? 'Sincronizando...' : 'Sincronizar'}</span>
                </Button>
                <Button 
                  className="flex items-center space-x-2"
                  onClick={() => setShowConnectModal(true)}
                >
                  <Plus className="w-4 h-4" />
                  <span>Conectar Drive</span>
                </Button>
              </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Drives Conectados</h3>
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
                    <h3 className="text-sm font-medium text-muted-foreground">Arquivos Totais</h3>
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
                    <h3 className="text-sm font-medium text-muted-foreground">Processados Hoje</h3>
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
                    <h3 className="text-sm font-medium text-muted-foreground">Pendentes</h3>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">3</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Connected Drives */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Drives Conectados</h3>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">A carregar configurações...</p>
                </div>
              ) : cloudDrives.length === 0 ? (
                <div className="text-center py-8">
                  <Cloud className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Não há drives conectados</h4>
                  <p className="text-gray-500 mb-4">Conecte a sua primeira conta de armazenamento na nuvem</p>
                  <Button 
                    onClick={() => setShowConnectModal(true)}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Conectar Drive</span>
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
                          <Badge className={getStatusColor(drive.status)}>
                            {getStatusText(drive.status)}
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
                            <span>Testar</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectFolder(integrations.find(i => i.id === drive.integrationId)!)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 flex items-center space-x-1"
                          >
                            <FolderOpen className="w-4 h-4" />
                            <span>Pasta</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnectProvider(drive.integrationId)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center space-x-1"
                          >
                            <X className="w-4 h-4" />
                            <span>Desconectar</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Files */}
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Arquivos Recentes</h3>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Pesquisar arquivos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-gray-600">Nome do Arquivo</th>
                      <th className="text-left p-4 font-medium text-gray-600">Origem</th>
                      <th className="text-left p-4 font-medium text-gray-600">Data Upload</th>
                      <th className="text-left p-4 font-medium text-gray-600">Tamanho</th>
                      <th className="text-left p-4 font-medium text-gray-600">Categoria</th>
                      <th className="text-left p-4 font-medium text-gray-600">Status</th>
                      <th className="text-right p-4 font-medium text-gray-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentFiles
                      .filter(file => 
                        searchTerm === '' || 
                        file.name.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((file) => (
                        <tr key={file.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <File className="w-5 h-5 text-gray-400" />
                              <span className="font-medium">{file.name}</span>
                            </div>
                          </td>
                          <td className="p-4">{file.source}</td>
                          <td className="p-4">
                            {new Date(file.uploadDate).toLocaleDateString('pt-PT')}
                          </td>
                          <td className="p-4">{file.size}</td>
                          <td className="p-4">
                            <Badge variant="outline" className="text-xs">
                              {file.category}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={getStatusColor(file.status)}>
                              {getStatusText(file.status)}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal para conectar fornecedor */}
      <Modal 
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        title="Conectar Armazenamento na Nuvem"
      >
        <div>
          <p className="text-gray-600 mb-6">Selecione o fornecedor que deseja conectar:</p>
          
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
              <span className="font-medium text-gray-900">Dropbox</span>
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
              <span className="font-medium text-gray-900">Google Drive</span>
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
              <span className="font-medium text-gray-900">OneDrive</span>
            </Button>
          </div>

          <div className="mt-6 pt-4 border-t">
            <Button
              onClick={() => setShowConnectModal(false)}
              variant="outline"
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Notificaciones */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`flex items-center p-4 rounded-lg shadow-lg ${
            notification.type === 'success' 
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