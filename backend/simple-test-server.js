// Servidor FastWings con soporte para PDFs

// Configuración de variables de entorno
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const qrcode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');
const multer = require('multer');
const fs = require('fs');
const pdf = require('pdf-parse');
const WhatsAppManager = require('./whatsapp-manager');
const AIManager = require('./ai-manager');
const SimpleDatabase = require('./simple-database');
const setupPhoneEndpoints = require('./phone-endpoints');

const app = express();

// Inicializar managers
const whatsappManager = new WhatsAppManager();
const aiManager = new AIManager();
const database = new SimpleDatabase();

// Configurar managers
whatsappManager.setAIManager(aiManager);
whatsappManager.setDatabase(database);

// Inicializar base de datos al arrancar
database.connect()
  .then(() => {
    console.log('✅ Base de datos conectada al inicio');
    // Cargar estado anterior de WhatsApp
    whatsappManager.loadStateFromDatabase();
  })
  .catch(err => {
    console.error('❌ Error conectando base de datos al inicio:', err);
    console.log('ℹ️ Continuando sin base de datos...');
  });

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/frontend-admin', express.static(path.join(__dirname, '../frontend-admin')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuración de multer para subir archivos PDF
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const branchId = req.params.branchId || 'default';
    const timestamp = Date.now();
    cb(null, `menu_${branchId}_${timestamp}.pdf`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  }
}).single('menu');

// Usuario fijo
const USER = {
  id: '68b32d3167697f77c914d377',
  _id: '68b32d3167697f77c914d377',
  name: 'Administrador',
  email: 'admin@fastwings.com',
  password: 'admin123',
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
      res.status(401).json({ error: 'Usuario no encontrado' });
    }
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Almacenar datos de WhatsApp por sucursal
const whatsappData = {
  'branch-1': { 
    branchName: 'Sucursal Principal',
    phoneNumber: null, 
    qrCode: null, 
    status: 'disconnected',
    client: null,
    lastReadyAt: null,
    // Nuevos campos para teléfonos
    orderPhone: '+573001234567', // Teléfono para pedidos
    complaintPhone: '+573001234568', // Teléfono para reclamaciones
    defaultMessages: {
      welcome: '¡Hola! Bienvenido a FastWings. ¿En qué puedo ayudarte?',
      menu: 'Aquí tienes nuestro menú: [MENÚ]',
      order: 'Perfecto, tu pedido ha sido recibido. Te contactaremos pronto.',
      goodbye: '¡Gracias por preferir FastWings! Que tengas un excelente día.',
      aiPrompt: 'Eres un asistente virtual de FastWings, un restaurante de comida rápida. Debes ser amigable, profesional y ayudar a los clientes con sus pedidos, consultas sobre el menú y cualquier otra pregunta relacionada con nuestros servicios.'
    },
    conversationState: {},
    menuPdf: null,
    menuContent: null,
    menuLastUpdated: null
  },
  'branch-2': { 
    branchName: 'Sucursal Norte',
    phoneNumber: null, 
    qrCode: null, 
    status: 'disconnected',
    client: null,
    lastReadyAt: null,
    // Nuevos campos para teléfonos
    orderPhone: '+573001234569', // Teléfono para pedidos
    complaintPhone: '+573001234570', // Teléfono para reclamaciones
    defaultMessages: {
      welcome: '¡Hola! Bienvenido a FastWings Norte. ¿En qué puedo ayudarte?',
      menu: 'Aquí tienes nuestro menú: [MENÚ]',
      order: 'Perfecto, tu pedido ha sido recibido. Te contactaremos pronto.',
      goodbye: '¡Gracias por preferir FastWings! Que tengas un excelente día.',
      aiPrompt: 'Eres un asistente virtual de FastWings Norte, un restaurante de comida rápida. Debes ser amigable, profesional y ayudar a los clientes con sus pedidos, consultas sobre el menú y cualquier otra pregunta relacionada con nuestros servicios.'
    },
    conversationState: {},
    menuPdf: null,
    menuContent: null,
    menuLastUpdated: null
  }
};

