import { NextRequest, NextResponse } from 'next/server'
import { continuousLearningService } from '@/lib/continuous-learning-service'

export async function POST(request: NextRequest) {
    try {
        console.log('🔄 Iniciando proceso de reentrenamiento...')

        const { tenantId = 1, forceRetrain = false } = await request.json()

        // Get learning insights to check if retraining is needed
        const insights = await continuousLearningService.getLearningInsights(tenantId)

        console.log('📊 Insights de aprendizaje:', {
            totalInteractions: insights.totalInteractions,
            highValueInteractions: insights.highValueInteractions,
            patternsCount: insights.patterns.length
        })

        // Check if we have enough data for retraining
        if (!forceRetrain && insights.highValueInteractions < 10) {
            return NextResponse.json({
                success: false,
                message: 'No hay suficientes interacciones de alto valor para reentrenar',
                insights: {
                    totalInteractions: insights.totalInteractions,
                    highValueInteractions: insights.highValueInteractions,
                    required: 10
                }
            }, { status: 400 })
        }

        // Generate retraining data
        console.log('📋 Generando datos de reentrenamiento...')
        const retrainingData = await continuousLearningService.generateRetrainingData(tenantId)

        console.log('📊 Datos de reentrenamiento generados:', {
            interactions: retrainingData.interactions.length,
            patterns: retrainingData.patterns.length,
            performanceMetrics: retrainingData.performanceMetrics
        })

        // Update model with learning data
        console.log('🤖 Actualizando modelo con datos de aprendizaje...')
        await continuousLearningService.updateModelWithLearning(tenantId)

        return NextResponse.json({
            success: true,
            message: 'Reentrenamiento completado exitosamente',
            retrainingData: {
                interactionsCount: retrainingData.interactions.length,
                patternsCount: retrainingData.patterns.length,
                performanceMetrics: retrainingData.performanceMetrics,
                domainKnowledge: Object.keys(retrainingData.domainKnowledge).length
            },
            insights: {
                totalInteractions: insights.totalInteractions,
                highValueInteractions: insights.highValueInteractions,
                patternsCount: insights.patterns.length
            }
        })

    } catch (error) {
        console.error('❌ Error en reentrenamiento:', error)

        return NextResponse.json({
            success: false,
            error: 'Error durante el reentrenamiento',
            details: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const tenantId = parseInt(searchParams.get('tenantId') || '1')

        console.log(`📊 Obteniendo insights de aprendizaje para tenant ${tenantId}...`)

        const insights = await continuousLearningService.getLearningInsights(tenantId)

        return NextResponse.json({
            success: true,
            insights: {
                totalInteractions: insights.totalInteractions,
                highValueInteractions: insights.highValueInteractions,
                patterns: insights.patterns,
                performanceMetrics: insights.performanceMetrics,
                recentActivity: insights.recentActivity
            }
        })

    } catch (error) {
        console.error('❌ Error obteniendo insights:', error)

        return NextResponse.json({
            success: false,
            error: 'Error obteniendo insights de aprendizaje',
            details: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 })
    }
}
