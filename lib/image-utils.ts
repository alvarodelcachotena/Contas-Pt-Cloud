/**
 * Utilidades para manejo de imágenes en base64
 */

export interface ImageData {
    name: string
    originalFilename: string
    imageData: string
    mimeType: string
    fileSize: number
    source: 'whatsapp' | 'ai-assistant'
    companyName?: string
    documentDate?: string
}

/**
 * Convierte un archivo a base64
 */
export async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const result = reader.result as string
            resolve(result)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

/**
 * Convierte un ArrayBuffer a base64
 */
export function arrayBufferToBase64(buffer: ArrayBuffer, mimeType: string = 'image/jpeg'): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    return `data:${mimeType};base64,${btoa(binary)}`
}

/**
 * Genera un nombre descriptivo para la imagen
 */
export function generateImageName(
    companyName?: string,
    documentDate?: Date | string,
    source: 'whatsapp' | 'ai-assistant' = 'whatsapp'
): string {
    // Formatear fecha
    let dateStr: string
    if (documentDate) {
        const date = typeof documentDate === 'string' ? new Date(documentDate) : documentDate
        dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
    } else {
        dateStr = new Date().toISOString().split('T')[0]
    }

    // Limpiar nombre de empresa
    let cleanCompanyName = 'UNKNOWN'
    if (companyName) {
        cleanCompanyName = companyName
            .toUpperCase()
            .replace(/[^A-Z0-9\s]/g, '') // Quitar caracteres especiales
            .replace(/\s+/g, '') // Quitar espacios
            .substring(0, 50) // Limitar longitud
    }

    return `${cleanCompanyName} ${dateStr}`
}

/**
 * Guarda una imagen en la base de datos
 */
export async function saveImageToDatabase(imageData: ImageData, tenantId: string = '1'): Promise<any> {
    try {
        const response = await fetch('/api/images', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-tenant-id': tenantId
            },
            body: JSON.stringify(imageData)
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        return result.image
    } catch (error) {
        console.error('❌ Error saving image to database:', error)
        throw error
    }
}

/**
 * Obtiene todas las imágenes del tenant
 */
export async function getImagesFromDatabase(tenantId: string = '1'): Promise<any[]> {
    try {
        const response = await fetch('/api/images', {
            headers: {
                'x-tenant-id': tenantId
            }
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        return result.images || []
    } catch (error) {
        console.error('❌ Error fetching images from database:', error)
        throw error
    }
}

/**
 * Elimina una imagen de la base de datos
 */
export async function deleteImageFromDatabase(imageId: number, tenantId: string = '1'): Promise<boolean> {
    try {
        const response = await fetch(`/api/images?id=${imageId}`, {
            method: 'DELETE',
            headers: {
                'x-tenant-id': tenantId
            }
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        return true
    } catch (error) {
        console.error('❌ Error deleting image from database:', error)
        throw error
    }
}

/**
 * Calcula el tamaño de una imagen en base64
 */
export function calculateBase64Size(base64String: string): number {
    // Remover el prefijo data:image/...;base64,
    const base64Data = base64String.split(',')[1] || base64String
    return Math.round((base64Data.length * 3) / 4)
}
