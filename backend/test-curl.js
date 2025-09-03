// Script de prueba usando curl para diagnosticar el problema de PDFs
const { exec } = require('child_process');
const fs = require('fs');

async function testWithCurl() {
  try {
    console.log('🔍 Probando con curl para diagnosticar el problema...\n');
    
    // Paso 1: Obtener token
    console.log('1️⃣ Obteniendo token...');
    const loginCommand = `curl -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d "{\\"email\\":\\"admin@fastwings.com\\",\\"password\\":\\"admin123\\"}"`;
    
    exec(loginCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error en login:', error);
        return;
      }
      
      try {
        const loginData = JSON.parse(stdout);
        const token = loginData.token;
        console.log('✅ Token obtenido:', token.substring(0, 50) + '...\n');
        
        // Paso 2: Probar subida con curl
        console.log('2️⃣ Probando subida con curl...');
        const uploadCommand = `curl -X POST http://localhost:4000/api/branch/branch-1/upload-menu -H "Authorization: Bearer ${token}" -F "menu=@test-menu-valid.pdf"`;
        
        exec(uploadCommand, (error, stdout, stderr) => {
          if (error) {
            console.error('❌ Error en subida:', error);
            return;
          }
          
          console.log('✅ Respuesta del servidor:');
          console.log(stdout);
          
          if (stderr) {
            console.log('⚠️ Errores:');
            console.log(stderr);
          }
        });
        
      } catch (parseError) {
        console.error('❌ Error parseando respuesta:', parseError);
        console.log('Respuesta raw:', stdout);
      }
    });
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar prueba
testWithCurl();
