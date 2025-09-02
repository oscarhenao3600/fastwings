const fetch = require('node-fetch');

async function testServer() {
  console.log('🧪 Probando servidor...');
  
  try {
    // Test 1: Login
    console.log('1️⃣ Probando login...');
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@fastwings.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (loginData.token) {
      console.log('✅ Login exitoso');
      
      // Test 2: Dashboard
      console.log('2️⃣ Probando dashboard...');
      const dashboardResponse = await fetch('http://localhost:4000/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const dashboardData = await dashboardResponse.json();
      console.log('Dashboard response:', dashboardData);
      
      if (dashboardResponse.ok) {
        console.log('✅ Dashboard funciona');
      } else {
        console.log('❌ Dashboard falló');
      }
    } else {
      console.log('❌ Login falló');
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
  }
}

testServer();
