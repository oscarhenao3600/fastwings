require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo 1000 requests por ventana
  message: 'Demasiadas peticiones, intenta de nuevo más tarde'
});
app.use(globalLimiter);

// Servir archivos del frontend
app.use('/frontend-admin', express.static(path.join(__dirname, '../frontend-admin')));

// Simular base de datos en memoria con estructura mejorada
const users = [
  {
    id: '1',
    name: 'Administrador',
    email: 'admin@fastwings.com',
    password: 'admin123',
    role: 'super_admin',
    branch_id: null,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  }
];

const branches = [
  {
    id: 'branch-1',
    name: 'Sucursal Principal',
    address: 'Calle Principal #123',
    phone: '+573001234567',
    email: 'principal@fastwings.com',
    systemNumber: '+573001234567',
    ordersForwardNumber: '+573001234568',
    whatsapp: {
      provider: 'whatsapp-web.js',
      sessionId: 'branch_branch-1',
      status: 'not_initialized',
      lastReadyAt: null,
      phone_number: null,
      is_connected: false,
      session_path: null,
      qr_code: null
    },
    serviceFee: 0.05,
    billingActive: true,
    isActive: true,
    menu: {
      items: [
        { name: 'Hamburguesa Clásica', description: 'Hamburguesa con carne, lechuga, tomate y queso', price: 15000, category: 'Hamburguesas', isAvailable: true },
        { name: 'Hamburguesa Doble', description: 'Doble carne con todos los ingredientes', price: 22000, category: 'Hamburguesas', isAvailable: true },
        { name: 'Papas Fritas', description: 'Papas fritas crujientes', price: 8000, category: 'Acompañamientos', isAvailable: true },
        { name: 'Bebida Gaseosa', description: 'Bebida gaseosa 500ml', price: 5000, category: 'Bebidas', isAvailable: true }
      ],
      combos: [
        { name: 'Combo Clásico', description: 'Hamburguesa + Papas + Bebida', items: [], price: 25000, isAvailable: true },
        { name: 'Combo Doble', description: 'Hamburguesa Doble + Papas + Bebida', items: [], price: 32000, isAvailable: true }
      ]
    },
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'branch-2',
    name: 'Sucursal Norte',
    address: 'Avenida Norte #456',
    phone: '+573001234569',
    email: 'norte@fastwings.com',
    systemNumber: '+573001234569',
    ordersForwardNumber: '+573001234570',
    whatsapp: {
      provider: 'whatsapp-web.js',
      sessionId: 'branch_branch-2',
      status: 'not_initialized',
      lastReadyAt: null,
      phone_number: null,
      is_connected: false,
      session_path: null,
      qr_code: null
    },
    serviceFee: 0.05,
    billingActive: true,
    isActive: true,
    menu: {
      items: [
        { name: 'Pizza Margherita', description: 'Pizza con tomate, mozzarella y albahaca', price: 18000, category: 'Pizzas', isAvailable: true },
        { name: 'Pizza Hawaiana', description: 'Pizza con jamón y piña', price: 20000, category: 'Pizzas', isAvailable: true },
        { name: 'Ensalada César', description: 'Ensalada con lechuga, crutones y aderezo', price: 12000, category: 'Ensaladas', isAvailable: true }
      ],
      combos: [
        { name: 'Combo Pizza', description: 'Pizza + Bebida + Postre', items: [], price: 28000, isAvailable: true }
      ]
    },
    created_at: new Date(),
    updated_at: new Date()
  }
];

// Simular pool de clientes WhatsApp
const whatsappClients = new Map();

// Middleware de autenticación
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fake-secret');
    const user = users.find(u => u.id === decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar roles
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Acceso denegado. No tienes permisos para realizar esta acción.' 
      });
    }

    next();
  };
};

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'FastWings API v4 - Sistema Completo (Simulado)',
    version: '4.0.0',
    features: [
      'Multi-cuenta WhatsApp por sucursal',
      'Pool de clientes con sesiones persistentes',
      'Enrutamiento de mensajes por sucursal',
      'Métricas y salud del sistema',
      'Rate limiting y seguridad mejorada'
    ]
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fake-secret',
    { expiresIn: '24h' }
  );
  
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
app.get('/api/admin/dashboard/stats', auth, requireRole(['super_admin', 'admin']), (req, res) => {
  const connectedBranches = branches.filter(b => b.whatsapp.status === 'ready').length;
  
  res.json({
    totalBranches: branches.length,
    totalUsers: users.length,
    totalOrders: 0,
    totalRevenue: 0,
    connectedBranches,
    connectionRate: Math.round((connectedBranches / branches.length) * 100)
  });
});

