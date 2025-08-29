import { createClient } from '@supabase/supabase-js';
import { documentsEmbedding } from '../shared/schema';
import { advancedTableParser, type LineItem, type TableStructure } from './advanced-table-parser';

export interface ConsensusData {
  documentId: number;
  tenantId: number;
  extractedData: any;
  lineItems: LineItem[];
  tableStructures: TableStructure[];
  confidence: number;
  extractionMethod: string;
  processingTime: number;
}

export interface ConsensusResult {
  success: boolean;
  finalData: any;
  lineItems: LineItemConsensus[];
  confidence: number;
  consensusMethod: string;
  processingTime: number;
  error?: string;
}

export interface LineItemConsensus {
  id: string;
  rowIndex: number;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  vatRate: number;
  vatAmount: number;
  category: string | null;
  confidence: number;
  sources: string[];
  boundingBox?: any;
}

export class ConsensusEngine {
  private supabase: any;
  private consensusThreshold = 0.8;
  private maxIterations = 3;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_ANON_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Main consensus method that incorporates line items from table extraction
   */
  async buildConsensus(
    documentId: number,
    tenantId: number,
    extractionResults: any[]
  ): Promise<ConsensusResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Building consensus for document ${documentId}...`);
      
      // Step 1: Extract line items from table structures if available
      const lineItems = await this.extractLineItemsFromDocument(documentId, tenantId);
      
      // Step 2: Build consensus on extracted data
      const dataConsensus = await this.buildDataConsensus(extractionResults);
      
      // Step 3: Build consensus on line items
      const lineItemConsensus = await this.buildLineItemConsensus(lineItems);
      
      // Step 4: Merge consensus results
      const finalData = this.mergeConsensusResults(dataConsensus, lineItemConsensus);
      
      // Step 5: Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(dataConsensus, lineItemConsensus);
      
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ Consensus built successfully: ${lineItemConsensus.length} line items, confidence: ${overallConfidence.toFixed(2)}`);
      
      return {
        success: true,
        finalData,
        lineItems: lineItemConsensus,
        confidence: overallConfidence,
        consensusMethod: 'hybrid_table_text',
        processingTime
      };
      
    } catch (error) {
      console.error('❌ Consensus building failed:', error);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: false,
        finalData: {},
        lineItems: [],
        confidence: 0,
        consensusMethod: 'failed',
        processingTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Extract line items from document using advanced table parser
   */
  private async extractLineItemsFromDocument(documentId: number, tenantId: number): Promise<LineItem[]> {
    try {
      console.log(`📋 Extracting line items from document ${documentId}...`);
      
      // Get document from storage
      const { data: document } = await this.supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('tenant_id', tenantId)
        .single();
      
      if (!document) {
        console.warn(`⚠️ Document ${documentId} not found`);
        return [];
      }
      
      // Check if we already have extracted line items
      const { data: existingLineItems } = await this.supabase
        .from('line_items')
        .select('*')
        .eq('document_id', documentId)
        .eq('tenant_id', tenantId);
      
      if (existingLineItems && existingLineItems.length > 0) {
        console.log(`✅ Found ${existingLineItems.length} existing line items`);
        return existingLineItems.map(this.mapDatabaseLineItemToLineItem);
      }
      
      // If no existing line items, try to extract from document content
      if (document.content && document.content.length > 0) {
        console.log('🔄 No existing line items found, attempting extraction from content...');
        
        // This would integrate with your document processing pipeline
        // For now, we'll return empty array
        return [];
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ Failed to extract line items from document:', error);
      return [];
    }
  }

  /**
   * Build consensus on extracted data
   */
  private async buildDataConsensus(extractionResults: any[]): Promise<any> {
    try {
      console.log('🔍 Building consensus on extracted data...');
      
      if (extractionResults.length === 0) {
        return { confidence: 0, data: {} };
      }
      
      if (extractionResults.length === 1) {
        return { confidence: extractionResults[0].confidence || 0.7, data: extractionResults[0].data };
      }
      
      // Multiple extraction results - build consensus
      const consensusData: any = {};
      const fieldConfidences: Record<string, number[]> = {};
      
      // Collect all field values and confidences
      for (const result of extractionResults) {
        const data = result.data || {};
        const confidence = result.confidence || 0.5;
        
        for (const [field, value] of Object.entries(data)) {
          if (!consensusData[field]) {
            consensusData[field] = [];
            fieldConfidences[field] = [];
          }
          
          consensusData[field].push(value);
          fieldConfidences[field].push(confidence);
        }
      }
      
      // Build consensus for each field
      const finalData: any = {};
      let overallConfidence = 0;
      let fieldCount = 0;
      
      for (const [field, values] of Object.entries(consensusData)) {
        const confidences = fieldConfidences[field];
        const typedValues = values as any[];
        
        if (typedValues.length === 1) {
          // Single value
          finalData[field] = typedValues[0];
          overallConfidence += confidences[0];
        } else {
          // Multiple values - find most common or highest confidence
          const consensus = this.findFieldConsensus(field, typedValues, confidences);
          finalData[field] = consensus.value;
          overallConfidence += consensus.confidence;
        }
        
        fieldCount++;
      }
      
      const averageConfidence = fieldCount > 0 ? overallConfidence / fieldCount : 0;
      
      console.log(`✅ Data consensus built: ${fieldCount} fields, confidence: ${averageConfidence.toFixed(2)}`);
      
      return {
        confidence: averageConfidence,
        data: finalData
      };
      
    } catch (error) {
      console.error('❌ Failed to build data consensus:', error);
      return { confidence: 0, data: {} };
    }
  }

  /**
   * Build consensus on line items
   */
  private async buildLineItemConsensus(lineItems: LineItem[]): Promise<LineItemConsensus[]> {
    try {
      console.log(`📋 Building consensus on ${lineItems.length} line items...`);
      
      if (lineItems.length === 0) {
        return [];
      }
      
      // Group line items by description similarity
      const groupedItems = this.groupLineItemsByDescription(lineItems);
      
      const consensusLineItems: LineItemConsensus[] = [];
      
      for (const [description, items] of Object.entries(groupedItems)) {
        if (items.length === 1) {
          // Single item - use as is
          const item = items[0];
          consensusLineItems.push({
            id: item.id || `consensus_${Date.now()}_${Math.random()}`,
            rowIndex: item.rowIndex || 0,
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || item.totalAmount,
            totalAmount: item.totalAmount,
            vatRate: item.vatRate || 0,
            vatAmount: item.vatAmount || 0,
            category: item.category || 'Other',
            confidence: item.confidence,
            sources: ['single_extraction'],
            boundingBox: item.boundingBox
          });
        } else {
          // Multiple items - build consensus
          const consensus = this.buildLineItemFieldConsensus(items);
          consensusLineItems.push(consensus);
        }
      }
      
      console.log(`✅ Line item consensus built: ${consensusLineItems.length} consensus items`);
      
      return consensusLineItems;
      
    } catch (error) {
      console.error('❌ Failed to build line item consensus:', error);
      return [];
    }
  }

  /**
   * Group line items by description similarity
   */
  private groupLineItemsByDescription(lineItems: LineItem[]): Record<string, LineItem[]> {
    const groups: Record<string, LineItem[]> = {};
    
    for (const item of lineItems) {
      const normalizedDescription = this.normalizeDescription(item.description);
      
      if (!groups[normalizedDescription]) {
        groups[normalizedDescription] = [];
      }
      
      groups[normalizedDescription].push(item);
    }
    
    return groups;
  }

  /**
   * Normalize description for grouping
   */
  private normalizeDescription(description: string): string {
    return description
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Build consensus for line item fields
   */
  private buildLineItemFieldConsensus(items: LineItem[]): LineItemConsensus {
    try {
      // Calculate consensus for each field
      const quantities = items.map(item => item.quantity || 1).filter(q => q > 0);
      const unitPrices = items.map(item => item.unitPrice || item.totalAmount).filter(p => p > 0);
      const totalAmounts = items.map(item => item.totalAmount).filter(a => a > 0);
      const vatRates = items.map(item => item.vatRate || 0).filter(r => r >= 0);
      
      // Use median for numerical fields to avoid outliers
      const quantity = this.calculateMedian(quantities) || 1;
      const unitPrice = this.calculateMedian(unitPrices) || 0;
      const totalAmount = this.calculateMedian(totalAmounts) || 0;
      const vatRate = this.calculateMedian(vatRates) || 0;
      
      // Calculate VAT amount
      const vatAmount = vatRate > 0 ? (totalAmount * vatRate) / 100 : 0;
      
      // Use most common category
      const categories = items.map(item => item.category || 'Other');
      const category = this.findMostCommon(categories);
      
      // Calculate average confidence
      const avgConfidence = items.reduce((sum, item) => sum + item.confidence, 0) / items.length;
      
      // Collect sources
      const sources = items.map(item => `extraction_${item.confidence.toFixed(2)}`);
      
      return {
        id: `consensus_${Date.now()}_${Math.random()}`,
        rowIndex: items[0].rowIndex || 0,
        description: items[0].description, // Use first description as reference
        quantity,
        unitPrice,
        totalAmount,
        vatRate,
        vatAmount,
        category,
        confidence: avgConfidence,
        sources,
        boundingBox: items[0].boundingBox
      };
      
    } catch (error) {
      console.error('❌ Failed to build line item field consensus:', error);
      
      // Return fallback consensus
      const fallbackItem = items[0];
      return {
        id: `fallback_${Date.now()}_${Math.random()}`,
        rowIndex: fallbackItem.rowIndex || 0,
        description: fallbackItem.description,
        quantity: fallbackItem.quantity || 1,
        unitPrice: fallbackItem.unitPrice || fallbackItem.totalAmount,
        totalAmount: fallbackItem.totalAmount,
        vatRate: fallbackItem.vatRate || 0,
        vatAmount: fallbackItem.vatAmount || 0,
        category: fallbackItem.category || 'Other',
        confidence: fallbackItem.confidence * 0.8, // Reduce confidence for fallback
        sources: ['fallback_consensus'],
        boundingBox: fallbackItem.boundingBox
      };
    }
  }

  /**
   * Find consensus for a specific field
   */
  private findFieldConsensus(field: string, values: any[], confidences: number[]): { value: any; confidence: number } {
    try {
      if (values.length === 0) {
        return { value: null, confidence: 0 };
      }
      
      if (values.length === 1) {
        return { value: values[0], confidence: confidences[0] };
      }
      
      // Check for exact matches
      const uniqueValues = [...new Set(values)];
      if (uniqueValues.length === 1) {
        // All values are the same
        const avgConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
        return { value: uniqueValues[0], confidence: avgConfidence };
      }
      
      // Check for similar values (string similarity)
      if (typeof values[0] === 'string') {
        const similarityGroups = this.groupBySimilarity(values, confidences);
        if (similarityGroups.length === 1) {
          // All values are similar
          const bestGroup = similarityGroups[0];
          return { value: bestGroup.representative, confidence: bestGroup.confidence };
        }
      }
      
      // Use highest confidence value
      const maxConfidenceIndex = confidences.indexOf(Math.max(...confidences));
      return { value: values[maxConfidenceIndex], confidence: confidences[maxConfidenceIndex] };
      
    } catch (error) {
      console.error('❌ Failed to find field consensus:', error);
      
      // Return first value with medium confidence
      return { value: values[0], confidence: 0.5 };
    }
  }

  /**
   * Group values by similarity
   */
  private groupBySimilarity(values: string[], confidences: number[]): Array<{ representative: string; confidence: number; count: number }> {
    const groups: Array<{ representative: string; confidence: number; count: number; values: string[] }> = [];
    
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      const confidence = confidences[i];
      
      let addedToGroup = false;
      
      for (const group of groups) {
        if (this.calculateSimilarity(value, group.representative) > 0.8) {
          group.values.push(value);
          group.confidence = (group.confidence + confidence) / 2;
          group.count++;
          addedToGroup = true;
          break;
        }
      }
      
      if (!addedToGroup) {
        groups.push({
          representative: value,
          confidence,
          count: 1,
          values: [value]
        });
      }
    }
    
    return groups.map(group => ({
      representative: group.representative,
      confidence: group.confidence,
      count: group.count
    }));
  }

  /**
   * Calculate similarity between two strings
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    return (longer.length - this.editDistance(longer, shorter)) / longer.length;
  }

  /**
   * Calculate edit distance between two strings
   */
  private editDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate median of numbers
   */
  private calculateMedian(numbers: number[]): number | null {
    if (numbers.length === 0) return null;
    
    const sorted = numbers.sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    
    return sorted[middle];
  }

  /**
   * Find most common value in array
   */
  private findMostCommon<T>(array: T[]): T | null {
    if (array.length === 0) return null;
    
    const counts = new Map<T, number>();
    let maxCount = 0;
    let mostCommon: T | null = null;
    
    for (const item of array) {
      const count = (counts.get(item) || 0) + 1;
      counts.set(item, count);
      
      if (count > maxCount) {
        maxCount = count;
        mostCommon = item;
      }
    }
    
    return mostCommon;
  }

  /**
   * Merge consensus results
   */
  private mergeConsensusResults(dataConsensus: any, lineItemConsensus: LineItemConsensus[]): any {
    try {
      const merged = { ...dataConsensus.data };
      
      // Add line items summary to merged data
      if (lineItemConsensus.length > 0) {
        merged.lineItems = lineItemConsensus;
        merged.totalLineItems = lineItemConsensus.length;
        merged.totalAmount = lineItemConsensus.reduce((sum, item) => sum + item.totalAmount, 0);
        merged.totalVAT = lineItemConsensus.reduce((sum, item) => sum + item.vatAmount, 0);
        merged.lineItemCategories = [...new Set(lineItemConsensus.map(item => item.category))];
      }
      
      return merged;
      
    } catch (error) {
      console.error('❌ Failed to merge consensus results:', error);
      return dataConsensus.data || {};
    }
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(dataConsensus: any, lineItemConsensus: LineItemConsensus[]): number {
    try {
      let totalConfidence = dataConsensus.confidence || 0;
      let weightCount = 1;
      
      if (lineItemConsensus.length > 0) {
        const lineItemConfidence = lineItemConsensus.reduce((sum, item) => sum + item.confidence, 0) / lineItemConsensus.length;
        totalConfidence += lineItemConfidence;
        weightCount++;
      }
      
      return totalConfidence / weightCount;
      
    } catch (error) {
      console.error('❌ Failed to calculate overall confidence:', error);
      return 0.5;
    }
  }

  /**
   * Map database line item to LineItem interface
   */
  private mapDatabaseLineItemToLineItem(dbItem: any): LineItem {
    return {
      id: dbItem.id,
      description: dbItem.description,
      quantity: dbItem.quantity,
      unitPrice: dbItem.unit_price,
      totalAmount: dbItem.total_amount,
      vatRate: dbItem.vat_rate,
      vatAmount: dbItem.vat_amount,
      category: dbItem.category,
      confidence: dbItem.confidence,
      rowIndex: dbItem.row_index,
      boundingBox: dbItem.bounding_box
    };
  }

  /**
   * Store consensus results
   */
  async storeConsensusResults(
    documentId: number,
    tenantId: number,
    consensusResult: ConsensusResult
  ): Promise<void> {
    try {
      console.log('💾 Storing consensus results...');
      
      // Store final consensus data
      await this.supabase
        .from('consensus_results')
        .insert({
          tenant_id: tenantId,
          document_id: documentId,
          consensus_data: consensusResult.finalData,
          line_items: consensusResult.lineItems,
          confidence: consensusResult.confidence,
          consensus_method: consensusResult.consensusMethod,
          processing_time: consensusResult.processingTime,
          created_at: new Date().toISOString()
        });
      
      console.log('✅ Consensus results stored successfully');
      
    } catch (error) {
      console.error('❌ Failed to store consensus results:', error);
      // Don't fail the entire process if storage fails
    }
  }
}

// Export singleton instance
export const consensusEngine = new ConsensusEngine();
