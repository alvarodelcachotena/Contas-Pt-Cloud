import { NextRequest, NextResponse } from 'next/server';
import { documentEmbeddingPipeline } from '../../../lib/document-embedding-pipeline';
import { embeddingService } from '../../../lib/embedding-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const action = searchParams.get('action');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const tenantIdNum = parseInt(tenantId);

    switch (action) {
      case 'stats':
        // Get pipeline statistics
        const stats = await documentEmbeddingPipeline.getPipelineStats(tenantIdNum);
        return NextResponse.json({ success: true, data: stats });

      case 'cache-stats':
        // Get cache statistics
        const cacheStats = embeddingService.getCacheStats();
        return NextResponse.json({ success: true, data: cacheStats });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: stats, cache-stats' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in embeddings GET endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, action, documentIds, options = {} } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const tenantIdNum = parseInt(tenantId);

    switch (action) {
      case 'process-single':
        // Process a single document
        if (!body.documentId) {
          return NextResponse.json(
            { error: 'documentId is required for process-single' },
            { status: 400 }
          );
        }

        const singleResult = await documentEmbeddingPipeline.processDocument(
          tenantIdNum,
          body.documentId,
          options
        );

        return NextResponse.json({ success: true, data: singleResult });

      case 'process-batch':
        // Process multiple documents
        if (!documentIds || !Array.isArray(documentIds)) {
          return NextResponse.json(
            { error: 'documentIds array is required for process-batch' },
            { status: 400 }
          );
        }

        const batchResults = await documentEmbeddingPipeline.processDocumentsBatch(
          tenantIdNum,
          documentIds,
          options
        );

        return NextResponse.json({ success: true, data: batchResults });

      case 'process-all':
        // Process all pending documents
        const allResults = await documentEmbeddingPipeline.processAllPendingDocuments(
          tenantIdNum,
          options
        );

        return NextResponse.json({ success: true, data: allResults });

      case 'clear-cache':
        // Clear embedding cache
        embeddingService.clearCache();
        return NextResponse.json({ 
          success: true, 
          message: 'Embedding cache cleared' 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: process-single, process-batch, process-all, clear-cache' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in embeddings POST endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
