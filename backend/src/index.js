
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const orderRoutes = require('./routes/orders');
const whatsappWebhook = require('./routes/whatsappWebhook');
const billingRoutes = require('./routes/billing');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/whatsapp', whatsappWebhook);
app.use('/api/billing', billingRoutes);

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'FastWings API v4 - Sistema de Pedidos WhatsApp' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 FastWings backend ejecutándose en puerto ${PORT}`));
