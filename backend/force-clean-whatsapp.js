const fs = require('fs');
const path = require('path');

console.log('🧹 LIMPIEZA COMPLETA DE WHATSAPP - MODO FORZADO\n');

// 1. Limpiar directorio de autenticación
const authDir = path.join(__dirname, '.wwebjs_auth');
if (fs.existsSync(authDir)) {
    try {
        fs.rmSync(authDir, { recursive: true, force: true });
        console.log('✅ Directorio de autenticación eliminado');
    } catch (error) {
        console.error('❌ Error eliminando directorio de auth:', error.message);
    }
}

// 2. Limpiar directorio de sesiones
const sessionDir = path.join(__dirname, '.wwebjs_sessions');
if (fs.existsSync(sessionDir)) {
    try {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        console.log('✅ Directorio de sesiones eliminado');
    } catch (error) {
        console.error('❌ Error eliminando directorio de sesiones:', error.message);
    }
}

// 3. Limpiar archivos de caché de Puppeteer
const puppeteerCacheDir = path.join(process.env.TEMP || process.env.TMP || '/tmp', '.puppeteer');
if (fs.existsSync(puppeteerCacheDir)) {
    try {
        fs.rmSync(puppeteerCacheDir, { recursive: true, force: true });
        console.log('✅ Caché de Puppeteer eliminado');
    } catch (error) {
        console.error('❌ Error eliminando caché de Puppeteer:', error.message);
    }
}

// 4. Buscar y eliminar archivos de sesión en el directorio actual
const currentDir = __dirname;
const files = fs.readdirSync(currentDir);
files.forEach(file => {
    if (file.includes('session') || file.includes('auth') || file.includes('whatsapp')) {
        const filePath = path.join(currentDir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            try {
                fs.rmSync(filePath, { recursive: true, force: true });
                console.log(`✅ Directorio eliminado: ${file}`);
            } catch (error) {
                console.log(`⚠️ No se pudo eliminar: ${file}`);
            }
        }
    }
});

// 5. Limpiar datos de la base de datos local
const dataDir = path.join(__dirname, 'data');
if (fs.existsSync(dataDir)) {
    try {
        const dataFiles = fs.readdirSync(dataDir);
        dataFiles.forEach(file => {
            if (file.includes('whatsapp') || file.includes('session')) {
                const filePath = path.join(dataDir, file);
                fs.unlinkSync(filePath);
                console.log(`✅ Archivo de datos eliminado: ${file}`);
            }
        });
    } catch (error) {
        console.log('⚠️ No se pudieron limpiar archivos de datos');
    }
}

console.log('\n🎯 LIMPIEZA COMPLETADA');
console.log('📱 Ahora puedes:');
console.log('   1. Cerrar WhatsApp Web en tu navegador');
console.log('   2. Desvincular WhatsApp Web desde tu teléfono');
console.log('   3. Reiniciar el servidor: node simple-test-server.js');
console.log('   4. Usar el botón "Nueva Sesión" en el frontend');
console.log('\n💡 Si aún no funciona:');
console.log('   - Desinstala WhatsApp Web desde tu teléfono');
console.log('   - Vuelve a instalarlo');
console.log('   - Intenta con un navegador diferente');
