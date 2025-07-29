import { NextRequest, NextResponse } from 'next/server';

// Force environment loading
require('../../../lib/env-loader');

export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    console.log('🔑 Testing OpenAI API Key...');
    console.log(`Key available: ${!!apiKey}`);
    console.log(`Key format: ${apiKey ? 'sk-proj-' + apiKey.substring(8, 20) + '...' : 'Not found'}`);
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'No OpenAI API key found',
        success: false 
      });
    }
    
    // Test API connection
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 OpenAI API Response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      const gpt4oMiniAvailable = data.data.some((m: any) => m.id.includes('gpt-4o-mini'));
      
      return NextResponse.json({
        success: true,
        status: 'OpenAI API working',
        availableModels: data.data.length,
        gpt4oMiniAvailable,
        testResult: 'API key is valid and working'
      });
    } else {
      const errorText = await response.text();
      console.log(`❌ OpenAI API Error: ${errorText}`);
      
      return NextResponse.json({
        success: false,
        error: `OpenAI API Error: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }
  } catch (error) {
    console.log(`❌ OpenAI API Connection Error: ${error}`);
    
    return NextResponse.json({
      success: false,
      error: 'OpenAI API Connection Error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}