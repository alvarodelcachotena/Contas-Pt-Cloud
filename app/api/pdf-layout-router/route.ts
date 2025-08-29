import { NextRequest, NextResponse } from 'next/server';
import { pdfLayoutRouter } from '../../../lib/pdf-layout-router';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pdfBuffer, tenantId, documentId } = body;

    // Validate required fields
    if (!pdfBuffer || !tenantId || !documentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'pdfBuffer, tenantId, and documentId are required' 
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

    // Validate documentId
    const documentIdNum = parseInt(documentId.toString());
    if (isNaN(documentIdNum) || documentIdNum <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'documentId must be a positive integer' 
        },
        { status: 400 }
      );
    }

    // Convert base64 PDF buffer to actual buffer
    let pdfBufferActual: Buffer;
    try {
      if (typeof pdfBuffer === 'string') {
        // Handle base64 encoded PDF
        pdfBufferActual = Buffer.from(pdfBuffer, 'base64');
      } else if (Buffer.isBuffer(pdfBuffer)) {
        // Handle actual buffer
        pdfBufferActual = pdfBuffer;
      } else {
        throw new Error('Invalid PDF buffer format');
      }
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid PDF buffer format' 
        },
        { status: 400 }
      );
    }

    console.log(`🔄 Routing PDF ${documentId} for tenant ${tenantId}...`);

    // Route PDF to appropriate processing pipeline
    const routingResult = await pdfLayoutRouter.routePDF(
      pdfBufferActual,
      tenantIdNum,
      documentIdNum
    );

    if (routingResult.success) {
      return NextResponse.json({
        success: true,
        data: {
          pipeline: routingResult.pipeline,
          processingTime: routingResult.processingTime,
          result: routingResult.result
        }
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: routingResult.error || 'PDF routing failed',
          pipeline: routingResult.pipeline,
          processingTime: routingResult.processingTime
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in PDF layout router endpoint:', error);
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
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'tenantId is required' 
        },
        { status: 400 }
      );
    }

    const tenantIdNum = parseInt(tenantId);
    if (isNaN(tenantIdNum) || tenantIdNum <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'tenantId must be a positive integer' 
        },
        { status: 400 }
      );
    }

    switch (action) {
      case 'stats':
        // Get routing statistics
        const stats = await pdfLayoutRouter.getRoutingStats(tenantIdNum);
        return NextResponse.json({ 
          success: true, 
          data: stats 
        });

      case 'analyze':
        // Analyze a sample PDF layout (for testing)
        const sampleBuffer = Buffer.from('Sample PDF content for analysis');
        const analysis = await pdfLayoutRouter.analyzeLayout(sampleBuffer);
        return NextResponse.json({ 
          success: true, 
          data: analysis 
        });

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid action. Use "stats" or "analyze"' 
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in PDF layout router GET endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
