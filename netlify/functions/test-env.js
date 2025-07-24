export default async function handler(req, context) {
  try {
    console.log('Test function starting...');
    
    // Check environment variables
    const envCheck = {
      hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasTwilioToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasTwilioPhone: !!process.env.TWILIO_PHONE_NUMBER,
      hasNetlifySiteId: !!process.env.NETLIFY_SITE_ID,
      hasOpenAI: !!process.env.OPENAI_API_KEY
    };
    
    console.log('Environment check:', envCheck);
    
    // Test imports one by one
    let importResults = {};
    
    try {
      const { getStore } = await import("@netlify/blobs");
      importResults.netlifyBlobs = 'OK';
      console.log('Netlify Blobs import: OK');
    } catch (error) {
      importResults.netlifyBlobs = error.message;
      console.log('Netlify Blobs import failed:', error.message);
    }
    
    try {
      const twilio = await import('twilio');
      importResults.twilio = 'OK';
      console.log('Twilio import: OK');
      
      // Try to create client only if we have credentials
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        const client = twilio.default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        importResults.twilioClient = 'OK';
        console.log('Twilio client creation: OK');
      } else {
        importResults.twilioClient = 'Missing credentials';
        console.log('Twilio client: Missing credentials');
      }
    } catch (error) {
      importResults.twilio = error.message;
      console.log('Twilio import/client failed:', error.message);
    }
    
    return new Response(JSON.stringify({
      status: 'success',
      environment: envCheck,
      imports: importResults,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Test function error:', error);
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}