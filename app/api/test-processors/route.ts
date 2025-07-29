import { NextRequest, NextResponse } from 'next/server';
import { ProcessorTester } from '../../../server/test-processors';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Starting processor testing...');
    
    // Get Dropbox integration credentials
    const integrationResponse = await fetch('http://localhost:5000/api/cloud-integrations');
    const integrationsData = await integrationResponse.json();
    
    const dropboxIntegration = integrationsData.integrations?.find((i: any) => i.provider === 'dropbox');
    
    if (!dropboxIntegration) {
      return NextResponse.json({ 
        error: 'No Dropbox integration found. Please connect your Dropbox first.' 
      }, { status: 404 });
    }

    if (!dropboxIntegration.access_token) {
      return NextResponse.json({ 
        error: 'Dropbox access token not available. Please reconnect your Dropbox.' 
      }, { status: 401 });
    }

    // Check API keys
    const hasGemini = !!process.env.GOOGLE_AI_API_KEY;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    
    if (!hasGemini && !hasOpenAI) {
      return NextResponse.json({ 
        error: 'No AI processor API keys found. Please provide GOOGLE_AI_API_KEY or OPENAI_API_KEY.' 
      }, { status: 400 });
    }

    console.log(`🔑 Available processors: ${hasGemini ? 'Gemini' : ''} ${hasOpenAI ? 'OpenAI' : ''}`);

    // Parse request body for options
    const body = await request.json().catch(() => ({}));
    const documentCount = body.documentCount || 5;

    // Initialize tester
    const tester = new ProcessorTester(
      dropboxIntegration.access_token,
      dropboxIntegration.refresh_token
    );

    // Check available documents first
    const availableDocs = await tester.getAvailableDocuments();
    
    if (availableDocs.length === 0) {
      return NextResponse.json({ 
        error: 'No documents found in Dropbox /input folder. Please upload some documents first.' 
      }, { status: 404 });
    }

    console.log(`📄 Found ${availableDocs.length} documents in Dropbox`);

    // Run the test
    const report = await tester.testRandomDocuments(Math.min(documentCount, availableDocs.length));

    // Generate readable report
    const reportText = tester.generateReport(report);
    
    // Save report to file
    await tester.saveReport(report, `processor-test-${Date.now()}.txt`);

    console.log('✅ Processor testing completed');

    return NextResponse.json({
      success: true,
      summary: {
        totalDocuments: report.totalDocuments,
        successfulGemini: report.successfulGemini,
        successfulOpenAI: report.successfulOpenAI,
        averageProcessingTime: report.averageProcessingTime,
        availableProcessors: {
          gemini: hasGemini,
          openai: hasOpenAI
        }
      },
      report: reportText,
      detailedResults: report,
      message: `Tested ${report.totalDocuments} documents. Gemini: ${report.successfulGemini}/${report.totalDocuments} successful, OpenAI: ${report.successfulOpenAI}/${report.totalDocuments} successful.`
    });

  } catch (error) {
    console.error('❌ Processor testing failed:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error occurred during testing',
      success: false
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return current processor status and available documents
    const integrationResponse = await fetch('http://localhost:5000/api/cloud-integrations');
    const integrationsData = await integrationResponse.json();
    
    const dropboxIntegration = integrationsData.integrations?.find((i: any) => i.provider === 'dropbox');
    
    const status = {
      dropboxConnected: !!dropboxIntegration?.access_token,
      processors: {
        gemini: {
          available: !!process.env.GOOGLE_AI_API_KEY,
          model: 'gemini-2.5-flash'
        },
        openai: {
          available: !!process.env.OPENAI_API_KEY,
          model: 'gpt-4o-mini-2024-07-18'
        }
      }
    };

    if (dropboxIntegration?.access_token) {
      try {
        const tester = new ProcessorTester(
          dropboxIntegration.access_token,
          dropboxIntegration.refresh_token
        );
        const availableDocs = await tester.getAvailableDocuments();
        
        return NextResponse.json({
          ...status,
          availableDocuments: availableDocs.length,
          documentList: availableDocs.slice(0, 10).map(doc => ({
            name: doc.name,
            size: doc.size,
            path: doc.path_display
          }))
        });
      } catch (error) {
        return NextResponse.json({
          ...status,
          availableDocuments: 0,
          error: 'Failed to fetch documents from Dropbox'
        });
      }
    }

    return NextResponse.json(status);
    
  } catch (error) {
    console.error('❌ Status check failed:', error);
    return NextResponse.json({
      error: 'Failed to check processor status',
      success: false
    }, { status: 500 });
  }
}