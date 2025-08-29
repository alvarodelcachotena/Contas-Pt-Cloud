import { ExtractionResult, LineItem } from '../../shared/types';

interface ConsensusConfig {
  minConfidence: number;
  minAgreement: number;
  useSemanticMatching: boolean;
}

interface LineItemMatch {
  items: LineItem[];
  confidence: number;
  agreement: number;
}

export class ConsensusEngine {
  private config: ConsensusConfig;

  constructor(config?: Partial<ConsensusConfig>) {
    this.config = {
      minConfidence: config?.minConfidence ?? 0.7,
      minAgreement: config?.minAgreement ?? 0.5,
      useSemanticMatching: config?.useSemanticMatching ?? true
    };
  }

  async processResults(results: ExtractionResult[]): Promise<ExtractionResult> {
    if (!results.length) {
      throw new Error('No results to process');
    }

    // Process regular fields
    const consensusResult = this.processFields(results);

    // Process line items if present
    const hasLineItems = results.some(r => {
      const lineItems = r.data.lineItems;
      return lineItems && lineItems.length > 0;
    });

    if (hasLineItems) {
      consensusResult.data.lineItems = await this.processLineItems(results);
    }

    return consensusResult;
  }

  private processFields(results: ExtractionResult[]): ExtractionResult {
    // Implementación existente
    return results[0]; // Placeholder
  }

  private async processLineItems(results: ExtractionResult[]): Promise<LineItem[]> {
    const allLineItems = results.flatMap(r => r.data.lineItems || []);
    if (!allLineItems.length) return [];

    // Group similar line items
    const lineItemGroups: LineItemMatch[] = [];
    
    for (const item of allLineItems) {
      let matched = false;
      
      for (const group of lineItemGroups) {
        const similarityScore = await this.calculateLineItemSimilarity(item, group.items[0]);
        
        if (similarityScore >= this.config.minConfidence) {
          group.items.push(item);
          group.confidence = (group.confidence + similarityScore) / 2;
          group.agreement = group.items.length / results.length;
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        lineItemGroups.push({
          items: [item],
          confidence: 1,
          agreement: 1 / results.length
        });
      }
    }

    // Filter groups by confidence and agreement
    const validGroups = lineItemGroups.filter(group => 
      group.confidence >= this.config.minConfidence && 
      group.agreement >= this.config.minAgreement
    );

    // Select best item from each group
    return validGroups.map(group => this.selectBestLineItem(group.items));
  }

  private async calculateLineItemSimilarity(item1: LineItem, item2: LineItem): Promise<number> {
    if (!this.config.useSemanticMatching) {
      // Simple string matching for descriptions
      const descriptionSimilarity = this.calculateStringSimilarity(
        item1.description.toLowerCase(),
        item2.description.toLowerCase()
      );

      // Exact matching for numerical values
      const amountMatch = Math.abs(parseFloat(item1.totalAmount.toString()) - parseFloat(item2.totalAmount.toString())) < 0.01;
      const quantityMatch = Math.abs(item1.quantity - item2.quantity) < 0.01;
      const vatMatch = Math.abs(parseFloat(item1.vatAmount?.toString() || '0') - parseFloat(item2.vatAmount?.toString() || '0')) < 0.01;

      return (
        descriptionSimilarity * 0.4 + 
        (amountMatch ? 0.3 : 0) +
        (quantityMatch ? 0.2 : 0) +
        (vatMatch ? 0.1 : 0)
      );
    } else {
      // Use semantic similarity for descriptions
      // This would integrate with a language model API
      return 0.8; // Placeholder for semantic similarity
    }
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance implementation
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j - 1] + 1,
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1
          );
        }
      }
    }

    const maxLength = Math.max(m, n);
    return 1 - (dp[m][n] / maxLength);
  }

  private selectBestLineItem(items: LineItem[]): LineItem {
    // Select item with highest confidence or most complete data
    return items.reduce((best, current) => {
      const bestScore = this.calculateCompleteness(best);
      const currentScore = this.calculateCompleteness(current);
      return currentScore > bestScore ? current : best;
    });
  }

  private calculateCompleteness(item: LineItem): number {
    let score = 0;
    let total = 0;

    // Check each field
    if (item.description) { score++; }
    if (item.quantity) { score++; }
    if (item.unitPrice) { score++; }
    if (item.totalAmount) { score++; }
    if (item.vatRate) { score++; }
    if (item.vatAmount) { score++; }
    total += 6;

    // Additional quality checks
    if (item.description && item.description.length > 10) score += 0.5;
    total += 0.5;

    return score / total;
  }
} 