const axios = require('axios');

async function testCompleteSystem() {
  try {
    console.log('🚀 Probando sistema completo...');
    
    // 1. Login
    console.log('\n1️⃣ Probando login...');
    const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'admin@fastwings.com',
      password: 'admin123'
    });
    
    console.log('✅ Login exitoso');
    const token = loginResponse.data.token;
    
    // 2. Dashboard
    console.log('\n2️⃣ Probando dashboard...');
    const dashboardResponse = await axios.get('http://localhost:4000/api/admin/dashboard/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Dashboard cargado:', dashboardResponse.data);
    
    // 3. Sucursales
    console.log('\n3️⃣ Probando sucursales...');
    const branchesResponse = await axios.get('http://localhost:4000/api/admin/branches', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Sucursales cargadas:', branchesResponse.data.branches.length);
    
    // 4. Estado de WhatsApp
    console.log('\n4️⃣ Probando estado de WhatsApp...');
    const whatsappResponse = await axios.get('http://localhost:4000/api/branch-whatsapp/branches/status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Estado de WhatsApp cargado:', whatsappResponse.data.branches.length);
    
    // 5. Inicializar WhatsApp para una sucursal
    console.log('\n5️⃣ Probando inicialización de WhatsApp...');
    const initResponse = await axios.post('http://localhost:4000/api/branch-whatsapp/branch/branch-1/initialize', {
      phoneNumber: '+573001234567'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ WhatsApp inicializado:', initResponse.data);
    
    // 6. Obtener QR
    console.log('\n6️⃣ Probando obtención de QR...');
    const qrResponse = await axios.get('http://localhost:4000/api/branch-whatsapp/branch/branch-1/qr', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ QR obtenido:', qrResponse.data.qrDataUrl ? 'Sí' : 'No');
    
    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('\n📱 Ahora puedes probar el frontend en: http://localhost:4000/frontend-admin/super.html');
    console.log('🔐 Usa: admin@fastwings.com / admin123');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

testCompleteSystem();
