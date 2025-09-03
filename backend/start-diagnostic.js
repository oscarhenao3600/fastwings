console.log('🚀 Iniciando servidor FastWings...');

try {
    // Verificar que el archivo existe
    const fs = require('fs');
    const path = require('path');
    
    const serverFile = path.join(__dirname, 'simple-test-server.js');
    console.log('📁 Verificando archivo:', serverFile);
    
    if (fs.existsSync(serverFile)) {
        console.log('✅ Archivo encontrado');
    } else {
        console.log('❌ Archivo no encontrado');
        process.exit(1);
    }
    
    // Verificar dependencias
    console.log('📦 Verificando dependencias...');
    require('./simple-test-server.js');
    
} catch (error) {
    console.error('❌ Error iniciando servidor:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}
