import { createClient } from '@supabase/supabase-js';
import { embeddingService, type DocumentContent } from './embedding-service';
import { vectorStoreService } from './vector-store';
import { createHash } from 'crypto';

export interface IndexingJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  documentId: number;
  tenantId: number;
  filename: string;
  filePath: string;
  mimeType: string;
  size: number;
  lastModified: Date;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  embeddingGenerated?: boolean;
  embeddingVersion?: string;
  processingTime?: number;
  metadata?: Record<string, any>;
}

export interface IndexingStats {
  totalDocuments: number;
  indexedDocuments: number;
  failedDocuments: number;
  pendingDocuments: number;
  lastSyncTime: Date;
  averageProcessingTime: number;
  storageSize: number;
  embeddingsSize: number;
}

export interface IndexingConfig {
  scanIntervalMinutes: number;
  batchSize: number;
  maxConcurrentJobs: number;
  retryAttempts: number;
  retryDelayMinutes: number;
  fileTypes: string[];
  maxFileSize: number;
  enableIncrementalSync: boolean;
}

export class ScheduledIndexingService {
  private supabase: any;
  private isRunning: boolean = false;
  private activeJobs: Map<string, IndexingJob> = new Map();
  private jobQueue: IndexingJob[] = [];
  private stats: IndexingStats;
  private config: IndexingConfig;
  private scanTimer?: NodeJS.Timeout;
  private lastScanTime: Date = new Date(0);

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);

    this.config = {
      scanIntervalMinutes: parseInt(process.env.INDEXING_SCAN_INTERVAL_MINUTES || '15'),
      batchSize: parseInt(process.env.INDEXING_BATCH_SIZE || '10'),
      maxConcurrentJobs: parseInt(process.env.INDEXING_MAX_CONCURRENT_JOBS || '5'),
      retryAttempts: parseInt(process.env.INDEXING_RETRY_ATTEMPTS || '3'),
      retryDelayMinutes: parseInt(process.env.INDEXING_RETRY_DELAY_MINUTES || '5'),
      fileTypes: (process.env.INDEXING_FILE_TYPES || 'pdf,jpg,jpeg,png,tiff').split(','),
      maxFileSize: parseInt(process.env.INDEXING_MAX_FILE_SIZE_MB || '50') * 1024 * 1024,
      enableIncrementalSync: process.env.INDEXING_INCREMENTAL_SYNC !== 'false'
    };

    this.stats = {
      totalDocuments: 0,
      indexedDocuments: 0,
      failedDocuments: 0,
      pendingDocuments: 0,
      lastSyncTime: new Date(0),
      averageProcessingTime: 0,
      storageSize: 0,
      embeddingsSize: 0
    };
  }

  /**
   * Start the scheduled indexing service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Indexing service is already running');
      return;
    }

    console.log('🚀 Starting scheduled indexing service...');
    this.isRunning = true;

    // Perform initial scan
    await this.performFullScan();

    // Schedule periodic scans
    this.schedulePeriodicScans();

    console.log('✅ Scheduled indexing service started');
  }

  /**
   * Stop the scheduled indexing service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️ Indexing service is not running');
      return;
    }

    console.log('🛑 Stopping scheduled indexing service...');
    this.isRunning = false;

    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = undefined;
    }

    // Wait for active jobs to complete
    await this.waitForActiveJobs();

    console.log('✅ Scheduled indexing service stopped');
  }

  /**
   * Schedule periodic scans
   */
  private schedulePeriodicScans(): void {
    const intervalMs = this.config.scanIntervalMinutes * 60 * 1000;
    
    const scheduleNextScan = () => {
      if (!this.isRunning) return;

      this.scanTimer = setTimeout(async () => {
        try {
          await this.performIncrementalScan();
        } catch (error) {
          console.error('❌ Error during incremental scan:', error);
        } finally {
          scheduleNextScan();
        }
      }, intervalMs);
    };

    scheduleNextScan();
  }

  /**
   * Perform full scan of all documents
   */
  async performFullScan(): Promise<void> {
    console.log('🔍 Performing full scan of documents...');
    const startTime = Date.now();

    try {
      // Get all documents from storage
      const documents = await this.scanStorageForDocuments();
      console.log(`📊 Found ${documents.length} documents to process`);

      // Process documents in batches
      for (let i = 0; i < documents.length; i += this.config.batchSize) {
        const batch = documents.slice(i, i + this.config.batchSize);
        await this.processDocumentBatch(batch);
        
        // Small delay between batches to avoid overwhelming the system
        if (i + this.config.batchSize < documents.length) {
          await this.delay(1000);
        }
      }

      this.stats.lastSyncTime = new Date();
      this.stats.totalDocuments = documents.length;
      
      const scanTime = Date.now() - startTime;
      console.log(`✅ Full scan completed in ${scanTime}ms. Processed ${documents.length} documents`);

    } catch (error) {
      console.error('❌ Full scan failed:', error);
      throw error;
    }
  }

  /**
   * Perform incremental scan for new/changed documents
   */
  async performIncrementalScan(): Promise<void> {
    if (!this.config.enableIncrementalSync) {
      console.log('⏭️ Incremental sync disabled, skipping');
      return;
    }

    console.log('🔄 Performing incremental scan...');
    const startTime = Date.now();

    try {
      // Get documents modified since last scan
      const newDocuments = await this.scanStorageForNewDocuments();
      
      if (newDocuments.length === 0) {
        console.log('✅ No new documents found');
        return;
      }

      console.log(`📊 Found ${newDocuments.length} new/changed documents`);

      // Process new documents
      for (let i = 0; i < newDocuments.length; i += this.config.batchSize) {
        const batch = newDocuments.slice(i, i + this.config.batchSize);
        await this.processDocumentBatch(batch);
        
        if (i + this.config.batchSize < newDocuments.length) {
          await this.delay(500);
        }
      }

      this.stats.lastSyncTime = new Date();
      this.stats.totalDocuments += newDocuments.length;
      
      const scanTime = Date.now() - startTime;
      console.log(`✅ Incremental scan completed in ${scanTime}ms. Processed ${newDocuments.length} documents`);

    } catch (error) {
      console.error('❌ Incremental scan failed:', error);
      throw error;
    }
  }

  /**
   * Scan storage for all documents
   */
  private async scanStorageForDocuments(): Promise<any[]> {
    try {
      const { data: buckets } = await this.supabase.storage.listBuckets();
      const documents: any[] = [];

      for (const bucket of buckets || []) {
        if (bucket.name === 'documents') {
          const { data: files } = await this.supabase.storage
            .from(bucket.name)
            .list('', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });

          if (files) {
            for (const file of files) {
              if (this.shouldProcessFile(file)) {
                documents.push({
                  ...file,
                  bucket: bucket.name,
                  filePath: `${bucket.name}/${file.name}`
                });
              }
            }
          }
        }
      }

      return documents;

    } catch (error) {
      console.error('❌ Error scanning storage:', error);
      throw error;
    }
  }

  /**
   * Scan storage for new/changed documents since last scan
   */
  private async scanStorageForNewDocuments(): Promise<any[]> {
    try {
      const { data: buckets } = await this.supabase.storage.listBuckets();
      const newDocuments: any[] = [];

      for (const bucket of buckets || []) {
        if (bucket.name === 'documents') {
          const { data: files } = await this.supabase.storage
            .from(bucket.name)
            .list('', { 
              limit: 1000, 
              sortBy: { column: 'updated_at', order: 'desc' },
              search: this.lastScanTime.toISOString()
            });

          if (files) {
            for (const file of files) {
              if (this.shouldProcessFile(file) && this.isNewOrChanged(file)) {
                newDocuments.push({
                  ...file,
                  bucket: bucket.name,
                  filePath: `${bucket.name}/${file.name}`
                });
              }
            }
          }
        }
      }

      return newDocuments;

    } catch (error) {
      console.error('❌ Error scanning for new documents:', error);
      throw error;
    }
  }

  /**
   * Check if file should be processed
   */
  private shouldProcessFile(file: any): boolean {
    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!this.config.fileTypes.includes(fileExtension)) {
      return false;
    }

    // Check file size
    if (file.metadata?.size > this.config.maxFileSize) {
      return false;
    }

    // Skip temporary or system files
    if (file.name.startsWith('.') || file.name.includes('temp') || file.name.includes('tmp')) {
      return false;
    }

    return true;
  }

  /**
   * Check if file is new or changed since last scan
   */
  private isNewOrChanged(file: any): boolean {
    const fileUpdatedAt = new Date(file.updated_at || file.created_at);
    return fileUpdatedAt > this.lastScanTime;
  }

  /**
   * Process a batch of documents
   */
  private async processDocumentBatch(documents: any[]): Promise<void> {
    const promises = documents.map(doc => this.processDocument(doc));
    await Promise.allSettled(promises);
  }

  /**
   * Process a single document
   */
  private async processDocument(file: any): Promise<void> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: IndexingJob = {
      id: jobId,
      status: 'pending',
      documentId: this.extractDocumentId(file),
      tenantId: this.extractTenantId(file),
      filename: file.name,
      filePath: file.filePath,
      mimeType: file.metadata?.mimetype || 'application/octet-stream',
      size: file.metadata?.size || 0,
      lastModified: new Date(file.updated_at || file.created_at),
      createdAt: new Date(),
      metadata: { retryCount: 0 }
    };

    this.activeJobs.set(jobId, job);
    this.stats.pendingDocuments++;

    try {
      console.log(`📄 Processing document: ${file.name}`);
      job.status = 'processing';
      job.startedAt = new Date();

      // Check if document already has embedding
      const existingEmbedding = await this.checkExistingEmbedding(job.documentId, job.tenantId);
      
      if (existingEmbedding && !this.shouldRegenerateEmbedding(file, existingEmbedding)) {
        console.log(`⏭️ Skipping ${file.name} - embedding up to date`);
        job.status = 'completed';
        job.embeddingGenerated = true;
        job.embeddingVersion = existingEmbedding.version;
        this.stats.indexedDocuments++;
        return;
      }

      // Generate document content for embedding
      const documentContent = await this.extractDocumentContent(file);
      
      // Generate embedding
      const embeddingResult = await embeddingService.generateEmbedding(documentContent);
      
      if (!embeddingResult.success) {
        throw new Error(`Failed to generate embedding: ${embeddingResult.error}`);
      }

      // Store embedding in vector store
      const metadata = {
        mimeType: file.metadata?.mimetype,
        size: file.metadata?.size,
        lastModified: file.updated_at || file.created_at,
        embeddingGeneratedAt: new Date().toISOString(),
        embeddingVersion: this.generateEmbeddingVersion(file, embeddingResult),
        processingJobId: jobId
      };
      
      const vectorResult = await vectorStoreService.storeDocumentEmbedding(
        job.tenantId,
        job.documentId,
        job.filename,
        this.detectDocumentType(file),
        documentContent.ocrText,
        embeddingResult.embedding!,
        metadata
      );

      if (!vectorResult.success) {
        throw new Error(`Failed to store embedding: ${vectorResult.error}`);
      }

      // Update job status
      job.status = 'completed';
      job.completedAt = new Date();
      job.embeddingGenerated = true;
      job.embeddingVersion = this.generateEmbeddingVersion(file, embeddingResult);
      job.processingTime = Date.now() - job.startedAt!.getTime();

      this.stats.indexedDocuments++;
      this.stats.pendingDocuments--;
      
      console.log(`✅ Successfully processed ${file.name} in ${job.processingTime}ms`);

    } catch (error) {
      console.error(`❌ Failed to process ${file.name}:`, error);
      
      job.status = 'failed';
      job.completedAt = new Date();
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.processingTime = Date.now() - job.startedAt!.getTime();

      this.stats.failedDocuments++;
      this.stats.pendingDocuments--;

      // Retry logic
      if (this.shouldRetryJob(job)) {
        await this.scheduleRetry(job);
      }
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  /**
   * Extract document ID from file path or metadata
   */
  private extractDocumentId(file: any): number {
    // Try to extract from file path
    const pathParts = file.filePath.split('/');
    const filename = pathParts[pathParts.length - 1];
    
    // Look for numeric ID in filename
    const idMatch = filename.match(/(\d+)/);
    if (idMatch) {
      return parseInt(idMatch[1]);
    }

    // Fallback to hash-based ID
    return this.hashString(filename);
  }

  /**
   * Extract tenant ID from file path or metadata
   */
  private extractTenantId(file: any): number {
    // Try to extract from file path structure
    const pathParts = file.filePath.split('/');
    
    // Look for tenant ID in path (e.g., documents/tenant_1/folder/file.pdf)
    for (const part of pathParts) {
      if (part.startsWith('tenant_')) {
        const tenantMatch = part.match(/tenant_(\d+)/);
        if (tenantMatch) {
          return parseInt(tenantMatch[1]);
        }
      }
    }

    // Default to tenant 1 if not found
    return 1;
  }

  /**
   * Extract document content for embedding generation
   */
  private async extractDocumentContent(file: any): Promise<DocumentContent> {
    try {
      // Download file content
      const { data: fileBuffer, error } = await this.supabase.storage
        .from(file.bucket)
        .download(file.name);

      if (error) {
        throw new Error(`Failed to download file: ${error.message}`);
      }

      // Extract text content based on file type
      let ocrText = '';
      let title = file.name;

      if (file.metadata?.mimetype?.includes('pdf')) {
        ocrText = await this.extractTextFromPDF(fileBuffer);
      } else if (file.metadata?.mimetype?.includes('image')) {
        ocrText = await this.extractTextFromImage(fileBuffer);
      } else {
        ocrText = await this.extractTextFromText(fileBuffer);
      }

      return {
        ocrText: ocrText || file.name,
        title: title,
        metadata: {
          mimeType: file.metadata?.mimetype,
          size: file.metadata?.size,
          lastModified: file.updated_at || file.created_at
        },
        documentType: this.detectDocumentType(file)
      };

    } catch (error) {
      console.warn(`⚠️ Failed to extract content from ${file.name}:`, error);
      
      // Return basic content if extraction fails
      return {
        ocrText: file.name,
        title: file.name,
        metadata: {
          mimeType: file.metadata?.mimetype,
          size: file.metadata?.size,
          lastModified: file.updated_at || file.created_at
        },
        documentType: this.detectDocumentType(file)
      };
    }
  }

  /**
   * Extract text from PDF file
   */
  private async extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
    // This would integrate with your existing PDF processing
    // For now, return a placeholder
    return `PDF document: ${buffer.byteLength} bytes`;
  }

  /**
   * Extract text from image file
   */
  private async extractTextFromImage(buffer: ArrayBuffer): Promise<string> {
    // This would integrate with your existing OCR processing
    // For now, return a placeholder
    return `Image document: ${buffer.byteLength} bytes`;
  }

  /**
   * Extract text from text file
   */
  private async extractTextFromText(buffer: ArrayBuffer): Promise<string> {
    try {
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(buffer);
    } catch (error) {
      return `Text document: ${buffer.byteLength} bytes`;
    }
  }

  /**
   * Detect document type based on filename and content
   */
  private detectDocumentType(file: any): string {
    const filename = file.name.toLowerCase();
    
    if (filename.includes('invoice') || filename.includes('fatura')) return 'invoice';
    if (filename.includes('receipt') || filename.includes('recibo')) return 'receipt';
    if (filename.includes('contract') || filename.includes('contrato')) return 'contract';
    if (filename.includes('statement') || filename.includes('extrato')) return 'statement';
    if (filename.includes('tax') || filename.includes('imposto')) return 'tax';
    if (filename.includes('expense') || filename.includes('despesa')) return 'expense';
    
    return 'document';
  }

  /**
   * Check if document already has embedding
   */
  private async checkExistingEmbedding(documentId: number, tenantId: number): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('documents_embedding')
        .select('*')
        .eq('document_id', documentId)
        .eq('tenant_id', tenantId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Error checking existing embedding:', error);
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if embedding should be regenerated
   */
  private shouldRegenerateEmbedding(file: any, existingEmbedding: any): boolean {
    // Check if file was modified after embedding was generated
    const fileModified = new Date(file.updated_at || file.created_at);
    const embeddingGenerated = new Date(existingEmbedding.metadata?.embeddingGeneratedAt || 0);
    
    if (fileModified > embeddingGenerated) {
      return true;
    }

    // Check if embedding version is outdated
    const currentVersion = this.generateEmbeddingVersion(file, { model: 'current' });
    if (existingEmbedding.metadata?.embeddingVersion !== currentVersion) {
      return true;
    }

    return false;
  }

  /**
   * Generate embedding version hash
   */
  private generateEmbeddingVersion(file: any, embeddingResult: any): string {
    const content = `${file.name}_${file.metadata?.size}_${file.updated_at || file.created_at}_${embeddingResult.model || 'unknown'}`;
    return createHash('md5').update(content).digest('hex').substring(0, 8);
  }

  /**
   * Check if job should be retried
   */
  private shouldRetryJob(job: IndexingJob): boolean {
    const retryCount = job.metadata?.retryCount || 0;
    return retryCount < this.config.retryAttempts;
  }

  /**
   * Schedule job retry
   */
  private async scheduleRetry(job: IndexingJob): Promise<void> {
    const retryCount = (job.metadata?.retryCount || 0) + 1;
    const retryDelay = this.config.retryDelayMinutes * 60 * 1000 * retryCount;

    console.log(`⏰ Scheduling retry ${retryCount} for ${job.filename} in ${retryDelay}ms`);

    setTimeout(async () => {
      try {
        await this.processDocument({
          name: job.filename,
          filePath: job.filePath,
          bucket: 'documents',
          metadata: { mimetype: job.mimeType, size: job.size },
          updated_at: job.lastModified.toISOString(),
          created_at: job.createdAt.toISOString()
        });
      } catch (error) {
        console.error(`❌ Retry ${retryCount} failed for ${job.filename}:`, error);
      }
    }, retryDelay);
  }

  /**
   * Wait for active jobs to complete
   */
  private async waitForActiveJobs(): Promise<void> {
    if (this.activeJobs.size === 0) return;

    console.log(`⏳ Waiting for ${this.activeJobs.size} active jobs to complete...`);
    
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.activeJobs.size === 0) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 1000);
    });
  }

  /**
   * Get indexing statistics
   */
  getStats(): IndexingStats {
    return { ...this.stats };
  }

  /**
   * Get active jobs
   */
  getActiveJobs(): IndexingJob[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Get job queue status
   */
  getQueueStatus(): { queueLength: number; isRunning: boolean } {
    return {
      queueLength: this.jobQueue.length,
      isRunning: this.isRunning
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<IndexingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Indexing configuration updated:', this.config);
  }

  /**
   * Force a scan now
   */
  async forceScan(): Promise<void> {
    console.log('🔧 Force scan requested');
    await this.performIncrementalScan();
  }

  /**
   * Clear failed jobs
   */
  clearFailedJobs(): void {
    this.stats.failedDocuments = 0;
    console.log('🧹 Failed jobs cleared');
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

// Export singleton instance
export const scheduledIndexingService = new ScheduledIndexingService();
