import { createClient } from '@supabase/supabase-js'
import { embeddingService } from './embedding-service'
import { vectorStoreService } from './vector-store'

export interface LearningInteraction {
    id?: string
    tenantId: number
    userId?: number
    sessionId?: string
    interactionType: 'question' | 'feedback' | 'correction' | 'document_analysis'

    // Input data
    userInput: string
    context?: string
    documentId?: number
    extractedData?: Record<string, any>

    // AI response
    aiResponse: string
    confidence: number
    model: string

    // Learning data
    userFeedback?: 'positive' | 'negative' | 'neutral'
    userCorrection?: string
    learningValue: number // 0-1, how valuable this interaction is for learning

    // Metadata
    timestamp: Date
    source: 'whatsapp' | 'ai_assistant' | 'api' | 'manual'
    metadata?: Record<string, any>
}

export interface LearningPattern {
    id?: string
    tenantId: number
    pattern: string
    patternType: 'question_type' | 'response_pattern' | 'correction_pattern' | 'domain_knowledge'
    frequency: number
    confidence: number
    examples: string[]
    lastUpdated: Date
}

export interface ReTrainingData {
    interactions: LearningInteraction[]
    patterns: LearningPattern[]
    domainKnowledge: Record<string, any>
    performanceMetrics: {
        accuracy: number
        userSatisfaction: number
        responseTime: number
    }
}

