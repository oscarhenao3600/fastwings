const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const qrcode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/frontend-admin', express.static(path.join(__dirname, '../frontend-admin')));

// Usuario fijo
const USER = {
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
  
  if (email === USER.email && password === USER.password) {
    const token = jwt.sign(
      { id: USER.id, email: USER.email, role: USER.role },
      'test-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('✅ Login successful for:', USER.email);
    
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
    const decoded = jwt.verify(token, 'test-secret-key');
    console.log('🔍 Token decodificado:', decoded);
    
    if (decoded.id === USER.id) {
      req.user = USER;
      console.log('✅ Usuario autenticado:', USER.email);
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
          phone_number: whatsappData['branch-1']?.phoneNumber || null,
          is_connected: whatsappData['branch-1']?.status === 'connected',
          status: whatsappData['branch-1']?.status || 'disconnected',
          qr_code: whatsappData['branch-1']?.qrCode || null,
          last_connection: whatsappData['branch-1']?.lastReadyAt || null
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
          phone_number: whatsappData['branch-1']?.phoneNumber || null,
          is_connected: whatsappData['branch-1']?.status === 'connected',
          status: whatsappData['branch-1']?.status || 'disconnected',
          qr_code: whatsappData['branch-1']?.qrCode || null,
          last_connection: whatsappData['branch-1']?.lastReadyAt || null
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
        }
      }
    ]
  });
});

// Almacenar datos de WhatsApp por sucursal
const whatsappData = {
  'branch-1': { 
    phoneNumber: null, 
    qrCode: null, 
    status: 'disconnected',
    client: null,
    lastReadyAt: null,
    defaultMessages: {
      welcome: '¡Hola! Bienvenido a FastWings. ¿En qué puedo ayudarte?',
      menu: 'Aquí tienes nuestro menú: [MENÚ]',
      order: 'Perfecto, tu pedido ha sido recibido. Te contactaremos pronto.',
      goodbye: '¡Gracias por preferir FastWings! Que tengas un excelente día.',
      aiPrompt: 'Eres un asistente virtual de FastWings, un restaurante de comida rápida. Debes ser amigable, profesional y ayudar a los clientes con sus pedidos, consultas sobre el menú y cualquier otra pregunta relacionada con nuestros servicios.'
    }
  },
  'branch-2': { 
    phoneNumber: null, 
    qrCode: null, 
    status: 'disconnected',
    client: null,
    lastReadyAt: null,
    defaultMessages: {
      welcome: '¡Hola! Bienvenido a FastWings Norte. ¿En qué puedo ayudarte?',
      menu: 'Aquí tienes nuestro menú: [MENÚ]',
      order: 'Perfecto, tu pedido ha sido recibido. Te contactaremos pronto.',
      goodbye: '¡Gracias por preferir FastWings! Que tengas un excelente día.',
      aiPrompt: 'Eres un asistente virtual de FastWings Norte, un restaurante de comida rápida. Debes ser amigable, profesional y ayudar a los clientes con sus pedidos, consultas sobre el menú y cualquier otra pregunta relacionada con nuestros servicios.'
    }
  }
};

