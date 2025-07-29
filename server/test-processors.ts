import { DropboxApiClient } from './dropbox-api-client';
import { AgentExtractorGemini } from './agents/AgentExtractorGemini';
import { AgentExtractorOpenAI } from './agents/AgentExtractorOpenAI';
import { ExtractionResult } from '../shared/types';
import Tesseract from 'tesseract.js';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  documentName: string;
  documentPath: string;
  fileSize: number;
  geminiResult: ExtractionResult | null;
  openaiResult: ExtractionResult | null;
  geminiError: string | null;
  openaiError: string | null;
  processingTime: {
    gemini: number;
    openai: number;
  };
  ocrText: string;
}

interface ComparisonReport {
  totalDocuments: number;
  successfulGemini: number;
  successfulOpenAI: number;
  averageProcessingTime: {
    gemini: number;
    openai: number;
  };
  fieldComparison: {
    [fieldName: string]: {
      geminiValues: string[];
      openaiValues: string[];
      matches: number;
      differences: number;
    };
  };
  confidenceScores: {
    gemini: number[];
    openai: number[];
  };
  testResults: TestResult[];
}

export class ProcessorTester {
  private dropboxClient: DropboxApiClient;
  private geminiExtractor: AgentExtractorGemini | null = null;
  private openaiExtractor: AgentExtractorOpenAI | null = null;

  constructor(accessToken: string, refreshToken: string) {
    this.dropboxClient = new DropboxApiClient(accessToken, refreshToken);
    
    // Force environment loading to ensure .env file values are used
    require('../lib/env-loader');
    
    // Initialize extractors if API keys are available  
    console.log('🔑 Checking API keys from environment...');
    console.log(`🤖 Gemini API key available: ${!!process.env.GOOGLE_AI_API_KEY} (ends with: ${process.env.GOOGLE_AI_API_KEY?.slice(-10)})`);
    console.log(`🤖 OpenAI API key available: ${!!process.env.OPENAI_API_KEY} (ends with: ${process.env.OPENAI_API_KEY?.slice(-10)})`);
    
    if (process.env.GOOGLE_AI_API_KEY) {
      this.geminiExtractor = new AgentExtractorGemini(process.env.GOOGLE_AI_API_KEY);
      console.log('✅ Gemini extractor initialized');
    } else {
      console.log('❌ Gemini API key not found');
    }
    
    if (process.env.OPENAI_API_KEY) {
      this.openaiExtractor = new AgentExtractorOpenAI(process.env.OPENAI_API_KEY);
      console.log('✅ OpenAI extractor initialized');
    } else {
      console.log('❌ OpenAI API key not found');
    }
  }

  private isDocumentFile(filename: string): boolean {
    const ext = filename.toLowerCase().split('.').pop();
    return ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
  }

