// Script para probar la subida de PDFs de manera simple
const fs = require('fs');
const FormData = require('form-data');

async function testPdfUploadSimple() {
  try {
    console.log('📄 Probando subida de PDFs...\n');
    
    // Paso 1: Login
    console.log('1️⃣ Obteniendo token...');
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@fastwings.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Token obtenido\n');
    
    // Paso 2: Crear FormData
    console.log('2️⃣ Preparando archivo PDF...');
    const formData = new FormData();
    formData.append('menu', fs.createReadStream('test-menu-valid.pdf'));
    console.log('✅ Archivo preparado\n');
    
    // Paso 3: Subir PDF
    console.log('3️⃣ Subiendo PDF...');
    const uploadResponse = await fetch('http://localhost:4000/api/branch/branch-1/upload-menu', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.log('❌ Error en la respuesta:', uploadResponse.status);
      console.log('Respuesta del servidor:', errorText);
      return;
    }
    
    const uploadData = await uploadResponse.json();
    console.log('✅ PDF subido exitosamente!');
    console.log('   Archivo:', uploadData.data.filename);
    console.log('   Tamaño:', uploadData.data.size, 'bytes');
    console.log('   Contenido extraído:', uploadData.data.contentLength, 'caracteres');
    console.log('   Última actualización:', uploadData.data.lastUpdated);
    
    console.log('\n🎉 ¡Funcionalidad de PDFs funcionando correctamente!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejecutar prueba
testPdfUploadSimple();
