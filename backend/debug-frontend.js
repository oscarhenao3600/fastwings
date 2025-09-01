// Script para debuggear el problema del frontend
const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function debugFrontend() {
    try {
        console.log('🔍 Debuggeando problema del frontend...\n');

        // 1. Login para obtener token
        console.log('1. Haciendo login...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@fastwings.com',
            password: 'admin123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Token obtenido:', token.substring(0, 20) + '...');

        // 2. Simular exactamente lo que hace el frontend
        console.log('\n2. Simulando petición del frontend...');
        
        // URL exacta que usa el frontend
        const frontendUrl = 'http://localhost:4000/admin/dashboard/stats';
        console.log('URL del frontend:', frontendUrl);
        
        try {
            const response = await axios.get(frontendUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✅ Respuesta exitosa:', response.data);
            
        } catch (error) {
            console.log('❌ Error en petición del frontend:');
            console.log('Status:', error.response?.status);
            console.log('Headers:', error.response?.headers);
            console.log('Data:', error.response?.data);
            
            // Intentar con la URL correcta
            console.log('\n3. Intentando con URL correcta...');
            const correctUrl = `${BASE_URL}/admin/dashboard/stats`;
            console.log('URL correcta:', correctUrl);
            
            const correctResponse = await axios.get(correctUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✅ Respuesta correcta:', correctResponse.data);
        }

    } catch (error) {
        console.error('❌ Error general:', error.message);
    }
}

// Ejecutar debug
debugFrontend();