// Obtener sucursales
app.get('/api/admin/branches', auth, requireRole(['super_admin', 'admin']), (req, res) => {
  res.json({ branches });
});

// Obtener usuarios
app.get('/api/admin/users', auth, requireRole(['super_admin']), (req, res) => {
  res.json({ users: users.map(u => ({ ...u, password: undefined })) });
});

// ===== WHATSAPP POR SUCURSAL =====

// Estado de WhatsApp por sucursal
app.get('/api/branch-whatsapp/branches/status', auth, requireRole(['super_admin', 'admin']), (req, res) => {
  const branchesWithStatus = branches.map(branch => ({
    id: branch.id,
    name: branch.name,
    whatsapp: {
      ...branch.whatsapp,
      // Simular estado del pool
      status: whatsappClients.has(branch.id) ? 'ready' : branch.whatsapp.status,
      lastReadyAt: whatsappClients.has(branch.id) ? new Date().toISOString() : branch.whatsapp.lastReadyAt
    }
  }));

  res.json({ branches: branchesWithStatus });
});

// Inicializar WhatsApp para una sucursal
app.post('/api/branch-whatsapp/branch/:branchId/initialize', auth, requireRole(['super_admin']), (req, res) => {
  const { branchId } = req.params;
  const { phoneNumber } = req.body;
  
  const branch = branches.find(b => b.id === branchId);
  if (!branch) {
    return res.status(404).json({ error: 'Sucursal no encontrada' });
  }
  
  // Simular inicialización
  whatsappClients.set(branchId, {
    status: 'qr',
    phoneNumber,
    createdAt: new Date()
  });
  
  // Actualizar sucursal
  branch.whatsapp.phone_number = phoneNumber;
  branch.whatsapp.sessionId = `branch_${branchId}`;
  branch.whatsapp.status = 'qr';
  
  console.log(`🔐 WhatsApp inicializado para sucursal ${branch.name} con número ${phoneNumber}`);
  
  res.json({ 
    message: 'WhatsApp inicializado exitosamente para la sucursal',
    status: 'qr'
  });
});

// Desconectar WhatsApp
app.post('/api/branch-whatsapp/branch/:branchId/disconnect', auth, requireRole(['super_admin']), (req, res) => {
  const { branchId } = req.params;
  
  const branch = branches.find(b => b.id === branchId);
  if (!branch) {
    return res.status(404).json({ error: 'Sucursal no encontrada' });
  }
  
  whatsappClients.delete(branchId);
  branch.whatsapp.status = 'disconnected';
  branch.whatsapp.is_connected = false;
  
  console.log(`📱 WhatsApp desconectado para sucursal ${branch.name}`);
  
  res.json({ message: 'WhatsApp desconectado exitosamente de la sucursal' });
});

// Desvincular WhatsApp
app.post('/api/branch-whatsapp/branch/:branchId/logout', auth, requireRole(['super_admin']), (req, res) => {
  const { branchId } = req.params;
  
  const branch = branches.find(b => b.id === branchId);
  if (!branch) {
    return res.status(404).json({ error: 'Sucursal no encontrada' });
  }
  
  whatsappClients.delete(branchId);
  branch.whatsapp.status = 'not_initialized';
  branch.whatsapp.is_connected = false;
  branch.whatsapp.phone_number = null;
  branch.whatsapp.sessionId = null;
  branch.whatsapp.lastReadyAt = null;
  
  console.log(`🔓 WhatsApp desvinculado para sucursal ${branch.name}`);
  
  res.json({ message: 'Sesión de WhatsApp desvinculada exitosamente de la sucursal' });
});

// Obtener QR
app.get('/api/branch-whatsapp/branch/:branchId/qr', auth, requireRole(['super_admin', 'admin']), (req, res) => {
  const { branchId } = req.params;
  
  const branch = branches.find(b => b.id === branchId);
  if (!branch) {
    return res.status(404).json({ error: 'Sucursal no encontrada' });
  }
  
  const client = whatsappClients.get(branchId);
  if (!client || client.status !== 'qr') {
    return res.status(400).json({ error: 'QR no disponible' });
  }
  
  // Simular QR
  const qrCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  res.json({ 
    qrDataUrl: qrCode,
    status: 'qr_ready'
  });
});