  private async performOCR(buffer: Buffer, mimeType: string): Promise<string> {
    // No OCR needed - both AI models can process documents directly
    // Return a simple indicator for logging purposes
    if (mimeType === 'application/pdf') {
      return "PDF - will be processed directly by AI vision";
    }
    return "Image - will be processed directly by AI vision";
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private compareFields(geminiData: any, openaiData: any): { [fieldName: string]: { geminiValues: string[]; openaiValues: string[]; matches: number; differences: number; } } {
    const comparison: any = {};
    const fields = ['vendor', 'nif', 'nifCountry', 'vendorAddress', 'vendorPhone', 'invoiceNumber', 'issueDate', 'total', 'netAmount', 'vatAmount', 'vatRate', 'category', 'description'];
    
    fields.forEach(field => {
      const geminiValue = geminiData?.[field]?.toString() || '';
      const openaiValue = openaiData?.[field]?.toString() || '';
      
      if (!comparison[field]) {
        comparison[field] = {
          geminiValues: [],
          openaiValues: [],
          matches: 0,
          differences: 0
        };
      }
      
      comparison[field].geminiValues.push(geminiValue);
      comparison[field].openaiValues.push(openaiValue);
      
      if (geminiValue === openaiValue) {
        comparison[field].matches++;
      } else {
        comparison[field].differences++;
      }
    });
    
    return comparison;
  }

  async getAvailableDocuments(): Promise<any[]> {
    try {
      console.log('📂 Listing documents from Dropbox...');
      const result = await this.dropboxClient.listFolder('/input');
      
      const documents = result.entries.filter(entry => 
        entry['.tag'] === 'file' && this.isDocumentFile(entry.name)
      );
      
      console.log(`📄 Found ${documents.length} documents in Dropbox`);
      return documents;
    } catch (error) {
      console.error('❌ Error listing Dropbox documents:', error);
      return [];
    }
  }

  async testRandomDocuments(count: number = 5): Promise<ComparisonReport> {
    console.log(`\n🧪 Starting processor testing with ${count} random documents...\n`);
    
    const documents = await this.getAvailableDocuments();
    
    if (documents.length === 0) {
      throw new Error('No documents found in Dropbox');
    }
    
    // Select random documents
    const selectedDocs = documents
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(count, documents.length));
    
    console.log('📋 Selected documents:');
    selectedDocs.forEach((doc, i) => {
      console.log(`  ${i + 1}. ${doc.name} (${this.formatFileSize(doc.size || 0)})`);
    });
    console.log('');
    
    const testResults: TestResult[] = [];
    const report: ComparisonReport = {
      totalDocuments: selectedDocs.length,
      successfulGemini: 0,
      successfulOpenAI: 0,
      averageProcessingTime: { gemini: 0, openai: 0 },
      fieldComparison: {},
      confidenceScores: { gemini: [], openai: [] },
      testResults: []
    };
    
    for (let i = 0; i < selectedDocs.length; i++) {
      const doc = selectedDocs[i];
      console.log(`\n📄 Processing document ${i + 1}/${selectedDocs.length}: ${doc.name}`);
      
      const testResult: TestResult = {
        documentName: doc.name,
        documentPath: doc.path_display,
        fileSize: doc.size || 0,
        geminiResult: null,
        openaiResult: null,
        geminiError: null,
        openaiError: null,
        processingTime: { gemini: 0, openai: 0 },
        ocrText: ''
      };
      
      try {
        // Download document
        console.log(`📥 Downloading ${doc.name}...`);
        const fileBuffer = await this.dropboxClient.downloadFile(doc.path_display);
        console.log(`✅ Downloaded ${fileBuffer.length} bytes`);
        
        // Determine MIME type
        const ext = doc.name.toLowerCase().split('.').pop();
        const mimeType = ext === 'pdf' ? 'application/pdf' : `image/${ext}`;
        
        // Perform OCR for text extraction
        console.log(`🔍 Performing OCR extraction...`);
        testResult.ocrText = await this.performOCR(fileBuffer, mimeType);
        console.log(`📝 OCR extracted ${testResult.ocrText.length} characters`);
        
        // Test Gemini
        if (this.geminiExtractor) {
          console.log(`🤖 Testing Gemini processor...`);
          const geminiStart = Date.now();
          try {
            if (mimeType === 'application/pdf') {
              testResult.geminiResult = await this.geminiExtractor.extractFromPDF(fileBuffer, doc.name);
            } else {
              testResult.geminiResult = await this.geminiExtractor.extract(testResult.ocrText, doc.name);
            }
            testResult.processingTime.gemini = Date.now() - geminiStart;
            report.successfulGemini++;
            report.confidenceScores.gemini.push(testResult.geminiResult.confidenceScore);
            console.log(`✅ Gemini completed in ${testResult.processingTime.gemini}ms (confidence: ${testResult.geminiResult.confidenceScore})`);
          } catch (error) {
            testResult.geminiError = error instanceof Error ? error.message : String(error);
            testResult.processingTime.gemini = Date.now() - geminiStart;
            console.log(`❌ Gemini failed: ${testResult.geminiError}`);
          }
        } else {
          testResult.geminiError = 'Gemini API key not available';
          console.log(`⚠️  Gemini skipped: No API key`);
        }
        
        // Test OpenAI
        if (this.openaiExtractor) {
          console.log(`🤖 Testing OpenAI processor...`);
          const openaiStart = Date.now();
          try {
            // OpenAI can handle both PDFs and images directly with vision capabilities
            if (mimeType === 'application/pdf') {
              testResult.openaiResult = await this.openaiExtractor.extractFromImage(fileBuffer, mimeType, doc.name);
            } else {
              testResult.openaiResult = await this.openaiExtractor.extractFromImage(fileBuffer, mimeType, doc.name);
            }
            testResult.processingTime.openai = Date.now() - openaiStart;
            report.successfulOpenAI++;
            report.confidenceScores.openai.push(testResult.openaiResult.confidenceScore);
            console.log(`✅ OpenAI completed in ${testResult.processingTime.openai}ms (confidence: ${testResult.openaiResult.confidenceScore})`);
          } catch (error) {
            testResult.openaiError = error instanceof Error ? error.message : String(error);
            testResult.processingTime.openai = Date.now() - openaiStart;
            console.log(`❌ OpenAI failed: ${testResult.openaiError}`);
          }
        } else {
          testResult.openaiError = 'OpenAI API key not available';
          console.log(`⚠️  OpenAI skipped: No API key`);
        }
        
        // Compare results if both succeeded
        if (testResult.geminiResult && testResult.openaiResult) {
          const fieldComparison = this.compareFields(testResult.geminiResult.data, testResult.openaiResult.data);
          
          // Merge field comparison into report
          Object.keys(fieldComparison).forEach(field => {
            if (!report.fieldComparison[field]) {
              report.fieldComparison[field] = {
                geminiValues: [],
                openaiValues: [],
                matches: 0,
                differences: 0
              };
            }
            report.fieldComparison[field].geminiValues.push(...fieldComparison[field].geminiValues);
            report.fieldComparison[field].openaiValues.push(...fieldComparison[field].openaiValues);
            report.fieldComparison[field].matches += fieldComparison[field].matches;
            report.fieldComparison[field].differences += fieldComparison[field].differences;
          });
        }
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        testResult.geminiError = testResult.geminiError || errorMsg;
        testResult.openaiError = testResult.openaiError || errorMsg;
        console.log(`❌ Document processing failed: ${errorMsg}`);
      }
      
      testResults.push(testResult);
      report.testResults.push(testResult);
      
      console.log(`📊 Document ${i + 1} completed\n`);
    }
    
    // Calculate averages
    const geminiTimes = testResults.filter(r => r.geminiResult).map(r => r.processingTime.gemini);
    const openaiTimes = testResults.filter(r => r.openaiResult).map(r => r.processingTime.openai);
    
    report.averageProcessingTime.gemini = geminiTimes.length > 0 ? 
      geminiTimes.reduce((a, b) => a + b, 0) / geminiTimes.length : 0;
    report.averageProcessingTime.openai = openaiTimes.length > 0 ? 
      openaiTimes.reduce((a, b) => a + b, 0) / openaiTimes.length : 0;
    
    return report;
  }

