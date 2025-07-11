import { NextRequest, NextResponse } from 'next/server'
import { dropboxScheduler } from '../../../../server/dropbox-scheduler'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider } = body

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
    }

    console.log(`🔄 Manual sync triggered for provider: ${provider}`)

    if (provider === 'dropbox') {
      // Trigger manual Dropbox sync
      await dropboxScheduler.runOnce()
      
      return NextResponse.json({ 
        success: true, 
        message: 'Dropbox sync started successfully',
        provider: 'dropbox'
      })
    } else {
      return NextResponse.json({ 
        error: `Provider ${provider} not supported for manual sync` 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in manual sync:', error)
    return NextResponse.json({ 
      error: 'Internal server error during sync' 
    }, { status: 500 })
  }
}