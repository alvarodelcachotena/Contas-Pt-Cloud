#!/usr/bin/env node

/**
 * Script para reintentar procesamiento de documentos fallidos
 * Útil cuando Gemini AI estaba sobrecargado
 */

import { createClient } from '@supabase/supabase-js'
import { DocumentAIService } from '../lib/gemini-ai-service.js'
import dotenv from 'dotenv'

// Configurar dotenv
dotenv.config()

async function retryFailedDocuments() {
    console.log('🔄 === REINTENTANDO DOCUMENTOS FALLIDOS ===\n')

    try {
        // Crear cliente de Supabase
        const supabaseUrl = process.env.SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Configuración de Supabase faltante')
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // Buscar documentos que fallaron por problemas de IA
        console.log('🔍 Buscando documentos fallidos por problemas de IA...')

        const { data: failedDocs, error } = await supabase
            .from('documents')
            .select('*')
            .eq('processing_status', 'failed')
            .ilike('extracted_data', '%503%')
            .order('created_at', { ascending: false })
            .limit(10)

        if (error) {
            throw new Error(`Error recuperando documentos: ${error.message}`)
        }

        if (!failedDocs || failedDocs.length === 0) {
            console.log('✅ No hay documentos fallidos que requieran reintento')
            return
        }

        console.log(`📄 Encontrados ${failedDocs.length} documentos fallidos`)

        // Inicializar servicio de IA
        const aiService = new DocumentAIService()

        // Reintentar cada documento
        for (const doc of failedDocs) {
            try {
                console.log(`\n🔄 Reintentando documento ID ${doc.id}: ${doc.filename}`)
                console.log(`   Status actual: ${doc.processing_status}`)
                console.log(`   Error anterior: ${doc.extracted_data?.ai_error || 'Desconocido'}`)

                // Descargar archivo desde storage
                if (!doc.file_path) {
                    console.log(`   ⚠️ Sin ruta de archivo, saltando...`)
                    continue
                }

                const { data: fileData, error: downloadError } = await supabase.storage
                    .from('documents')
                    .download(doc.file_path)

                if (downloadError) {
                    console.log(`   ❌ Error descargando archivo: ${downloadError.message}`)
                    continue
                }

                // Convertir blob a buffer
                const buffer = Buffer.from(await fileData.arrayBuffer())

                // Actualizar status a processing
                await supabase
                    .from('documents')
                    .update({ processing_status: 'processing' })
                    .eq('id', doc.id)

                // Reintentar análisis con IA
                const analysisResult = await aiService.analyzeDocument(
                    buffer,
                    doc.filename,
                    doc.mime_type
                )

                console.log(`   ✅ Análisis exitoso con confianza: ${(analysisResult.confidence * 100).toFixed(1)}%`)

                // Actualizar documento con nuevo resultado
                await supabase
                    .from('documents')
                    .update({
                        processing_status: 'completed',
                        confidence_score: analysisResult.confidence,
                        extracted_data: {
                            ...doc.extracted_data,
                            ai_analysis: analysisResult,
                            retry_successful: true,
                            retry_timestamp: new Date().toISOString(),
                            original_error: doc.extracted_data?.ai_error
                        }
                    })
                    .eq('id', doc.id)

                console.log(`   🎉 Documento ${doc.id} procesado exitosamente en reintento`)

                // Procesar como invoice o expense según el tipo
                if (analysisResult.document_type === 'invoice') {
                    await processInvoice(analysisResult.extracted_data, doc.id, supabase, doc.tenant_id || 1)
                } else {
                    await processExpense(analysisResult.extracted_data, doc.id, supabase, doc.tenant_id || 1)
                }

                // Pequeña pausa entre documentos
                await new Promise(resolve => setTimeout(resolve, 2000))

            } catch (retryError) {
                console.log(`   ❌ Error en reintento: ${retryError instanceof Error ? retryError.message : 'Desconocido'}`)

                // Actualizar con nuevo error
                await supabase
                    .from('documents')
                    .update({
                        processing_status: 'failed',
                        extracted_data: {
                            ...doc.extracted_data,
                            retry_attempted: true,
                            retry_timestamp: new Date().toISOString(),
                            retry_error: retryError instanceof Error ? retryError.message : 'Error desconocido en reintento'
                        }
                    })
                    .eq('id', doc.id)
            }
        }

        console.log('\n✅ Proceso de reintento completado')

    } catch (error) {
        console.error('\n❌ Error en proceso de reintento:', error)
        process.exit(1)
    }
}

// Placeholder functions que deberían estar importadas desde el webhook
async function processInvoice(invoiceData: any, filePath: string, supabase: any, tenantId: number) {
    // Esta función debería ser la misma que en el webhook
    console.log(`   📄 Procesando como factura`)
}

async function processExpense(expenseData: any, filePath: string, supabase: any, tenantId: number) {
    // Esta función debería ser la misma que en el webhook
    console.log(`   💰 Procesando como gasto`)
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    retryFailedDocuments()
}

export { retryFailedDocuments }
