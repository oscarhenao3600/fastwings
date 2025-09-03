const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Usuario fijo
const USER = {
    id: '68b32d3167697f77c914d377',
    email: 'admin@fastwings.com',
    role: 'super_admin'
};

// Middleware de autenticación
const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }
    
    try {
        const decoded = jwt.verify(token, 'test-secret-key');
        if (decoded.id === USER.id) {
            req.user = USER;
            next();
        } else {
            res.status(401).json({ error: 'Token inválido' });
        }
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
};

// Endpoint de prueba
app.get('/api/test', (req, res) => {
    res.json({ message: 'Servidor funcionando correctamente' });
});

// Endpoint de conexión de WhatsApp (simulado)
app.post('/api/whatsapp/branch/:branchId/connect', auth, async (req, res) => {
    const { branchId } = req.params;
    
    console.log(`Iniciando conexión de WhatsApp para sucursal ${branchId}`);
    
    try {
        // Simular proceso de conexión
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log(`Cliente WhatsApp creado para sucursal ${branchId}`);
        
        res.json({
            success: true,
            message: 'WhatsApp iniciado correctamente',
            data: {
                status: 'connecting',
                branchId: branchId
            }
        });
        
    } catch (error) {
        console.error(`Error conectando WhatsApp:`, error);
        res.status(500).json({ 
            error: 'Error conectando WhatsApp',
            details: error.message 
        });
    }
});

// Endpoint de estado de WhatsApp
app.get('/api/whatsapp/status', auth, (req, res) => {
    const branches = [
        {
            branchId: 'branch-1',
            branchName: 'Sucursal Centro',
            whatsapp: {
                status: 'disconnected',
                is_connected: false,
                qr_code: null,
                phone_number: null,
                last_connection: null
            },
            phones: {
                orderPhone: '',
                complaintPhone: ''
            }
        },
        {
            branchId: 'branch-2',
            branchName: 'Sucursal Norte',
            whatsapp: {
                status: 'disconnected',
                is_connected: false,
                qr_code: null,
                phone_number: null,
                last_connection: null
            },
            phones: {
                orderPhone: '',
                complaintPhone: ''
            }
        }
    ];
    
    res.json({
        success: true,
        branches: branches
    });
});

// Puerto
const PORT = 4000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor de prueba iniciado en puerto ${PORT}`);
    console.log(`📱 Endpoints disponibles:`);
    console.log(`   GET  /api/test`);
    console.log(`   POST /api/whatsapp/branch/:id/connect`);
    console.log(`   GET  /api/whatsapp/status`);
});
