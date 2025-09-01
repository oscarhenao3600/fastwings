
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Branch = require('../models/Branch');
const { auth, requireRole } = require('../middlewares/auth');
const { generateInvoicePDF } = require('../services/billingService');

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(auth);

// ===== GENERACIÓN DE FACTURAS =====

// Generar factura para un pedido
router.post('/generate/:orderId', 
  requireRole(['admin', 'branch_user']),
  async (req, res) => {
    try {
      const { orderId } = req.params;
      
      // Obtener el pedido
      let filter = { _id: orderId };

      // Filtrar por sucursal según el rol del usuario
      if (req.user.role === 'branch_user' || req.user.role === 'admin') {
        filter.branch_id = req.user.branch_id;
      }

      const order = await Order.findOne(filter).populate('branch_id', 'name address phone');
      
      if (!order) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      // Generar la factura PDF
      const invoicePath = await generateInvoicePDF(order);
      
      // Actualizar el pedido con la ruta de la factura
      await Order.findByIdAndUpdate(orderId, { invoice_path: invoicePath });

      res.json({
        message: 'Factura generada exitosamente',
        invoicePath,
        order: {
          id: order._id,
          customer_name: order.customer_name,
          total_amount: order.total_amount,
          status: order.status
        }
      });

    } catch (error) {
      console.error('Error generando factura:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// Descargar factura
router.get('/download/:orderId', 
  requireRole(['admin', 'branch_user']),
  async (req, res) => {
    try {
      const { orderId } = req.params;
      
      // Obtener el pedido
      let filter = { _id: orderId };

      // Filtrar por sucursal según el rol del usuario
      if (req.user.role === 'branch_user' || req.user.role === 'admin') {
        filter.branch_id = req.user.branch_id;
      }

      const order = await Order.findOne(filter).select('invoice_path branch_id');
      
      if (!order || !order.invoice_path) {
        return res.status(404).json({ error: 'Factura no encontrada' });
      }

      const fullPath = path.join(__dirname, '../../../', order.invoice_path);
      
      // Verificar que el archivo existe
      try {
        await fs.access(fullPath);
      } catch (error) {
        return res.status(404).json({ error: 'Archivo de factura no encontrado' });
      }

      res.download(fullPath, `factura-${orderId}.pdf`);

    } catch (error) {
      console.error('Error descargando factura:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// ===== ENVÍO DE FACTURAS POR WHATSAPP =====

// Enviar factura por WhatsApp
router.post('/send/:branchId', 
  requireRole(['admin', 'branch_user']),
  [
    body('caption').optional().trim().isLength({ max: 500 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { branchId } = req.params;
      const { caption } = req.body;

      // Verificar permisos
      if (req.user.role === 'branch_user' && req.user.branch_id != branchId) {
        return res.status(403).json({ error: 'Acceso denegado a esta sucursal' });
      }

      // Obtener la sucursal
      const branch = await Branch.findById(branchId);
      if (!branch) {
        return res.status(404).json({ error: 'Sucursal no encontrada' });
      }

      if (!branch.order_number && !branch.system_number) {
        return res.status(400).json({ error: 'La sucursal no tiene configurado un número de WhatsApp' });
      }

      // Obtener pedidos pendientes de facturación
      const ordersToInvoice = await Order.find({ branch_id: branchId, status: 'confirmed', invoice_path: null })
        .sort({ created_at: 1 })
        .limit(5); // Procesar máximo 5 pedidos por vez

      if (ordersToInvoice.length === 0) {
        return res.json({ 
          message: 'No hay pedidos pendientes de facturación',
          ordersProcessed: 0
        });
      }

      const results = [];
      
      for (const order of ordersToInvoice) {
        try {
          // Generar factura si no existe
          let invoicePath = order.invoice_path;
          if (!invoicePath) {
            invoicePath = await generateInvoicePDF(order);
            
            // Actualizar el pedido con la ruta de la factura
            await Order.findByIdAndUpdate(order._id, { invoice_path: invoicePath });
          }

          // Aquí se implementaría el envío real por WhatsApp
          // Por ahora, solo simulamos el envío
          const whatsappNumber = branch.order_number || branch.system_number;
          const message = `📄 Factura para tu pedido #${order._id}\n\nCliente: ${order.customer_name}\nTotal: $${order.total_amount}\n\n${caption || 'Gracias por tu compra!'}`;

          console.log(`📱 Enviando factura por WhatsApp a ${whatsappNumber}:`);
          console.log(`   Pedido: #${order._id}`);
          console.log(`   Cliente: ${order.customer_name}`);
          console.log(`   Factura: ${invoicePath}`);

          results.push({
            orderId: order._id,
            customerName: order.customer_name,
            invoicePath,
            whatsappNumber,
            message,
            status: 'sent'
          });

        } catch (error) {
          console.error(`Error procesando pedido ${order._id}:`, error);
          results.push({
            orderId: order._id,
            customerName: order.customer_name,
            error: error.message,
            status: 'error'
          });
        }
      }

      res.json({
        message: `Procesados ${results.length} pedidos`,
        results,
        ordersProcessed: results.length
      });

    } catch (error) {
      console.error('Error enviando facturas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// ===== ESTADÍSTICAS DE FACTURACIÓN =====

// Obtener estadísticas de facturación
router.get('/stats', async (req, res) => {
  try {
    let filter = {};
    
    // Filtrar por sucursal según el rol del usuario
    if (req.user.role === 'branch_user' || req.user.role === 'admin') {
      filter.branch_id = req.user.branch_id;
    }

    const totalOrders = await Order.countDocuments(filter);
    const invoicedOrders = await Order.countDocuments({ ...filter, invoice_path: { $exists: true, $ne: null } });
    const pendingInvoicing = await Order.countDocuments({ 
      ...filter, 
      status: 'confirmed',
      invoice_path: { $exists: false }
    });

    // Calcular ingresos totales
    const totalRevenueResult = await Order.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$total_amount' } } }
    ]);

    // Calcular ingresos facturados
    const invoicedRevenueResult = await Order.aggregate([
      { $match: { ...filter, invoice_path: { $exists: true, $ne: null } } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } }
    ]);

    res.json({
      stats: {
        totalOrders,
        invoicedOrders,
        pendingInvoicing,
        totalRevenue: totalRevenueResult.length > 0 ? totalRevenueResult[0].total || 0 : 0,
        invoicedRevenue: invoicedRevenueResult.length > 0 ? invoicedRevenueResult[0].total || 0 : 0
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de facturación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
