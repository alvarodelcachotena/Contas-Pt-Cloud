import { NextResponse } from 'next/server'
import { ProcessorManager } from '@/server/agents/ProcessorManager'

const processorManager = new ProcessorManager()

export async function POST(request: Request) {
  try {
    const { action } = await request.json()

    switch (action) {
      case 'list':
        return NextResponse.json({
          processors: [
            {
              name: 'Gemini + OpenAI',
              type: 'internal',
              supportedFormats: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
              specialties: ['invoices', 'receipts', 'portuguese_documents'],
              avgProcessingTime: 5000,
              costPerDocument: 0.02,
              accuracy: 0.92,
              isAvailable: true,
              description: 'Internal AI processing with Gemini and OpenAI models'
            }
          ],
          success: true
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in processors endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}