import { createClient } from '@supabase/supabase-js';
import { embeddingService, type DocumentContent } from './embedding-service';
import { vectorStoreService } from './vector-store';
import { auditLoggingService, type RAGQueryLogData } from './audit-logging-service';

export interface RAGQuery {
  query: string;
  tenantId: number;
  topK?: number;
  similarityThreshold?: number;
  includeMetadata?: boolean;
  includeContent?: boolean;
  userId?: number;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  requestHeaders?: Record<string, any>;
}

export interface RAGDocument {
  documentId: number;
  filename: string;
  documentType: string;
  similarity: number;
  highlightedMatch: string;
  metadata?: Record<string, any>;
  content?: string;
  embeddingId: number;
}

export interface RAGResponse {
  success: boolean;
  query: string;
  documents: RAGDocument[];
  totalResults: number;
  processingTime: number;
  model: string;
  error?: string;
}

export interface RAGStats {
  totalQueries: number;
  averageResponseTime: number;
  cacheHitRate: number;
  topQueries: Array<{ query: string; count: number }>;
}

export class RAGService {
  private supabase: any;
  private queryCache: Map<string, RAGResponse> = new Map();
  private queryStats: Array<{ query: string; responseTime: number; timestamp: number }> = [];
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_CACHE_SIZE = 1000;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_ANON_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Main RAG query method - semantic search with document retrieval
   */
  async query(query: RAGQuery): Promise<RAGResponse> {
    const startTime = Date.now();
    let response: RAGResponse;
    
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(query);
      const cachedResponse = this.getCachedResponse(cacheKey);
      if (cachedResponse) {
        response = {
          ...cachedResponse,
          processingTime: Date.now() - startTime,
          model: cachedResponse.model + ' (cached)'
        };
        
        // Log cached query
        await this.logRAGQuery(query, response, startTime, true, cacheKey);
        return response;
      }

      // Generate embedding for the query
      const queryContent: DocumentContent = {
        ocrText: query.query,
        title: query.query,
        metadata: {},
        documentType: 'query'
      };

      const embeddingResult = await embeddingService.generateEmbedding(queryContent);
      if (!embeddingResult.success) {
        response = {
          success: false,
          query: query.query,
          documents: [],
          totalResults: 0,
          processingTime: Date.now() - startTime,
          model: 'unknown',
          error: `Failed to generate query embedding: ${embeddingResult.error}`
        };
        
        // Log failed query
        await this.logRAGQuery(query, response, startTime, false);
        return response;
      }

      // Search for similar documents
      const searchResult = await this.searchSimilarDocuments(
        query.tenantId,
        embeddingResult.embedding!,
        query.topK || 5,
        query.similarityThreshold || 0.7
      );

      if (!searchResult.success) {
        response = {
          success: false,
          query: query.query,
          documents: [],
          totalResults: 0,
          processingTime: Date.now() - startTime,
          model: embeddingResult.model || 'unknown',
          error: `Failed to search documents: ${searchResult.error}`
        };
        
        // Log failed query
        await this.logRAGQuery(query, response, startTime, false);
        return response;
      }

      // Process and enhance results
      const enhancedDocuments = await this.enhanceSearchResults(
        searchResult.documents!,
        query.query,
        query.includeMetadata,
        query.includeContent
      );

      response = {
        success: true,
        query: query.query,
        documents: enhancedDocuments,
        totalResults: enhancedDocuments.length,
        processingTime: Date.now() - startTime,
        model: embeddingResult.model || 'unknown'
      };

      // Cache the response
      this.cacheResponse(cacheKey, response);
      
      // Update statistics
      this.updateQueryStats(query.query, response.processingTime);
      
      // Log successful query
      await this.logRAGQuery(query, response, startTime, false, cacheKey);

      return response;

    } catch (error) {
      console.error('Error in RAG query:', error);
      response = {
        success: false,
        query: query.query,
        documents: [],
        totalResults: 0,
        processingTime: Date.now() - startTime,
        model: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      // Log failed query
      await this.logRAGQuery(query, response, startTime, false);
      return response;
    }
  }

