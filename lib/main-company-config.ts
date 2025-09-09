/**
 * Configuración de la empresa principal
 * DIAMOND NXT TRADING LDA
 */

export const MAIN_COMPANY_CONFIG = {
    name: 'DIAMOND NXT TRADING LDA',
    nif: '517124548',
    taxId: '517124548',

    // Configuración para el procesamiento de documentos
    processing: {
        // Siempre extraer datos del OTRO proveedor/cliente
        extractOtherParty: true,

        // Nombres alternativos que pueden aparecer en documentos
        alternativeNames: [
            'DIAMOND NXT TRADING LDA',
            'DIAMOND NXT TRADING',
            'DIAMOND NXT',
            'DIAMOND NXT TRADING, LDA',
            'DIAMOND NXT TRADING LDA.'
        ],

        // NIFs alternativos que pueden aparecer
        alternativeNIFs: [
            '517124548',
            '517 124 548',
            '517.124.548',
            '517-124-548'
        ]
    },

    // Configuración para el sistema RAG
    rag: {
        // Siempre identificar como empresa principal
        isMainCompany: true,

        // Instrucciones para IA
        aiInstructions: `
        IMPORTANTE: Esta empresa (DIAMOND NXT TRADING LDA, NIF: 517124548) es la empresa principal.
        Cuando proceses documentos que contengan DOS nombres/NIFs:
        1. Identifica DIAMOND NXT TRADING LDA como la empresa principal
        2. SIEMPRE extrae los datos del OTRO proveedor/cliente
        3. NO extraigas datos de DIAMOND NXT TRADING LDA
        4. El proveedor/cliente es quien emitió la factura o a quien se le emitió
        `
    }
}

/**
 * Función para verificar si un nombre/NIF pertenece a la empresa principal
 */
export function isMainCompany(name?: string, nif?: string): boolean {
    if (!name && !nif) return false

    // Verificar por nombre
    if (name) {
        const nameLower = name.toLowerCase()
        const isMainByName = MAIN_COMPANY_CONFIG.processing.alternativeNames.some(
            altName => nameLower.includes(altName.toLowerCase())
        )
        if (isMainByName) return true
    }

    // Verificar por NIF
    if (nif) {
        const cleanNif = nif.replace(/\D/g, '')
        const isMainByNIF = MAIN_COMPANY_CONFIG.processing.alternativeNIFs.some(
            altNif => altNif.replace(/\D/g, '') === cleanNif
        )
        if (isMainByNIF) return true
    }

    return false
}

/**
 * Función para obtener la configuración de la empresa principal
 */
export function getMainCompanyConfig() {
    return MAIN_COMPANY_CONFIG
}
