// WhatsApp Configuration
export interface WhatsAppCredentials {
    accessToken: string
    phoneNumberId: string
    businessAccountId: string
    appId: string
    appSecret: string
    verifyToken: string
    webhookUrl: string
}

export interface WhatsAppMediaMessage {
    id: string
    type: 'image' | 'document' | 'audio' | 'video'
    image?: {
        id: string
        mime_type: string
        sha256: string
        filename?: string
    }
    document?: {
        id: string
        filename: string
        mime_type: string
        sha256: string
        file_size: number
    }
    audio?: {
        id: string
        mime_type: string
        sha256: string
        voice: boolean
        filename?: string
    }
    video?: {
        id: string
        mime_type: string
        sha256: string
        filename?: string
    }
}

export interface WhatsAppMessage {
    id: string
    from: string
    timestamp: string
    type: string
    image?: any
    document?: any
    audio?: any
    video?: any
    text?: {
        body: string
    }
}

export interface WhatsAppWebhookPayload {
    object: string
    entry: Array<{
        id: string
        changes: Array<{
            value: {
                messaging_product: string
                metadata: {
                    display_phone_number: string
                    phone_number_id: string
                }
                contacts: Array<{
                    profile: {
                        name: string
                    }
                    wa_id: string
                }>
                messages: WhatsAppMessage[]
            }
            field: string
        }>
    }>
}

// WhatsApp API endpoints
export const WHATSAPP_API_BASE = 'https://graph.facebook.com/v18.0'
export const WHATSAPP_MEDIA_API = `${WHATSAPP_API_BASE}/media`

// Supported media types for document processing
export const SUPPORTED_MEDIA_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
]

// Function to check if media type is supported
export function isMediaTypeSupported(mimeType: string): boolean {
    return SUPPORTED_MEDIA_TYPES.includes(mimeType)
}

// Function to get file extension from MIME type
export function getFileExtension(mimeType: string): string {
    const extensions: { [key: string]: string } = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'application/pdf': '.pdf',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'application/vnd.ms-excel': '.xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
        'text/plain': '.txt'
    }
    return extensions[mimeType] || '.bin'
}