export class ContinuousLearningService {
    private supabase: any
    private learningThreshold = 0.7 // Minimum learning value to include in retraining
    private patternThreshold = 3 // Minimum frequency for pattern recognition

    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('tu_supabase_url_aqui') || supabaseUrl === 'tu_supabase_url_aqui/') {
            throw new Error('Missing or invalid Supabase configuration')
        }

        this.supabase = createClient(supabaseUrl, supabaseServiceKey)
    }

    /**
     * Store a learning interaction for future retraining
     */
    async storeInteraction(interaction: LearningInteraction): Promise<void> {
        try {
            console.log(`🧠 Storing learning interaction: ${interaction.interactionType}`)

            const { error } = await this.supabase
                .from('learning_interactions')
                .insert({
                    tenant_id: interaction.tenantId,
                    user_id: interaction.userId,
                    session_id: interaction.sessionId,
                    interaction_type: interaction.interactionType,
                    user_input: interaction.userInput,
                    context: interaction.context,
                    document_id: interaction.documentId,
                    extracted_data: interaction.extractedData,
                    ai_response: interaction.aiResponse,
                    confidence: interaction.confidence,
                    model: interaction.model,
                    user_feedback: interaction.userFeedback,
                    user_correction: interaction.userCorrection,
                    learning_value: interaction.learningValue,
                    timestamp: interaction.timestamp.toISOString(),
                    source: interaction.source,
                    metadata: interaction.metadata || {}
                })

            if (error) {
                console.error('❌ Error storing learning interaction:', error)
                throw error
            }

            console.log(`✅ Learning interaction stored successfully`)

            // Check if we should trigger pattern analysis
            await this.analyzePatterns(interaction.tenantId)

        } catch (error) {
            console.error('❌ Error in storeInteraction:', error)
            throw error
        }
    }

    /**
     * Analyze patterns from recent interactions
     */
    async analyzePatterns(tenantId: number): Promise<void> {
        try {
            console.log(`🔍 Analyzing learning patterns for tenant ${tenantId}`)

            // Get recent interactions with high learning value
            const { data: interactions, error } = await this.supabase
                .from('learning_interactions')
                .select('*')
                .eq('tenant_id', tenantId)
                .gte('learning_value', this.learningThreshold)
                .order('timestamp', { ascending: false })
                .limit(100)

            if (error) {
                console.error('❌ Error fetching interactions for pattern analysis:', error)
                return
            }

            if (!interactions || interactions.length === 0) {
                console.log('📊 No high-value interactions found for pattern analysis')
                return
            }

            // Analyze question patterns
            await this.analyzeQuestionPatterns(interactions, tenantId)

            // Analyze response patterns
            await this.analyzeResponsePatterns(interactions, tenantId)

            // Analyze correction patterns
            await this.analyzeCorrectionPatterns(interactions, tenantId)

            console.log(`✅ Pattern analysis completed for tenant ${tenantId}`)

        } catch (error) {
            console.error('❌ Error in analyzePatterns:', error)
        }
    }

    /**
     * Analyze question patterns to understand user intent
     */
    private async analyzeQuestionPatterns(interactions: any[], tenantId: number): Promise<void> {
        const questionPatterns = new Map<string, { count: number, examples: string[] }>()

        interactions
            .filter(i => i.interaction_type === 'question')
            .forEach(interaction => {
                const question = interaction.user_input.toLowerCase()

                // Simple pattern extraction (can be enhanced with NLP)
                if (question.includes('factura') || question.includes('invoice')) {
                    const pattern = 'factura_inquiry'
                    if (!questionPatterns.has(pattern)) {
                        questionPatterns.set(pattern, { count: 0, examples: [] })
                    }
                    const patternData = questionPatterns.get(pattern)!
                    patternData.count++
                    if (patternData.examples.length < 5) {
                        patternData.examples.push(interaction.user_input)
                    }
                }

                if (question.includes('gasto') || question.includes('expense')) {
                    const pattern = 'gasto_inquiry'
                    if (!questionPatterns.has(pattern)) {
                        questionPatterns.set(pattern, { count: 0, examples: [] })
                    }
                    const patternData = questionPatterns.get(pattern)!
                    patternData.count++
                    if (patternData.examples.length < 5) {
                        patternData.examples.push(interaction.user_input)
                    }
                }
            })

        // Store patterns that meet threshold
        for (const [pattern, data] of questionPatterns.entries()) {
            if (data.count >= this.patternThreshold) {
                await this.storePattern({
                    tenantId,
                    pattern,
                    patternType: 'question_type',
                    frequency: data.count,
                    confidence: Math.min(data.count / 10, 1), // Simple confidence calculation
                    examples: data.examples,
                    lastUpdated: new Date()
                })
            }
        }
    }

    /**
     * Analyze response patterns to understand what works well
     */
    private async analyzeResponsePatterns(interactions: any[], tenantId: number): Promise<void> {
        const responsePatterns = new Map<string, { count: number, examples: string[], avgConfidence: number }>()

        interactions
            .filter(i => i.user_feedback === 'positive' || i.confidence > 0.8)
            .forEach(interaction => {
                const response = interaction.ai_response.toLowerCase()

                // Analyze successful response patterns
                if (response.includes('factura') && response.includes('€')) {
                    const pattern = 'factura_response_with_amount'
                    if (!responsePatterns.has(pattern)) {
                        responsePatterns.set(pattern, { count: 0, examples: [], avgConfidence: 0 })
                    }
                    const patternData = responsePatterns.get(pattern)!
                    patternData.count++
                    patternData.avgConfidence = (patternData.avgConfidence + interaction.confidence) / 2
                    if (patternData.examples.length < 3) {
                        patternData.examples.push(interaction.ai_response)
                    }
                }
            })

        // Store successful response patterns
        for (const [pattern, data] of responsePatterns.entries()) {
            if (data.count >= this.patternThreshold) {
                await this.storePattern({
                    tenantId,
                    pattern,
                    patternType: 'response_pattern',
                    frequency: data.count,
                    confidence: data.avgConfidence,
                    examples: data.examples,
                    lastUpdated: new Date()
                })
            }
        }
    }

    /**
     * Analyze correction patterns to understand common mistakes
     */
    private async analyzeCorrectionPatterns(interactions: any[], tenantId: number): Promise<void> {
        const correctionPatterns = new Map<string, { count: number, examples: string[] }>()

        interactions
            .filter(i => i.interaction_type === 'correction' && i.user_correction)
            .forEach(interaction => {
                const correction = interaction.user_correction.toLowerCase()

                // Analyze common correction patterns
                if (correction.includes('iva') || correction.includes('vat')) {
                    const pattern = 'vat_correction'
                    if (!correctionPatterns.has(pattern)) {
                        correctionPatterns.set(pattern, { count: 0, examples: [] })
                    }
                    const patternData = correctionPatterns.get(pattern)!
                    patternData.count++
                    if (patternData.examples.length < 5) {
                        patternData.examples.push(interaction.user_correction)
                    }
                }
            })

        // Store correction patterns
        for (const [pattern, data] of correctionPatterns.entries()) {
            if (data.count >= this.patternThreshold) {
                await this.storePattern({
                    tenantId,
                    pattern,
                    patternType: 'correction_pattern',
                    frequency: data.count,
                    confidence: 0.9, // High confidence in correction patterns
                    examples: data.examples,
                    lastUpdated: new Date()
                })
            }
        }
    }

    /**
     * Store a learning pattern
     */
    private async storePattern(pattern: LearningPattern): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('learning_patterns')
                .upsert({
                    tenant_id: pattern.tenantId,
                    pattern: pattern.pattern,
                    pattern_type: pattern.patternType,
                    frequency: pattern.frequency,
                    confidence: pattern.confidence,
                    examples: pattern.examples,
                    last_updated: pattern.lastUpdated.toISOString()
                }, {
                    onConflict: 'tenant_id,pattern'
                })

            if (error) {
                console.error('❌ Error storing learning pattern:', error)
            } else {
                console.log(`✅ Learning pattern stored: ${pattern.pattern}`)
            }
        } catch (error) {
            console.error('❌ Error in storePattern:', error)
        }
    }

    /**
     * Generate retraining data for the AI model
     */
    async generateRetrainingData(tenantId: number): Promise<ReTrainingData> {
        try {
            console.log(`🔄 Generating retraining data for tenant ${tenantId}`)

            // Get high-value interactions
            const { data: interactions, error: interactionsError } = await this.supabase
                .from('learning_interactions')
                .select('*')
                .eq('tenant_id', tenantId)
                .gte('learning_value', this.learningThreshold)
                .order('timestamp', { ascending: false })
                .limit(500)

            if (interactionsError) {
                throw interactionsError
            }

            // Get learning patterns
            const { data: patterns, error: patternsError } = await this.supabase
                .from('learning_patterns')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('frequency', { ascending: false })

            if (patternsError) {
                throw patternsError
            }

            // Calculate performance metrics
            const performanceMetrics = await this.calculatePerformanceMetrics(tenantId)

            // Generate domain knowledge
            const domainKnowledge = await this.generateDomainKnowledge(tenantId, interactions || [])

            const retrainingData: ReTrainingData = {
                interactions: (interactions || []).map(i => ({
                    id: i.id,
                    tenantId: i.tenant_id,
                    userId: i.user_id,
                    sessionId: i.session_id,
                    interactionType: i.interaction_type,
                    userInput: i.user_input,
                    context: i.context,
                    documentId: i.document_id,
                    extractedData: i.extracted_data,
                    aiResponse: i.ai_response,
                    confidence: i.confidence,
                    model: i.model,
                    userFeedback: i.user_feedback,
                    userCorrection: i.user_correction,
                    learningValue: i.learning_value,
                    timestamp: new Date(i.timestamp),
                    source: i.source,
                    metadata: i.metadata
                })),
                patterns: (patterns || []).map(p => ({
                    id: p.id,
                    tenantId: p.tenant_id,
                    pattern: p.pattern,
                    patternType: p.pattern_type,
                    frequency: p.frequency,
                    confidence: p.confidence,
                    examples: p.examples,
                    lastUpdated: new Date(p.last_updated)
                })),
                domainKnowledge,
                performanceMetrics
            }

            console.log(`✅ Retraining data generated: ${retrainingData.interactions.length} interactions, ${retrainingData.patterns.length} patterns`)
            return retrainingData

        } catch (error) {
            console.error('❌ Error generating retraining data:', error)
            throw error
        }
    }

    /**
     * Calculate performance metrics from interactions
     */
    private async calculatePerformanceMetrics(tenantId: number): Promise<ReTrainingData['performanceMetrics']> {
        try {
            const { data: metrics, error } = await this.supabase
                .from('learning_interactions')
                .select('confidence, user_feedback, created_at')
                .eq('tenant_id', tenantId)
                .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

            if (error) {
                console.error('❌ Error calculating performance metrics:', error)
                return { accuracy: 0, userSatisfaction: 0, responseTime: 0 }
            }

            if (!metrics || metrics.length === 0) {
                return { accuracy: 0, userSatisfaction: 0, responseTime: 0 }
            }

            // Calculate accuracy (average confidence)
            const accuracy = metrics.reduce((sum, m) => sum + (m.confidence || 0), 0) / metrics.length

            // Calculate user satisfaction (positive feedback rate)
            const positiveFeedback = metrics.filter(m => m.user_feedback === 'positive').length
            const userSatisfaction = positiveFeedback / metrics.length

            // Response time would need to be tracked separately
            const responseTime = 0 // Placeholder

            return { accuracy, userSatisfaction, responseTime }

        } catch (error) {
            console.error('❌ Error in calculatePerformanceMetrics:', error)
            return { accuracy: 0, userSatisfaction: 0, responseTime: 0 }
        }
    }

    /**
     * Generate domain knowledge from interactions
     */
    private async generateDomainKnowledge(tenantId: number, interactions: any[]): Promise<Record<string, any>> {
        const domainKnowledge: Record<string, any> = {
            commonQuestions: {},
            successfulResponses: {},
            commonCorrections: {},
            businessContext: {}
        }

        // Analyze common questions
        const questionCounts = new Map<string, number>()
        interactions
            .filter(i => i.interaction_type === 'question')
            .forEach(i => {
                const question = i.user_input.toLowerCase()
                questionCounts.set(question, (questionCounts.get(question) || 0) + 1)
            })

        domainKnowledge.commonQuestions = Object.fromEntries(
            Array.from(questionCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
        )

        // Analyze successful responses
        const responsePatterns = new Map<string, number>()
        interactions
            .filter(i => i.user_feedback === 'positive' || i.confidence > 0.8)
            .forEach(i => {
                const response = i.ai_response.toLowerCase()
                responsePatterns.set(response, (responsePatterns.get(response) || 0) + 1)
            })

        domainKnowledge.successfulResponses = Object.fromEntries(
            Array.from(responsePatterns.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
        )

        // Analyze common corrections
        const correctionCounts = new Map<string, number>()
        interactions
            .filter(i => i.interaction_type === 'correction' && i.user_correction)
            .forEach(i => {
                const correction = i.user_correction.toLowerCase()
                correctionCounts.set(correction, (correctionCounts.get(correction) || 0) + 1)
            })

        domainKnowledge.commonCorrections = Object.fromEntries(
            Array.from(correctionCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
        )

        return domainKnowledge
    }

    /**
     * Update the AI model with new learning data
     */
    async updateModelWithLearning(tenantId: number): Promise<void> {
        try {
            console.log(`🔄 Updating AI model with learning data for tenant ${tenantId}`)

            const retrainingData = await this.generateRetrainingData(tenantId)

            if (retrainingData.interactions.length === 0) {
                console.log('📊 No learning data available for model update')
                return
            }

            // Generate enhanced prompts based on learning patterns
            const enhancedPrompts = await this.generateEnhancedPrompts(retrainingData)

            // Update vector store with new knowledge
            await this.updateVectorStoreWithKnowledge(retrainingData, tenantId)

            // Store model update metadata
            await this.storeModelUpdate(tenantId, retrainingData, enhancedPrompts)

            console.log(`✅ AI model updated successfully with ${retrainingData.interactions.length} learning interactions`)

        } catch (error) {
            console.error('❌ Error updating AI model:', error)
            throw error
        }
    }

    /**
     * Generate enhanced prompts based on learning patterns
     */
    private async generateEnhancedPrompts(retrainingData: ReTrainingData): Promise<Record<string, string>> {
        const enhancedPrompts: Record<string, string> = {}

        // Generate prompts based on successful patterns
        retrainingData.patterns
            .filter(p => p.patternType === 'response_pattern' && p.confidence > 0.8)
            .forEach(pattern => {
                const promptKey = `enhanced_${pattern.pattern}`
                enhancedPrompts[promptKey] = `Based on successful interactions, when users ask about ${pattern.pattern}, provide responses similar to: ${pattern.examples.join(', ')}`
            })

        // Generate prompts based on correction patterns
        retrainingData.patterns
            .filter(p => p.patternType === 'correction_pattern')
            .forEach(pattern => {
                const promptKey = `correction_${pattern.pattern}`
                enhancedPrompts[promptKey] = `Common corrections for ${pattern.pattern}: ${pattern.examples.join(', ')}. Always verify these aspects.`
            })

        return enhancedPrompts
    }

    /**
     * Update vector store with new knowledge
     */
    private async updateVectorStoreWithKnowledge(retrainingData: ReTrainingData, tenantId: number): Promise<void> {
        try {
            console.log(`🔄 Updating vector store with new knowledge`)

            // Create embeddings for high-value interactions
            const highValueInteractions = retrainingData.interactions
                .filter(i => i.learningValue > 0.8)
                .slice(0, 50) // Limit to prevent overload

            for (const interaction of highValueInteractions) {
                try {
                    const embedding = await embeddingService.generateEmbedding(
                        `${interaction.userInput} ${interaction.aiResponse}`
                    )

                    await vectorStoreService.storeEmbedding({
                        tenantId,
                        content: `${interaction.userInput} ${interaction.aiResponse}`,
                        metadata: {
                            type: 'learning_interaction',
                            interactionType: interaction.interactionType,
                            confidence: interaction.confidence,
                            learningValue: interaction.learningValue,
                            source: interaction.source,
                            timestamp: interaction.timestamp.toISOString()
                        },
                        embedding
                    })
                } catch (error) {
                    console.error(`❌ Error storing embedding for interaction ${interaction.id}:`, error)
                }
            }

            console.log(`✅ Vector store updated with ${highValueInteractions.length} learning interactions`)

        } catch (error) {
            console.error('❌ Error updating vector store:', error)
            throw error
        }
    }

    /**
     * Store model update metadata
     */
    private async storeModelUpdate(tenantId: number, retrainingData: ReTrainingData, enhancedPrompts: Record<string, string>): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('model_updates')
                .insert({
                    tenant_id: tenantId,
                    update_type: 'continuous_learning',
                    interactions_count: retrainingData.interactions.length,
                    patterns_count: retrainingData.patterns.length,
                    performance_metrics: retrainingData.performanceMetrics,
                    enhanced_prompts: enhancedPrompts,
                    domain_knowledge: retrainingData.domainKnowledge,
                    created_at: new Date().toISOString()
                })

            if (error) {
                console.error('❌ Error storing model update:', error)
            } else {
                console.log('✅ Model update metadata stored')
            }
        } catch (error) {
            console.error('❌ Error in storeModelUpdate:', error)
        }
    }

    /**
     * Get learning insights for a tenant
     */
    async getLearningInsights(tenantId: number): Promise<{
        totalInteractions: number
        highValueInteractions: number
        patterns: LearningPattern[]
        performanceMetrics: ReTrainingData['performanceMetrics']
        recentActivity: LearningInteraction[]
    }> {
        try {
            // Get total interactions
            const { count: totalInteractions } = await this.supabase
                .from('learning_interactions')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)

            // Get high-value interactions
            const { count: highValueInteractions } = await this.supabase
                .from('learning_interactions')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .gte('learning_value', this.learningThreshold)

            // Get patterns
            const { data: patterns } = await this.supabase
                .from('learning_patterns')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('frequency', { ascending: false })
                .limit(20)

            // Get performance metrics
            const performanceMetrics = await this.calculatePerformanceMetrics(tenantId)

            // Get recent activity
            const { data: recentActivity } = await this.supabase
                .from('learning_interactions')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('timestamp', { ascending: false })
                .limit(10)

            return {
                totalInteractions: totalInteractions || 0,
                highValueInteractions: highValueInteractions || 0,
                patterns: (patterns || []).map(p => ({
                    id: p.id,
                    tenantId: p.tenant_id,
                    pattern: p.pattern,
                    patternType: p.pattern_type,
                    frequency: p.frequency,
                    confidence: p.confidence,
                    examples: p.examples,
                    lastUpdated: new Date(p.last_updated)
                })),
                performanceMetrics,
                recentActivity: (recentActivity || []).map(i => ({
                    id: i.id,
                    tenantId: i.tenant_id,
                    userId: i.user_id,
                    sessionId: i.session_id,
                    interactionType: i.interaction_type,
                    userInput: i.user_input,
                    context: i.context,
                    documentId: i.document_id,
                    extractedData: i.extracted_data,
                    aiResponse: i.ai_response,
                    confidence: i.confidence,
                    model: i.model,
                    userFeedback: i.user_feedback,
                    userCorrection: i.user_correction,
                    learningValue: i.learning_value,
                    timestamp: new Date(i.timestamp),
                    source: i.source,
                    metadata: i.metadata
                }))
            }

        } catch (error) {
            console.error('❌ Error getting learning insights:', error)
            throw error
        }
    }
}

export const continuousLearningService = new ContinuousLearningService()

