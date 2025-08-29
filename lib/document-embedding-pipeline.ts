import { embeddingService, type DocumentContent, type EmbeddingResult } from './embedding-service';
import { vectorStoreService } from './vector-store';
import { createClient } from '@supabase/supabase-js';

export interface DocumentEmbeddingPipelineResult {
  success: boolean;
  embeddingId?: number;
  error?: string;
  processingTime?: number;
  model?: string;
  dimensions?: number;
  wasCached?: boolean;
}

export interface PipelineOptions {
  preferredModel?: 'openai' | 'instructor' | 'sentence-transformers';
  forceRegenerate?: boolean;
  batchSize?: number;
}

export class DocumentEmbeddingPipeline {
  private supabase: any;
  private processingQueue: Set<number> = new Set(); // Prevent duplicate processing

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_ANON_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Process a single document and generate embedding
   */
  async processDocument(
    tenantId: number,
    documentId: number,
    options: PipelineOptions = {}
  ): Promise<DocumentEmbeddingPipelineResult> {
    const startTime = Date.now();

    try {
      // Check if already processing this document
      if (this.processingQueue.has(documentId)) {
        return {
          success: false,
          error: 'Document already being processed'
        };
      }

      this.processingQueue.add(documentId);

      // Check if embedding already exists and we're not forcing regeneration
      if (!options.forceRegenerate) {
        const existingEmbedding = await this.checkExistingEmbedding(tenantId, documentId);
        if (existingEmbedding) {
          return {
            success: true,
            embeddingId: existingEmbedding.id,
            processingTime: Date.now() - startTime,
            model: existingEmbedding.model || 'unknown',
            dimensions: existingEmbedding.dimensions || 0,
            wasCached: true
          };
        }
      }

      // Get document content
      const documentContent = await this.getDocumentContent(tenantId, documentId);
      if (!documentContent) {
        return {
          success: false,
          error: 'Document not found or no content available'
        };
      }

      // Generate embedding
      const embeddingResult = await embeddingService.generateEmbedding(
        documentContent,
        options.preferredModel
      );

      if (!embeddingResult.success) {
        return {
          success: false,
          error: embeddingResult.error || 'Failed to generate embedding',
          processingTime: Date.now() - startTime
        };
      }

      // Store embedding in vector database
      const storeResult = await this.storeDocumentEmbedding(
        tenantId,
        documentId,
        documentContent,
        embeddingResult
      );

      if (!storeResult.success) {
        return {
          success: false,
          error: storeResult.error || 'Failed to store embedding',
          processingTime: Date.now() - startTime
        };
      }

      return {
        success: true,
        embeddingId: storeResult.id,
        processingTime: Date.now() - startTime,
        model: embeddingResult.model,
        dimensions: embeddingResult.dimensions,
        wasCached: false
      };

    } catch (error) {
      console.error('Error in document embedding pipeline:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      };
    } finally {
      this.processingQueue.delete(documentId);
    }
  }

  /**
   * Process multiple documents in batch
   */
  async processDocumentsBatch(
    tenantId: number,
    documentIds: number[],
    options: PipelineOptions = {}
  ): Promise<DocumentEmbeddingPipelineResult[]> {
    const batchSize = options.batchSize || 5;
    const results: DocumentEmbeddingPipelineResult[] = [];

    // Process documents in batches to avoid overwhelming the system
    for (let i = 0; i < documentIds.length; i += batchSize) {
      const batch = documentIds.slice(i, i + batchSize);
      const batchPromises = batch.map(docId => 
        this.processDocument(tenantId, docId, options)
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches to be respectful to APIs
      if (i + batchSize < documentIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Process all documents for a tenant that don't have embeddings
   */
  async processAllPendingDocuments(
    tenantId: number,
    options: PipelineOptions = {}
  ): Promise<{
    total: number;
    processed: number;
    successful: number;
    failed: number;
    results: DocumentEmbeddingPipelineResult[];
  }> {
    try {
      // Get documents without embeddings
      const pendingDocuments = await this.getPendingDocuments(tenantId);
      
      if (pendingDocuments.length === 0) {
        return {
          total: 0,
          processed: 0,
          successful: 0,
          failed: 0,
          results: []
        };
      }

      console.log(`Processing ${pendingDocuments.length} pending documents for tenant ${tenantId}`);

      const results = await this.processDocumentsBatch(
        tenantId,
        pendingDocuments.map(doc => doc.id),
        options
      );

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      return {
        total: pendingDocuments.length,
        processed: results.length,
        successful,
        failed,
        results
      };

    } catch (error) {
      console.error('Error processing all pending documents:', error);
      throw error;
    }
  }

  /**
   * Check if document already has an embedding
   */
  private async checkExistingEmbedding(
    tenantId: number,
    documentId: number
  ): Promise<any | null> {
    try {
      const { data, error } = await this.supabase
        .from('documents_embedding')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('document_id', documentId)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get document content for embedding generation
   */
  private async getDocumentContent(
    tenantId: number,
    documentId: number
  ): Promise<DocumentContent | null> {
    try {
      // Get document details
      const { data: document, error: docError } = await this.supabase
        .from('documents')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('id', documentId)
        .single();

      if (docError || !document) {
        return null;
      }

      // Get OCR text from multi_agent_results if available
      let ocrText = '';
      try {
        const { data: agentResult } = await this.supabase
          .from('multi_agent_results')
          .select('ocr_text')
          .eq('document_id', documentId.toString())
          .single();

        if (agentResult?.ocr_text) {
          ocrText = agentResult.ocr_text;
        }
      } catch (error) {
        // OCR text not available, continue with what we have
      }

      // Extract metadata from extracted data
      const metadata: Record<string, any> = {};
      if (document.extractedData) {
        try {
          const extracted = typeof document.extractedData === 'string' 
            ? JSON.parse(document.extractedData) 
            : document.extractedData;
          
          // Extract relevant fields
          if (extracted.vendor) metadata.vendor = extracted.vendor;
          if (extracted.issuer) metadata.issuer = extracted.issuer;
          if (extracted.category) metadata.category = extracted.category;
          if (extracted.description) metadata.description = extracted.description;
          if (extracted.amount) metadata.amount = extracted.amount;
          if (extracted.currency) metadata.currency = extracted.currency;
        } catch (error) {
          console.warn('Failed to parse extracted data:', error);
        }
      }

      return {
        ocrText: ocrText || document.originalFilename || '',
        title: document.filename || document.originalFilename || 'Untitled Document',
        metadata,
        documentType: this.inferDocumentType(document.filename, metadata)
      };

    } catch (error) {
      console.error('Error getting document content:', error);
      return null;
    }
  }

  /**
   * Infer document type from filename and metadata
   */
  private inferDocumentType(filename: string, metadata: Record<string, any>): string {
    const lowerFilename = filename.toLowerCase();
    
    // Check for common document types
    if (lowerFilename.includes('invoice') || metadata.issuer) {
      return 'invoice';
    }
    if (lowerFilename.includes('receipt') || lowerFilename.includes('recibo')) {
      return 'receipt';
    }
    if (lowerFilename.includes('contract') || lowerFilename.includes('contrato')) {
      return 'contract';
    }
    if (lowerFilename.includes('statement') || lowerFilename.includes('extrato')) {
      return 'statement';
    }
    if (lowerFilename.includes('tax') || lowerFilename.includes('imposto')) {
      return 'tax_document';
    }
    
    return 'document';
  }

  /**
   * Store document embedding in vector database
   */
  private async storeDocumentEmbedding(
    tenantId: number,
    documentId: number,
    content: DocumentContent,
    embeddingResult: EmbeddingResult
  ): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
      // Convert embedding array to PostgreSQL vector format
      const vectorString = `[${embeddingResult.embedding!.join(',')}]`;

      const { data, error } = await this.supabase
        .from('documents_embedding')
        .insert({
          tenant_id: tenantId,
          document_id: documentId,
          filename: content.title,
          document_type: content.documentType,
          ocr_text: content.ocrText,
          metadata: {
            ...content.metadata,
            embedding_model: embeddingResult.model,
            embedding_dimensions: embeddingResult.dimensions,
            generated_at: new Date().toISOString()
          },
          embedding: vectorString
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error storing document embedding:', error);
        return { success: false, error: error.message };
      }

      return { success: true, id: data.id };
    } catch (error) {
      console.error('Exception storing document embedding:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Get documents that don't have embeddings yet
   */
  private async getPendingDocuments(tenantId: number): Promise<Array<{ id: number; filename: string }>> {
    try {
      const { data, error } = await this.supabase
        .from('documents')
        .select('id, filename')
        .eq('tenant_id', tenantId)
        .not('id', 'in', `(
          SELECT document_id 
          FROM documents_embedding 
          WHERE tenant_id = ${tenantId}
        )`);

      if (error) {
        console.error('Error getting pending documents:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception getting pending documents:', error);
      return [];
    }
  }

  /**
   * Get pipeline statistics
   */
  async getPipelineStats(tenantId: number): Promise<{
    totalDocuments: number;
    documentsWithEmbeddings: number;
    pendingDocuments: number;
    cacheStats: { size: number; hitRate: number };
  }> {
    try {
      // Get total documents
      const { count: totalDocuments } = await this.supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      // Get documents with embeddings
      const { count: documentsWithEmbeddings } = await this.supabase
        .from('documents_embedding')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      const pendingDocuments = (totalDocuments || 0) - (documentsWithEmbeddings || 0);
      const cacheStats = embeddingService.getCacheStats();

      return {
        totalDocuments: totalDocuments || 0,
        documentsWithEmbeddings: documentsWithEmbeddings || 0,
        pendingDocuments: Math.max(0, pendingDocuments),
        cacheStats
      };
    } catch (error) {
      console.error('Error getting pipeline stats:', error);
      return {
        totalDocuments: 0,
        documentsWithEmbeddings: 0,
        pendingDocuments: 0,
        cacheStats: { size: 0, hitRate: 0 }
      };
    }
  }
}

// Export singleton instance
export const documentEmbeddingPipeline = new DocumentEmbeddingPipeline();