  /**
   * Search for similar documents using vector similarity
   */
  private async searchSimilarDocuments(
    tenantId: number,
    queryEmbedding: number[],
    topK: number,
    threshold: number
  ): Promise<{ success: boolean; documents?: any[]; error?: string }> {
    try {
      // Try to use the RPC function first
      const { data, error } = await this.supabase.rpc('match_documents', {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        match_threshold: threshold,
        match_count: topK,
        tenant_filter: tenantId
      });

      if (error) {
        console.warn('RPC function failed, falling back to manual search:', error);
        return this.manualSimilaritySearch(tenantId, queryEmbedding, topK, threshold);
      }

      return { success: true, documents: data || [] };

    } catch (error) {
      console.warn('RPC call failed, using manual search:', error);
      return this.manualSimilaritySearch(tenantId, queryEmbedding, topK, threshold);
    }
  }

  /**
   * Manual similarity search fallback
   */
  private async manualSimilaritySearch(
    tenantId: number,
    queryEmbedding: number[],
    topK: number,
    threshold: number
  ): Promise<{ success: boolean; documents?: any[]; error?: string }> {
    try {
      // Get all embeddings for the tenant
      const { data: embeddings, error } = await this.supabase
        .from('documents_embedding')
        .select('*')
        .eq('tenant_id', tenantId)
        .not('embedding', 'is', null);

      if (error) {
        return { success: false, error: error.message };
      }

      if (!embeddings || embeddings.length === 0) {
        return { success: true, documents: [] };
      }

             // Calculate similarities manually
       const similarities = embeddings.map((embedding: any) => {
         const embeddingVector = this.parseVectorString(embedding.embedding);
         const similarity = this.cosineSimilarity(queryEmbedding, embeddingVector);
         return { ...embedding, similarity };
       });

       // Filter by threshold and sort by similarity
       const filtered = similarities
         .filter((doc: any) => doc.similarity >= threshold)
         .sort((a: any, b: any) => b.similarity - a.similarity)
         .slice(0, topK);

      return { success: true, documents: filtered };

    } catch (error) {
      return { success: false, error: 'Manual search failed' };
    }
  }

  /**
   * Parse vector string from database
   */
  private parseVectorString(vectorStr: string): number[] {
    try {
      // Remove brackets and split by comma
      const cleanStr = vectorStr.replace(/[\[\]]/g, '');
      return cleanStr.split(',').map(Number);
    } catch (error) {
      console.error('Error parsing vector string:', vectorStr);
      return [];
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Enhance search results with additional information
   */
  private async enhanceSearchResults(
    documents: any[],
    query: string,
    includeMetadata?: boolean,
    includeContent?: boolean
  ): Promise<RAGDocument[]> {
    const enhanced: RAGDocument[] = [];

    for (const doc of documents) {
      const enhancedDoc: RAGDocument = {
        documentId: doc.document_id,
        filename: doc.filename,
        documentType: doc.document_type,
        similarity: doc.similarity,
        highlightedMatch: this.generateHighlightedMatch(doc.ocr_text, query),
        embeddingId: doc.id
      };

      // Include metadata if requested
      if (includeMetadata && doc.metadata) {
        enhancedDoc.metadata = doc.metadata;
      }

      // Include content if requested
      if (includeContent && doc.ocr_text) {
        enhancedDoc.content = doc.ocr_text;
      }

      enhanced.push(enhancedDoc);
    }

    return enhanced;
  }

  /**
   * Generate highlighted match text
   */
  private generateHighlightedMatch(content: string, query: string): string {
    if (!content || !query) {
      return content || '';
    }

    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    let highlighted = content;

    // Simple highlighting - wrap matching words in **
    queryWords.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      highlighted = highlighted.replace(regex, '**$1**');
    });

    // Truncate if too long
    const maxLength = 300;
    if (highlighted.length > maxLength) {
      const truncated = highlighted.substring(0, maxLength);
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > maxLength * 0.8) {
        highlighted = truncated.substring(0, lastSpace) + '...';
      } else {
        highlighted = truncated + '...';
      }
    }

