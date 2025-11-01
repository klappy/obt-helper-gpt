// Test registration against deployed preview
const testRegistration = async () => {
  const baseURL = 'https://deploy-preview-8--obt-helper-gpt.netlify.app';
  const email = `test-${Date.now()}@example.com`;
  const password = 'testpassword123';
  
  console.log(`\n=== TESTING REGISTRATION ===`);
  console.log(`URL: ${baseURL}/.netlify/functions/users`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}\n`);
  
  try {
    const response = await fetch(`${baseURL}/.netlify/functions/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const text = await response.text();
    console.log(`Response body: ${text}`);
    
    if (response.ok) {
      const json = JSON.parse(text);
      console.log('\n✅ SUCCESS:', JSON.stringify(json, null, 2));
      return true;
    } else {
      console.log('\n❌ FAILED - Status:', response.status);
      try {
        const json = JSON.parse(text);
        console.log('Error object:', JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('Non-JSON error response:', text);
      }
      return false;
    }
  } catch (error) {
    console.error('❌ REQUEST ERROR:', error.message);
    return false;
  }
};

testRegistration();
