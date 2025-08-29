import { NextRequest, NextResponse } from 'next/server';
import { enhancedDocumentRouter } from '../../../lib/enhanced-document-router';
import { mlDocumentClassifier } from '../../../lib/ml-document-classifier';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentBuffer, metadata, tenantId, action } = body;

    // Validate required fields
    if (!documentBuffer || !tenantId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'documentBuffer and tenantId are required' 
        },
        { status: 400 }
      );
    }

    // Validate tenantId
    const tenantIdNum = parseInt(tenantId.toString());
    if (isNaN(tenantIdNum) || tenantIdNum <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'tenantId must be a positive integer' 
        },
        { status: 400 }
      );
    }

    console.log('🚀 ML Document Routing API request:', { 
      action, 
      tenantId: tenantIdNum,
      hasDocumentBuffer: !!documentBuffer,
      metadata: metadata || 'none'
    });

    // Handle different actions
    switch (action) {
      case 'route_single':
        return await handleSingleDocumentRouting(documentBuffer, metadata, tenantIdNum);
      
      case 'route_batch':
        return await handleBatchDocumentRouting(documentBuffer, metadata, tenantIdNum);
      
      case 'get_statistics':
        return await handleGetStatistics(tenantIdNum);
      
      case 'retrain_classifier':
        return await handleRetrainClassifier(body.trainingData);
      
      case 'get_classifier_status':
        return await handleGetClassifierStatus();
      
      case 'get_pipelines':
        return await handleGetPipelines();
      
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: `Unknown action: ${action}. Valid actions: route_single, route_batch, get_statistics, retrain_classifier, get_classifier_status, get_pipelines` 
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ ML Document Routing API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle single document routing
 */
async function handleSingleDocumentRouting(documentBuffer: string, metadata: any, tenantId: number) {
  try {
    // Convert base64 document buffer to actual buffer
    let documentBufferActual: Buffer;
    try {
      if (typeof documentBuffer === 'string') {
        // Handle base64 encoded document
        documentBufferActual = Buffer.from(documentBuffer, 'base64');
      } else if (Buffer.isBuffer(documentBuffer)) {
        documentBufferActual = documentBuffer;
      } else {
        throw new Error('Invalid document buffer format');
      }
    } catch (bufferError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid document buffer format. Must be base64 string or Buffer' 
        },
        { status: 400 }
      );
    }

    console.log('📄 Processing single document with ML routing...');
    
    // Use enhanced document router for ML-based routing
    const routingResult = await enhancedDocumentRouter.routeDocument(
      documentBufferActual,
      metadata || {},
      tenantId
    );

    if (routingResult.success) {
      console.log('✅ Single document routing completed successfully');
      return NextResponse.json({
        success: true,
        message: 'Document routed successfully using ML classifier',
        result: routingResult
      });
    } else {
      console.log('⚠️ Single document routing completed with errors');
      return NextResponse.json({
        success: false,
        message: 'Document routing completed with errors',
        result: routingResult
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Error in single document routing:', error);
    throw error;
  }
}

/**
 * Handle batch document routing
 */
async function handleBatchDocumentRouting(documents: any[], metadata: any, tenantId: number) {
  try {
    if (!Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'documents must be a non-empty array' 
        },
        { status: 400 }
      );
    }

    console.log(`📚 Processing batch of ${documents.length} documents with ML routing...`);
    
    // Convert documents to proper format
    const processedDocuments = documents.map((doc, index) => {
      let buffer: Buffer;
      try {
        if (typeof doc.buffer === 'string') {
          buffer = Buffer.from(doc.buffer, 'base64');
        } else if (Buffer.isBuffer(doc.buffer)) {
          buffer = doc.buffer;
        } else {
          throw new Error(`Invalid buffer format for document ${index}`);
        }
      } catch (bufferError) {
        throw new Error(`Document ${index}: ${bufferError instanceof Error ? bufferError.message : 'Invalid buffer'}`);
      }

      return {
        buffer,
        metadata: doc.metadata || metadata || {},
        tenantId: doc.tenantId || tenantId
      };
    });

    // Use enhanced document router for batch ML routing
    const batchResults = await enhancedDocumentRouter.batchRouteDocuments(processedDocuments);

    const successfulRoutings = batchResults.filter(r => r.success).length;
    const failedRoutings = batchResults.filter(r => !r.success).length;

    console.log(`✅ Batch routing completed: ${successfulRoutings}/${documents.length} successful`);

    return NextResponse.json({
      success: true,
      message: `Batch routing completed: ${successfulRoutings}/${documents.length} successful`,
      results: batchResults,
      summary: {
        total: documents.length,
        successful: successfulRoutings,
        failed: failedRoutings,
        successRate: (successfulRoutings / documents.length) * 100
      }
    });

  } catch (error) {
    console.error('❌ Error in batch document routing:', error);
    throw error;
  }
}

