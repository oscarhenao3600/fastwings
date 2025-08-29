
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
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
      let query = db('orders')
        .leftJoin('branches', 'orders.branch_id', 'branches.id')
        .where('orders.id', orderId)
        .select('orders.*', 'branches.name as branch_name', 'branches.address as branch_address', 'branches.phone as branch_phone');

      // Filtrar por sucursal según el rol del usuario
      if (req.user.role === 'branch_user' || req.user.role === 'admin') {
        query = query.where('orders.branch_id', req.user.branch_id);
      }

      const order = await query.first();
      
      if (!order) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      // Generar la factura PDF
      const invoicePath = await generateInvoicePDF(order);
      
      // Actualizar el pedido con la ruta de la factura
      await db('orders')
        .where('id', orderId)
        .update({ 
          invoice_path: invoicePath,
          updated_at: new Date()
        });

      res.json({
        message: 'Factura generada exitosamente',
        invoicePath,
        order: {
          id: order.id,
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
      let query = db('orders')
        .where('id', orderId)
        .select('invoice_path', 'branch_id');

      // Filtrar por sucursal según el rol del usuario
      if (req.user.role === 'branch_user' || req.user.role === 'admin') {
        query = query.where('branch_id', req.user.branch_id);
      }

      const order = await query.first();
      
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
      const branch = await db('branches').where('id', branchId).first();
      if (!branch) {
        return res.status(404).json({ error: 'Sucursal no encontrada' });
      }

      if (!branch.order_number && !branch.system_number) {
        return res.status(400).json({ error: 'La sucursal no tiene configurado un número de WhatsApp' });
      }

      // Obtener pedidos pendientes de facturación
      const ordersToInvoice = await db('orders')
        .where('branch_id', branchId)
        .where('status', 'confirmed')
        .whereNull('invoice_path')
        .orderBy('created_at', 'asc')
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
            await db('orders')
              .where('id', order.id)
              .update({ 
                invoice_path: invoicePath,
                updated_at: new Date()
              });
          }

          // Aquí se implementaría el envío real por WhatsApp
          // Por ahora, solo simulamos el envío
          const whatsappNumber = branch.order_number || branch.system_number;
          const message = `📄 Factura para tu pedido #${order.id}\n\nCliente: ${order.customer_name}\nTotal: $${order.total_amount}\n\n${caption || 'Gracias por tu compra!'}`;

          console.log(`📱 Enviando factura por WhatsApp a ${whatsappNumber}:`);
          console.log(`   Pedido: #${order.id}`);
          console.log(`   Cliente: ${order.customer_name}`);
          console.log(`   Factura: ${invoicePath}`);

          results.push({
            orderId: order.id,
            customerName: order.customer_name,
            invoicePath,
            whatsappNumber,
            message,
            status: 'sent'
          });

        } catch (error) {
          console.error(`Error procesando pedido ${order.id}:`, error);
          results.push({
            orderId: order.id,
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
    let baseQuery = db('orders');
    
    // Filtrar por sucursal según el rol del usuario
    if (req.user.role === 'branch_user' || req.user.role === 'admin') {
      baseQuery = baseQuery.where('branch_id', req.user.branch_id);
    }

    const [totalOrders] = await baseQuery.count('* as count');
    const [invoicedOrders] = await baseQuery.whereNotNull('invoice_path').count('* as count');
    const [pendingInvoicing] = await baseQuery
      .where('status', 'confirmed')
      .whereNull('invoice_path')
      .count('* as count');

    const totalRevenue = await baseQuery.sum('total_amount as total').first();
    const invoicedRevenue = await baseQuery
      .whereNotNull('invoice_path')
      .sum('total_amount as total')
      .first();

    res.json({
      stats: {
        totalOrders: totalOrders.count,
        invoicedOrders: invoicedOrders.count,
        pendingInvoicing: pendingInvoicing.count,
        totalRevenue: totalRevenue.total || 0,
        invoicedRevenue: invoicedRevenue.total || 0
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de facturación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
