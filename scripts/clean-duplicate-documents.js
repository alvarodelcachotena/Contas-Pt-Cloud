#!/usr/bin/env node

/**
 * Script para limpiar documentos duplicados que ya existen en la base de datos
 * Elimina registros duplicados basados en WhatsApp media ID
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Configurar dotenv
dotenv.config()

async function cleanDuplicateDocuments() {
    console.log(`🧹 === LIMPIANDO DOCUMENTOS DUPLICADOS === ${new Date().toLocaleTimeString()}\n`)

    try {
        // Crear cliente de Supabase
        const supabaseUrl = process.env.SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Configuración de Supabase faltante')
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // Buscar documentos con el mismo WhatsApp media ID
        console.log('🔍 Buscando documentos duplicados...')

        const { data: whereDuplicatedDocs } = await supabase
            .from('documents')
            .select('id, filename, extracted_data, created_at')
            .not('extracted_data->whatsapp_message->id', 'is', null)
            .order('created_at', { ascending: false })

        if (!whereDuplicatedDocs || whereDuplicatedDocs.length === 0) {
            console.log('✅ No hay documentos de WhatsApp para verificar')
            return
        }

        // Agrupar por WhatsApp media ID
        const groupedByMediaId = new Map()

        whereDuplicatedDocs.forEach(doc => {
            const mediaId = doc.extracted_data?.whatsapp_message?.id
            if (mediaId) {
                if (!groupedByMediaId.has(mediaId)) {
                    groupedByMediaId.set(mediaId, [])
                }
                groupedByMediaId.get(mediaId).push(doc)
            }
        })

        // Encontrar grupos con duplicados
        let duplicatesFound = 0
        let documentsToDelete = []

        for (const [mediaId, docs] of groupedByMediaId.entries()) {
            if (docs.length > 1) {
                console.log(`📄 Media ID ${mediaId}: ${docs.length} documentos`)

                // Ordenar por fecha de creación (mantener el más reciente)
                docs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

                // Mantener el primero (más reciente) y marcar los otros para eliminar
                const toKeep = docs[0]
                const toDelete = docs.slice(1)

                console.log(`   ✅ Mantener: ${toKeep.id} (${toKeep.filename})`)
                toDelete.forEach(doc => {
                    console.log(`   🗑️ Eliminar: ${doc.id} (${doc.filename})`)
                    documentsToDelete.push(doc.id)
                })

                duplicatesFound++
            }
        }

        if (documentsToDelete.length === 0) {
            console.log('✅ No se encontraron documentos duplicados para eliminar')
            return
        }

        console.log(`\n📊 Resumen:`)
        console.log(`   📄 Grupos duplicados encontrados: ${duplicatesFound}`)
        console.log(`   🗑️ Documentos a eliminar: ${documentsToDelete.length}`)

        // Eliminar documentos duplicados
        console.log('\n🗑️ Eliminando documentos duplicados...')

        const { error: deleteError } = await supabase
            .from('documents')
            .delete()
            .in('id', documentsToDelete)

        if (deleteError) {
            console.error('❌ Error eliminando documentos:', deleteError.message)
        } else {
            console.log(`✅ ${documentsToDelete.length} documentos duplicados eliminados exitosamente`)
        }

        // También limpiar invoices y expenses huérfanos
        console.log('\n🧹 Limpiando invoices y expenses huérfanos...')

        const { error: invoiceError } = await supabase
            .from('invoices')
            .delete()
            .not('id', 'in',
                supabase
                    .from('documents')
                    .select('extracted_data->>invoice_id')
                    .not('id', 'is', null)
            )

        const { error: expenseError } = await supabase
            .from('expenses')
            .delete()
            .not('id', 'in',
                supabase
                    .from('documents')
                    .select('extracted_data->>expense_id')
                    .not('id', 'is', null)
            )

        if (invoiceError) console.error('⚠️ Error limpiando invoices:', invoiceError.message)
        if (expenseError) console.error('⚠️ Error limpiando expenses:', expenseError.message)

        console.log('\n🎉 Limpieza completada exitosamente!')

    } catch (error) {
        console.error('\n❌ Error en limpieza:', error)
        process.exit(1)
    }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    cleanDuplicateDocuments()
}

export { cleanDuplicateDocuments }
