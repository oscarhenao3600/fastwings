const fetch = require('node-fetch');

async function testLogin() {
    try {
        console.log('🧪 Probando login...');
        
        // Test 1: Login
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
        console.log('✅ Login response:', loginData);
        
        if (loginData.token) {
            console.log('🔑 Token generado:', loginData.token.substring(0, 50) + '...');
            
            // Test 2: Dashboard con token
            const dashboardResponse = await fetch('http://localhost:4000/api/admin/dashboard/stats', {
                headers: {
                    'Authorization': `Bearer ${loginData.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('📡 Dashboard status:', dashboardResponse.status);
            const dashboardData = await dashboardResponse.json();
            console.log('📄 Dashboard data:', dashboardData);
            
        } else {
            console.log('❌ No se generó token');
        }
        
    } catch (error) {
        console.error('❌ Error en test:', error);
    }
}

testLogin();
