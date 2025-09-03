const fs = require('fs');
const path = require('path');

console.log('🧹 Limpiando sesiones anteriores de WhatsApp...\n');

const authDir = path.join(__dirname, '.wwebjs_auth');

if (fs.existsSync(authDir)) {
    try {
        fs.rmSync(authDir, { recursive: true, force: true });
        console.log('✅ Sesiones eliminadas exitosamente');
    } catch (error) {
        console.error('❌ Error eliminando sesiones:', error.message);
    }
} else {
    console.log('ℹ️ No hay sesiones para eliminar');
}

console.log('\n🎯 Ahora puedes iniciar el servidor con sesiones limpias:');
console.log('   node simple-test-server.js');
