import * as cron from 'node-cron';
import { storage } from './storage';
import { CloudDocumentProcessor } from './agents/CloudDocumentProcessor';
import { DropboxApiClient } from './dropbox-api-client';
import { getWebSocketManager } from './websocket-server';
import type { CloudDriveConfig, InsertExpense, InsertDocument } from '@shared/schema';

export class DropboxScheduler {
  private isRunning = false;
  private cronJob: any = null;
  private processedFiles: Set<string> = new Set();
  private folderCursors: Map<string, string> = new Map(); // Store cursors for each config

  constructor() {}

  /**
   * Start the scheduled monitoring - runs every 5 minutes
   */
  start() {
    if (this.cronJob) {
      console.log('📅 Dropbox scheduler already running');
      return;
    }

    console.log('🚀 Starting Dropbox folder monitoring (every 5 minutes)...');
    // Clear processed files tracking on startup
    this.processedFiles.clear();
    
    // Run every 5 minutes: "*/5 * * * *"
    this.cronJob = cron.schedule('*/5 * * * *', async () => {
      if (this.isRunning) {
        console.log('⏳ Previous Dropbox sync still running, skipping this interval');
        return;
      }

      this.isRunning = true;
      try {
        await this.checkAllDropboxConfigs();
      } catch (error) {
        console.error('❌ Error in scheduled Dropbox check:', error);
      } finally {
        this.isRunning = false;
      }
    });

    console.log('✅ Dropbox scheduler started successfully');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.destroy();
      this.cronJob = null;
      console.log('🛑 Dropbox scheduler stopped');
    }
  }

  /**
   * Check all active Dropbox configurations for new files
   */
  private async checkAllDropboxConfigs() {
    try {
      console.log('🔍 Checking all Dropbox configurations for new files...');
      
      const configs = await this.getAllDropboxConfigs();
      console.log(`📋 Found ${configs.length} active Dropbox configuration(s)`);

      // Process each configuration
      for (const config of configs) {
        try {
          await this.processDropboxConfig(config);
        } catch (error) {
          console.error(`❌ Error processing Dropbox config ${config.id} for tenant ${config.tenantId}:`, error);
          // Continue with other configs even if one fails
        }
      }

      console.log('✅ Completed checking all Dropbox configurations');
    } catch (error) {
      console.error('❌ Error getting Dropbox configurations:', error);
    }
  }

  /**
   * Get all active Dropbox configurations from all tenants
   */
  private async getAllDropboxConfigs(): Promise<CloudDriveConfig[]> {
    try {
      // Get all tenants
      const tenants = await storage.getTenants();
      const allConfigs: CloudDriveConfig[] = [];
      
      console.log(`🔍 Fetching tenants from Supabase...`);
      console.log(`📊 Tenants query result: { data: [], error: null }`);
      console.log(`✅ Found ${tenants.length} tenant(s)`);

      // If no tenants found, let's try direct database query as fallback
      if (tenants.length === 0) {
        console.log('⚠️ No tenants found via storage, trying direct approach...');
        
        // Direct query for active Dropbox configs across all tenants
        try {
          const directConfigs = await storage.getCloudDriveConfigs(1); // Try tenant 1 directly
          console.log(`🔍 Direct query for tenant 1 found ${directConfigs.length} configs`);
          
          const dropboxConfigs = directConfigs.filter(config => 
            config.provider === 'dropbox' && config.isActive
          );
          
          if (dropboxConfigs.length > 0) {
            console.log(`✅ Found ${dropboxConfigs.length} active Dropbox config(s) via direct query`);
            return dropboxConfigs;
          }
        } catch (directError) {
          console.error('❌ Direct query also failed:', directError);
        }
        
        return [];
      }

      // For each tenant, get their Dropbox configs
      for (const tenant of tenants) {
        try {
          const configs = await storage.getCloudDriveConfigs(tenant.id);
          const dropboxConfigs = configs.filter(config => 
            config.provider === 'dropbox' && config.isActive
          );
          allConfigs.push(...dropboxConfigs);
        } catch (error) {
          console.error(`❌ Error getting configs for tenant ${tenant.id}:`, error);
        }
      }

      return allConfigs;
    } catch (error) {
      console.error('❌ Error getting tenants:', error);
      return [];
    }
  }

  /**
   * Process a single Dropbox configuration using efficient delta sync
   */
  private async processDropboxConfig(config: CloudDriveConfig) {
    console.log(`🔄 Processing Dropbox config ${config.id} (tenant: ${config.tenantId}, folder: ${config.folderPath})`);

    try {
      // Create Dropbox API client with stored tokens
      const apiClient = new DropboxApiClient(
        config.accessToken || '',
        config.refreshToken || ''
      );

      // Ensure token is valid before processing any files
      await apiClient.ensureValidToken();

      // Update configuration with fresh token if it was refreshed
      const currentToken = apiClient.getCurrentAccessToken();
      if (currentToken !== config.accessToken) {
        console.log(`🔄 Updating stored access token for config ${config.id}`);
        await storage.updateCloudDriveConfig(config.id, {
          accessToken: currentToken
        }, config.tenantId);
        // Update the config object for this processing session
        config.accessToken = currentToken;
      }

      // Get the cursor for this configuration
      const configKey = `${config.id}-${config.folderPath}`;
      let cursor = this.folderCursors.get(configKey);

      let newFiles: any[] = [];

      if (!cursor) {
        // First time sync - get initial cursor and list current files
        console.log(`📋 Initial sync for folder: ${config.folderPath}`);
        cursor = await apiClient.getLatestCursor(config.folderPath);
        this.folderCursors.set(configKey, cursor);
        
        // For initial sync, process all unprocessed files
        const folderResult = await apiClient.listFolder(config.folderPath);
        
        // Filter for document files only
        const documentFiles = folderResult.entries.filter(entry => 
          entry['.tag'] === 'file' && this.isDocumentFile(entry.name)
        );
        
        // Process all files that haven't been processed yet
        newFiles = [];
        for (const file of documentFiles) {
          const isNew = await this.isNewFile(file, config.tenantId);
          if (isNew) {
            newFiles.push(file);
          }
        }
        
        console.log(`📂 Initial sync found ${documentFiles.length} total documents, ${newFiles.length} unprocessed files`);
      } else {
        // Delta sync - check for changes since last cursor
        console.log(`🔄 Delta sync for folder: ${config.folderPath}`);
        
        try {
          const deltaResult = await apiClient.listFolderContinue(cursor);
          
          // Filter for new document files only
          newFiles = deltaResult.entries.filter(entry => 
            entry['.tag'] === 'file' && 
            this.isDocumentFile(entry.name) &&
            !this.processedFiles.has(`${config.tenantId}-${entry.path_display}`)
          );
          
          // Update cursor
          this.folderCursors.set(configKey, deltaResult.cursor);
          
          console.log(`🔄 Delta sync found ${deltaResult.entries.length} total changes, ${newFiles.length} new documents`);
        } catch (error) {
          if (error instanceof Error && error.message.includes('reset')) {
            // Cursor is invalid, reset and get new cursor
            console.log(`🔄 Cursor reset required for folder: ${config.folderPath}`);
            cursor = await apiClient.getLatestCursor(config.folderPath);
            this.folderCursors.set(configKey, cursor);
            return; // Skip processing this round, will pick up changes next time
          }
          throw error;
        }
      }
      
      if (newFiles.length === 0) {
        console.log(`📭 No new files found in Dropbox folder: ${config.folderPath}`);
        return;
      }

      console.log(`📂 Processing ${newFiles.length} new file(s) from Dropbox folder: ${config.folderPath}`);

      // Process each new file sequentially to avoid token conflicts
      for (const file of newFiles) {
        try {
          // Get fresh API client for each file to avoid token conflicts
          const freshConfig = await storage.getCloudDriveConfigById(config.id, config.tenantId);
          if (freshConfig) {
            const freshApiClient = new DropboxApiClient(freshConfig.accessToken, freshConfig.refreshToken || undefined);
            await this.processDropboxFile(freshApiClient, file, freshConfig);
          } else {
            console.error(`❌ Could not get fresh config for file ${file.name}`);
          }
        } catch (fileError) {
          console.error(`❌ Error processing file ${file.name}:`, fileError);
          // Continue with other files even if one fails
        }
      }

      // Update last sync time (token was already updated at the beginning)
      await storage.updateCloudDriveConfig(config.id, {
        lastSyncAt: new Date().toISOString()
      }, config.tenantId);

    } catch (error) {
      console.error(`❌ Error processing Dropbox config ${config.id}:`, error);
      
      // If it's an authentication error that couldn't be resolved, disable the config
      if (error instanceof Error && error.message.includes('401')) {
        console.log(`❌ Authentication failed for config ${config.id}, disabling...`);
        await storage.updateCloudDriveConfig(config.id, {
          isActive: false,
          lastSyncAt: new Date().toISOString()
        }, config.tenantId);
      }
    }
  }

  /**
   * Check if a file has been processed recently
   */
  private async isNewFile(file: any, tenantId: number): Promise<boolean> {
    const fileKey = `${tenantId}-${file.path_display}`;
    
    // Check in-memory processed files cache
    if (this.processedFiles.has(fileKey)) {
      return false;
    }
    
    // Check if document already exists in database
    try {
      const existingDocs = await storage.getDocuments(tenantId);
      const existsInDb = existingDocs.some(doc => 
        (doc.originalFilename || doc.filename) === file.name
      );
      
      if (existsInDb) {
        // Add to processed files cache to avoid future database checks
        this.processedFiles.add(fileKey);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error checking if file is new:', error);
      return true; // Process if we can't determine
    }
  }

  /**
   * Process a single file from Dropbox
   */
  private async processDropboxFile(apiClient: DropboxApiClient, file: any, config: CloudDriveConfig) {
    const fileKey = `${config.tenantId}-${file.path_display}`;
    
    try {
      console.log(`📄 Processing file: ${file.name} (${this.formatFileSize(file.size || 0)})`);
      
      // Mark as being processed
      this.processedFiles.add(fileKey);
      
      // Token freshness is handled at the configuration level, not per file
      
      // Download file content using the API client
      const fileBuffer = await apiClient.downloadFile(file.path_display || '');
      
      // Create document record first
      const documentData = {
        tenantId: config.tenantId,
        filename: `dropbox_${Date.now()}_${file.name}`,
        originalFilename: file.name,
        mimeType: this.getMimeTypeFromExtension(file.name),
        fileSize: file.size || 0,
        extractedData: null,
        processingStatus: 'processing',
        processingError: null,
        confidence: null,
        uploadedBy: 1
      };
      
      const document = await storage.createDocument(documentData);
      
      console.log(`📄 Created document record: ${document.id} for ${file.name}`);
      
      // Notify processing started
      const wsManager = getWebSocketManager();
      if (wsManager) {
        wsManager.broadcastDocumentProcessing(config.tenantId, {
          documentId: document.id.toString(),
          filename: file.name,
          status: 'processing'
        });
      }
      
      // Process with AI
      const processor = new CloudDocumentProcessor();
      const result = await processor.processDocument(
        config.tenantId,
        fileBuffer,
        this.getMimeTypeFromExtension(file.name),
        file.name
      );
      
      const extractedData = result?.data || null;
      const confidence = extractedData ? 0.85 : 0.1;
      
      // Update document with extracted data
      console.log(`📝 Updating document ${document.id} with extracted data:`, extractedData ? 'Data found' : 'No data');
      const updateData = {
        extractedData: extractedData,
        processingStatus: extractedData ? 'completed' : 'failed',
        processingError: extractedData ? null : 'No data extracted',
        confidence: confidence.toString()
      };
      
      await storage.updateDocument(document.id, updateData, config.tenantId);
      console.log(`📝 Document ${document.id} updated successfully`);
      
      // Notify processing completed
      if (wsManager) {
        wsManager.broadcastDocumentProcessing(config.tenantId, {
          documentId: document.id.toString(),
          filename: file.name,
          status: extractedData ? 'completed' : 'failed',
          extractedData: extractedData
        });
      }
      
      // Force re-fetch the extractedData from database for expense creation
      const updatedDoc = await storage.getDocuments(config.tenantId);
      const currentDoc = updatedDoc.find(d => d.id === document.id);
      const dbExtractedData = currentDoc?.extractedData ? 
        (typeof currentDoc.extractedData === 'string' ? JSON.parse(currentDoc.extractedData) : currentDoc.extractedData) 
        : null;
      
      console.log(`✅ AI processing completed for ${file.name}`);
      
      // Create expense if valid data was extracted
      const finalExtractedData = dbExtractedData || extractedData;
      console.log(`🔍 Checking extracted data for expense creation:`, JSON.stringify(finalExtractedData, null, 2));
      if (finalExtractedData && this.isValidExpenseData(finalExtractedData)) {
        await this.createExpenseFromExtraction(finalExtractedData, config.tenantId, document.id);
        console.log(`💰 Created expense from ${file.name}`);
      } else {
        console.log(`⚠️ No valid expense data found for ${file.name}. Data:`, finalExtractedData);
      }
      
    } catch (error) {
      console.error(`❌ Error processing file ${file.name}:`, error);
      // Remove from processed files so it can be retried
      this.processedFiles.delete(fileKey);
      throw error;
    }
  }

  /**
   * Create expense from extracted data
   */
  private async createExpenseFromExtraction(extractedData: any, tenantId: number, documentId: number) {
    try {
      console.log(`💼 Starting expense creation for document ${documentId}`);
      console.log(`💼 Raw extracted data:`, JSON.stringify(extractedData, null, 2));
      
      // Extract and validate required fields with comprehensive field mapping
      const amount = this.extractAmount(extractedData);
      const vendor = this.extractVendor(extractedData);
      const description = this.extractDescription(extractedData, vendor);
      const date = this.extractDate(extractedData);
      const category = this.extractCategory(extractedData);
      const vatAmount = this.extractVatAmount(extractedData);
      const vatRate = this.extractVatRate(extractedData);
      
      console.log(`💼 Parsed values - Amount: ${amount}, Vendor: ${vendor}, Date: ${date}`);
      
      if (!amount || parseFloat(amount) <= 0) {
        console.log('⚠️ No valid amount found, skipping expense creation');
        return;
      }
      
      const expense = {
        tenantId,
        vendor: vendor || 'Fornecedor Desconhecido',
        amount: parseFloat(amount.toString()).toString(),
        description: `${description} [DOC:${documentId.toString()}]`,
        expenseDate: date,
        category: category,
        vatAmount: vatAmount.toString(),
        vatRate: vatRate.toString(),
        receiptNumber: extractedData.invoice_number || extractedData.receipt_number || null,
        isDeductible: true
      };
      
      const createdExpense = await storage.createExpense(expense);
      console.log(`💰 Created expense ID ${createdExpense.id}: €${expense.amount} - ${expense.description}`);
      
      // Notify expense creation via WebSocket
      const wsManager = getWebSocketManager();
      if (wsManager) {
        wsManager.broadcastExpenseCreated(tenantId, {
          expenseId: createdExpense.id,
          vendor: expense.vendor,
          amount: parseFloat(expense.amount),
          sourceDocument: documentId.toString()
        });
      }
      
    } catch (error) {
      console.error('❌ Error creating expense from extraction:', error);
    }
  }
  
  /**
   * Extract amount with comprehensive field mapping
   */
  private extractAmount(data: any): number {
    const possibleFields = [
      'total_amount', 'amount', 'total', 'totalAmount', 'valor_total', 
      'importo_totale', 'total_value', 'net_amount', 'gross_amount'
    ];
    
    for (const field of possibleFields) {
      const value = data[field];
      if (value && !isNaN(parseFloat(value))) {
        return parseFloat(value);
      }
    }
    return 0;
  }
  
  /**
   * Extract vendor/issuer information
   */
  private extractVendor(data: any): string {
    const possibleFields = [
      'issuer', 'vendor', 'supplier', 'company', 'business_name',
      'fornecedor', 'empresa', 'razao_social', 'nome_empresa'
    ];
    
    for (const field of possibleFields) {
      const value = data[field];
      if (value && typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
    return 'Fornecedor Desconhecido';
  }
  
  /**
   * Extract description
   */
  private extractDescription(data: any, vendor: string): string {
    const possibleFields = [
      'description', 'descricao', 'produto', 'servico', 'item_description'
    ];
    
    for (const field of possibleFields) {
      const value = data[field];
      if (value && typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
    
    return `Despesa de ${vendor}`;
  }
  
  /**
   * Extract date with fallback to current date
   */
  private extractDate(data: any): string {
    const possibleFields = [
      'invoice_date', 'date', 'issueDate', 'data_emissao', 'data_documento', 
      'document_date', 'purchase_date', 'expense_date'
    ];
    
    for (const field of possibleFields) {
      const value = data[field];
      if (value) {
        // Try to parse date
        const parsedDate = new Date(value);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString().split('T')[0];
        }
      }
    }
    
    return new Date().toISOString().split('T')[0];
  }
  
  /**
   * Extract category with Portuguese business classification
   */
  private extractCategory(data: any): string {
    const possibleFields = ['category', 'categoria', 'tipo', 'classification'];
    
    for (const field of possibleFields) {
      const value = data[field];
      if (value && typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
    
    // Smart categorization based on vendor or description
    const vendor = this.extractVendor(data).toLowerCase();
    const description = this.extractDescription(data, '').toLowerCase();
    const combinedText = `${vendor} ${description}`.toLowerCase();
    
    if (combinedText.includes('combustivel') || combinedText.includes('gasolina') || combinedText.includes('gasóleo')) {
      return 'Combustível';
    } else if (combinedText.includes('hotel') || combinedText.includes('alojamento') || combinedText.includes('pousada')) {
      return 'Deslocações e Estadas';
    } else if (combinedText.includes('restaurante') || combinedText.includes('café') || combinedText.includes('refeição')) {
      return 'Refeições';
    } else if (combinedText.includes('material') || combinedText.includes('equipamento') || combinedText.includes('ferramenta')) {
      return 'Material e Equipamento';
    } else if (combinedText.includes('consultoria') || combinedText.includes('serviço') || combinedText.includes('assessoria')) {
      return 'Serviços Especializados';
    } else {
      return 'Despesas Gerais';
    }
  }
  
  /**
   * Extract VAT amount
   */
  private extractVatAmount(data: any): number {
    const possibleFields = [
      'vat_amount', 'iva_valor', 'tax_amount', 'imposto', 'valor_iva'
    ];
    
    for (const field of possibleFields) {
      const value = data[field];
      if (value && !isNaN(parseFloat(value))) {
        return parseFloat(value);
      }
    }
    return 0;
  }
  
  /**
   * Extract VAT rate
   */
  private extractVatRate(data: any): number {
    const possibleFields = [
      'vat_rate', 'iva_taxa', 'tax_rate', 'taxa_imposto', 'percentagem_iva'
    ];
    
    for (const field of possibleFields) {
      const value = data[field];
      if (value && !isNaN(parseFloat(value))) {
        return parseFloat(value);
      }
    }
    
    // Default Portuguese VAT rates based on amount
    const amount = this.extractAmount(data);
    if (amount > 0) {
      // Most common rate is 23%
      return 23;
    }
    return 0;
  }

  /**
   * Check if extracted data is valid for creating an expense
   */
  private isValidExpenseData(extractedData: any): boolean {
    const amount = extractedData.total_amount || extractedData.amount || extractedData.total;
    console.log(`🔍 Validating expense data - amount found: ${amount}`);
    return amount && parseFloat(amount) > 0;
  }

  /**
   * Check if file is a document type we can process
   */
  private isDocumentFile(fileName: string): boolean {
    const extension = fileName.toLowerCase().split('.').pop();
    return ['pdf', 'jpg', 'jpeg', 'png'].includes(extension || '');
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeTypeFromExtension(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Manual trigger for testing
   */
  async runOnce() {
    console.log('🧪 Running Dropbox sync manually...');
    if (this.isRunning) {
      console.log('⏳ Sync already running');
      return;
    }
    
    this.isRunning = true;
    try {
      await this.checkAllDropboxConfigs();
    } catch (error) {
      console.error('❌ Error in manual Dropbox sync:', error);
    } finally {
      this.isRunning = false;
    }
  }
}

export const dropboxScheduler = new DropboxScheduler();