// Configurar endpoints de teléfonos
setupPhoneEndpoints(app, auth, database, whatsappData);

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === USER.email && password === USER.password) {
    const token = jwt.sign(
      { id: USER.id, email: USER.email, role: USER.role },
      'test-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: USER.id,
        _id: USER._id,
        name: USER.name,
        email: USER.email,
        role: USER.role
      }
    });
  } else {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

// Dashboard stats
app.get('/api/admin/dashboard/stats', auth, (req, res) => {
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
          phone_number: whatsappData['branch-1']?.phoneNumber || null,
          is_connected: whatsappData['branch-1']?.status === 'connected',
          status: whatsappData['branch-1']?.status || 'disconnected',
          qr_code: whatsappData['branch-1']?.qrCode || null,
          last_connection: whatsappData['branch-1']?.lastReadyAt || null
        },
        menu: {
          hasPdf: !!whatsappData['branch-1']?.menuPdf,
          pdfUrl: whatsappData['branch-1']?.menuPdf ? `/uploads/${whatsappData['branch-1'].menuPdf}` : null,
          lastUpdated: whatsappData['branch-1']?.menuLastUpdated || null
        }
      },
      {
        id: 'branch-2',
        name: 'Sucursal Norte',
        whatsapp: {
          phone_number: whatsappData['branch-2']?.phoneNumber || null,
          is_connected: whatsappData['branch-2']?.status === 'connected',
          status: whatsappData['branch-2']?.status || 'disconnected',
          qr_code: whatsappData['branch-2']?.qrCode || null,
          last_connection: whatsappData['branch-2']?.lastReadyAt || null
        },
        menu: {
          hasPdf: !!whatsappData['branch-2']?.menuPdf,
          pdfUrl: whatsappData['branch-2']?.menuPdf ? `/uploads/${whatsappData['branch-2'].menuPdf}` : null,
          lastUpdated: whatsappData['branch-2']?.menuLastUpdated || null
        }
      }
    ]
  });
});

// Endpoint para subir carta PDF de una sucursal
app.post('/api/branch/:branchId/upload-menu', auth, (req, res) => {
  upload(req, res, async (err) => {
    const { branchId } = req.params;
    
    console.log(`Subiendo carta PDF para sucursal ${branchId}`);
    
    if (err) {
      console.error(`Error en multer:`, err);
      return res.status(400).json({ error: 'Error procesando el archivo', details: err.message });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
      }
      
      // Extraer contenido del PDF
      const pdfPath = req.file.path;
      const dataBuffer = fs.readFileSync(pdfPath);
      
      console.log(`Extrayendo contenido del PDF...`);
      const pdfData = await pdf(dataBuffer);
      const extractedText = pdfData.text;
      
      console.log(`Contenido extraído: ${extractedText.length} caracteres`);
      
      // Guardar información en whatsappData
      whatsappData[branchId].menuPdf = req.file.filename;
      whatsappData[branchId].menuContent = extractedText;
      whatsappData[branchId].menuLastUpdated = new Date().toISOString();
      
      // Configurar contenido del menú en AI Manager
      aiManager.setMenuContent(branchId, extractedText);
      
      console.log(`Información guardada para sucursal ${branchId}`);
      console.log(`Menú configurado en IA para sucursal ${branchId}`);
      
      res.json({
        success: true,
        message: 'Carta PDF subida y procesada exitosamente',
        data: {
          filename: req.file.filename,
          size: req.file.size,
          contentLength: extractedText.length,
          lastUpdated: whatsappData[branchId].menuLastUpdated
        }
      });
      
    } catch (error) {
      console.error(`Error procesando PDF:`, error);
      res.status(500).json({ 
        error: 'Error procesando el archivo PDF',
        details: error.message 
      });
    }
  });
});

// Endpoint para obtener información del menú de una sucursal
app.get('/api/branch/:branchId/menu', auth, (req, res) => {
  const { branchId } = req.params;
  
  const branchData = whatsappData[branchId];
  if (!branchData) {
    return res.status(404).json({ error: 'Sucursal no encontrada' });
  }
  
  res.json({
    success: true,
    data: {
      hasPdf: !!branchData.menuPdf,
      pdfUrl: branchData.menuPdf ? `/uploads/${branchData.menuPdf}` : null,
      lastUpdated: branchData.menuLastUpdated,
      contentPreview: branchData.menuContent ? 
        branchData.menuContent.substring(0, 200) + '...' : null
    }
  });
});

