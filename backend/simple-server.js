require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos del frontend
app.use('/frontend-admin', express.static(path.join(__dirname, '../frontend-admin')));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'FastWings API v4 - Servidor Simple' });
});

// Ruta de login (simulada)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@fastwings.com' && password === 'admin123') {
    res.json({
      token: 'fake-jwt-token-for-testing',
      user: {
        id: '1',
        name: 'Administrador',
        email: 'admin@fastwings.com',
        role: 'super_admin'
      }
    });
  } else {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

// Ruta de prueba para WhatsApp
app.get('/api/branch-whatsapp/branches/status', (req, res) => {
  res.json({ 
    branches: [
      {
        id: 'test-branch-1',
        name: 'Sucursal de Prueba',
        whatsapp: {
          phone_number: null,
          is_connected: false,
          status: 'disconnected',
          qr_code: null,
          last_connection: null
        }
      }
    ]
  });
});

// Ruta para inicializar WhatsApp (simulada)
app.post('/api/branch-whatsapp/branch/:branchId/initialize', (req, res) => {
  const { branchId } = req.params;
  const { phoneNumber } = req.body;
  
  console.log(`Inicializando WhatsApp para sucursal ${branchId} con número ${phoneNumber}`);
  
  // Simular que se está generando un QR
  res.json({ 
    message: 'WhatsApp inicializado exitosamente para la sucursal',
    qr_ready: true
  });
});

// Ruta para desconectar WhatsApp (simulada)
app.post('/api/branch-whatsapp/branch/:branchId/disconnect', (req, res) => {
  const { branchId } = req.params;
  
  console.log(`Desconectando WhatsApp para sucursal ${branchId}`);
  
  res.json({ message: 'WhatsApp desconectado exitosamente de la sucursal' });
});

// Ruta para desvincular WhatsApp (simulada)
app.post('/api/branch-whatsapp/branch/:branchId/logout', (req, res) => {
  const { branchId } = req.params;
  
  console.log(`Desvinculando WhatsApp para sucursal ${branchId}`);
  
  res.json({ message: 'Sesión de WhatsApp desvinculada exitosamente de la sucursal' });
});

// Ruta para obtener QR (simulada)
app.get('/api/branch-whatsapp/branch/:branchId/qr', (req, res) => {
  const { branchId } = req.params;
  
  // Generar un QR de prueba (base64 de una imagen simple)
  const testQR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  res.json({ 
    qrDataUrl: testQR,
    status: 'qr_ready'
  });
});

const PORT = 4002;
app.listen(PORT, () => {
  console.log(`🚀 Servidor simple ejecutándose en puerto ${PORT}`);
  console.log(`📱 Frontend disponible en: http://localhost:${PORT}/frontend-admin/super.html`);
  console.log(`🧪 Página de prueba en: http://localhost:${PORT}/frontend-admin/test-whatsapp-branch.html`);
});
