// Script de prueba para subir PDF
const fs = require('fs');
const FormData = require('form-data');

async function testPdfUpload() {
  try {
    // 1. Login para obtener token
    console.log('1. Obteniendo token de autenticación...');
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
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Token obtenido:', token.substring(0, 20) + '...');
    
    // 2. Verificar estado inicial
    console.log('\n2. Verificando estado inicial de sucursal branch-1...');
    const branchesResponse = await fetch('http://localhost:4000/api/admin/branches', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const branchesData = await branchesResponse.json();
    const branch1 = branchesData.branches.find(b => b.id === 'branch-1');
    console.log('Estado inicial:', {
      hasPdf: branch1.menu.hasPdf,
      lastUpdated: branch1.menu.lastUpdated
    });
    
    // 3. Subir PDF
    console.log('\n3. Subiendo PDF de prueba...');
    const formData = new FormData();
    formData.append('menu', fs.createReadStream('test-menu.pdf'));
    
    const uploadResponse = await fetch('http://localhost:4000/api/branch/branch-1/upload-menu', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    const uploadData = await uploadResponse.json();
    console.log('✅ PDF subido exitosamente:', uploadData);
    
    // 4. Verificar estado después de subida
    console.log('\n4. Verificando estado después de subida...');
    const menuResponse = await fetch('http://localhost:4000/api/branch/branch-1/menu', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const menuData = await menuResponse.json();
    console.log('Estado después de subida:', menuData);
    
    console.log('\n🎉 ¡Prueba completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar prueba
testPdfUpload();
