require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos del frontend
app.use('/frontend-admin', express.static(path.join(__dirname, '../frontend-admin')));

// Simular base de datos en memoria
const users = [
  {
    id: '1',
    name: 'Administrador',
    email: 'admin@fastwings.com',
    password: 'admin123',
    role: 'super_admin'
  }
];

const branches = [
  {
    id: 'branch-1',
    name: 'Sucursal Principal',
    whatsapp: {
      phone_number: null,
      is_connected: false,
      status: 'disconnected',
      qr_code: null,
      last_connection: null
    }
  },
  {
    id: 'branch-2',
    name: 'Sucursal Norte',
    whatsapp: {
      phone_number: null,
      is_connected: false,
      status: 'disconnected',
      qr_code: null,
      last_connection: null
    }
  }
];

// Middleware de autenticación simplificado
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  
  try {
    const decoded = jwt.verify(token, 'fake-secret');
    const user = users.find(u => u.id === decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'FastWings API v4 - Servidor Simplificado' });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', { email, password });
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    'fake-secret',
    { expiresIn: '24h' }
  );
  
  console.log('Login successful for:', user.email);
  
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// Dashboard stats
app.get('/api/admin/dashboard/stats', auth, (req, res) => {
  console.log('Dashboard request from user:', req.user.email);
  
  res.json({
    totalBranches: branches.length,
    totalUsers: users.length,
    totalOrders: 0,
    totalRevenue: 0
  });
});

// Obtener sucursales
app.get('/api/admin/branches', auth, (req, res) => {
  res.json({ branches });
});

// Estado de WhatsApp por sucursal
app.get('/api/branch-whatsapp/branches/status', auth, (req, res) => {
  res.json({ branches });
});

// Inicializar WhatsApp para una sucursal
app.post('/api/branch-whatsapp/branch/:branchId/initialize', auth, (req, res) => {
  const { branchId } = req.params;
  const { phoneNumber } = req.body;
  
  const branch = branches.find(b => b.id === branchId);
  if (!branch) {
    return res.status(404).json({ error: 'Sucursal no encontrada' });
  }
  
  // Simular generación de QR
  const qrCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  branch.whatsapp.phone_number = phoneNumber;
  branch.whatsapp.status = 'qr_ready';
  branch.whatsapp.qr_code = qrCode;
  branch.whatsapp.is_connected = false;
  
  console.log(`QR generado para sucursal ${branch.name} con número ${phoneNumber}`);
  
  res.json({ 
    message: 'WhatsApp inicializado exitosamente para la sucursal',
    qr_ready: true
  });
});

// Desconectar WhatsApp
app.post('/api/branch-whatsapp/branch/:branchId/disconnect', auth, (req, res) => {
  const { branchId } = req.params;
  
  const branch = branches.find(b => b.id === branchId);
  if (!branch) {
    return res.status(404).json({ error: 'Sucursal no encontrada' });
  }
  
  branch.whatsapp.status = 'disconnected';
  branch.whatsapp.is_connected = false;
  branch.whatsapp.qr_code = null;
  
  console.log(`WhatsApp desconectado para sucursal ${branch.name}`);
  
  res.json({ message: 'WhatsApp desconectado exitosamente de la sucursal' });
});

// Desvincular WhatsApp
app.post('/api/branch-whatsapp/branch/:branchId/logout', auth, (req, res) => {
  const { branchId } = req.params;
  
  const branch = branches.find(b => b.id === branchId);
  if (!branch) {
    return res.status(404).json({ error: 'Sucursal no encontrada' });
  }
  
  branch.whatsapp.status = 'disconnected';
  branch.whatsapp.is_connected = false;
  branch.whatsapp.qr_code = null;
  branch.whatsapp.phone_number = null;
  branch.whatsapp.last_connection = null;
  
  console.log(`WhatsApp desvinculado para sucursal ${branch.name}`);
  
  res.json({ message: 'Sesión de WhatsApp desvinculada exitosamente de la sucursal' });
});

// Obtener QR
app.get('/api/branch-whatsapp/branch/:branchId/qr', auth, (req, res) => {
  const { branchId } = req.params;
  
  const branch = branches.find(b => b.id === branchId);
  if (!branch) {
    return res.status(404).json({ error: 'Sucursal no encontrada' });
  }
  
  if (branch.whatsapp.status === 'qr_ready' && branch.whatsapp.qr_code) {
    res.json({ 
      qrDataUrl: branch.whatsapp.qr_code,
      status: branch.whatsapp.status
    });
  } else {
    res.status(400).json({ error: 'QR no disponible' });
  }
});

// Obtener usuarios
app.get('/api/admin/users', auth, (req, res) => {
  res.json({ users: users.map(u => ({ ...u, password: undefined })) });
});

// Obtener pedidos
app.get('/api/orders', auth, (req, res) => {
  res.json({ orders: [] });
});

// Estadísticas de facturación
app.get('/api/billing/stats', auth, (req, res) => {
  res.json({
    totalInvoices: 0,
    totalBillingAmount: 0,
    pendingInvoices: 0,
    paidInvoices: 0
  });
});

// Enviar facturas
app.post('/api/billing/send/:branchId', auth, (req, res) => {
  res.json({ ordersProcessed: 0 });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 FastWings API v4 - Servidor Simplificado ejecutándose en puerto ${PORT}`);
  console.log(`📱 Frontend disponible en: http://localhost:${PORT}/frontend-admin/super.html`);
  console.log(`🔐 Login: admin@fastwings.com / admin123`);
});
