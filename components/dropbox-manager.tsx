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
    ArrowLeft,
    Plus,
    Trash2,
    Upload,
    Download,
    MoreVertical,
    Home
} from 'lucide-react'

interface DropboxItem {
    id: string
    name: string
    path: string
    type: 'file' | 'folder'
    size?: number
    modified?: string
    hasChildren?: boolean
}

interface DropboxManagerProps {
    accessToken: string
    refreshToken?: string
}

export default function DropboxManager({ accessToken, refreshToken }: DropboxManagerProps) {
    const [items, setItems] = useState<DropboxItem[]>([])
    const [currentPath, setCurrentPath] = useState('')
    const [selectedItems, setSelectedItems] = useState<string[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pathHistory, setPathHistory] = useState<string[]>([])
    const [showCreateFolder, setShowCreateFolder] = useState(false)
    const [newFolderName, setNewFolderName] = useState('')
    const [showUploadDialog, setShowUploadDialog] = useState(false)
    const [uploadFile, setUploadFile] = useState<File | null>(null)

    // Load initial items when component mounts
    useEffect(() => {
        if (accessToken) {
            loadItems('')
        }
    }, [accessToken])

    const loadItems = async (path: string) => {
        setLoading(true)
        setError(null)

        try {
            console.log(`🔍 Loading items for path: ${path || 'root'}`)

            const response = await fetch('/api/dropbox/list-items', {
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
                throw new Error(`Failed to load items: ${response.status}`)
            }

            const data = await response.json()
            console.log('📂 Loaded items:', data)

            setItems(data.items || [])
            setCurrentPath(data.currentPath || path)

        } catch (err) {
            console.error('❌ Error loading items:', err)
            setError(err instanceof Error ? err.message : 'Failed to load items')
        } finally {
            setLoading(false)
        }
    }

    const navigateToFolder = (folderPath: string) => {
        setPathHistory([...pathHistory, currentPath])
        setCurrentPath(folderPath)
        loadItems(folderPath)
    }

    const navigateBack = () => {
        if (pathHistory.length > 0) {
            const previousPath = pathHistory[pathHistory.length - 1]
            setPathHistory(pathHistory.slice(0, -1))
            setCurrentPath(previousPath)
            loadItems(previousPath)
        }
    }

    const navigateToRoot = () => {
        setPathHistory([])
        setCurrentPath('')
        loadItems('')
    }

    const createFolder = async () => {
        if (!newFolderName.trim()) return

        try {
            const response = await fetch('/api/dropbox/create-folder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    accessToken,
                    refreshToken,
                    path: currentPath ? `${currentPath}/${newFolderName}` : `/${newFolderName}`
                }),
            })

            if (!response.ok) {
                throw new Error(`Failed to create folder: ${response.status}`)
            }

            setShowCreateFolder(false)
            setNewFolderName('')
            loadItems(currentPath) // Refresh current view

        } catch (err) {
            console.error('❌ Error creating folder:', err)
            setError(err instanceof Error ? err.message : 'Failed to create folder')
        }
    }

    const deleteItems = async (itemPaths: string[]) => {
        try {
            const response = await fetch('/api/dropbox/delete-items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    accessToken,
                    refreshToken,
                    paths: itemPaths
                }),
            })

            if (!response.ok) {
                throw new Error(`Failed to delete items: ${response.status}`)
            }

            setSelectedItems([])
            loadItems(currentPath) // Refresh current view

        } catch (err) {
            console.error('❌ Error deleting items:', err)
            setError(err instanceof Error ? err.message : 'Failed to delete items')
        }
    }

    const uploadFileToDropbox = async () => {
        if (!uploadFile) return

        try {
            const formData = new FormData()
            formData.append('file', uploadFile)
            formData.append('path', currentPath ? `${currentPath}/${uploadFile.name}` : `/${uploadFile.name}`)
            formData.append('accessToken', accessToken)
            if (refreshToken) {
                formData.append('refreshToken', refreshToken)
            }

            const response = await fetch('/api/dropbox/upload-file', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                throw new Error(`Failed to upload file: ${response.status}`)
            }

            setShowUploadDialog(false)
            setUploadFile(null)
            loadItems(currentPath) // Refresh current view

        } catch (err) {
            console.error('❌ Error uploading file:', err)
            setError(err instanceof Error ? err.message : 'Failed to upload file')
        }
    }

    const downloadFile = async (filePath: string, fileName: string) => {
        try {
            const response = await fetch('/api/dropbox/download-file', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    accessToken,
                    refreshToken,
                    path: filePath
                }),
            })

            if (!response.ok) {
                throw new Error(`Failed to download file: ${response.status}`)
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = fileName
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

        } catch (err) {
            console.error('❌ Error downloading file:', err)
            setError(err instanceof Error ? err.message : 'Failed to download file')
        }
    }

    const toggleItemSelection = (itemId: string) => {
        setSelectedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        )
    }

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getPathBreadcrumbs = () => {
        if (!currentPath) return ['Root']
        return ['Root', ...currentPath.split('/').filter(Boolean)]
    }

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return ''
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
    }

    return (
        <div className="bg-white rounded-lg border shadow-sm">
            {/* Header */}
            <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Gestión de Dropbox</h3>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadItems(currentPath)}
                            disabled={loading}
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCreateFolder(true)}
                        >
                            <Plus className="w-4 h-4" />
                            Nueva Carpeta
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowUploadDialog(true)}
                        >
                            <Upload className="w-4 h-4" />
                            Subir Archivo
                        </Button>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={navigateToRoot}
                        className="p-1 h-6 w-6"
                    >
                        <Home className="w-4 h-4" />
                    </Button>
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
                        placeholder="Buscar archivos y carpetas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Actions Bar */}
            {selectedItems.length > 0 && (
                <div className="p-4 bg-blue-50 border-b">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-800">
                            {selectedItems.length} elemento{selectedItems.length !== 1 ? 's' : ''} seleccionado{selectedItems.length !== 1 ? 's' : ''}
                        </span>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteItems(selectedItems)}
                                className="text-red-600 hover:text-red-700"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="p-6">
                {loading ? (
                    <div className="flex items-center justify-center p-8">
                        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="ml-2 text-gray-600">Cargando...</span>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center">
                        <div className="text-red-600 mb-2">❌ Error</div>
                        <div className="text-sm text-gray-600 mb-4">{error}</div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadItems(currentPath)}
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Intentar de nuevo
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredItems.map((item) => (
                            <div
                                key={item.id}
                                className={`flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer border-2 ${selectedItems.includes(item.id) ? 'border-blue-500 bg-blue-50' : 'border-transparent'
                                    }`}
                                onClick={() => item.type === 'folder' ? navigateToFolder(item.path) : toggleItemSelection(item.id)}
                            >
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.includes(item.id)}
                                        onChange={() => toggleItemSelection(item.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="rounded"
                                    />
                                    {item.type === 'folder' ? (
                                        <Folder className="w-5 h-5 text-blue-600" />
                                    ) : (
                                        <File className="w-5 h-5 text-gray-400" />
                                    )}
                                    <div>
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {item.type === 'file' ? formatFileSize(item.size) : 'Carpeta'}
                                            {item.modified && ` • ${new Date(item.modified).toLocaleDateString()}`}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {item.type === 'file' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                downloadFile(item.path, item.name)
                                            }}
                                            className="p-1 h-6 w-6"
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="p-1 h-6 w-6"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {filteredItems.length === 0 && !loading && (
                            <div className="text-center py-8 text-gray-500">
                                <Folder className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <div>No se encontraron elementos</div>
                                {searchTerm && (
                                    <div className="text-sm mt-2">
                                        Intenta con un término de búsqueda diferente
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Folder Dialog */}
            <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crear Nueva Carpeta</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            placeholder="Nombre de la carpeta"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={createFolder} disabled={!newFolderName.trim()}>
                            Crear Carpeta
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Upload File Dialog */}
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Subir Archivo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            type="file"
                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={uploadFileToDropbox} disabled={!uploadFile}>
                            Subir Archivo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
