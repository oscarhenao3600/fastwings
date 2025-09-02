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
    id: '68b32d3167697f77c914d377',
    _id: '68b32d3167697f77c914d377',
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
  
  console.log('🔐 Auth middleware - Token recibido:', token ? 'Sí' : 'No');
  
  if (!token) {
    console.log('❌ Token no proporcionado');
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fake-secret');
    console.log('🔍 Token decodificado:', decoded);
    
    // Buscar usuario por id o _id
    const user = users.find(u => u.id === decoded.id || u._id === decoded.id);
    console.log('👤 Usuario encontrado:', user ? user.email : 'No encontrado');
    console.log('📋 Usuarios disponibles:', users.map(u => ({ id: u.id, _id: u._id, email: u.email })));
    
    if (!user) {
      console.log('❌ Usuario no encontrado para ID:', decoded.id);
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    
    req.user = user;
    console.log('✅ Usuario autenticado:', user.email);
    next();
  } catch (error) {
    console.error('❌ Error en autenticación:', error);
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
    process.env.JWT_SECRET || 'fake-secret',
    { expiresIn: '24h' }
  );
  
  console.log('Login successful for:', user.email);
  
  res.json({
    token,
    user: {
      id: user.id,
      _id: user._id,
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

const qrcode = require('qrcode');

// Inicializar WhatsApp para una sucursal
app.post('/api/branch-whatsapp/branch/:branchId/initialize', auth, (req, res) => {
  const { branchId } = req.params;
  const { phoneNumber } = req.body;
  
  const branch = branches.find(b => b.id === branchId);
  if (!branch) {
    return res.status(404).json({ error: 'Sucursal no encontrada' });
  }
  
  // Generar QR real
  const qrData = `https://wa.me/${phoneNumber.replace('+', '')}?text=Hola%20desde%20FastWings%20${branch.name}`;
  
  qrcode.toDataURL(qrData, { margin: 1, scale: 6 }, (err, qrCode) => {
    if (err) {
      console.error('Error generando QR:', err);
      return res.status(500).json({ error: 'Error generando código QR' });
    }
    
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

// Obtener estado de WhatsApp de una sucursal
app.get('/api/branch-whatsapp/branch/:branchId/status', auth, (req, res) => {
  const { branchId } = req.params;
  
  const branch = branches.find(b => b.id === branchId);
  if (!branch) {
    return res.status(404).json({ error: 'Sucursal no encontrada' });
  }
  
  res.json({
    status: branch.whatsapp.status,
    is_connected: branch.whatsapp.is_connected,
    phone_number: branch.whatsapp.phone_number,
    lastReadyAt: branch.whatsapp.last_connection
  });
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
      ok: true,
      dataUrl: branch.whatsapp.qr_code,
      status: branch.whatsapp.status
    });
  } else {
    res.json({ 
      ok: false,
      message: 'QR no disponible. Primero debes inicializar WhatsApp para esta sucursal.'
    });
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

// Enviar mensaje de WhatsApp
app.post('/api/branch-whatsapp/branch/:branchId/send', auth, (req, res) => {
  const { branchId } = req.params;
  const { to, message } = req.body;
  
  const branch = branches.find(b => b.id === branchId);
  if (!branch) {
    return res.status(404).json({ error: 'Sucursal no encontrada' });
  }
  
  if (!to || !message) {
    return res.status(400).json({ error: 'Número de teléfono y mensaje son requeridos' });
  }
  
  // Simular envío de mensaje
  console.log(`📤 Mensaje enviado desde sucursal ${branch.name} a ${to}: ${message}`);
  
  res.json({ 
    success: true,
    message: 'Mensaje enviado exitosamente',
    to: to,
    branchId: branchId
  });
});

// Configurar sucursal
app.post('/api/branch-whatsapp/branch/:branchId/config', auth, (req, res) => {
  const { branchId } = req.params;
  const { systemNumber, ordersForwardNumber } = req.body;
  
  const branch = branches.find(b => b.id === branchId);
  if (!branch) {
    return res.status(404).json({ error: 'Sucursal no encontrada' });
  }
  
  // Actualizar configuración
  if (systemNumber) branch.systemNumber = systemNumber;
  if (ordersForwardNumber) branch.ordersForwardNumber = ordersForwardNumber;
  
  console.log(`⚙️ Configuración actualizada para sucursal ${branch.name}`);
  
  res.json({ 
    success: true,
    message: 'Configuración actualizada exitosamente',
    branch: {
      id: branch.id,
      name: branch.name,
      systemNumber: branch.systemNumber,
      ordersForwardNumber: branch.ordersForwardNumber
    }
  });
});

// Health check de WhatsApp
app.get('/api/branch-whatsapp/health', auth, (req, res) => {
  const healthData = branches.map(branch => ({
    branchId: branch.id,
    name: branch.name,
    status: branch.whatsapp.status,
    is_connected: branch.whatsapp.is_connected,
    lastReadyAt: branch.whatsapp.last_connection,
    hasQR: branch.whatsapp.status === 'qr_ready'
  }));
  
  res.json({
    totalBranches: branches.length,
    connectedBranches: branches.filter(b => b.whatsapp.is_connected).length,
    branches: healthData
  });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 FastWings API v4 - Servidor Simplificado ejecutándose en puerto ${PORT}`);
  console.log(`📱 Frontend disponible en: http://localhost:${PORT}/frontend-admin/super.html`);
  console.log(`🔐 Login: admin@fastwings.com / admin123`);
});
