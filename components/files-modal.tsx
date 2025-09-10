'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Download, Image, HardDrive, FileText } from 'lucide-react'

interface DatabaseImage {
    id: number
    name: string
    original_filename: string
    image_data: string
    mime_type: string
    file_size: number
    source: string
    company_name?: string
    document_date?: string
    created_at: string
}

interface FilesModalProps {
    children: React.ReactNode
}

export default function FilesModal({ children }: FilesModalProps) {
    const [isOpen, setIsOpen] = useState(false)

    const { data: images, isLoading, error, refetch } = useQuery<DatabaseImage[]>({
        queryKey: ['/api/images'],
        queryFn: async () => {
            const response = await fetch('/api/images', {
                headers: {
                    'x-tenant-id': '1' // Hardcoded for now, should come from user context
                }
            })
            if (!response.ok) {
                throw new Error('Failed to fetch images')
            }
            const data = await response.json()
            return data.images || []
        },
        enabled: isOpen, // Only fetch when modal is open
    })

    const handleDownload = (image: DatabaseImage) => {
        const link = document.createElement('a')
        link.href = image.image_data
        link.download = image.original_filename
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handlePreview = (image: DatabaseImage) => {
        window.open(image.image_data, '_blank')
    }

    const isPDF = (mimeType: string) => {
        return mimeType === 'application/pdf'
    }

    return (
        <>
            <div onClick={() => setIsOpen(true)}>
                {children}
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <HardDrive className="w-5 h-5" />
                            Archivos de WhatsApp (Imágenes y PDFs)
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto">
                        {isLoading && (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="ml-2 text-muted-foreground">Cargando imágenes...</span>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-red-800 mb-2">Error al cargar imágenes</h3>
                                <p className="text-red-600">{error.message}</p>
                                <Button
                                    onClick={() => refetch()}
                                    className="mt-3"
                                    variant="outline"
                                >
                                    Intentar de nuevo
                                </Button>
                            </div>
                        )}

                        {images && images.length === 0 && !isLoading && (
                            <div className="text-center py-8">
                                <HardDrive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-muted-foreground mb-2">No hay archivos guardados</h3>
                                <p className="text-muted-foreground">Aún no se han recibido imágenes o PDFs desde WhatsApp o AI Assistant.</p>
                            </div>
                        )}

                        {images && images.length > 0 && (
                            <div className="space-y-4">
                                {console.log('📊 Total imágenes en DB:', images.length)}
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        {images.length} archivo{images.length !== 1 ? 's' : ''} guardado{images.length !== 1 ? 's' : ''}
                                    </p>
                                    <Button
                                        onClick={() => refetch()}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Actualizar
                                    </Button>
                                </div>

                                {/* Mostrar imágenes y PDFs desde base de datos */}
                                <div className="grid grid-cols-3 gap-6">
                                    {images.map((image, index) => (
                                        <div key={image.id} className="relative group">
                                            {isPDF(image.mime_type) ? (
                                                // Mostrar PDF con icono
                                                <div 
                                                    className="w-full h-64 bg-red-50 border-2 border-red-200 rounded-lg cursor-pointer hover:bg-red-100 transition-colors shadow-lg flex flex-col items-center justify-center"
                                                    onClick={() => handlePreview(image)}
                                                >
                                                    <FileText className="w-16 h-16 text-red-600 mb-4" />
                                                    <div className="text-red-800 font-medium text-center px-4">
                                                        <div className="truncate">{image.name}</div>
                                                        <div className="text-sm text-red-600 mt-1">PDF Document</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                // Mostrar imagen normal
                                                <img
                                                    src={image.image_data}
                                                    alt={image.name}
                                                    className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity shadow-lg"
                                                    onClick={() => handlePreview(image)}
                                                    onError={(e) => {
                                                        console.log('❌ Error cargando imagen:', image.name, image.id);
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                    }}
                                                    onLoad={() => {
                                                        console.log('✅ Imagen cargada:', image.name, image.id);
                                                    }}
                                                />
                                            )}
                                            
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        onClick={() => handleDownload(image)}
                                                        variant="secondary"
                                                        size="sm"
                                                        className="h-8 px-3 text-sm bg-white bg-opacity-90 hover:bg-opacity-100"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            
                                            {/* Información del archivo */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-sm p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="truncate font-medium">{image.name}</div>
                                                {image.company_name && (
                                                    <div className="truncate text-xs opacity-75 mt-1">{image.company_name}</div>
                                                )}
                                                <div className="text-xs opacity-75 mt-1">
                                                    {isPDF(image.mime_type) ? 'PDF' : image.mime_type.split('/')[1]?.toUpperCase()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}