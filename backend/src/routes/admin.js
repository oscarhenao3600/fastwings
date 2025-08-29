
const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, requireRole } = require('../middlewares/auth');
const bcrypt = require('bcryptjs'); // Added missing import for bcrypt

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
    const branches = await db('branches')
      .select('*')
      .orderBy('name');
    
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

      const [branchId] = await db('branches').insert(branchData);
      const newBranch = await db('branches').where('id', branchId).first();

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

      await db('branches').where('id', id).update(updateData);
      const updatedBranch = await db('branches').where('id', id).first();

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
    const usersCount = await db('users').where('branch_id', id).count('* as count').first();
    if (usersCount.count > 0) {
      return res.status(400).json({ error: 'No se puede eliminar una sucursal con usuarios asociados' });
    }

    await db('branches').where('id', id).del();
    
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
    let query = db('users')
      .leftJoin('branches', 'users.branch_id', 'branches.id')
      .select('users.id', 'users.email', 'users.name', 'users.role', 'users.is_active', 'users.created_at', 'branches.name as branch_name');

    if (req.user.role === 'admin') {
      query = query.where('users.branch_id', req.user.branch_id);
    }

    const users = await query.orderBy('users.name');
    
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
    body('branch_id').isInt().toInt()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name, role, branch_id } = req.body;

      // Verificar que la sucursal existe
      const branch = await db('branches').where('id', branch_id).first();
      if (!branch) {
        return res.status(400).json({ error: 'Sucursal no encontrada' });
      }

      // Verificar que el email no esté en uso
      const existingUser = await db('users').where('email', email).first();
      if (existingUser) {
        return res.status(400).json({ error: 'El email ya está en uso' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      
      const [userId] = await db('users').insert({
        email,
        password: hashedPassword,
        name,
        role,
        branch_id
      });

      const newUser = await db('users')
        .leftJoin('branches', 'users.branch_id', 'branches.id')
        .where('users.id', userId)
        .select('users.id', 'users.email', 'users.name', 'users.role', 'users.branch_id', 'branches.name as branch_name')
        .first();

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
    const [totalBranches] = await db('branches').count('* as count');
    const [totalUsers] = await db('users').count('* as count');
    const [totalOrders] = await db('orders').count('* as count');
    
    const recentOrders = await db('orders')
      .leftJoin('branches', 'orders.branch_id', 'branches.id')
      .select('orders.*', 'branches.name as branch_name')
      .orderBy('orders.created_at', 'desc')
      .limit(10);

    res.json({
      stats: {
        totalBranches: totalBranches.count,
        totalUsers: totalUsers.count,
        totalOrders: totalOrders.count
      },
      recentOrders
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