/**
 * Handle getting routing statistics
 */
async function handleGetStatistics(tenantId: number) {
  try {
    console.log('📊 Getting ML routing statistics...');
    
    const statistics = await enhancedDocumentRouter.getRoutingStatistics(tenantId);
    
    console.log('✅ Statistics retrieved successfully');
    return NextResponse.json({
      success: true,
      message: 'Routing statistics retrieved successfully',
      statistics
    });

  } catch (error) {
    console.error('❌ Error getting statistics:', error);
    throw error;
  }
}

/**
 * Handle classifier retraining
 */
async function handleRetrainClassifier(trainingData: any[]) {
  try {
    if (!Array.isArray(trainingData) || trainingData.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'trainingData must be a non-empty array' 
        },
        { status: 400 }
      );
    }

    console.log(`🎯 Retraining ML classifier with ${trainingData.length} samples...`);
    
    const retrainResult = await enhancedDocumentRouter.retrainClassifier(trainingData);
    
    console.log('✅ Classifier retraining completed');
    return NextResponse.json({
      success: true,
      message: 'ML classifier retrained successfully',
      result: retrainResult
    });

  } catch (error) {
    console.error('❌ Error retraining classifier:', error);
    throw error;
  }
}

/**
 * Handle getting classifier status
 */
async function handleGetClassifierStatus() {
  try {
    console.log('🔍 Getting ML classifier status...');
    
    const status = mlDocumentClassifier.getClassifierStatus();
    
    console.log('✅ Classifier status retrieved successfully');
    return NextResponse.json({
      success: true,
      message: 'Classifier status retrieved successfully',
      status
    });

  } catch (error) {
    console.error('❌ Error getting classifier status:', error);
    throw error;
  }
}

/**
 * Handle getting available pipelines
 */
async function handleGetPipelines() {
  try {
    console.log('🔧 Getting available processing pipelines...');
    
    const pipelines = enhancedDocumentRouter.getAvailablePipelines();
    
    console.log('✅ Pipelines retrieved successfully');
    return NextResponse.json({
      success: true,
      message: 'Processing pipelines retrieved successfully',
      pipelines
    });

  } catch (error) {
    console.error('❌ Error getting pipelines:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const tenantId = searchParams.get('tenantId') || '1';

    console.log('🔍 ML Document Routing API GET request:', { action, tenantId });

    // Validate tenantId
    const tenantIdNum = parseInt(tenantId.toString());
    if (isNaN(tenantIdNum) || tenantIdNum <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'tenantId must be a positive integer' 
        },
        { status: 400 }
      );
    }

    // Handle different GET actions
    switch (action) {
      case 'statistics':
        return await handleGetStatistics(tenantIdNum);
      
      case 'classifier_status':
        return await handleGetClassifierStatus();
      
      case 'pipelines':
        return await handleGetPipelines();
      
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: `Unknown GET action: ${action}. Valid actions: statistics, classifier_status, pipelines` 
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ ML Document Routing API GET error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
