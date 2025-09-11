'use client'

import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { FormModal } from "@/components/ui/modal"
import { Search, Plus, Download, FileText, AlertCircle, Eye, Trash2, Upload, CheckCircle, Clock, XCircle } from "lucide-react"
import DeleteAllButton from "@/components/delete-all-button"
import { useLanguage } from '@/hooks/useLanguage'

interface Document {
    id: number
    filename: string
    file_path?: string
    file_size?: number
    mime_type?: string
    processing_status: 'pending' | 'processing' | 'completed' | 'failed'
    source?: string
    extracted_data?: any
    confidence_score?: number
    created_at: string
}

export default function DocumentsPage() {
    const { isAuthenticated, isLoading } = useAuth()
    const { t } = useLanguage()
    const router = useRouter()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [formData, setFormData] = useState({
        filename: '',
        fileType: '',
        documentType: '',
        fileSize: ''
    })

    const queryClient = useQueryClient()

    // Fetch documents from API
    const { data: documents, isLoading: documentsLoading, error: queryError } = useQuery<Document[]>({
        queryKey: ['/api/documents'],
        queryFn: async () => {
            const response = await fetch('/api/documents', {
                headers: {
                    'x-tenant-id': '1'
                }
            })
            if (!response.ok) throw new Error('Failed to fetch documents')
            return response.json()
        }
    })

    // Filter documents based on search term
    const filteredDocuments = documents?.filter(document =>
        document.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        document.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        document.processing_status.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    // Calculate metrics
    const totalDocuments = documents?.length || 0
    const pendingDocuments = documents?.filter(d => d.processing_status === 'pending').length || 0
    const completedDocuments = documents?.filter(d => d.processing_status === 'completed').length || 0
    const failedDocuments = documents?.filter(d => d.processing_status === 'failed').length || 0

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login')
        }
    }, [isAuthenticated, isLoading, router])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'text-green-600'
            case 'processing':
                return 'text-blue-600'
            case 'pending':
                return 'text-yellow-600'
            case 'failed':
                return 'text-red-600'
            default:
                return 'text-gray-600'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed':
                return t.documents.status.completed
            case 'processing':
                return t.documents.status.processing
            case 'pending':
                return t.documents.status.pending
            case 'failed':
                return t.documents.status.failed
            default:
                return status
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-600" />
            case 'processing':
                return <Clock className="w-4 h-4 text-blue-600" />
            case 'pending':
                return <Clock className="w-4 h-4 text-yellow-600" />
            case 'failed':
                return <XCircle className="w-4 h-4 text-red-600" />
            default:
                return <FileText className="w-4 h-4 text-gray-600" />
        }
    }

    const formatFileSize = (bytes: number | null | undefined) => {
        if (!bytes || bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const handleOpenModal = () => {
        setFormData({
            filename: '',
            fileType: '',
            documentType: '',
            fileSize: ''
        })
        setError(null)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setFormData({
            filename: '',
            fileType: '',
            documentType: '',
            fileSize: ''
        })
        setError(null)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))

        // Clear error when user starts typing
        if (error) setError(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation without alerts
        if (!formData.filename.trim()) {
            setError(t.documents.validation.filenameRequired)
            return
        }
        if (!formData.fileType.trim()) {
            setError(t.documents.validation.fileTypeRequired)
            return
        }
        if (!formData.documentType.trim()) {
            setError(t.documents.validation.documentTypeRequired)
            return
        }
        if (!formData.fileSize.trim() || isNaN(Number(formData.fileSize))) {
            setError(t.documents.validation.fileSizeValid)
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            const newDocument = {
                filename: formData.filename,
                filePath: `/uploads/${formData.filename}`,
                fileType: formData.fileType,
                fileSize: Number(formData.fileSize),
                documentType: formData.documentType,
                status: 'pending',
                confidence: 0
            }

            const response = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newDocument)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || t.documents.validation.createError)
            }

            // Documento criado com sucesso
            handleCloseModal()

            // Invalidar e recarregar os dados automaticamente
            await queryClient.invalidateQueries({ queryKey: ['/api/documents'] })

        } catch (error) {
            console.error('Erro:', error)
            setError(error instanceof Error ? error.message : t.documents.validation.createError)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (documentId: number) => {
        if (!confirm(t.documents.validation.deleteConfirm)) return

        try {
            const response = await fetch(`/api/documents?id=${documentId}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error('Erro ao excluir documento')
            }

            // Documento excluído com sucesso
            await queryClient.invalidateQueries({ queryKey: ['/api/documents'] })

        } catch (error) {
            console.error('Erro ao excluir:', error)
            setError(t.documents.validation.deleteError)
        }
    }

    const handleExport = async () => {
        try {
            if (!documents || documents.length === 0) {
                setError(t.documents.validation.noDocumentsToExport)
                return
            }

            // Generate CSV content
            const csvContent = [
                ['ID', 'Nome do Arquivo', 'Tipo', 'Tamanho', 'Status', 'Tipo de Documento', 'Data de Upload', 'Confiança'].join(','),
                ...documents.map((document) => [
                    document.id,
                    `"${document.filename}"`,
                    document.mime_type || 'N/A',
                    formatFileSize(document.file_size),
                    document.processing_status,
                    `"${document.source || 'N/A'}"`,
                    document.created_at ? new Date(document.created_at).toLocaleDateString('pt-PT') : 'N/A',
                    document.confidence_score ? (document.confidence_score * 100).toFixed(1) : '0'
                ].join(','))
            ].join('\n')

            // Create and download CSV file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = `documentos_${new Date().toISOString().split('T')[0]}.csv`
            link.click()
            URL.revokeObjectURL(link.href)

            console.log('✅ Documentos exportados com sucesso')
        } catch (error) {
            console.error('❌ Erro ao exportar:', error)
            setError(t.documents.validation.exportError)
        }
    }

    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-auto">
                    <div className="p-6 space-y-6">
                        {/* Error display for export errors */}
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                                <strong className="font-bold">Erro!</strong>
                                <span className="block sm:inline"> {error}</span>
                                <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
                                    <button onClick={() => setError(null)} className="text-red-700">
                                        <svg className="fill-current h-6 w-6" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.15 2.759 3.152z" /></svg>
                                    </button>
                                </span>
                            </div>
                        )}

                        {/* Error display for query errors */}
                        {queryError && (
                            <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded relative mb-4" role="alert">
                                <strong className="font-bold">Erro na API:</strong>
                                <span className="block sm:inline"> {queryError.message}</span>
                                <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
                                    <button onClick={() => window.location.reload()} className="text-orange-700">
                                        <svg className="fill-current h-6 w-6" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.15 2.759 3.152z" /></svg>
                                    </button>
                                </span>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground">{t.documents.title}</h1>
                                <p className="text-gray-600 mt-1">{t.documents.subtitle}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <DeleteAllButton
                                    entityName="documento"
                                    entityNamePlural="documentos"
                                    apiEndpoint="/api/documents/delete-all"
                                    onSuccess={() => {
                                        // Refresh the documents list
                                        queryClient.invalidateQueries({ queryKey: ['/api/documents'] })
                                    }}
                                />
                                <Button
                                    className="flex items-center space-x-2"
                                    onClick={handleOpenModal}
                                >
                                    <Upload className="w-4 h-4" />
                                    <span>{t.documents.newDocument}</span>
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder={t.documents.searchPlaceholder}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button
                                variant="outline"
                                className="flex items-center space-x-2"
                                onClick={handleExport}
                            >
                                <Download className="w-4 h-4" />
                                <span>{t.documents.export}</span>
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                            <div className="metric-card">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">{t.documents.metrics.totalDocuments}</h3>
                                        <p className="text-3xl font-bold text-blue-600 mt-2">{totalDocuments}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="metric-card">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">{t.documents.metrics.pending}</h3>
                                        <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingDocuments}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                        <Clock className="w-6 h-6 text-yellow-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="metric-card">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">{t.documents.metrics.completed}</h3>
                                        <p className="text-3xl font-bold text-green-600 mt-2">{completedDocuments}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="metric-card">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">{t.documents.metrics.failed}</h3>
                                        <p className="text-3xl font-bold text-red-600 mt-2">{failedDocuments}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                        <XCircle className="w-6 h-6 text-red-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {documentsLoading ? (
                            <div className="bg-white rounded-lg border shadow-sm p-6">
                                <div className="animate-pulse space-y-4">
                                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                    <div className="space-y-3">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div key={i} className="h-12 bg-gray-200 rounded"></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg border shadow-sm">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t.documents.table.status}</TableHead>
                                            <TableHead>{t.documents.table.filename}</TableHead>
                                            <TableHead>{t.documents.table.type}</TableHead>
                                            <TableHead>{t.documents.table.size}</TableHead>
                                            <TableHead>{t.documents.table.documentType}</TableHead>
                                            <TableHead>{t.documents.table.uploadDate}</TableHead>
                                            <TableHead>{t.documents.table.confidence}</TableHead>
                                            <TableHead>{t.documents.table.actions}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredDocuments.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                                    {t.documents.noDocumentsFound}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredDocuments.map((document) => (
                                                <TableRow key={document.id}>
                                                    <TableCell>
                                                        <div className="flex items-center space-x-2">
                                                            {getStatusIcon(document.processing_status)}
                                                            <Badge variant={document.processing_status === 'completed' ? 'default' : 'secondary'}>
                                                                {getStatusLabel(document.processing_status)}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-medium">{document.filename}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{document.mime_type || 'N/A'}</Badge>
                                                    </TableCell>
                                                    <TableCell>{formatFileSize(document.file_size)}</TableCell>
                                                    <TableCell>{document.source || 'N/A'}</TableCell>
                                                    <TableCell>
                                                        {document.created_at ? new Date(document.created_at).toLocaleDateString('pt-PT') : 'N/A'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {document.confidence_score ? `${(document.confidence_score * 100).toFixed(1)}%` : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex space-x-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => console.log(`Ver detalhes do documento: ${document.filename}`)}
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDelete(document.id)}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        <div className="text-sm text-gray-500">
                            {t.documents.totalDocuments}: {filteredDocuments.length} documento(s) •
                            {t.documents.processingProgress}: {completedDocuments}/{totalDocuments} ({totalDocuments > 0 ? Math.round((completedDocuments / totalDocuments) * 100) : 0}%)
                        </div>
                    </div>
                </main>
            </div>

            {/* Modal de Novo Documento */}
            <FormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                onCancel={handleCloseModal}
                title={t.documents.newDocument}
                submitLabel="Criar Documento"
                isSubmitting={isSubmitting}
            >
                <div className="space-y-4">
                    {/* Error display in modal */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <div className="flex items-center">
                                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                                <p className="text-sm text-red-800 font-medium">
                                    {error}
                                </p>
                            </div>
                        </div>
                    )}

                    <div>
                        <label htmlFor="filename" className="block text-sm font-medium text-gray-700 mb-1">
                            {t.documents.form.filenameRequired}
                        </label>
                        <Input
                            id="filename"
                            name="filename"
                            type="text"
                            value={formData.filename}
                            onChange={handleInputChange}
                            placeholder={t.documents.form.filenamePlaceholder}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="fileType" className="block text-sm font-medium text-gray-700 mb-1">
                                {t.documents.form.fileTypeRequired}
                            </label>
                            <select
                                id="fileType"
                                name="fileType"
                                value={formData.fileType}
                                onChange={handleInputChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            >
                                <option value="">{t.documents.form.selectPlaceholder}</option>
                                <option value="pdf">{t.documents.fileTypes.pdf}</option>
                                <option value="doc">{t.documents.fileTypes.doc}</option>
                                <option value="docx">{t.documents.fileTypes.docx}</option>
                                <option value="jpg">{t.documents.fileTypes.jpg}</option>
                                <option value="png">{t.documents.fileTypes.png}</option>
                                <option value="txt">{t.documents.fileTypes.txt}</option>
                                <option value="xml">{t.documents.fileTypes.xml}</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="fileSize" className="block text-sm font-medium text-gray-700 mb-1">
                                {t.documents.form.fileSizeRequired}
                            </label>
                            <Input
                                id="fileSize"
                                name="fileSize"
                                type="number"
                                min="0"
                                value={formData.fileSize}
                                onChange={handleInputChange}
                                placeholder={t.documents.form.fileSizePlaceholder}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-1">
                            {t.documents.form.documentTypeRequired}
                        </label>
                        <select
                            id="documentType"
                            name="documentType"
                            value={formData.documentType}
                            onChange={handleInputChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            required
                        >
                            <option value="">{t.documents.form.selectPlaceholder}</option>
                            <option value="invoice">{t.documents.documentTypes.invoice}</option>
                            <option value="receipt">{t.documents.documentTypes.receipt}</option>
                            <option value="contract">{t.documents.documentTypes.contract}</option>
                            <option value="report">{t.documents.documentTypes.report}</option>
                            <option value="other">{t.documents.documentTypes.other}</option>
                        </select>
                    </div>

                    {/* Preview */}
                    {formData.filename && formData.fileType && (
                        <div className="bg-muted p-3 rounded-lg">
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">{t.documents.form.summary}</h4>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span>{t.documents.form.file}:</span>
                                    <span className="font-medium">{formData.filename}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t.documents.form.type}:</span>
                                    <span className="font-medium">{formData.fileType.toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t.documents.form.document}:</span>
                                    <span className="font-medium">{formData.documentType}</span>
                                </div>
                                {formData.fileSize && (
                                    <div className="flex justify-between">
                                        <span>{t.documents.form.size}:</span>
                                        <span className="font-medium">{formatFileSize(Number(formData.fileSize))}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </FormModal>
        </div>
    )
}