// Endpoint para eliminar carta PDF de una sucursal
app.delete('/api/branch/:branchId/menu', auth, (req, res) => {
  const { branchId } = req.params;
  
  const branchData = whatsappData[branchId];
  if (!branchData) {
    return res.status(404).json({ error: 'Sucursal no encontrada' });
  }
  
  try {
    // Eliminar archivo físico si existe
    if (branchData.menuPdf) {
      const filePath = path.join(__dirname, 'uploads', branchData.menuPdf);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Archivo eliminado: ${branchData.menuPdf}`);
      }
    }
    
    // Limpiar datos en memoria
    branchData.menuPdf = null;
    branchData.menuContent = null;
    branchData.menuLastUpdated = null;
    
    console.log(`Carta PDF eliminada de sucursal ${branchId}`);
    
    res.json({
      success: true,
      message: 'Carta PDF eliminada exitosamente'
    });
    
  } catch (error) {
    console.error(`Error eliminando carta PDF:`, error);
    res.status(500).json({ 
      error: 'Error eliminando el archivo',
      details: error.message 
    });
  }
});

// ===== ENDPOINTS FALTANTES PARA EL FRONTEND =====

// Endpoint para obtener usuarios
app.get('/api/admin/users', auth, (req, res) => {
  res.json({
    users: [
      {
        id: 1,
        name: 'Administrador Principal',
        email: 'admin@fastwings.com',
        role: 'super_admin',
        status: 'active',
        createdAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 2,
        name: 'Gerente Sucursal',
        email: 'gerente@fastwings.com',
        role: 'admin',
        status: 'active',
        createdAt: '2025-01-01T00:00:00.000Z'
      }
    ]
  });
});

// Endpoint para obtener pedidos
app.get('/api/orders', auth, (req, res) => {
  res.json({
    orders: [
      {
        id: 'ORD-001',
        customer: 'Juan Pérez',
        phone: '+573001234567',
        items: [
          { name: 'Hamburguesa Clásica', quantity: 2, price: 8.99 },
          { name: 'Papas Fritas', quantity: 1, price: 3.99 }
        ],
        total: 21.97,
        status: 'pending',
        branch: 'branch-1',
        createdAt: '2025-01-02T10:30:00.000Z'
      },
      {
        id: 'ORD-002',
        customer: 'María García',
        phone: '+573001234568',
        items: [
          { name: 'Pizza Margherita', quantity: 1, price: 14.99 },
          { name: 'Refresco', quantity: 2, price: 2.99 }
        ],
        total: 20.97,
        status: 'completed',
        branch: 'branch-2',
        createdAt: '2025-01-02T11:15:00.000Z'
      }
    ]
  });
});

// Endpoint para obtener estadísticas de facturación
app.get('/api/billing/stats', auth, (req, res) => {
  res.json({
    totalRevenue: 42.94,
    totalOrders: 2,
    averageOrderValue: 21.47,
    monthlyRevenue: 42.94,
    topProducts: [
      { name: 'Hamburguesa Clásica', sales: 2 },
      { name: 'Pizza Margherita', sales: 1 },
      { name: 'Papas Fritas', sales: 1 }
    ],
    revenueByBranch: [
      { branch: 'branch-1', revenue: 21.97 },
      { branch: 'branch-2', revenue: 20.97 }
    ]
  });
});

// Endpoint para obtener estado de WhatsApp de todas las sucursales
app.get('/api/whatsapp/status', auth, async (req, res) => {
  try {
    const branches = Object.keys(whatsappData);
    const status = await Promise.all(branches.map(async (branchId) => {
      const realStatus = whatsappManager.getStatus(branchId);
      const realQR = whatsappManager.getQRCode(branchId);
      const isConnected = whatsappManager.isConnected(branchId);
      
      // Obtener configuración desde BD si está disponible
      let dbConfig = null;
      try {
        dbConfig = await database.getWhatsAppConfig(branchId);
      } catch (error) {
        console.log(`No hay configuración BD para ${branchId}:`, error.message);
      }
      
      // Obtener teléfonos desde BD
      let phones = { orderPhone: '', complaintPhone: '' };
      try {
        phones = await database.getPhoneNumbers(branchId);
      } catch (error) {
        console.log(`No hay teléfonos en BD para ${branchId}:`, error.message);
      }
      
      return {
        branchId,
        branchName: whatsappData[branchId].branchName || (branchId === 'branch-1' ? 'Sucursal Principal' : 'Sucursal Norte'),
        whatsapp: {
          phone_number: whatsappData[branchId]?.phoneNumber || null,
          is_connected: isConnected,
          status: realStatus,
          qr_code: realQR || dbConfig?.qrCode || null,
          last_connection: whatsappData[branchId]?.lastReadyAt || dbConfig?.lastConnection || null
        },
        phones: {
          orderPhone: phones.orderPhone || whatsappData[branchId]?.orderPhone || '',
          complaintPhone: phones.complaintPhone || whatsappData[branchId]?.complaintPhone || ''
        },
        menu: {
          hasPdf: !!whatsappData[branchId]?.menuPdf,
          pdfUrl: whatsappData[branchId]?.menuPdf ? `/uploads/${whatsappData[branchId].menuPdf}` : null,
          lastUpdated: whatsappData[branchId]?.menuLastUpdated || null
        }
      };
    }));

    res.json({ branches: status });
  } catch (error) {
    console.error('Error obteniendo estado de WhatsApp:', error);
    res.status(500).json({ 
      error: 'Error obteniendo estado de WhatsApp',
      details: error.message 
    });
  }
});

// ===== ENDPOINTS DE WHATSAPP =====

// Conectar WhatsApp para una sucursal
app.post('/api/whatsapp/branch/:branchId/connect', auth, async (req, res) => {
  const { branchId } = req.params;
  
  console.log(`Iniciando conexión de WhatsApp para sucursal ${branchId}`);
  
  try {
    // Crear cliente WhatsApp real
    await whatsappManager.createClient(branchId);
    
    // Actualizar datos locales
    whatsappData[branchId].status = 'connecting';
    whatsappData[branchId].lastReadyAt = new Date().toISOString();
    
    console.log(`Cliente WhatsApp creado para sucursal ${branchId}`);
    
    res.json({
      success: true,
      message: 'WhatsApp iniciado correctamente',
      data: {
        status: whatsappData[branchId].status,
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

// Desconectar WhatsApp
app.post('/api/whatsapp/branch/:branchId/disconnect', auth, async (req, res) => {
  const { branchId } = req.params;
  
  console.log(`Desconectando WhatsApp para sucursal ${branchId}`);
  
  try {
    await whatsappManager.disconnect(branchId);
    
    // Actualizar datos locales
    whatsappData[branchId].status = 'disconnected';
    whatsappData[branchId].qrCode = null;
    whatsappData[branchId].phoneNumber = null;
    
    res.json({
      success: true,
      message: 'WhatsApp desconectado correctamente',
      data: {
        status: whatsappData[branchId].status,
        branchId: branchId
      }
    });
    
  } catch (error) {
    console.error(`Error desconectando WhatsApp:`, error);
    res.status(500).json({ 
      error: 'Error desconectando WhatsApp',
      details: error.message 
    });
  }
});

// Forzar logout desde teléfono
app.post('/api/whatsapp/branch/:branchId/force-phone-logout', auth, async (req, res) => {
  const { branchId } = req.params;
  
  console.log(`Forzando logout desde teléfono para sucursal ${branchId}`);
  
  try {
    // Forzar logout desde teléfono
    await whatsappManager.forcePhoneLogout(branchId);
    
    // Actualizar datos locales
    whatsappData[branchId].status = 'disconnected';
    
    console.log(`Logout forzado completado para sucursal ${branchId}`);
    
    res.json({
      success: true,
      message: 'Logout forzado completado. Ahora puedes desvincular desde tu teléfono y crear una nueva sesión.',
      data: {
        status: whatsappData[branchId].status,
        branchId: branchId
      }
    });
    
  } catch (error) {
    console.error(`Error forzando logout:`, error);
    res.status(500).json({ 
      error: 'Error forzando logout',
      details: error.message 
    });
  }
});

// Forzar nueva sesión de WhatsApp
app.post('/api/whatsapp/branch/:branchId/force-new-session', auth, async (req, res) => {
  const { branchId } = req.params;
  
  console.log(`Forzando nueva sesión para sucursal ${branchId}`);
  
  try {
    // Forzar nueva sesión
    await whatsappManager.forceNewSession(branchId);
    
    // Actualizar datos locales
    whatsappData[branchId].status = 'connecting';
    whatsappData[branchId].lastReadyAt = new Date().toISOString();
    
    console.log(`Nueva sesión creada para sucursal ${branchId}`);
    
    res.json({
      success: true,
      message: 'Nueva sesión iniciada correctamente',
      data: {
        status: whatsappData[branchId].status,
        branchId: branchId
      }
    });
    
  } catch (error) {
    console.error(`Error forzando nueva sesión:`, error);
    res.status(500).json({ 
      error: 'Error forzando nueva sesión',
      details: error.message 
    });
  }
});

// Regenerar QR para una sucursal
app.post('/api/whatsapp/branch/:branchId/regenerate-qr', auth, async (req, res) => {
  const { branchId } = req.params;
  
  console.log(`Regenerando QR para sucursal ${branchId}`);
  
  try {
    // Desconectar cliente actual si existe
    await whatsappManager.disconnect(branchId);
    
    // Crear nuevo cliente (esto generará un nuevo QR)
    await whatsappManager.createClient(branchId);
    
    // Actualizar datos locales
    whatsappData[branchId].status = 'connecting';
    whatsappData[branchId].lastReadyAt = new Date().toISOString();
    
    console.log(`QR regenerado para sucursal ${branchId}`);
    
    res.json({
      success: true,
      message: 'QR regenerado correctamente',
      data: {
        status: whatsappData[branchId].status,
        branchId: branchId
      }
    });
    
  } catch (error) {
    console.error(`Error regenerando QR:`, error);
    res.status(500).json({ 
      error: 'Error regenerando QR',
      details: error.message 
    });
  }
});

// Enviar mensaje de prueba
app.post('/api/whatsapp/branch/:branchId/send-message', auth, async (req, res) => {
  const { branchId } = req.params;
  const { to, message } = req.body;
  
  console.log(`Enviando mensaje de prueba desde sucursal ${branchId} a ${to}`);
  
  try {
    const success = await whatsappManager.sendMessage(branchId, to, message);
    
    if (success) {
      res.json({
        success: true,
        message: 'Mensaje enviado correctamente',
        data: { to, message }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'No se pudo enviar el mensaje. Verifica que WhatsApp esté conectado.'
      });
    }
    
  } catch (error) {
    console.error(`Error enviando mensaje:`, error);
    res.status(500).json({ 
      error: 'Error enviando mensaje',
      details: error.message 
    });
  }
});

// Regenerar QR
app.post('/api/whatsapp/branch/:branchId/regenerate-qr', auth, (req, res) => {
  const { branchId } = req.params;
  
  console.log(`Regenerando QR para sucursal ${branchId}`);
  
  try {
    // Generar nuevo QR
    const qrCode = Buffer.from(`QR_NUEVO_${Date.now()}`).toString('base64');
    whatsappData[branchId].qrCode = qrCode;
    whatsappData[branchId].status = 'qr_ready';
    
    res.json({
      success: true,
      message: 'QR regenerado correctamente',
      data: {
        status: whatsappData[branchId].status,
        qr_code: qrCode,
        branchId: branchId
      }
    });
    
  } catch (error) {
    console.error(`Error regenerando QR:`, error);
    res.status(500).json({ 
      error: 'Error regenerando QR',
      details: error.message 
    });
  }
});

// Obtener QR actual
app.get('/api/whatsapp/branch/:branchId/qr', auth, (req, res) => {
  const { branchId } = req.params;
  
  const qrCode = whatsappManager.getQRCode(branchId);
  const status = whatsappManager.getStatus(branchId);
  
  if (!qrCode) {
    return res.status(404).json({ error: 'QR no disponible' });
  }
  
  res.json({
    success: true,
    data: {
      qr_code: qrCode,
      status: status,
      branchId: branchId
    }
  });
});

// Enviar mensaje de prueba
app.post('/api/whatsapp/branch/:branchId/send-message', auth, async (req, res) => {
  const { branchId } = req.params;
  const { to, message } = req.body;
  
  console.log(`Enviando mensaje de prueba desde sucursal ${branchId} a ${to}`);
  
  try {
    const success = await whatsappManager.sendMessage(branchId, to, message);
    
    if (success) {
      res.json({
        success: true,
        message: 'Mensaje enviado correctamente',
        data: { to, message }
      });
    } else {
      res.status(400).json({
        error: 'No se pudo enviar el mensaje',
        details: 'Cliente no conectado o número inválido'
      });
    }
  } catch (error) {
    console.error(`Error enviando mensaje:`, error);
    res.status(500).json({ 
      error: 'Error enviando mensaje',
      details: error.message 
    });
  }
});

// Desvincular WhatsApp completamente
app.post('/api/whatsapp/branch/:branchId/logout', auth, async (req, res) => {
  const { branchId } = req.params;
  
  console.log(`Desvinculando WhatsApp para sucursal ${branchId}`);
  
  try {
    await whatsappManager.logout(branchId);
    
    // Actualizar datos locales
    whatsappData[branchId].status = 'disconnected';
    whatsappData[branchId].qrCode = null;
    whatsappData[branchId].phoneNumber = null;
    whatsappData[branchId].lastReadyAt = null;
    
    res.json({
      success: true,
      message: 'WhatsApp desvinculado correctamente',
      data: {
        status: whatsappData[branchId].status,
        branchId: branchId
      }
    });
    
  } catch (error) {
    console.error(`Error desvinculando WhatsApp:`, error);
    res.status(500).json({ 
      error: 'Error desvinculando WhatsApp',
      details: error.message 
    });
  }
});

// Obtener configuración de teléfonos de una sucursal
app.get('/api/whatsapp/branch/:branchId/phones', auth, (req, res) => {
  const { branchId } = req.params;
  
  const branchData = whatsappData[branchId];
  if (!branchData) {
    return res.status(404).json({ error: 'Sucursal no encontrada' });
  }
  
  res.json({
    success: true,
    data: {
      orderPhone: branchData.orderPhone || '',
      complaintPhone: branchData.complaintPhone || '',
      branchId: branchId
    }
  });
});

// Actualizar configuración de teléfonos
app.put('/api/whatsapp/branch/:branchId/phones', auth, (req, res) => {
  const { branchId } = req.params;
  const { orderPhone, complaintPhone } = req.body;
  
  console.log(`Actualizando teléfonos para sucursal ${branchId}:`, { orderPhone, complaintPhone });
  
  const branchData = whatsappData[branchId];
  if (!branchData) {
    return res.status(404).json({ error: 'Sucursal no encontrada' });
  }
  
  try {
    // Validar formato de teléfonos
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    
    if (orderPhone && !phoneRegex.test(orderPhone.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Formato de teléfono de pedidos inválido' });
    }
    
    if (complaintPhone && !phoneRegex.test(complaintPhone.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Formato de teléfono de reclamaciones inválido' });
    }
    
    // Actualizar teléfonos
    if (orderPhone !== undefined) {
      branchData.orderPhone = orderPhone;
    }
    if (complaintPhone !== undefined) {
      branchData.complaintPhone = complaintPhone;
    }
    
    console.log(`Teléfonos actualizados para sucursal ${branchId}`);
    
    res.json({
      success: true,
      message: 'Teléfonos actualizados correctamente',
      data: {
        orderPhone: branchData.orderPhone,
        complaintPhone: branchData.complaintPhone,
        branchId: branchId
      }
    });
    
  } catch (error) {
    console.error(`Error actualizando teléfonos:`, error);
    res.status(500).json({ 
      error: 'Error actualizando teléfonos',
      details: error.message 
    });
  }
});

// Endpoint para configurar prompt de IA para una sucursal
app.post('/api/branch/:branchId/ai-prompt', auth, (req, res) => {
  const { branchId } = req.params;
  const { prompt } = req.body;
  
  console.log(`Configurando prompt de IA para sucursal ${branchId}`);
  
  try {
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt no proporcionado' });
    }
    
    // Configurar prompt en AI Manager
    aiManager.setAIPrompt(branchId, prompt);
    
    // Guardar en datos locales
    if (!whatsappData[branchId]) {
      whatsappData[branchId] = {
        branchName: branchId === 'branch-1' ? 'Sucursal Principal' : 'Sucursal Norte',
        phoneNumber: null,
        qrCode: null,
        status: 'disconnected',
        client: null,
        lastReadyAt: null,
        orderPhone: '+573001234567',
        complaintPhone: '+573001234568',
        defaultMessages: {},
        conversationState: {},
        menuPdf: null,
        menuContent: null,
        menuLastUpdated: null,
        aiPrompt: null
      };
    }
    
    whatsappData[branchId].aiPrompt = prompt;
    
    console.log(`Prompt de IA configurado para sucursal ${branchId}`);
    
    res.json({
      success: true,
      message: 'Prompt de IA configurado correctamente',
      data: {
        branchId: branchId,
        prompt: prompt
      }
    });
    
  } catch (error) {
    console.error(`Error configurando prompt de IA:`, error);
    res.status(500).json({ 
      error: 'Error configurando prompt de IA',
      details: error.message 
    });
  }
});

// Endpoint para obtener prompt de IA de una sucursal
app.get('/api/branch/:branchId/ai-prompt', auth, (req, res) => {
  const { branchId } = req.params;
  
  const branchData = whatsappData[branchId];
  if (!branchData) {
    return res.status(404).json({ error: 'Sucursal no encontrada' });
  }
  
  res.json({
    success: true,
    data: {
      branchId: branchId,
      prompt: branchData.aiPrompt || aiManager.getPrompt(branchId)
    }
  });
});

// Endpoint para configurar Hugging Face
app.post('/api/ai/configure-huggingface', auth, (req, res) => {
  const { apiKey, modelName, enabled } = req.body;
  
  console.log(`Configurando Hugging Face:`, { apiKey: apiKey ? '***' : 'no key', modelName, enabled });
  
  try {
    // Actualizar configuración en AI Manager
    if (apiKey) {
      aiManager.hf = new (require('@huggingface/inference').HfInference)(apiKey);
    }
    
    if (modelName) {
      aiManager.modelName = modelName;
    }
    
    if (enabled !== undefined) {
      aiManager.useHuggingFace = enabled;
    }
    
    console.log(`Hugging Face configurado:`, {
      hasApiKey: !!aiManager.hf,
      modelName: aiManager.modelName,
      enabled: aiManager.useHuggingFace
    });
    
    res.json({
      success: true,
      message: 'Hugging Face configurado correctamente',
      data: {
        hasApiKey: !!aiManager.hf,
        modelName: aiManager.modelName,
        enabled: aiManager.useHuggingFace
      }
    });
    
  } catch (error) {
    console.error(`Error configurando Hugging Face:`, error);
    res.status(500).json({ 
      error: 'Error configurando Hugging Face',
      details: error.message 
    });
  }
});

// Endpoint para probar respuesta de IA
app.post('/api/ai/test-response', auth, async (req, res) => {
  const { message, branchId } = req.body;
  
  try {
    const response = await aiManager.generateResponse(branchId, message, 'test-client');
    
    res.json({
      success: true,
      response: response,
      data: {
        message: message,
        branchId: branchId,
        aiType: aiManager.useHuggingFace ? 'Hugging Face' : 'Simulación'
      }
    });
    
  } catch (error) {
    console.error(`Error probando IA:`, error);
    res.status(500).json({ 
      error: 'Error probando IA',
      details: error.message 
    });
  }
});
app.get('/api/ai/configuration', auth, (req, res) => {
  res.json({
    success: true,
    data: {
      hasApiKey: !!aiManager.hf,
      modelName: aiManager.modelName,
      enabled: aiManager.useHuggingFace,
      availableModels: [
        'microsoft/DialoGPT-medium',
        'microsoft/DialoGPT-large',
        'gpt2',
        'distilgpt2'
      ]
    }
  });
});
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor FastWings ejecutándose en puerto ${PORT}`);
  console.log(`Directorio de uploads: ${path.join(__dirname, 'uploads')}`);
});
