// Script para probar autenticación y rutas
const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testAuth() {
    try {
        console.log('🔐 Probando autenticación...\n');

        // 1. Intentar login
        console.log('1. Intentando login...');
        try {
            const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
                email: 'admin@fastwings.com',
                password: 'admin123'
            });
            
            console.log('✅ Login exitoso');
            const token = loginResponse.data.token;
            console.log('Token:', token.substring(0, 20) + '...');
            
            // 2. Probar ruta protegida con token válido
            console.log('\n2. Probando ruta protegida...');
            const dashboardResponse = await axios.get(`${BASE_URL}/admin/dashboard/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('✅ Dashboard stats obtenidas:', dashboardResponse.data);
            
            // 3. Probar WhatsApp por sucursal
            console.log('\n3. Probando WhatsApp por sucursal...');
            const whatsappResponse = await axios.get(`${BASE_URL}/branch-whatsapp/branches/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('✅ WhatsApp status obtenido:', whatsappResponse.data);
            
        } catch (error) {
            if (error.response) {
                console.log('❌ Error:', error.response.status, error.response.data);
            } else {
                console.log('❌ Error:', error.message);
            }
        }

    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
    }
}

// Ejecutar la prueba
testAuth();
