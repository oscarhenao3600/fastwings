const axios = require('axios');

async function testWhatsAppRoute() {
    try {
        console.log('🔍 Probando ruta de WhatsApp de sucursales...');
        
        // Primero probar sin autenticación
        console.log('\n1. Probando sin token:');
        try {
            const response = await axios.get('http://localhost:4000/api/branch-whatsapp/branches/status');
            console.log('✅ Respuesta sin token:', response.data);
        } catch (error) {
            console.log('❌ Error sin token:', error.response?.status, error.response?.data);
        }

        // Probar con login
        console.log('\n2. Haciendo login...');
        const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
            email: 'admin@fastwings.com',
            password: 'admin123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login exitoso, token obtenido');

        // Probar con token
        console.log('\n3. Probando con token:');
        const whatsappResponse = await axios.get('http://localhost:4000/api/branch-whatsapp/branches/status', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Respuesta con token:', JSON.stringify(whatsappResponse.data, null, 2));
        
    } catch (error) {
        console.error('❌ Error general:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
            console.error('Headers:', error.response.headers);
        }
    }
}

testWhatsAppRoute();
