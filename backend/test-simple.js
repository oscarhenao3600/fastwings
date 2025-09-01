const axios = require('axios');

async function testAuth() {
  try {
    console.log('🔐 Probando autenticación...');
    
    // 1. Login
    const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'admin@fastwings.com',
      password: 'admin123'
    });
    
    console.log('✅ Login exitoso');
    console.log('Token:', loginResponse.data.token.substring(0, 50) + '...');
    console.log('Usuario:', loginResponse.data.user);
    
    const token = loginResponse.data.token;
    
    // 2. Probar dashboard con token
    const dashboardResponse = await axios.get('http://localhost:4000/api/admin/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Dashboard cargado exitosamente');
    console.log('Datos:', dashboardResponse.data);
    
    // 3. Probar sucursales
    const branchesResponse = await axios.get('http://localhost:4000/api/admin/branches', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Sucursales cargadas exitosamente');
    console.log('Sucursales:', branchesResponse.data.branches.length);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAuth();
