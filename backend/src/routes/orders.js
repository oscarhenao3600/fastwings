
const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Branch = require('../models/Branch');
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
    body('branch_id').isMongoId(),
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
      const branch = await Branch.findOne({ _id: branch_id, is_active: true });
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

      const newOrder = await Order.create(orderData);
      await newOrder.populate('branch_id', 'name');

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
    let filter = {};

    // Filtrar por sucursal según el rol del usuario
    if (req.user.role === 'branch_user' || req.user.role === 'admin') {
      filter.branch_id = req.user.branch_id;
    }

    // Filtros opcionales
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.branch_id && req.user.role === 'super_admin') {
      filter.branch_id = req.query.branch_id;
    }

    const orders = await Order.find(filter)
      .populate('branch_id', 'name')
      .sort({ createdAt: -1 });
    
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
    
    let filter = { _id: id };

    // Filtrar por sucursal según el rol del usuario
    if (req.user.role === 'branch_user' || req.user.role === 'admin') {
      filter.branch_id = req.user.branch_id;
    }

    const order = await Order.findOne(filter).populate('branch_id', 'name');
    
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

      let filter = { _id: id };
      
      // Filtrar por sucursal según el rol del usuario
      if (req.user.role === 'branch_user' || req.user.role === 'admin') {
        filter.branch_id = req.user.branch_id;
      }

      const order = await Order.findOneAndUpdate(
        filter,
        { status },
        { new: true }
      ).populate('branch_id', 'name');

      if (!order) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      res.json({
        message: 'Estado del pedido actualizado exitosamente',
        order
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

      let filter = { _id: id };
      
      // Filtrar por sucursal según el rol del usuario
      if (req.user.role === 'branch_user' || req.user.role === 'admin') {
        filter.branch_id = req.user.branch_id;
      }

      const order = await Order.findOneAndUpdate(
        filter,
        { notes },
        { new: true }
      ).populate('branch_id', 'name');

      if (!order) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      res.json({
        message: 'Notas del pedido actualizadas exitosamente',
        order
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
    let filter = {};
    
    // Filtrar por sucursal según el rol del usuario
    if (req.user.role === 'branch_user' || req.user.role === 'admin') {
      filter.branch_id = req.user.branch_id;
    }

    const totalOrders = await Order.countDocuments(filter);
    const pendingOrders = await Order.countDocuments({ ...filter, status: 'pending' });
    const confirmedOrders = await Order.countDocuments({ ...filter, status: 'confirmed' });
    const preparingOrders = await Order.countDocuments({ ...filter, status: 'preparing' });
    const readyOrders = await Order.countDocuments({ ...filter, status: 'ready' });
    const deliveredOrders = await Order.countDocuments({ ...filter, status: 'delivered' });

    const totalRevenueResult = await Order.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$total_amount' } } }
    ]);

    res.json({
      stats: {
        totalOrders,
        pendingOrders,
        confirmedOrders,
        preparingOrders,
        readyOrders,
        deliveredOrders,
        totalRevenue: totalRevenueResult.length > 0 ? totalRevenueResult[0].total || 0 : 0
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de pedidos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
