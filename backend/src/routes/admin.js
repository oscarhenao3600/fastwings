
const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const Branch = require('../models/Branch');
const User = require('../models/User');
const Order = require('../models/Order');
const { auth, requireRole } = require('../middlewares/auth');
const bcrypt = require('bcryptjs');

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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  }
});

// Middleware de autenticación para todas las rutas
router.use(auth);

// ===== GESTIÓN DE SUCURSALES =====

// Listar todas las sucursales (Super Admin y Admin)
router.get('/branches', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const branches = await Branch.find().sort('name');
    
    res.json({ branches });
  } catch (error) {
    console.error('Error listando sucursales:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nueva sucursal (Solo Super Admin)
router.post('/branches', 
  requireRole(['super_admin']),
  upload.single('logo'),
  [
    body('name').trim().isLength({ min: 2, max: 100 }),
    body('address').optional().trim(),
    body('phone').optional().trim(),
    body('order_number').optional().trim(),
    body('system_number').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, address, phone, order_number, system_number } = req.body;
      
      const branchData = {
        name,
        address,
        phone,
        order_number,
        system_number
      };

      if (req.file) {
        branchData.logo_path = `/uploads/${req.file.filename}`;
      }

      const newBranch = await Branch.create(branchData);

      res.status(201).json({
        message: 'Sucursal creada exitosamente',
        branch: newBranch
      });

    } catch (error) {
      console.error('Error creando sucursal:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// Actualizar sucursal (Solo Super Admin)
router.put('/branches/:id', 
  requireRole(['super_admin']),
  upload.single('logo'),
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('address').optional().trim(),
    body('phone').optional().trim(),
    body('order_number').optional().trim(),
    body('system_number').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const updateData = req.body;

      if (req.file) {
        updateData.logo_path = `/uploads/${req.file.filename}`;
      }

      const updatedBranch = await Branch.findByIdAndUpdate(id, updateData, { new: true });

      if (!updatedBranch) {
        return res.status(404).json({ error: 'Sucursal no encontrada' });
      }

      res.json({
        message: 'Sucursal actualizada exitosamente',
        branch: updatedBranch
      });

    } catch (error) {
      console.error('Error actualizando sucursal:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// Eliminar sucursal (Solo Super Admin)
router.delete('/branches/:id', requireRole(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que no haya usuarios asociados
    const usersCount = await User.countDocuments({ branch_id: id });
    if (usersCount > 0) {
      return res.status(400).json({ error: 'No se puede eliminar una sucursal con usuarios asociados' });
    }

    const deletedBranch = await Branch.findByIdAndDelete(id);
    
    if (!deletedBranch) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    res.json({ message: 'Sucursal eliminada exitosamente' });

  } catch (error) {
    console.error('Error eliminando sucursal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== GESTIÓN DE USUARIOS =====

// Listar usuarios (Super Admin ve todos, Admin ve solo su sucursal)
router.get('/users', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    let query = User.find().populate('branch_id', 'name');

    if (req.user.role === 'admin') {
      query = query.where('branch_id', req.user.branch_id);
    }

    const users = await query.sort('name');
    
    res.json({ users });
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear usuario (Solo Super Admin)
router.post('/users', 
  requireRole(['super_admin']),
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().isLength({ min: 2, max: 100 }),
    body('role').isIn(['admin', 'branch_user']),
    body('branch_id').isMongoId()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name, role, branch_id } = req.body;

      // Verificar que la sucursal existe
      const branch = await Branch.findById(branch_id);
      if (!branch) {
        return res.status(400).json({ error: 'Sucursal no encontrada' });
      }

      // Verificar que el email no esté en uso
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'El email ya está en uso' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      
      const newUser = await User.create({
        email,
        password: hashedPassword,
        name,
        role,
        branch_id
      });

      // Populate branch info for response
      await newUser.populate('branch_id', 'name');

      res.status(201).json({
        message: 'Usuario creado exitosamente',
        user: newUser
      });

    } catch (error) {
      console.error('Error creando usuario:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// Dashboard stats para Super Admin
router.get('/dashboard/stats', requireRole(['super_admin']), async (req, res) => {
  try {
    const totalBranches = await Branch.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    
    const recentOrders = await Order.find()
      .populate('branch_id', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      stats: {
        totalBranches,
        totalUsers,
        totalOrders
      },
      recentOrders
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
