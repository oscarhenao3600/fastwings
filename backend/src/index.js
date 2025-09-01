
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/database');
const whatsappService = require('./services/whatsappService');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const orderRoutes = require('./routes/orders');
const whatsappWebhook = require('./routes/whatsappWebhook');
const whatsappRoutes = require('./routes/whatsapp');
const branchWhatsappRoutes = require('./routes/branchWhatsapp');
const billingRoutes = require('./routes/billing');

const app = express();

// Conectar a MongoDB
connectDB();

// Inicializar WhatsApp Service
whatsappService.initialize().then(success => {
  if (success) {
    console.log('✅ WhatsApp Service inicializado correctamente');
  } else {
    console.log('⚠️ WhatsApp Service no pudo inicializarse');
  }
}).catch(error => {
  console.error('❌ Error inicializando WhatsApp Service:', error);
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/whatsapp/webhook', whatsappWebhook);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/branch-whatsapp', branchWhatsappRoutes);
app.use('/api/billing', billingRoutes);

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Servir archivos del frontend
app.use('/frontend-admin', express.static(path.join(__dirname, '../../frontend-admin')));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'FastWings API v4 - Sistema de Pedidos WhatsApp (MongoDB)' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 FastWings backend ejecutándose en puerto ${PORT}`));
