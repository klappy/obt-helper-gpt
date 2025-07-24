export default async (req, context) => {
  console.log('Simple test function starting');
  
  return new Response(JSON.stringify({
    message: 'Hello from Netlify function!',
    method: req.method,
    timestamp: new Date().toISOString(),
    env: {
      hasNodeVersion: !!process.version,
      nodeVersion: process.version || 'unknown'
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}