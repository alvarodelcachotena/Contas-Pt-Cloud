import { NextRequest, NextResponse } from 'next/server';
import { ragService, type RAGQuery } from '../../../../lib/rag-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, tenantId, topK, similarityThreshold, includeMetadata, includeContent } = body;

    // Validate required fields
    if (!query || !tenantId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'query and tenantId are required' 
        },
        { status: 400 }
      );
    }

    // Validate query length
    if (typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'query must be a non-empty string' 
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

    // Validate optional parameters
    const validatedTopK = topK ? Math.max(1, Math.min(50, parseInt(topK.toString()) || 5)) : 5;
    const validatedThreshold = similarityThreshold ? 
      Math.max(0.1, Math.min(1.0, parseFloat(similarityThreshold.toString()) || 0.7)) : 0.7;

    // Create RAG query object
    const ragQuery: RAGQuery = {
      query: query.trim(),
      tenantId: tenantIdNum,
      topK: validatedTopK,
      similarityThreshold: validatedThreshold,
      includeMetadata: Boolean(includeMetadata),
      includeContent: Boolean(includeContent)
    };

    // Execute RAG query
    const result = await ragService.query(ragQuery);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'RAG query failed' 
        },
        { status: 500 }
      );
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error in RAG query endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        // Get RAG service statistics
        const stats = ragService.getStats();
        return NextResponse.json({ 
          success: true, 
          data: stats 
        });

      case 'cache-stats':
        // Get cache statistics
        const cacheStats = ragService.getCacheStats();
        return NextResponse.json({ 
          success: true, 
          data: cacheStats 
        });

      case 'health':
        // Health check
        return NextResponse.json({ 
          success: true, 
          status: 'healthy',
          service: 'RAG API',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid action. Use: stats, cache-stats, health' 
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in RAG GET endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'clear-cache') {
      // Clear RAG query cache
      ragService.clearCache();
      return NextResponse.json({ 
        success: true, 
        message: 'RAG query cache cleared' 
      });
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Invalid action. Use: clear-cache' 
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in RAG DELETE endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
