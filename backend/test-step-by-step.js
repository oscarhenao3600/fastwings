// Script simple para probar la funcionalidad paso a paso
const fs = require('fs');

async function testStepByStep() {
  try {
    console.log('🔍 Probando funcionalidad paso a paso...\n');
    
    // Paso 1: Login
    console.log('1️⃣ Obteniendo token de autenticación...');
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@fastwings.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login falló: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login exitoso');
    console.log(`   Token: ${token.substring(0, 50)}...\n`);
    
    // Paso 2: Verificar estado inicial
    console.log('2️⃣ Verificando estado inicial...');
    const menuResponse = await fetch('http://localhost:4000/api/branch/branch-1/menu', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!menuResponse.ok) {
      throw new Error(`Error obteniendo menú: ${menuResponse.status}`);
    }
    
    const menuData = await menuResponse.json();
    console.log('✅ Estado inicial obtenido');
    console.log(`   Tiene PDF: ${menuData.data.hasPdf}`);
    console.log(`   Última actualización: ${menuData.data.lastUpdated}\n`);
    
    // Paso 3: Verificar que el archivo PDF existe
    console.log('3️⃣ Verificando archivo PDF de prueba...');
    if (fs.existsSync('test-menu.pdf')) {
      const stats = fs.statSync('test-menu.pdf');
      console.log('✅ Archivo PDF encontrado');
      console.log(`   Tamaño: ${stats.size} bytes`);
      console.log(`   Última modificación: ${stats.mtime}\n`);
    } else {
      throw new Error('❌ Archivo test-menu.pdf no encontrado');
    }
    
    console.log('🎉 ¡Todas las verificaciones básicas pasaron!');
    console.log('📝 El backend está funcionando correctamente.');
    console.log('🌐 Puedes acceder al frontend en: http://localhost:4000/frontend-admin/index.html');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Ejecutar prueba
testStepByStep();