// Función para crear cliente de WhatsApp real
function createWhatsAppClient(branchId) {
  console.log(`🔧 ===== CREANDO CLIENTE WHATSAPP REAL =====`);
  console.log(`📍 Sucursal: ${branchId}`);
  console.log(`🔑 Client ID: branch_${branchId}`);
  console.log(`🔧 ===========================================`);
  
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: `branch_${branchId}` }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      executablePath: process.env.CHROME_PATH || undefined,
      timeout: 120000
    }
  });

  client.on('qr', async (qr) => {
    console.log(`📱 ===== QR REAL GENERADO =====`);
    console.log(`📍 Sucursal: ${branchId}`);
    console.log(`🔑 Client ID: branch_${branchId}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`📱 ============================`);
    
    try {
      const qrCode = await qrcode.toDataURL(qr, { margin: 1, scale: 6 });
      whatsappData[branchId].qrCode = qrCode;
      whatsappData[branchId].status = 'qr_ready';
      
      console.log(`✅ QR REAL guardado para sucursal ${branchId}`);
      console.log(`📊 Estado actualizado a: qr_ready`);
    } catch (error) {
      console.error(`❌ Error generando QR real para sucursal ${branchId}:`, error);
    }
  });

  client.on('ready', () => {
    console.log(`✅ ===== WHATSAPP REAL CONECTADO =====`);
    console.log(`📍 Sucursal: ${branchId}`);
    console.log(`📱 Cliente listo para recibir mensajes`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`✅ ======================================`);
    whatsappData[branchId].status = 'connected';
    whatsappData[branchId].qrCode = null;
    whatsappData[branchId].lastReadyAt = new Date().toISOString();
  });

  client.on('loading_screen', (percent, message) => {
    console.log(`⏳ Cargando WhatsApp (${branchId}): ${percent}% - ${message}`);
  });

  client.on('change_state', (state) => {
    console.log(`🔄 Estado del cliente (${branchId}): ${state}`);
  });

  client.on('authenticated', () => {
    console.log(`🔐 Autenticado (${branchId})`);
  });

  client.on('auth_failure', (msg) => {
    console.log(`❌ Error de autenticación para sucursal ${branchId}: ${msg}`);
    whatsappData[branchId].status = 'auth_failure';
    whatsappData[branchId].qrCode = null;
  });

  client.on('disconnected', (reason) => {
    console.log(`❌ WhatsApp desconectado para sucursal ${branchId}: ${reason}`);
    whatsappData[branchId].status = 'disconnected';
    whatsappData[branchId].qrCode = null;
  });

  client.on('auth_failure', (msg) => {
    console.log(`❌ Error de autenticación para sucursal ${branchId}: ${msg}`);
    whatsappData[branchId].status = 'auth_failure';
    whatsappData[branchId].qrCode = null;
  });

  // Event listener para mensajes entrantes - IA automática
  client.on('message', async (msg) => {
    console.log(`📨 ===== MENSAJE RECIBIDO =====`);
    console.log(`📍 Sucursal: ${branchId}`);
    console.log(`👤 De: ${msg.from}`);
    console.log(`💬 Mensaje: ${msg.body}`);
    console.log(`📱 ============================`);
    
    try {
      // Solo responder a mensajes de texto (no archivos, stickers, etc.)
      if (msg.type === 'chat' || msg.type === 'text') {
        const userMessage = msg.body.toLowerCase().trim();
        const response = await generateAIResponse(userMessage, branchId);
        
        console.log(`🤖 Respuesta IA: ${response}`);
        
        // Enviar respuesta
        await msg.reply(response);
        
        console.log(`✅ Respuesta enviada exitosamente`);
      } else {
        console.log(`⚠️ Mensaje ignorado - tipo: ${msg.type}`);
      }
    } catch (error) {
      console.error(`❌ Error procesando mensaje para sucursal ${branchId}:`, error);
      try {
        await msg.reply('Lo siento, estoy teniendo problemas técnicos. Por favor, intenta más tarde.');
      } catch (replyError) {
        console.error(`❌ Error enviando mensaje de error:`, replyError);
      }
    }
  });

  return client;
}

// Función para generar respuestas de IA
async function generateAIResponse(userMessage, branchId) {
  console.log(`🤖 ===== GENERANDO RESPUESTA IA =====`);
  console.log(`📍 Sucursal: ${branchId}`);
  console.log(`💬 Mensaje del usuario: ${userMessage}`);
  
  const data = whatsappData[branchId];
  const messages = data?.defaultMessages || {};
  
  // Respuestas basadas en palabras clave
  if (userMessage.includes('hola') || userMessage.includes('buenos días') || userMessage.includes('buenas')) {
    return messages.welcome || '¡Hola! Bienvenido a FastWings. ¿En qué puedo ayudarte?';
  }
  
  if (userMessage.includes('menú') || userMessage.includes('menu') || userMessage.includes('comida')) {
    return messages.menu || 'Aquí tienes nuestro menú: 🍔 Hamburguesas, 🍕 Pizzas, 🥤 Bebidas, 🍟 Papas fritas. ¿Qué te gustaría ordenar?';
  }
  
  if (userMessage.includes('pedido') || userMessage.includes('ordenar') || userMessage.includes('comprar')) {
    return messages.order || 'Perfecto, tu pedido ha sido recibido. Te contactaremos pronto para confirmar los detalles.';
  }
  
  if (userMessage.includes('horario') || userMessage.includes('horarios') || userMessage.includes('abierto')) {
    return 'Nuestro horario de atención es de lunes a domingo de 11:00 AM a 10:00 PM. ¡Te esperamos!';
  }
  
  if (userMessage.includes('entrega') || userMessage.includes('delivery') || userMessage.includes('domicilio')) {
    return 'Ofrecemos servicio de entrega a domicilio. El tiempo de entrega es de 30-45 minutos. Costo de envío: $2.000.';
  }
  
  if (userMessage.includes('precio') || userMessage.includes('costo') || userMessage.includes('cuánto')) {
    return 'Nuestros precios varían según el producto. Hamburguesas desde $15.000, Pizzas desde $25.000. ¿Te gustaría ver el menú completo?';
  }
  
  if (userMessage.includes('gracias') || userMessage.includes('thank')) {
    return messages.goodbye || '¡Gracias por preferir FastWings! Que tengas un excelente día.';
  }
  
  if (userMessage.includes('ayuda') || userMessage.includes('help')) {
    return 'Puedo ayudarte con: 📋 Menú, 🛒 Pedidos, 🕐 Horarios, 🚚 Entregas, 💰 Precios. ¿Qué necesitas?';
  }
  
  // Respuesta por defecto
  return messages.goodbye || '¡Hola! Soy el asistente virtual de FastWings. Puedo ayudarte con información sobre nuestro menú, pedidos, horarios y más. ¿En qué puedo ayudarte?';
}

// Inicializar WhatsApp para una sucursal
app.post('/api/branch-whatsapp/branch/:branchId/initialize', auth, (req, res) => {
  const { branchId } = req.params;
  const { phoneNumber } = req.body;
  
  console.log(`🚀 ===== INICIALIZANDO WHATSAPP REAL =====`);
  console.log(`📍 Sucursal: ${branchId}`);
  console.log(`📱 Número: ${phoneNumber}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  
  try {
    // Verificar si ya existe un cliente
    if (whatsappData[branchId] && whatsappData[branchId].client) {
      console.log(`⚠️ Cliente ya existe para sucursal ${branchId}, destruyendo...`);
      try {
        whatsappData[branchId].client.destroy();
      } catch (destroyError) {
        console.log(`⚠️ Error destruyendo cliente anterior:`, destroyError.message);
      }
    }
    
    // Crear cliente de WhatsApp real
    console.log(`🔧 Creando cliente real para sucursal ${branchId}...`);
    const client = createWhatsAppClient(branchId);
    whatsappData[branchId].client = client;
    whatsappData[branchId].phoneNumber = phoneNumber;
    whatsappData[branchId].status = 'initializing';
    whatsappData[branchId].qrCode = null;
    
    console.log(`📊 Estado actualizado a: initializing`);
    
    // Inicializar cliente real
    console.log(`🚀 Inicializando cliente real...`);
    client.initialize().catch(error => {
      console.error(`❌ Error inicializando cliente real para sucursal ${branchId}:`, error);
      console.error(`📋 Stack trace:`, error.stack);
      whatsappData[branchId].status = 'error';
      whatsappData[branchId].error = error.message;
    });
    
    console.log(`✅ Cliente WhatsApp REAL creado para sucursal ${branchId}`);
    console.log(`🚀 ==============================================`);
    
    res.json({ 
      message: 'WhatsApp REAL inicializado exitosamente para la sucursal',
      qr_ready: true,
      status: 'initializing'
    });
  } catch (error) {
    console.error('❌ Error inicializando WhatsApp REAL:', error);
    console.error('📋 Stack trace:', error.stack);
    res.status(500).json({ error: 'Error inicializando WhatsApp REAL' });
  }
});

// Regenerar QR - Forzar nueva generación
app.post('/api/branch-whatsapp/branch/:branchId/regenerate-qr', auth, (req, res) => {
  const { branchId } = req.params;
  
  console.log(`🔄 ===== REGENERANDO QR =====`);
  console.log(`📍 Sucursal: ${branchId}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  
  try {
    const data = whatsappData[branchId];
    
    if (!data) {
      console.log(`❌ No hay datos para sucursal ${branchId}`);
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }
    
    // Si hay un cliente existente, destruirlo
    if (data.client) {
      console.log(`⚠️ Destruyendo cliente existente para regenerar QR...`);
      try {
        data.client.destroy();
      } catch (destroyError) {
        console.log(`⚠️ Error destruyendo cliente anterior:`, destroyError.message);
      }
      data.client = null;
    }
    
    // Limpiar QR anterior
    data.qrCode = null;
    data.status = 'initializing';
    data.error = null;
    
    // Crear nuevo cliente
    console.log(`🔧 Creando nuevo cliente para regenerar QR...`);
    const client = createWhatsAppClient(branchId);
    data.client = client;
    
    // Inicializar cliente
    console.log(`🚀 Inicializando nuevo cliente...`);
    client.initialize().catch(error => {
      console.error(`❌ Error inicializando cliente para regenerar QR en sucursal ${branchId}:`, error);
      data.status = 'error';
      data.error = error.message;
    });
    
    console.log(`✅ QR en proceso de regeneración para sucursal ${branchId}`);
    console.log(`🔄 ================================`);
    
    res.json({ 
      message: 'QR en proceso de regeneración. Espera unos segundos y solicita el QR nuevamente.',
      status: 'regenerating'
    });
  } catch (error) {
    console.error('❌ Error regenerando QR:', error);
    res.status(500).json({ error: 'Error regenerando QR' });
  }
});

// Obtener QR
app.get('/api/branch-whatsapp/branch/:branchId/qr', auth, (req, res) => {
  const { branchId } = req.params;
  
  console.log(`📱 ===== SOLICITANDO QR =====`);
  console.log(`📍 Sucursal: ${branchId}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  
  const data = whatsappData[branchId];
  
  console.log(`📊 Estado actual: ${data ? data.status : 'no data'}`);
  console.log(`🔍 Tiene QR: ${data && data.qrCode ? 'Sí' : 'No'}`);
  console.log(`📱 =========================`);
  
  if (data && data.qrCode && data.status === 'qr_ready') {
    console.log(`✅ Enviando QR para sucursal ${branchId}`);
    res.json({ 
      ok: true,
      dataUrl: data.qrCode,
      status: data.status
    });
  } else if (data && data.status === 'initializing') {
    console.log(`⏳ Cliente en inicialización para sucursal ${branchId}`);
    res.json({ 
      ok: false,
      message: 'Cliente en proceso de inicialización. Espera unos segundos y vuelve a intentar.',
      status: 'initializing',
      retryAfter: 5
    });
  } else if (data && data.status === 'connected') {
    console.log(`✅ Cliente ya conectado para sucursal ${branchId}`);
    res.json({ 
      ok: false,
      message: 'WhatsApp ya está conectado para esta sucursal.',
      status: 'connected',
      isConnected: true
    });
  } else {
    console.log(`❌ QR no disponible para sucursal ${branchId}`);
    console.log(`📋 Razón: ${!data ? 'No hay datos' : !data.qrCode ? 'No hay QR' : 'Estado incorrecto'}`);
    
    res.json({ 
      ok: false,
      message: 'QR no disponible. Primero debes inicializar WhatsApp para esta sucursal.',
      debug: {
        hasData: !!data,
        hasQR: !!(data && data.qrCode),
        status: data ? data.status : 'no data',
        expectedStatus: 'qr_ready'
      }
    });
  }
});

// Obtener estado de WhatsApp de una sucursal
app.get('/api/branch-whatsapp/branch/:branchId/status', auth, (req, res) => {
  const { branchId } = req.params;
  
  console.log(`📊 Solicitando estado para sucursal ${branchId}`);
  
  const data = whatsappData[branchId];
  
  if (data && data.phoneNumber) {
    res.json({
      status: data.status,
      is_connected: data.status === 'connected',
      phone_number: data.phoneNumber,
      lastReadyAt: data.lastReadyAt,
      error: data.error || null
    });
  } else {
    res.json({
      status: 'disconnected',
      is_connected: false,
      phone_number: null,
      lastReadyAt: null,
      error: null
    });
  }
});

// Desconectar WhatsApp
app.post('/api/branch-whatsapp/branch/:branchId/disconnect', auth, (req, res) => {
  const { branchId } = req.params;
  
  console.log(`🔌 Desconectando WhatsApp REAL para sucursal ${branchId}`);
  
  const data = whatsappData[branchId];
  if (data && data.client) {
    try {
      data.client.destroy();
    } catch (error) {
      console.log(`⚠️ Error destruyendo cliente:`, error.message);
    }
    data.client = null;
    data.status = 'disconnected';
    data.qrCode = null;
    data.error = null;
  }
  
  res.json({ message: 'WhatsApp REAL desconectado exitosamente de la sucursal' });
});

// Desvincular WhatsApp - Eliminar completamente los datos de sesión
app.post('/api/branch-whatsapp/branch/:branchId/logout', auth, (req, res) => {
  const { branchId } = req.params;
  
  console.log(`🚪 ===== DESVINCULANDO SESIÓN COMPLETA =====`);
  console.log(`📍 Sucursal: ${branchId}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  
  const data = whatsappData[branchId];
  if (data && data.client) {
    console.log(`🔌 Destruyendo cliente de WhatsApp...`);
    try {
      data.client.destroy();
    } catch (error) {
      console.log(`⚠️ Error destruyendo cliente:`, error.message);
    }
  }
  
  // Eliminar completamente todos los datos de sesión
  console.log(`🗑️ Eliminando todos los datos de sesión...`);
  whatsappData[branchId] = { 
    phoneNumber: null, 
    qrCode: null, 
    status: 'disconnected',
    client: null,
    lastReadyAt: null,
    error: null,
    defaultMessages: {
      welcome: '¡Hola! Bienvenido a FastWings. ¿En qué puedo ayudarte?',
      menu: 'Aquí tienes nuestro menú: [MENÚ]',
      order: 'Perfecto, tu pedido ha sido recibido. Te contactaremos pronto.',
      goodbye: '¡Gracias por preferir FastWings! Que tengas un excelente día.',
      aiPrompt: 'Eres un asistente virtual de FastWings, un restaurante de comida rápida. Debes ser amigable, profesional y ayudar a los clientes con sus pedidos, consultas sobre el menú y cualquier otra pregunta relacionada con nuestros servicios.'
    }
  };
  
  console.log(`✅ Sesión completamente desvinculada para sucursal ${branchId}`);
  console.log(`🚪 ==============================================`);
  
  res.json({ 
    message: 'Sesión de WhatsApp completamente desvinculada. Se requerirá nuevo QR para reconectar.',
    status: 'disconnected'
  });
});

// Health check de WhatsApp
app.get('/api/branch-whatsapp/health', auth, (req, res) => {
  const healthData = [
    {
      branchId: 'branch-1',
      name: 'Sucursal Principal',
      status: whatsappData['branch-1'].status,
      is_connected: whatsappData['branch-1'].status === 'connected',
      lastReadyAt: whatsappData['branch-1'].lastReadyAt,
      hasQR: whatsappData['branch-1'].status === 'qr_ready',
      error: whatsappData['branch-1'].error
    },
    {
      branchId: 'branch-2',
      name: 'Sucursal Norte',
      status: whatsappData['branch-2'].status,
      is_connected: whatsappData['branch-2'].status === 'connected',
      lastReadyAt: whatsappData['branch-2'].lastReadyAt,
      hasQR: whatsappData['branch-2'].status === 'qr_ready',
      error: whatsappData['branch-2'].error
    }
  ];
  
  res.json({
    totalBranches: 2,
    connectedBranches: healthData.filter(b => b.is_connected).length,
    branches: healthData
  });
});

// Obtener mensajes por defecto de una sucursal
app.get('/api/branch-whatsapp/branch/:branchId/messages', auth, (req, res) => {
  const { branchId } = req.params;
  
  console.log(`📝 Solicitando mensajes por defecto para sucursal ${branchId}`);
  
  const data = whatsappData[branchId];
  if (data) {
    res.json({
      success: true,
      messages: data.defaultMessages
    });
  } else {
    res.status(404).json({ error: 'Sucursal no encontrada' });
  }
});

// Actualizar mensajes por defecto de una sucursal
app.post('/api/branch-whatsapp/branch/:branchId/messages', auth, (req, res) => {
  const { branchId } = req.params;
  const { messages } = req.body;
  
  console.log(`📝 Actualizando mensajes por defecto para sucursal ${branchId}`);
  
  const data = whatsappData[branchId];
  if (data) {
    data.defaultMessages = { ...data.defaultMessages, ...messages };
    res.json({
      success: true,
      message: 'Mensajes por defecto actualizados exitosamente',
      messages: data.defaultMessages
    });
  } else {
    res.status(404).json({ error: 'Sucursal no encontrada' });
  }
});

// Probar conexión de IA
app.get('/api/branch-whatsapp/ai-status', auth, async (req, res) => {
  console.log('🔍 ===== VERIFICANDO ESTADO DE IA =====');
  
  try {
    res.json({
      success: true,
      aiStatus: 'connected',
      testResponse: '¡Hola! Soy el asistente virtual de FastWings. ¿En qué puedo ayudarte?',
      error: null
    });
    
    console.log('✅ Estado de IA enviado al frontend');
  } catch (error) {
    console.error('❌ Error verificando estado de IA:', error);
    res.status(500).json({
      success: false,
      aiStatus: 'error',
      error: error.message
    });
  }
});

// Forzar inicialización inmediata
app.post('/api/branch-whatsapp/branch/:branchId/force-init', auth, (req, res) => {
  const { branchId } = req.params;
  const { phoneNumber } = req.body;
  
  console.log(`⚡ ===== FORZANDO INICIALIZACIÓN REAL =====`);
  console.log(`📍 Sucursal: ${branchId}`);
  console.log(`📱 Número: ${phoneNumber}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  
  try {
    // Destruir cliente existente si hay
    if (whatsappData[branchId] && whatsappData[branchId].client) {
      console.log(`🔄 Destruyendo cliente existente...`);
      try {
        whatsappData[branchId].client.destroy();
      } catch (destroyError) {
        console.log(`⚠️ Error destruyendo cliente anterior:`, destroyError.message);
      }
    }
    
    // Crear cliente de WhatsApp real
    console.log(`🔧 Creando cliente real...`);
    const client = createWhatsAppClient(branchId);
    whatsappData[branchId].client = client;
    whatsappData[branchId].phoneNumber = phoneNumber;
    whatsappData[branchId].status = 'initializing';
    whatsappData[branchId].qrCode = null;
    whatsappData[branchId].error = null;
    
    console.log(`📊 Estado actualizado a: initializing`);
    
    // Inicializar cliente real
    console.log(`🚀 Inicializando cliente real...`);
    client.initialize().catch(error => {
      console.error(`❌ Error inicializando cliente real para sucursal ${branchId}:`, error);
      console.error(`📋 Stack trace:`, error.stack);
      whatsappData[branchId].status = 'error';
      whatsappData[branchId].error = error.message;
    });
    
    console.log(`✅ Cliente WhatsApp REAL creado para sucursal ${branchId}`);
    console.log(`⚡ ==============================================`);
    
    res.json({ 
      message: 'WhatsApp REAL inicializado exitosamente',
      status: 'initializing',
      note: 'El QR REAL aparecerá en unos segundos. Escanea con WhatsApp para vincular dispositivo.'
    });
  } catch (error) {
    console.error('❌ Error forzando inicialización REAL:', error);
    res.status(500).json({ error: 'Error forzando inicialización REAL' });
  }
});

// Debug endpoint para ver estado actual
app.get('/api/branch-whatsapp/debug', auth, (req, res) => {
  console.log('🔍 ===== DEBUG ESTADO ACTUAL =====');
  
  const debugData = {
    whatsappData: whatsappData,
    timestamp: new Date().toISOString(),
    branches: Object.keys(whatsappData)
  };
  
  console.log('📊 Estado actual:', debugData);
  
  res.json({
    success: true,
    debug: debugData
  });
});

// Obtener usuarios
app.get('/api/admin/users', auth, (req, res) => {
  res.json({ users: [USER] });
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

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Simple Test Server ejecutándose en puerto ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}/frontend-admin/super.html`);
  console.log(`🔐 Login: admin@fastwings.com / admin123`);
  console.log(`🔑 JWT Secret: test-secret-key`);
  console.log(`📊 Estado inicial de sucursales:`);
  console.log(`   - branch-1: ${whatsappData['branch-1'].status}`);
  console.log(`   - branch-2: ${whatsappData['branch-2'].status}`);
  console.log(`🔧 QR REAL de WhatsApp Web para vinculación de dispositivos`);
});
