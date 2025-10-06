import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const {
            tenantId = 1,
            interactionId,
            feedbackType,
            rating,
            feedbackText,
            isHelpful
        } = await request.json()

        console.log('📝 Procesando feedback de usuario...', {
            tenantId,
            interactionId,
            feedbackType,
            rating,
            isHelpful
        })

        // Validate required fields
        if (!feedbackType) {
            return NextResponse.json({
                success: false,
                error: 'feedbackType es requerido'
            }, { status: 400 })
        }

        // Store feedback
        const { data, error } = await supabase
            .from('learning_feedback')
            .insert({
                tenant_id: tenantId,
                interaction_id: interactionId,
                feedback_type: feedbackType,
                rating: rating,
                feedback_text: feedbackText,
                is_helpful: isHelpful
            })
            .select()
            .single()

        if (error) {
            console.error('❌ Error almacenando feedback:', error)
            throw error
        }

        // If this is a correction, also store it as a learning interaction
        if (feedbackType === 'correction' && feedbackText) {
            try {
                const { continuousLearningService } = await import('@/lib/continuous-learning-service')

                await continuousLearningService.storeInteraction({
                    tenantId,
                    interactionType: 'correction',
                    userInput: feedbackText,
                    context: 'User correction feedback',
                    aiResponse: 'Correction received',
                    confidence: 0.9, // High confidence in user corrections
                    model: 'user_feedback',
                    learningValue: 0.95, // Very high learning value for corrections
                    timestamp: new Date(),
                    source: 'manual',
                    metadata: {
                        originalInteractionId: interactionId,
                        feedbackType: 'correction'
                    }
                })

                console.log('🧠 Corrección almacenada como interacción de aprendizaje')
            } catch (learningError) {
                console.error('❌ Error almacenando corrección para aprendizaje:', learningError)
                // Don't fail the request if learning storage fails
            }
        }

        console.log('✅ Feedback almacenado correctamente')

        return NextResponse.json({
            success: true,
            message: 'Feedback almacenado correctamente',
            feedback: {
                id: data.id,
                feedbackType: data.feedback_type,
                rating: data.rating,
                isHelpful: data.is_helpful,
                createdAt: data.created_at
            }
        })

    } catch (error) {
        console.error('❌ Error procesando feedback:', error)

        return NextResponse.json({
            success: false,
            error: 'Error procesando feedback',
            details: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const tenantId = parseInt(searchParams.get('tenantId') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')

        console.log(`📊 Obteniendo feedback para tenant ${tenantId}...`)

        const { data, error } = await supabase
            .from('learning_feedback')
            .select(`
        *,
        learning_interactions!inner(
          user_input,
          ai_response,
          confidence,
          model
        )
      `)
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('❌ Error obteniendo feedback:', error)
            throw error
        }

        // Calculate feedback statistics
        const stats = {
            total: data.length,
            byType: data.reduce((acc, item) => {
                acc[item.feedback_type] = (acc[item.feedback_type] || 0) + 1
                return acc
            }, {} as Record<string, number>),
            averageRating: data
                .filter(item => item.rating)
                .reduce((sum, item) => sum + item.rating, 0) /
                data.filter(item => item.rating).length || 0,
            helpfulRate: data
                .filter(item => item.is_helpful !== null)
                .reduce((sum, item) => sum + (item.is_helpful ? 1 : 0), 0) /
                data.filter(item => item.is_helpful !== null).length || 0
        }

        return NextResponse.json({
            success: true,
            feedback: data,
            stats
        })

    } catch (error) {
        console.error('❌ Error obteniendo feedback:', error)

        return NextResponse.json({
            success: false,
            error: 'Error obteniendo feedback',
            details: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 })
    }
}

