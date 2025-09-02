require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/frontend-admin', express.static(path.join(__dirname, '../frontend-admin')));

// Usuario de prueba
const testUser = {
  id: '68b32d3167697f77c914d377',
  _id: '68b32d3167697f77c914d377',
  name: 'Administrador',
  email: 'admin@fastwings.com',
  password: 'admin123',
  role: 'super_admin'
};

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('🔐 Login attempt:', { email, password });
  
  if (email === testUser.email && password === testUser.password) {
    const token = jwt.sign(
      { id: testUser.id, email: testUser.email, role: testUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );
    
    console.log('✅ Login successful for:', testUser.email);
    
    res.json({
      token,
      user: {
        id: testUser.id,
        _id: testUser._id,
        name: testUser.name,
        email: testUser.email,
        role: testUser.role
      }
    });
  } else {
    console.log('❌ Login failed: Invalid credentials');
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

// Middleware de autenticación
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  console.log('🔐 Auth middleware - Token recibido:', token ? 'Sí' : 'No');
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
    console.log('🔍 Token decodificado:', decoded);
    
    // Buscar usuario por id o _id
    if (decoded.id === testUser.id || decoded.id === testUser._id) {
      req.user = testUser;
      console.log('✅ Usuario autenticado:', testUser.email);
      next();
    } else {
      console.log('❌ Usuario no encontrado para ID:', decoded.id);
      res.status(401).json({ error: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error('❌ Error en autenticación:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Dashboard stats
app.get('/api/admin/dashboard/stats', auth, (req, res) => {
  console.log('📊 Dashboard request from user:', req.user.email);
  
  res.json({
    totalBranches: 2,
    totalUsers: 1,
    totalOrders: 0,
    totalRevenue: 0
  });
});

// Obtener sucursales
app.get('/api/admin/branches', auth, (req, res) => {
  res.json({
    branches: [
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
    ]
  });
});

// Estado de WhatsApp por sucursal
app.get('/api/branch-whatsapp/branches/status', auth, (req, res) => {
  res.json({
    branches: [
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
    ]
  });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Test Server ejecutándose en puerto ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}/frontend-admin/super.html`);
  console.log(`🔐 Login: admin@fastwings.com / admin123`);
});
