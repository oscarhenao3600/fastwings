// Script de prueba para WhatsApp por sucursal
const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testBranchWhatsApp() {
    try {
        console.log('🧪 Probando WhatsApp por sucursal...\n');

        // 1. Obtener estado de todas las sucursales
        console.log('1. Obteniendo estado de sucursales...');
        const branchesResponse = await axios.get(`${BASE_URL}/branch-whatsapp/branches/status`);
        console.log('✅ Sucursales encontradas:', branchesResponse.data.branches.length);
        
        if (branchesResponse.data.branches.length === 0) {
            console.log('⚠️ No hay sucursales configuradas. Crea una sucursal primero.');
            return;
        }

        const firstBranch = branchesResponse.data.branches[0];
        console.log('📋 Primera sucursal:', firstBranch.name);
        console.log('📱 Estado WhatsApp:', firstBranch.whatsapp.status);

        // 2. Probar inicialización de WhatsApp para la primera sucursal
        if (firstBranch.whatsapp.status === 'disconnected') {
            console.log('\n2. Inicializando WhatsApp para la sucursal...');
            try {
                const initResponse = await axios.post(`${BASE_URL}/branch-whatsapp/branch/${firstBranch.id}/initialize`, {
                    phoneNumber: '+573001234567'
                });
                console.log('✅ WhatsApp inicializado:', initResponse.data.message);
            } catch (error) {
                console.log('❌ Error inicializando WhatsApp:', error.response?.data?.error || error.message);
            }
        }

        // 3. Obtener QR si está disponible
        console.log('\n3. Verificando QR...');
        try {
            const qrResponse = await axios.get(`${BASE_URL}/branch-whatsapp/branch/${firstBranch.id}/qr`);
            if (qrResponse.data.qrDataUrl) {
                console.log('✅ QR disponible para escanear');
            } else {
                console.log('ℹ️', qrResponse.data.message);
            }
        } catch (error) {
            console.log('❌ Error obteniendo QR:', error.response?.data?.error || error.message);
        }

        // 4. Probar envío de mensaje (solo si está conectado)
        if (firstBranch.whatsapp.status === 'connected') {
            console.log('\n4. Probando envío de mensaje...');
            try {
                const sendResponse = await axios.post(`${BASE_URL}/branch-whatsapp/branch/${firstBranch.id}/send`, {
                    to: '+573001234567',
                    message: 'Mensaje de prueba desde FastWings'
                });
                console.log('✅ Mensaje enviado:', sendResponse.data.message);
            } catch (error) {
                console.log('❌ Error enviando mensaje:', error.response?.data?.error || error.message);
            }
        }

        console.log('\n🎉 Prueba completada exitosamente!');

    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
        console.error('Error completo:', error);
    }
}

// Ejecutar la prueba
testBranchWhatsApp();
