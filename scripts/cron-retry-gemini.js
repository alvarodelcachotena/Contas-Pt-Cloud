#!/usr/bin/env node

/**
 * Script para reintentar automáticamente documentos que fallaron por sobrecarga de Gemini
 * Este script debería ejecutarse cada 5 minutos para procesar documentos pendientes
 */

import { createClient } from '@supabase/supabase-js'
import { DocumentAIService } from '../lib/gemini-ai-service.js'
import dotenv from 'dotenv'

// Configurar dotenv
dotenv.config()

async function retryPendingDocuments() {
    console.log(`🔄 === RETRY AUTOMÁTICO DE DOCUMENTOS === ${new Date().toLocaleTimeString()}\n`)

    try {
        // Crear cliente de Supabase
        const supabaseUrl = process.env.SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Configuración de Supabase faltante')
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // Buscar documentos pendientes o fallidos que necesiten reintento
        console.log('🔍 Buscando documentos para reintentar...')

        const { data: pendingDocs, error } = await supabase
            .from('documents')
            .select('*')
            .in('processing_status', ['processing', 'failed'])
            .filter('extracted_data', 'ilike', '%503%') // Documentos que fallaron por 503
            .order('created_at', { ascending: true })
            .limit(5) // Procesar máximo 5 documentos por vez

        if (error) {
            console.error('❌ Error recuperando documentos:', error.message)
            return
        }

        if (!pendingDocs || pendingDocs.length === 0) {
            console.log('✅ No hay documentos pendientes de reintento')
            return
        }

        console.log(`📄 Encontrados ${pendingDocs.length} documentos para reintento`)

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
        for (const doc of pendingDocs) {
            try {
                console.log(`\n🔄 Procesando documento ${doc.id}: ${doc.filename}`)

                // Descargar archivo desde storage
                if (!doc.file_path) {
                    console.log(`   ⚠️ Sin ruta de archivo, marcando como fallido`)
                    await supabase
                        .from('documents')
                        .update({
                            processing_status: 'failed',
                            extracted_data: {
                                ...doc.extracted_data,
                                final_error: 'File path missing',
                                retry_timestamp: new Date().toISOString()
                            }
                        })
                        .eq('id', doc.id)
                    errorCount++
                    continue
                }

                const { data: fileData, error: downloadError } = await Supabase.storage
                    .from('documents')
                    .download(doc.file_path)

                if (downloadError) {
                    console.log(`   ❌ Error descargando archivo: ${downloadError.message}`)
                    errorCount++
                    continue
                }

                // Reintentar análisis con IA
                const analysisResult = await aiService.analyzeDocument(
                    Buffer.from(await fileData.arrayBuffer()),
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

                successCount++
                console.log(`   🎉 Documento ${doc.id} procesado exitosamente en reintento`)

                // Pequeña pausa entre documentos
                await new Promise(resolve => setTimeout(resolve, 3000))

            } catch (docError) {
                console.log(`   ❌ Error procesando documento ${doc.id}: ${docError.message}`)

                // Marcar como fallido definitivamente después de varios intentos
                const retryCount = doc.extracted_data?.retry_count || 0
                if (retryCount >= 3) {
                    await supabase
                        .from('documents')
                        .update({
                            processing_status: 'failed_permanently',
                            extracted_data: {
                                ...doc.extracted_data,
                                retry_count: retryCount + 1,
                                final_error: docError.message,
                                retry_timestamp: new Date().toISOString()
                            }
                        })
                        .eq('id', doc.id)
                    console.log(`   🚫 Documento ${doc.id} marcado como fallido permanente después de ${retryCount + 1} intentos`)
                } else {
                    await supabase
                        .from('documents')
                        .update({
                            extracted_data: {
                                ...doc.extracted_data,
                                retry_count: retryCount + 1,
                                retry_error: docError.message,
                                retry_timestamp: new Date().toISOString()
                            }
                        })
                        .eq('id', doc.id)
                    console.log(`   🔄 Documento ${doc.id} quedará para siguiente intento (${retryCount + 1}/3)`)
                }

                errorCount++
            }
        }

        console.log(`\n📊 Resumen de procesamiento:`)
        console.log(`   ✅ Exitosos: ${successCount}`)
        console.log(`   ❌ Errores: ${errorCount}`)
        console.log(`   📄 Total procesados: ${pendingDocs.length}`)

    } catch (error) {
        console.error('\n❌ Error en proceso de retry:', error)
    }
}
