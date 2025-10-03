#!/usr/bin/env node

/**
 * Script para reintentar documentos que fueron procesados con total = 0
 * Estos documentos necesitan ser reanalizados para obtener el total real
 */

import { createClient } from '@supabase/supabase-js'
import { DocumentAIService } from '../lib/gemini-ai-service.js'
import dotenv from 'dotenv'

// Configurar dotenv
dotenv.config()

async function retryZeroTotalDocuments() {
    console.log(`💰 === REINTENTANDO DOCUMENTOS CON TOTAL = 0 === ${new Date().toLocaleTimeString()}\n`)

    try {
        // Crear cliente de Supabase
        const supabaseUrl = process.env.SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Configuración de Supabase faltante')
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // Buscar documentos que tienen total = 0 y necesitan reintento
        console.log('🔍 Buscando documentos con total = 0...')

        const { data: zeroTotalDocs, error } = await supabase
            .from('documents')
            .select('*')
            .or('extracted_data->>total_amount=0,extracted_data->>amount=0')
            .eq('processing_status', 'completed')
            .filter('extracted_data', 'ilike', '%TOTAL_ZERO_DETECTED%')
            .order('created_at', { ascending: false })
            .limit(5)

        if (error) {
            console.error('❌ Error recuperando documentos:', error.message)
            return
        }

        if (!zeroTotalDocs || zeroTotalDocs.length === 0) {
            console.log('✅ No hay documentos con total = 0 para reintentar')
            return
        }

        console.log(`📄 Encontrados ${zeroTotalDocs.length} documentos con total = 0`)

        // Inicializar servicio de IA
        let aiService = null
        try {
            aiService = new DocumentAIService()
        } catch (error) {
            console.log('⚠️ Error inicializando IA:', error.message)
            return
        }

        let successCount = 0
        let errorCount = 0

        // Procesar cada documento
        for (const doc of zeroTotalDocs) {
            try {
                console.log(`\n🔄 Reintentando documento ${doc.id}: ${doc.filename}`)
                console.log(`   Total actual: €${doc.extracted_data?.total_amount || doc.extracted_data?.amount || 0}`)

                // Descargar archivo desde storage
                if (!doc.file_path) {
                    console.log(`   ⚠️ Sin ruta de archivo, saltando...`)
                    errorCount++
                    continue
                }

                const { data: fileData, error: downloadError } = await supabase.storage
                    .from('documents')
                    .download(doc.file_path)

                if (downloadError) {
                    console.log(`   ❌ Error descargando archivo: ${downloadError.message}`)
                    errorCount++
                    continue
                }

                // Convertir blob a buffer
                const buffer = Buffer.from(await fileData.arrayBuffer())

                console.log(`   🔍 Reanalizando con mejores parámetros...`)

                // Reintentar análisis con IA (el servicio ya maneja múltiples modelos)
                const analysisResult = await aiService.analyzeDocument(
                    buffer,
                    doc.filename,
                    doc.mime_type
                )

                // Verificar si el nuevo total es válido (> 0)
                const newTotal = analysisResult.extracted_data?.total_amount || analysisResult.extracted_data?.amount || 0

                if (newTotal > 0) {
                    console.log(`   ✅ Nuevo total válido detectado: €${newTotal}`)
                    console.log(`   📈 Confianza del análisis: ${(analysisResult.confidence * 100).toFixed(1)}%`)

                    // Actualizar organización en base de datos
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
                                zero_total_fixed: true,
                                original_total: doc.extracted_data?.total_amount || doc.extracted_data?.amount || 0,
                                new_total: newTotal
                            }
                        })
                        .eq('id', doc.id)

                    successCount++
                    console.log(`   🎉 Documento ${doc.id} corregido exitosamente: €0 → €${newTotal}`)

                    // También actualizar en invoices/expenses si existe
                    await updateFinancialRecords(supabase, doc.id, analysisResult.extracted_data, doc.tenant_id || 1)

                } else {
                    console.log(`   ⚠️ Nuevo análisis también tiene total = 0, marcando como problema persistente`)

                    await supabase
                        .from('documents')
                        .update({
                            extracted_data: {
                                ...doc.extracted_data,
                                retry_attempted: true,
                                retry_timestamp: new Date().toISOString(),
                                persistent_zero_total: true,
                                manual_review_required: true
                            }
                        })
                        .eq('id', doc.id)

                    console.log(`   📝 Documento ${doc.id} marcado para revisión manual`)
                    errorCount++
                }

                // Pausa entre documentos
                await new Promise(resolve => setTimeout(resolve, 3000))

            } catch (retryError) {
                console.log(`   ❌ Error en reintento: ${retryError.message}`)
                errorCount++

                await supabase
                    .from('documents')
                    .update({
                        extracted_data: {
                            ...doc.extracted_data,
                            retry_error: retryError.message,
                            retry_timestamp: new Date().toISOString()
                        }
                    })
                    .eq('id', doc.id)
            }
        }

        console.log(`\n📊 Resumen de corrección de totales:`)
        console.log(`   ✅ Documentos corregidos: ${successCount}`)
        console.log(`   ❌ Documentos con errores: ${errorCount}`)
        console.log(`   📄 Total procesados: ${zeroTotalDocs.length}`)

        if (successCount > 0) {
            console.log(`\n🎉 Se corrigieron ${successCount} documentos con totales inválidos!`)
        }

    } catch (error) {
        console.error('\n❌ Error en proceso de corrección:', error)
    }
}

// Función helper para actualizar registros financieros
async function updateFinancialRecords(supabase: any, docId: number, extractedData: any, tenantId: number) {
    try {
        const invoiceNumber = extractedData.invoice_number || extractedData.number
        const newTotal = extractedData.total_amount || extractedData.amount || 0

        if (!invoiceNumber || !newTotal) return

        // Actualizar invoices si existe
        await supabase
            .from('invoices')
            .update({
                amount: extractedData.subtotal || 0,
                vat_amount: extractedData.vat_amount || 0,
                total_amount: newTotal
            })
            .eq('tenant_id', tenantId)
            .eq('document_id', docId)

        // Actualizar expenses si existe  
        await supabase
            .from('expenses')
            .update({
                amount: newTotal
            })
            .eq('tenant_id', tenantId)
            .eq('invoice_id', docId)

        console.log(`   💰 Registros financieros actualizados con total: €${newTotal}`)

    } catch (error) {
        console.log(`   ⚠️ Error actualizando registros financieros: ${error.message}`)
    }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    retryZeroTotalDocuments()
}

export { retryZeroTotalDocuments }
