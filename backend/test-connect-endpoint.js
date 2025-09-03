const fetch = require('node-fetch');

async function testConnectEndpoint() {
    const baseURL = 'http://localhost:4000/api';
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YjMyZDMxNjc2OTdmNzdjOTE0ZDM3NyIsImVtYWlsIjoiYWRtaW5AZmFzdHdpbmdzLmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTczNTg5NjgwMCwiZXhwIjoxNzM1OTgzMjAwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

    try {
        console.log('🔍 Probando endpoint de conexión...\n');

        // 1. Probar conexión
        console.log('1. Intentando conectar WhatsApp...');
        const connectResponse = await fetch(`${baseURL}/whatsapp/branch/branch-1/connect`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Status:', connectResponse.status);
        
        if (!connectResponse.ok) {
            const errorData = await connectResponse.text();
            console.log('Error response:', errorData);
            throw new Error(`Error conectando: ${connectResponse.status}`);
        }
        
        const connectData = await connectResponse.json();
        console.log('✅ Conexión exitosa:', connectData);

        // 2. Verificar estado
        console.log('\n2. Verificando estado...');
        const statusResponse = await fetch(`${baseURL}/whatsapp/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('✅ Estado actual:', statusData.branches[0].whatsapp.status);
        }

    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
    }
}

testConnectEndpoint();
