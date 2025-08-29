import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { documentsEmbedding } from '../shared/schema';

export interface EmbeddingResult {
  success: boolean;
  embedding?: number[];
  error?: string;
  model?: string;
  dimensions?: number;
  processingTime?: number;
}

export interface DocumentContent {
  ocrText: string;
  title: string;
  metadata: Record<string, any>;
  documentType: string;
}

export class EmbeddingService {
  private openai: OpenAI | null = null;
  private supabase: any;
  private cache: Map<string, EmbeddingResult> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    // Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_ANON_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Generate embedding for document content using the best available model
   */
  async generateEmbedding(
    content: DocumentContent,
    preferredModel?: 'openai' | 'instructor' | 'sentence-transformers'
  ): Promise<EmbeddingResult> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(content);
      const cachedResult = this.getCachedEmbedding(cacheKey);
      if (cachedResult) {
        return {
          ...cachedResult,
          processingTime: Date.now() - startTime,
          model: cachedResult.model + ' (cached)'
        };
      }

      // Try preferred model first, then fallback to available models
      const models = this.getAvailableModels(preferredModel);
      
      for (const model of models) {
        try {
          const result = await this.generateEmbeddingWithModel(content, model);
          if (result.success) {
            // Cache the result
            this.cacheEmbedding(cacheKey, result);
            return {
              ...result,
              processingTime: Date.now() - startTime
            };
          }
        } catch (error) {
          console.warn(`Failed to generate embedding with ${model}:`, error);
          continue;
        }
      }

      return {
        success: false,
        error: 'No embedding models available'
      };

    } catch (error) {
      console.error('Error generating embedding:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate embedding using OpenAI
   */
  private async generateEmbeddingWithOpenAI(content: DocumentContent): Promise<EmbeddingResult> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    const text = this.prepareTextForEmbedding(content);
    
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1536
    });

    return {
      success: true,
      embedding: response.data[0].embedding,
      model: 'openai-text-embedding-3-small',
      dimensions: 1536
    };
  }

  /**
   * Generate embedding using InstructorXL (local model)
   */
  private async generateEmbeddingWithInstructorXL(content: DocumentContent): Promise<EmbeddingResult> {
    // This would require running InstructorXL locally or via API
    // For now, we'll implement a placeholder
    throw new Error('InstructorXL not yet implemented - requires local model setup');
  }

  /**
   * Generate embedding using sentence-transformers (local model)
   */
  private async generateEmbeddingWithSentenceTransformers(content: DocumentContent): Promise<EmbeddingResult> {
    // This would require running sentence-transformers locally
    // For now, we'll implement a placeholder
    throw new Error('Sentence-transformers not yet implemented - requires local model setup');
  }

  /**
   * Generate embedding with specific model
   */
  private async generateEmbeddingWithModel(content: DocumentContent, model: string): Promise<EmbeddingResult> {
    switch (model) {
      case 'openai':
        return this.generateEmbeddingWithOpenAI(content);
      case 'instructor':
        return this.generateEmbeddingWithInstructorXL(content);
      case 'sentence-transformers':
        return this.generateEmbeddingWithSentenceTransformers(content);
      default:
        throw new Error(`Unknown model: ${model}`);
    }
  }

  /**
   * Get available models in order of preference
   */
  private getAvailableModels(preferredModel?: string): string[] {
    const availableModels: string[] = [];
    
    // Add preferred model first if specified
    if (preferredModel && this.isModelAvailable(preferredModel)) {
      availableModels.push(preferredModel);
    }

    // Add other available models
    if (this.isModelAvailable('openai')) {
      availableModels.push('openai');
    }
    
    if (this.isModelAvailable('instructor')) {
      availableModels.push('instructor');
    }
    
    if (this.isModelAvailable('sentence-transformers')) {
      availableModels.push('sentence-transformers');
    }

    return availableModels;
  }

  /**
   * Check if a model is available
   */
  private isModelAvailable(model: string): boolean {
    switch (model) {
      case 'openai':
        return !!process.env.OPENAI_API_KEY;
      case 'instructor':
        return !!(process.env.INSTRUCTOR_API_URL || process.env.INSTRUCTOR_LOCAL_PATH);
      case 'sentence-transformers':
        return !!process.env.SENTENCE_TRANSFORMERS_PATH;
      default:
        return false;
    }
  }

  /**
   * Prepare text for embedding by combining OCR, title, and metadata
   */
  private prepareTextForEmbedding(content: DocumentContent): string {
    const parts: string[] = [];

    // Add title if available
    if (content.title && content.title.trim()) {
      parts.push(`Title: ${content.title.trim()}`);
    }

    // Add document type
    if (content.documentType) {
      parts.push(`Type: ${content.documentType}`);
    }

    // Add OCR text (truncated if too long)
    if (content.ocrText && content.ocrText.trim()) {
      const maxOcrLength = 4000; // OpenAI limit is 8192, but we'll be conservative
      const truncatedOcr = content.ocrText.trim().length > maxOcrLength 
        ? content.ocrText.trim().substring(0, maxOcrLength) + '...'
        : content.ocrText.trim();
      parts.push(`Content: ${truncatedOcr}`);
    }

    // Add relevant metadata
    const relevantMetadata = this.extractRelevantMetadata(content.metadata);
    if (relevantMetadata) {
      parts.push(`Metadata: ${relevantMetadata}`);
    }

    return parts.join('\n\n');
  }

  /**
   * Extract relevant metadata for embedding
   */
  private extractRelevantMetadata(metadata: Record<string, any>): string | null {
    const relevantKeys = ['vendor', 'issuer', 'category', 'description', 'amount', 'currency'];
    const relevant: string[] = [];

    for (const key of relevantKeys) {
      if (metadata[key] && typeof metadata[key] === 'string') {
        relevant.push(`${key}: ${metadata[key]}`);
      }
    }

    return relevant.length > 0 ? relevant.join(', ') : null;
  }

  /**
   * Generate cache key for content
   */
  private generateCacheKey(content: DocumentContent): string {
    const text = this.prepareTextForEmbedding(content);
    return this.hashString(text);
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Get cached embedding if available and not expired
   */
  private getCachedEmbedding(cacheKey: string): EmbeddingResult | null {
    const cached = this.cache.get(cacheKey);
    const expiry = this.cacheExpiry.get(cacheKey);
    
    if (!cached || !expiry) {
      return null;
    }

    if (Date.now() > expiry) {
      // Remove expired cache entry
      this.cache.delete(cacheKey);
      this.cacheExpiry.delete(cacheKey);
      return null;
    }

    return cached;
  }

  /**
   * Cache embedding result
   */
  private cacheEmbedding(cacheKey: string, result: EmbeddingResult): void {
    this.cache.set(cacheKey, result);
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);
    
    // Clean up old cache entries if cache gets too large
    if (this.cache.size > 1000) {
      this.cleanupCache();
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const entries = Array.from(this.cacheExpiry.entries());
    for (const [key, expiry] of entries) {
      if (now > expiry) {
        this.cache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();
