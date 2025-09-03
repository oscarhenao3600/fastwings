const fetch = require('node-fetch');

async function testWhatsAppConnection() {
    const baseURL = 'http://localhost:4000/api';
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YjMyZDMxNjc2OTdmNzdjOTE0ZDM3NyIsImVtYWlsIjoiYWRtaW5AZmFzdHdpbmdzLmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTczNTg5NjgwMCwiZXhwIjoxNzM1OTgzMjAwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

    try {
        console.log('🔍 Probando conexión de WhatsApp...\n');

        // 1. Obtener estado actual
        console.log('1. Obteniendo estado actual...');
        const statusResponse = await fetch(`${baseURL}/whatsapp/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!statusResponse.ok) {
            throw new Error(`Error obteniendo estado: ${statusResponse.status}`);
        }
        
        const statusData = await statusResponse.json();
        console.log('✅ Estado obtenido:', statusData.branches[0].whatsapp.status);

        // 2. Conectar WhatsApp
        console.log('\n2. Conectando WhatsApp...');
        const connectResponse = await fetch(`${baseURL}/whatsapp/branch/branch-1/connect`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!connectResponse.ok) {
            const errorData = await connectResponse.json();
            throw new Error(`Error conectando: ${errorData.error}`);
        }
        
        const connectData = await connectResponse.json();
        console.log('✅ Conexión iniciada:', connectData.message);

        // 3. Esperar un momento para que se genere el QR
        console.log('\n3. Esperando generación del QR...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 4. Verificar estado nuevamente
        console.log('\n4. Verificando estado después de conexión...');
        const newStatusResponse = await fetch(`${baseURL}/whatsapp/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!newStatusResponse.ok) {
            throw new Error(`Error obteniendo nuevo estado: ${newStatusResponse.status}`);
        }
        
        const newStatusData = await newStatusResponse.json();
        const branch = newStatusData.branches[0];
        
        console.log('✅ Nuevo estado:', branch.whatsapp.status);
        console.log('✅ QR disponible:', !!branch.whatsapp.qr_code);
        
        if (branch.whatsapp.qr_code) {
            console.log('🎉 ¡QR generado exitosamente!');
            console.log('📱 Escanea el QR en el frontend para conectar WhatsApp');
        } else {
            console.log('⚠️ QR no disponible aún. Intenta regenerar el QR.');
        }

    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
    }
}

// Ejecutar la prueba
testWhatsAppConnection();
