
const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, requireRole } = require('../middlewares/auth');

const router = express.Router();

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../uploads/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes y PDFs'));
    }
  }
});

// Middleware de autenticación para todas las rutas
router.use(auth);

// ===== GESTIÓN DE PEDIDOS =====

// Crear nuevo pedido (público, pero requiere validación)
router.post('/', 
  upload.single('payment_proof'),
  [
    body('customer_name').trim().isLength({ min: 2, max: 100 }),
    body('customer_phone').trim().isLength({ min: 10, max: 15 }),
    body('items').isJSON(),
    body('total_amount').isFloat({ min: 0 }),
    body('branch_id').isInt().toInt(),
    body('notes').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { customer_name, customer_phone, items, total_amount, branch_id, notes } = req.body;

      // Verificar que la sucursal existe y está activa
      const branch = await db('branches').where('id', branch_id).where('is_active', true).first();
      if (!branch) {
        return res.status(400).json({ error: 'Sucursal no válida' });
      }

      // Validar que items sea un JSON válido
      let parsedItems;
      try {
        parsedItems = JSON.parse(items);
        if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
          throw new Error('Items debe ser un array no vacío');
        }
      } catch (e) {
        return res.status(400).json({ error: 'Formato de items inválido' });
      }

      const orderData = {
        branch_id,
        customer_name,
        customer_phone,
        items: items, // Mantener como JSON string
        total_amount,
        notes,
        status: 'pending'
      };

      if (req.file) {
        orderData.payment_proof_path = `/uploads/${req.file.filename}`;
      }

      const [orderId] = await db('orders').insert(orderData);
      const newOrder = await db('orders')
        .leftJoin('branches', 'orders.branch_id', 'branches.id')
        .where('orders.id', orderId)
        .select('orders.*', 'branches.name as branch_name')
        .first();

      res.status(201).json({
        message: 'Pedido creado exitosamente',
        order: newOrder
      });

    } catch (error) {
      console.error('Error creando pedido:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// Listar pedidos (filtrado por rol)
router.get('/', async (req, res) => {
  try {
    let query = db('orders')
      .leftJoin('branches', 'orders.branch_id', 'branches.id')
      .select('orders.*', 'branches.name as branch_name');

    // Filtrar por sucursal según el rol del usuario
    if (req.user.role === 'branch_user' || req.user.role === 'admin') {
      query = query.where('orders.branch_id', req.user.branch_id);
    }

    // Filtros opcionales
    if (req.query.status) {
      query = query.where('orders.status', req.query.status);
    }
    if (req.query.branch_id && req.user.role === 'super_admin') {
      query = query.where('orders.branch_id', req.query.branch_id);
    }

    const orders = await query.orderBy('orders.created_at', 'desc');
    
    res.json({ orders });
  } catch (error) {
    console.error('Error listando pedidos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener pedido específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = db('orders')
      .leftJoin('branches', 'orders.branch_id', 'branches.id')
      .where('orders.id', id)
      .select('orders.*', 'branches.name as branch_name');

    // Filtrar por sucursal según el rol del usuario
    if (req.user.role === 'branch_user' || req.user.role === 'admin') {
      query = query.where('orders.branch_id', req.user.branch_id);
    }

    const order = await query.first();
    
    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar estado del pedido
router.patch('/:id/status', 
  requireRole(['admin', 'branch_user']),
  [
    body('status').isIn(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { status } = req.body;

      let query = db('orders').where('id', id);
      
      // Filtrar por sucursal según el rol del usuario
      if (req.user.role === 'branch_user' || req.user.role === 'admin') {
        query = query.where('branch_id', req.user.branch_id);
      }

      const order = await query.first();
      if (!order) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      await query.update({ status, updated_at: new Date() });

      res.json({
        message: 'Estado del pedido actualizado exitosamente',
        order: { ...order, status }
      });

    } catch (error) {
      console.error('Error actualizando estado del pedido:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// Agregar notas al pedido
router.patch('/:id/notes', 
  requireRole(['admin', 'branch_user']),
  [
    body('notes').trim().isLength({ min: 1, max: 500 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { notes } = req.body;

      let query = db('orders').where('id', id);
      
      // Filtrar por sucursal según el rol del usuario
      if (req.user.role === 'branch_user' || req.user.role === 'admin') {
        query = query.where('branch_id', req.user.branch_id);
      }

      const order = await query.first();
      if (!order) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      await query.update({ notes, updated_at: new Date() });

      res.json({
        message: 'Notas del pedido actualizadas exitosamente',
        order: { ...order, notes }
      });

    } catch (error) {
      console.error('Error actualizando notas del pedido:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// Dashboard stats para pedidos
router.get('/dashboard/stats', async (req, res) => {
  try {
    let baseQuery = db('orders');
    
    // Filtrar por sucursal según el rol del usuario
    if (req.user.role === 'branch_user' || req.user.role === 'admin') {
      baseQuery = baseQuery.where('branch_id', req.user.branch_id);
    }

    const [totalOrders] = await baseQuery.count('* as count');
    const [pendingOrders] = await baseQuery.where('status', 'pending').count('* as count');
    const [confirmedOrders] = await baseQuery.where('status', 'confirmed').count('* as count');
    const [preparingOrders] = await baseQuery.where('status', 'preparing').count('* as count');
    const [readyOrders] = await baseQuery.where('status', 'ready').count('* as count');
    const [deliveredOrders] = await baseQuery.where('status', 'delivered').count('* as count');

    const totalRevenue = await baseQuery.sum('total_amount as total').first();

    res.json({
      stats: {
        totalOrders: totalOrders.count,
        pendingOrders: pendingOrders.count,
        confirmedOrders: confirmedOrders.count,
        preparingOrders: preparingOrders.count,
        readyOrders: readyOrders.count,
        deliveredOrders: deliveredOrders.count,
        totalRevenue: totalRevenue.total || 0
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de pedidos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