// Enviar mensaje desde una sucursal
app.post('/api/branch-whatsapp/branch/:branchId/send', auth, requireRole(['super_admin', 'admin']), (req, res) => {
  const { branchId } = req.params;
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: 'Número de destino y mensaje son requeridos' });
  }

  const branch = branches.find(b => b.id === branchId);
  if (!branch) {
    return res.status(404).json({ error: 'Sucursal no encontrada' });
  }

  const client = whatsappClients.get(branchId);
  if (!client || client.status !== 'ready') {
    return res.status(400).json({ error: 'WhatsApp no está conectado para esta sucursal' });
  }

  console.log(`📤 Mensaje enviado desde sucursal ${branch.name} a ${to}: ${message}`);
  
  res.json({ 
    message: 'Mensaje enviado exitosamente',
    result: { id: Date.now(), to, message }
  });
});

// Configurar sucursal
app.post('/api/branch-whatsapp/branch/:branchId/config', auth, requireRole(['super_admin']), (req, res) => {
  const { branchId } = req.params;
  const { systemNumber, ordersForwardNumber } = req.body;

  const branch = branches.find(b => b.id === branchId);
  if (!branch) {
    return res.status(404).json({ error: 'Sucursal no encontrada' });
  }

  if (systemNumber) {
    branch.systemNumber = systemNumber;
  }
  if (ordersForwardNumber) {
    branch.ordersForwardNumber = ordersForwardNumber;
  }

  console.log(`⚙️ Configuración actualizada para sucursal ${branch.name}`);
  
  res.json({ 
    message: 'Configuración de sucursal actualizada exitosamente',
    branch: {
      id: branch.id,
      name: branch.name,
      systemNumber: branch.systemNumber,
      ordersForwardNumber: branch.ordersForwardNumber
    }
  });
});

// Métricas y salud del pool
app.get('/api/branch-whatsapp/health', auth, requireRole(['super_admin']), (req, res) => {
  const health = [];
  
  for (const [branchId, client] of whatsappClients.entries()) {
    const branch = branches.find(b => b.id === branchId);
    health.push({
      branchId,
      status: client.status,
      lastReadyAt: client.status === 'ready' ? new Date().toISOString() : null,
      hasQR: client.status === 'qr'
    });
  }
  
  const totalBranches = branches.length;
  const connectedBranches = health.filter(h => h.status === 'ready').length;
  
  res.json({ 
    health,
    timestamp: new Date().toISOString(),
    totalBranches,
    connectedBranches
  });
});

// Simular conexión exitosa (para pruebas)
app.post('/api/branch-whatsapp/branch/:branchId/connect', auth, requireRole(['super_admin']), (req, res) => {
  const { branchId } = req.params;
  
  const branch = branches.find(b => b.id === branchId);
  if (!branch) {
    return res.status(404).json({ error: 'Sucursal no encontrada' });
  }
  
  const client = whatsappClients.get(branchId);
  if (client) {
    client.status = 'ready';
    client.lastReadyAt = new Date().toISOString();
  }
  
  branch.whatsapp.status = 'ready';
  branch.whatsapp.is_connected = true;
  branch.whatsapp.lastReadyAt = new Date();
  
  console.log(`✅ WhatsApp conectado para sucursal ${branch.name}`);
  
  res.json({ message: 'WhatsApp conectado exitosamente' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 FastWings API v4 - Sistema Completo ejecutándose en puerto ${PORT}`);
  console.log(`📱 Frontend disponible en: http://localhost:${PORT}/frontend-admin/super.html`);
  console.log(`🧪 Página de prueba en: http://localhost:${PORT}/frontend-admin/test-whatsapp-branch.html`);
  console.log(`🔐 Login: admin@fastwings.com / admin123`);
  console.log(`📊 Métricas: http://localhost:${PORT}/api/branch-whatsapp/health`);
  console.log(`\n✨ Características implementadas:`);
  console.log(`   ✅ Multi-cuenta WhatsApp por sucursal`);
  console.log(`   ✅ Pool de clientes con sesiones persistentes`);
  console.log(`   ✅ Enrutamiento de mensajes por sucursal`);
  console.log(`   ✅ Métricas y salud del sistema`);
  console.log(`   ✅ Rate limiting y seguridad mejorada`);
  console.log(`   ✅ Configuración robusta de sucursales`);
});
