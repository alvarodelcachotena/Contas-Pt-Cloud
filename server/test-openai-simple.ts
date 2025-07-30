// Simple OpenAI API test
require('../lib/env-loader');

async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  console.log('🔑 Testing OpenAI API Key...');
  console.log(`Key available: ${!!apiKey}`);
  console.log(`Key format: ${apiKey ? 'sk-proj-' + apiKey.substring(8, 20) + '...' : 'Not found'}`);
  
  if (!apiKey) {
    console.log('❌ No OpenAI API key found');
    return;
  }
  
  try {
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
      console.log(`✅ OpenAI API working! Available models: ${data.data.length}`);
      console.log(`🤖 GPT-4o-mini available: ${data.data.some((m: any) => m.id.includes('gpt-4o-mini'))}`);
    } else {
      const errorText = await response.text();
      console.log(`❌ OpenAI API Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ OpenAI API Connection Error: ${error}`);
  }
}

testOpenAI();