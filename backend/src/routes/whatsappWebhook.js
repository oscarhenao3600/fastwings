
const express = require('express');
const { body, validationResult } = require('express-validator');
const Branch = require('../models/Branch');
const Order = require('../models/Order');
const { generateInvoicePDF } = require('../services/billingService');

const router = express.Router();

// Webhook para recibir mensajes de WhatsApp
router.post('/webhook', [
  body('from').notEmpty(),
  body('text').optional(),
  body('type').optional(),
  body('mediaUrl').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { from, text, type, mediaUrl } = req.body;
    
    console.log(`📱 Mensaje recibido de ${from}: ${text || type}`);

    // Buscar la sucursal asociada a este número
    const branch = await Branch.findOne({
      $or: [
        { order_number: from },
        { system_number: from }
      ]
    });

    if (!branch) {
      console.log(`❌ No se encontró sucursal para el número ${from}`);
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    // Procesar el mensaje según el tipo
    let response = { message: 'Mensaje recibido' };

    if (type === 'image' && mediaUrl) {
      // Procesar imagen (comprobante de pago)
      response = await processPaymentProof(from, mediaUrl, branch._id);
    } else if (text) {
      // Procesar texto (pedido)
      response = await processOrderText(from, text, branch._id);
    }

    res.json(response);

  } catch (error) {
    console.error('Error procesando webhook de WhatsApp:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Función para procesar comprobantes de pago
async function processPaymentProof(phone, mediaUrl, branchId) {
  try {
    // Aquí se implementaría la lógica para descargar y procesar la imagen
    // Por ahora, solo registramos la recepción
    
    console.log(`💰 Comprobante de pago recibido de ${phone} para sucursal ${branchId}`);
    
    // Buscar pedidos pendientes para este cliente
    const pendingOrders = await Order.find({
      branch_id: branchId,
      customer_phone: phone,
      status: 'pending'
    }).sort({ createdAt: -1 }).limit(1);

    if (pendingOrders.length > 0) {
      const order = pendingOrders[0];
      
      // Actualizar el pedido con el comprobante
      await Order.findByIdAndUpdate(order._id, {
        payment_proof_path: mediaUrl,
        status: 'confirmed'
      });

      return {
        message: 'Comprobante de pago procesado exitosamente',
        orderId: order._id,
        status: 'confirmed'
      };
    }

    return {
      message: 'Comprobante de pago recibido, pero no hay pedidos pendientes',
      phone,
      branchId
    };

  } catch (error) {
    console.error('Error procesando comprobante de pago:', error);
    throw error;
  }
}

// Función para procesar texto de pedidos
async function processOrderText(phone, text, branchId) {
  try {
    // Aquí se implementaría la lógica de NLP para interpretar el pedido
    // Por ahora, creamos un pedido básico
    
    console.log(`📝 Procesando pedido de texto: ${text}`);
    
    // Extraer información básica del pedido
    const customerName = extractCustomerName(text);
    const items = extractItems(text);
    const totalAmount = calculateTotal(items);
    
    if (items.length === 0) {
      return {
        message: 'No se pudo interpretar el pedido. Por favor, especifica los productos claramente.',
        phone,
        branchId
      };
    }

    // Crear el pedido
    const newOrder = await Order.create({
      branch_id: branchId,
      customer_name: customerName || 'Cliente WhatsApp',
      customer_phone: phone,
      items: JSON.stringify(items),
      total_amount: totalAmount,
      status: 'pending',
      notes: `Pedido recibido por WhatsApp: ${text}`
    });

    return {
      message: 'Pedido creado exitosamente',
      order: newOrder,
      response: `✅ Pedido recibido!\n\nCliente: ${newOrder.customer_name}\nTotal: $${newOrder.total_amount}\nEstado: Pendiente de confirmación\n\nTe notificaremos cuando esté listo.`
    };

  } catch (error) {
    console.error('Error procesando pedido de texto:', error);
    throw error;
  }
}

// Funciones auxiliares para procesar texto (simplificadas)
function extractCustomerName(text) {
  // Buscar patrones como "Soy [nombre]" o "Mi nombre es [nombre]"
  const nameMatch = text.match(/(?:soy|mi nombre es|me llamo)\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i);
  return nameMatch ? nameMatch[1].trim() : null;
}

function extractItems(text) {
  // Lista simplificada de productos para demo
  const products = [
    { name: 'hamburguesa', price: 15.00 },
    { name: 'pizza', price: 20.00 },
    { name: 'ensalada', price: 12.00 },
    { name: 'bebida', price: 5.00 },
    { name: 'papas fritas', price: 8.00 }
  ];

  const items = [];
  const textLower = text.toLowerCase();

  products.forEach(product => {
    if (textLower.includes(product.name)) {
      // Buscar cantidad
      const quantityMatch = textLower.match(new RegExp(`(\\d+)\\s*${product.name}`, 'i'));
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
      
      items.push({
        name: product.name,
        price: product.price,
        quantity: quantity,
        subtotal: product.price * quantity
      });
    }
  });

  return items;
}

function calculateTotal(items) {
  return items.reduce((total, item) => total + item.subtotal, 0);
}

// Ruta para probar el webhook
router.get('/test', (req, res) => {
  res.json({
    message: 'Webhook de WhatsApp funcionando',
    endpoints: {
      webhook: 'POST /webhook - Recibir mensajes',
      test: 'GET /test - Probar conexión'
    }
  });
});

module.exports = router;