  generateReport(report: ComparisonReport): string {
    let output = '\n' + '='.repeat(80) + '\n';
    output += '📊 PROCESSOR COMPARISON REPORT\n';
    output += '='.repeat(80) + '\n\n';
    
    // Summary
    output += '📈 SUMMARY\n';
    output += `-----------\n`;
    output += `Total Documents Tested: ${report.totalDocuments}\n`;
    output += `Successful Gemini Extractions: ${report.successfulGemini}/${report.totalDocuments} (${((report.successfulGemini/report.totalDocuments)*100).toFixed(1)}%)\n`;
    output += `Successful OpenAI Extractions: ${report.successfulOpenAI}/${report.totalDocuments} (${((report.successfulOpenAI/report.totalDocuments)*100).toFixed(1)}%)\n`;
    output += `Average Processing Time - Gemini: ${report.averageProcessingTime.gemini.toFixed(0)}ms\n`;
    output += `Average Processing Time - OpenAI: ${report.averageProcessingTime.openai.toFixed(0)}ms\n\n`;
    
    // Confidence Scores
    if (report.confidenceScores.gemini.length > 0) {
      const avgGeminiConf = report.confidenceScores.gemini.reduce((a, b) => a + b, 0) / report.confidenceScores.gemini.length;
      output += `Average Confidence - Gemini: ${avgGeminiConf.toFixed(2)}\n`;
    }
    if (report.confidenceScores.openai.length > 0) {
      const avgOpenaiConf = report.confidenceScores.openai.reduce((a, b) => a + b, 0) / report.confidenceScores.openai.length;
      output += `Average Confidence - OpenAI: ${avgOpenaiConf.toFixed(2)}\n`;
    }
    output += '\n';
    
    // Field Comparison
    output += '🔍 FIELD COMPARISON\n';
    output += `------------------\n`;
    Object.keys(report.fieldComparison).forEach(field => {
      const fieldData = report.fieldComparison[field];
      const totalComparisons = fieldData.matches + fieldData.differences;
      const matchPercentage = totalComparisons > 0 ? ((fieldData.matches / totalComparisons) * 100).toFixed(1) : '0';
      output += `${field.padEnd(15)}: ${fieldData.matches}/${totalComparisons} matches (${matchPercentage}%)\n`;
    });
    output += '\n';
    
    // Individual Document Results
    output += '📄 INDIVIDUAL DOCUMENT RESULTS\n';
    output += `-------------------------------\n`;
    report.testResults.forEach((result, i) => {
      output += `${i + 1}. ${result.documentName} (${this.formatFileSize(result.fileSize)})\n`;
      output += `   Gemini: ${result.geminiResult ? `✅ Success (${result.processingTime.gemini}ms, conf: ${result.geminiResult.confidenceScore})` : `❌ ${result.geminiError}`}\n`;
      output += `   OpenAI: ${result.openaiResult ? `✅ Success (${result.processingTime.openai}ms, conf: ${result.openaiResult.confidenceScore})` : `❌ ${result.openaiError}`}\n`;
      
      if (result.geminiResult && result.openaiResult) {
        output += `   📊 Key Fields Comparison:\n`;
        const fields = ['vendor', 'nif', 'total', 'issueDate'];
        fields.forEach(field => {
          const geminiVal = result.geminiResult?.data[field]?.toString() || '';
          const openaiVal = result.openaiResult?.data[field]?.toString() || '';
          const match = geminiVal === openaiVal ? '✅' : '❌';
          output += `      ${field}: ${match} Gemini:"${geminiVal}" vs OpenAI:"${openaiVal}"\n`;
        });
      }
      output += '\n';
    });
    
    return output;
  }

  async saveReport(report: ComparisonReport, filename: string = 'processor-comparison-report.txt'): Promise<void> {
    const reportText = this.generateReport(report);
    const filePath = path.join(process.cwd(), filename);
    fs.writeFileSync(filePath, reportText);
    console.log(`📄 Report saved to: ${filePath}`);
  }
}

// CLI execution if run directly
if (require.main === module) {
  async function runTest() {
    try {
      // This would be called from API route with proper credentials
      console.log('⚠️  This script should be called via API route with proper Dropbox credentials');
      console.log('   Use: POST /api/test-processors');
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }
  
  runTest();
}