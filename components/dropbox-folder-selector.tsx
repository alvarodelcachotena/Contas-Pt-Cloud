'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { 
  Folder, 
  FolderOpen, 
  File, 
  ChevronRight,
  Search,
  RefreshCw,
  ArrowLeft
} from 'lucide-react'

interface DropboxFolder {
  id: string
  name: string
  path: string
  documentCount: number
  hasChildren: boolean
}

interface DropboxFolderSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelectFolder: (folderPath: string) => void
  accessToken: string
  refreshToken?: string
  initialFolder?: string
}

export default function DropboxFolderSelector({
  isOpen,
  onClose,
  onSelectFolder,
  accessToken,
  refreshToken,
  initialFolder = ""
}: DropboxFolderSelectorProps) {
  const [folders, setFolders] = useState<DropboxFolder[]>([])
  const [currentPath, setCurrentPath] = useState(initialFolder)
  const [selectedPath, setSelectedPath] = useState(initialFolder)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pathHistory, setPathHistory] = useState<string[]>([])

  // Load initial folders when modal opens
  useEffect(() => {
    if (isOpen && accessToken) {
      loadFolders(currentPath)
    }
  }, [isOpen, accessToken, currentPath])

  const loadFolders = async (path: string) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log(`🔍 Loading folders for path: ${path}`)
      
      const response = await fetch('/api/simple-debug-dropbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          refreshToken,
          path
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to load folders: ${response.status}`)
      }

      const data = await response.json()
      console.log('📂 Loaded folders:', data)
      
      setFolders(data.folders || [])
      setCurrentPath(data.currentPath || path)
      
    } catch (err) {
      console.error('❌ Error loading folders:', err)
      setError(err instanceof Error ? err.message : 'Failed to load folders')
    } finally {
      setLoading(false)
    }
  }

  const navigateToFolder = (folderPath: string) => {
    setPathHistory([...pathHistory, currentPath])
    setCurrentPath(folderPath)
    loadFolders(folderPath)
  }

  const navigateBack = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1]
      setPathHistory(pathHistory.slice(0, -1))
      setCurrentPath(previousPath)
      loadFolders(previousPath)
    }
  }

  const handleSelectFolder = () => {
    onSelectFolder(selectedPath)
    onClose()
  }

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPathBreadcrumbs = () => {
    if (!currentPath) return ['Root']
    return ['Root', ...currentPath.split('/').filter(Boolean)]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Selecionar Pasta do Dropbox</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4 flex-1 overflow-hidden">
          {/* Path Navigation */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            {pathHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateBack}
                className="p-1 h-6 w-6"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="flex items-center space-x-1">
              {getPathBreadcrumbs().map((part, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && <ChevronRight className="w-3 h-3 mx-1" />}
                  <span className={index === getPathBreadcrumbs().length - 1 ? 'font-medium' : ''}>
                    {part}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Pesquisar pastas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected Path Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-800 font-medium">Pasta Selecionada:</div>
            <div className="text-blue-700 mt-1">{selectedPath || '/root'}</div>
          </div>

          {/* Folders List */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">A carregar pastas...</span>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="text-red-600 mb-2">❌ Erro ao carregar pastas</div>
                <div className="text-sm text-gray-600 mb-4">{error}</div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => loadFolders(currentPath)}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {/* Current folder option */}
                <div
                  className={`flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer border-2 ${
                    selectedPath === currentPath ? 'border-blue-500 bg-blue-50' : 'border-transparent'
                  }`}
                  onClick={() => setSelectedPath(currentPath)}
                >
                  <div className="flex items-center space-x-3">
                    <FolderOpen className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium">
                        {currentPath ? `Pasta Atual (${currentPath})` : 'Pasta Raiz'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Selecionar esta pasta para sincronização
                      </div>
                    </div>
                  </div>
                  {selectedPath === currentPath && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Selecionada
                    </Badge>
                  )}
                </div>

                {/* Subfolders */}
                {filteredFolders.map((folder) => (
                  <div
                    key={folder.id}
                    className={`flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer border-2 ${
                      selectedPath === folder.path ? 'border-blue-500 bg-blue-50' : 'border-transparent'
                    }`}
                    onClick={() => setSelectedPath(folder.path)}
                  >
                    <div className="flex items-center space-x-3">
                      <Folder className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{folder.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {folder.documentCount} documento{folder.documentCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {selectedPath === folder.path && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Selecionada
                        </Badge>
                      )}
                      {folder.hasChildren && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigateToFolder(folder.path)
                          }}
                          className="p-1 h-6 w-6"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {filteredFolders.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    <Folder className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <div>Nenhuma pasta encontrada</div>
                    {searchTerm && (
                      <div className="text-sm mt-2">
                        Tente um termo de pesquisa diferente
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSelectFolder} disabled={!selectedPath}>
            Selecionar Pasta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}