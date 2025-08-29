import { createClient } from '@supabase/supabase-js';
import { documentsEmbedding, type InsertDocumentsEmbedding } from '../shared/schema';

export class VectorStoreService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_ANON_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Store document embedding in the vector database
   */
  async storeDocumentEmbedding(
    tenantId: number,
    documentId: number,
    filename: string,
    documentType: string,
    ocrText: string,
    embedding: number[],
    metadata: Record<string, any> = {}
  ): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
      // Convert embedding array to PostgreSQL vector format
      const vectorString = `[${embedding.join(',')}]`;

      const { data, error } = await this.supabase
        .from('documents_embedding')
        .insert({
          tenant_id: tenantId,
          document_id: documentId,
          filename,
          document_type: documentType,
          ocr_text: ocrText,
          metadata,
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
   * Find similar documents using vector similarity search
   */
  async findSimilarDocuments(
    tenantId: number,
    queryEmbedding: number[],
    limit: number = 5,
    similarityThreshold: number = 0.7
  ): Promise<{ success: boolean; documents?: any[]; error?: string }> {
    try {
      const vectorString = `[${queryEmbedding.join(',')}]`;

      // Use cosine similarity search
      const { data, error } = await this.supabase.rpc('match_documents', {
        query_embedding: vectorString,
        match_threshold: similarityThreshold,
        match_count: limit,
        tenant_filter: tenantId
      });

      if (error) {
        // Fallback to manual similarity search if RPC function doesn't exist
        console.log('RPC function not available, using manual search');
        return this.manualSimilaritySearch(tenantId, queryEmbedding, limit, similarityThreshold);
      }

      return { success: true, documents: data };
    } catch (error) {
      console.error('Exception in similarity search:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Manual similarity search using raw SQL
   */
  private async manualSimilaritySearch(
    tenantId: number,
    queryEmbedding: number[],
    limit: number = 5,
    similarityThreshold: number = 0.7
  ): Promise<{ success: boolean; documents?: any[]; error?: string }> {
    try {
      const vectorString = `[${queryEmbedding.join(',')}]`;

      const { data, error } = await this.supabase
        .from('documents_embedding')
        .select(`
          id,
          document_id,
          filename,
          document_type,
          ocr_text,
          metadata,
          created_at
        `)
        .eq('tenant_id', tenantId)
        .order(`embedding <=> '${vectorString}'`)
        .limit(limit);

      if (error) {
        console.error('Error in manual similarity search:', error);
        return { success: false, error: error.message };
      }

      // Filter by similarity threshold (basic implementation)
      const filteredDocuments = data?.filter(doc => {
        // For now, return all documents since we can't calculate exact similarity
        // In production, you'd want to implement proper similarity calculation
        return true;
      });

      return { success: true, documents: filteredDocuments };
    } catch (error) {
      console.error('Exception in manual similarity search:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Get document embedding by ID
   */
  async getDocumentEmbedding(
    tenantId: number,
    documentId: number
  ): Promise<{ success: boolean; embedding?: any; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('documents_embedding')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('document_id', documentId)
        .single();

      if (error) {
        console.error('Error getting document embedding:', error);
        return { success: false, error: error.message };
      }

      return { success: true, embedding: data };
    } catch (error) {
      console.error('Exception getting document embedding:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Delete document embedding
   */
  async deleteDocumentEmbedding(
    tenantId: number,
    documentId: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('documents_embedding')
        .delete()
        .eq('tenant_id', tenantId)
        .eq('document_id', documentId);

      if (error) {
        console.error('Error deleting document embedding:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception deleting document embedding:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Get all embeddings for a tenant
   */
  async getTenantEmbeddings(
    tenantId: number,
    limit: number = 100
  ): Promise<{ success: boolean; embeddings?: any[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('documents_embedding')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting tenant embeddings:', error);
        return { success: false, error: error.message };
      }

      return { success: true, embeddings: data };
    } catch (error) {
      console.error('Exception getting tenant embeddings:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Update document embedding
   */
  async updateDocumentEmbedding(
    tenantId: number,
    documentId: number,
    updates: Partial<InsertDocumentsEmbedding>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('documents_embedding')
        .update(updates)
        .eq('tenant_id', tenantId)
        .eq('document_id', documentId);

      if (error) {
        console.error('Error updating document embedding:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception updating document embedding:', error);
      return { success: false, error: 'Internal server error' };
    }
  }
}

// Export singleton instance
export const vectorStoreService = new VectorStoreService();