    return highlighted;
  }

  /**
   * Generate cache key for query
   */
  private generateCacheKey(query: RAGQuery): string {
    const key = `${query.tenantId}:${query.query}:${query.topK}:${query.similarityThreshold}:${query.includeMetadata}:${query.includeContent}`;
    return this.hashString(key);
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  /**
   * Get cached response if available
   */
  private getCachedResponse(cacheKey: string): RAGResponse | null {
    const cached = this.queryCache.get(cacheKey);
    if (!cached) {
      return null;
    }

    // Check if cache is still valid (30 minutes TTL)
    const now = Date.now();
    if (now - cached.processingTime > this.CACHE_TTL) {
      this.queryCache.delete(cacheKey);
      return null;
    }

    return cached;
  }

  /**
   * Cache response
   */
  private cacheResponse(cacheKey: string, response: RAGResponse): void {
    this.queryCache.set(cacheKey, response);
    
    // Clean up if cache gets too large
    if (this.queryCache.size > this.MAX_CACHE_SIZE) {
      this.cleanupCache();
    }
  }

  /**
   * Clean up old cache entries
   */
  private cleanupCache(): void {
         const now = Date.now();
     const entries = Array.from(this.queryCache.entries());
     for (const [key, response] of entries) {
       if (now - response.processingTime > this.CACHE_TTL) {
         this.queryCache.delete(key);
       }
     }
  }

  /**
   * Update query statistics
   */
  private updateQueryStats(query: string, responseTime: number): void {
    this.queryStats.push({
      query,
      responseTime,
      timestamp: Date.now()
    });

    // Keep only last 1000 queries
    if (this.queryStats.length > 1000) {
      this.queryStats = this.queryStats.slice(-1000);
    }
  }

  /**
   * Log RAG query to audit logging service
   */
  private async logRAGQuery(
    query: RAGQuery,
    response: RAGResponse,
    startTime: number,
    isCacheHit: boolean = false,
    cacheKey?: string
  ): Promise<void> {
    try {
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      const logData: RAGQueryLogData = {
        tenantId: query.tenantId,
        userId: query.userId,
        sessionId: query.sessionId,
        queryText: query.query,
        queryType: 'semantic_search',
        queryParameters: {
          topK: query.topK || 5,
          similarityThreshold: query.similarityThreshold || 0.7,
          includeMetadata: query.includeMetadata || false,
          includeContent: query.includeContent || false
        },
        totalResults: response.totalResults,
        vectorHitIds: response.documents.map(doc => doc.documentId),
        similarityScores: response.documents.map(doc => doc.similarity),
        processingTimeMs: processingTime,
        embeddingModel: response.model.replace(' (cached)', ''),
        cacheHit: isCacheHit,
        cacheKey: cacheKey,
        responseTimeMs: processingTime,
        userAgent: query.userAgent,
        ipAddress: query.ipAddress,
        requestHeaders: query.requestHeaders
      };

      await auditLoggingService.logRAGQuery(logData);
    } catch (error) {
      // Don't let audit logging errors break the main query
      console.warn('⚠️ Failed to log RAG query to audit service:', error);
    }
  }

  /**
   * Get RAG service statistics
   */
  getStats(): RAGStats {
    const now = Date.now();
    const recentQueries = this.queryStats.filter(
      stat => now - stat.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    const totalQueries = recentQueries.length;
    const averageResponseTime = totalQueries > 0 
      ? recentQueries.reduce((sum, stat) => sum + stat.responseTime, 0) / totalQueries 
      : 0;

    // Calculate cache hit rate (simplified)
    const cacheHitRate = 0; // TODO: Implement proper cache hit tracking

    // Get top queries
    const queryCounts = new Map<string, number>();
    recentQueries.forEach(stat => {
      queryCounts.set(stat.query, (queryCounts.get(stat.query) || 0) + 1);
    });

    const topQueries = Array.from(queryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    return {
      totalQueries,
      averageResponseTime,
      cacheHitRate,
      topQueries
    };
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.queryCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.queryCache.size,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }
}

// Export singleton instance
export const ragService = new RAGService();
