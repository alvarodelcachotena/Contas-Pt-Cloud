import { NextRequest, NextResponse } from 'next/server'
import { ProcessorManager } from '../../../server/agents/ProcessorManager'

const processorManager = new ProcessorManager()

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    switch (action) {
      case 'list':
        return NextResponse.json({
          processors: processorManager.getAvailableProcessors(),
          success: true
        })
      
      case 'capabilities':
        const capabilities = Array.from(processorManager.getProcessorCapabilities().entries())
          .map(([name, cap]) => ({ name, ...cap }))
        return NextResponse.json({
          capabilities,
          success: true
        })
      
      case 'recommend':
        const mimeType = url.searchParams.get('mimeType') || 'application/pdf'
        const filename = url.searchParams.get('filename') || 'document.pdf'
        const recommended = processorManager.getRecommendedProcessor(mimeType, filename)
        return NextResponse.json({
          recommended,
          mimeType,
          filename,
          success: true
        })
      
      default:
        return NextResponse.json({
          processors: processorManager.getAvailableProcessors(),
          success: true
        })
    }
  } catch (error) {
    console.error('Error in processors API:', error)
    return NextResponse.json({
      error: 'Failed to fetch processor information',
      success: false
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, processor, testFile } = body

    switch (action) {
      case 'test':
        if (!processor) {
          return NextResponse.json({
            error: 'Processor name required for testing',
            success: false
          }, { status: 400 })
        }

        const testResult = await processorManager.testProcessor(processor)
        return NextResponse.json({
          processor,
          available: testResult,
          success: true
        })
      
      case 'process':
        if (!testFile || !testFile.buffer || !testFile.mimeType || !testFile.filename) {
          return NextResponse.json({
            error: 'Test file data required (buffer, mimeType, filename)',
            success: false
          }, { status: 400 })
        }

        const buffer = Buffer.from(testFile.buffer, 'base64')
        const tenantId = 1 // Default tenant for testing
        
        const result = await processorManager.processDocument(
          tenantId,
          buffer,
          testFile.mimeType,
          testFile.filename,
          {
            primary: processor || undefined,
            confidenceThreshold: 0.5 // Lower threshold for testing
          }
        )

        return NextResponse.json({
          result,
          success: true
        })
      
      case 'cost':
        if (!processor) {
          return NextResponse.json({
            error: 'Processor name required for cost calculation',
            success: false
          }, { status: 400 })
        }

        const cost = processorManager.getProcessingCost(processor)
        return NextResponse.json({
          processor,
          costPerDocument: cost,
          currency: 'USD',
          success: true
        })
      
      default:
        return NextResponse.json({
          error: 'Invalid action. Supported: test, process, cost',
          success: false
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in processors POST API:', error)
    return NextResponse.json({
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : String(error),
      success: false
    }, { status: 500 })
  }
}