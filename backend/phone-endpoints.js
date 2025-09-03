// Endpoints para manejo de teléfonos y base de datos

const setupPhoneEndpoints = (app, auth, database, whatsappData) => {
    
    // Endpoint para guardar teléfonos en BD
    app.put('/api/whatsapp/branch/:branchId/phones', auth, async (req, res) => {
        const { branchId } = req.params;
        const { orderPhone, complaintPhone } = req.body;
        
        try {
            // Guardar en BD
            await database.savePhoneNumbers(branchId, { orderPhone, complaintPhone });
            
            // Actualizar datos en memoria
            if (!whatsappData[branchId]) {
                whatsappData[branchId] = {};
            }
            whatsappData[branchId].phones = { orderPhone, complaintPhone };
            
            res.json({
                success: true,
                message: 'Teléfonos guardados exitosamente',
                data: { branchId, orderPhone, complaintPhone }
            });
        } catch (error) {
            console.error(`Error guardando teléfonos para ${branchId}:`, error);
            res.status(500).json({ 
                error: 'Error guardando teléfonos',
                details: error.message 
            });
        }
    });

    // Endpoint para obtener teléfonos desde BD
    app.get('/api/whatsapp/branch/:branchId/phones', auth, async (req, res) => {
        const { branchId } = req.params;
        
        try {
            const phones = await database.getPhoneNumbers(branchId);
            res.json({
                success: true,
                data: phones
            });
        } catch (error) {
            console.error(`Error obteniendo teléfonos para ${branchId}:`, error);
            res.status(500).json({ 
                error: 'Error obteniendo teléfonos',
                details: error.message 
            });
        }
    });

    // Endpoint para inicializar base de datos
    app.post('/api/database/init', auth, async (req, res) => {
        try {
            await database.connect();
            console.log('✅ Base de datos conectada desde endpoint');
            res.json({
                success: true,
                message: 'Base de datos inicializada correctamente'
            });
        } catch (error) {
            console.error('❌ Error conectando base de datos:', error);
            res.status(500).json({ 
                error: 'Error inicializando base de datos',
                details: error.message 
            });
        }
    });

    // Endpoint para verificar estado de BD
    app.get('/api/database/status', auth, async (req, res) => {
        try {
            const isConnected = database.db !== null;
            res.json({
                success: true,
                data: {
                    connected: isConnected,
                    url: database.url,
                    dbName: database.dbName
                }
            });
        } catch (error) {
            res.json({
                success: true,
                data: {
                    connected: false,
                    error: error.message
                }
            });
        }
    });
};

module.exports = setupPhoneEndpoints;
