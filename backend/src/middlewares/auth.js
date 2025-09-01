
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware de autenticación básica
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fake-secret');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar roles específicos
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Acceso denegado. No tienes permisos para realizar esta acción.' 
      });
    }

    next();
  };
};

// Middleware para verificar permisos de sucursal
const requireBranchAccess = (branchIdParam = 'branchId') => {
  return async (req, res, next) => {
    try {
      const branchId = req.params[branchIdParam];
      
      if (!req.user) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // Super admin tiene acceso a todas las sucursales
      if (req.user.role === 'super_admin') {
        return next();
      }

      // Admin puede acceder a sus sucursales asignadas
      if (req.user.role === 'admin') {
        if (req.user.branch_id && req.user.branch_id.toString() === branchId) {
          return next();
        }
      }

      // Usuario de sucursal solo puede acceder a su sucursal
      if (req.user.role === 'branch_user') {
        if (req.user.branch_id && req.user.branch_id.toString() === branchId) {
          return next();
        }
      }

      return res.status(403).json({ 
        error: 'Acceso denegado. No tienes permisos para acceder a esta sucursal.' 
      });

    } catch (error) {
      console.error('Error verificando acceso a sucursal:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
};

// Middleware para verificar si el usuario es propietario del recurso
const requireOwnership = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      
      if (!req.user) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // Super admin puede acceder a todo
      if (req.user.role === 'super_admin') {
        return next();
      }

      // Buscar el recurso
      const resource = await resourceModel.findById(resourceId);
      if (!resource) {
        return res.status(404).json({ error: 'Recurso no encontrado' });
      }

      // Verificar si el usuario es propietario
      if (resource.user_id && resource.user_id.toString() === req.user._id.toString()) {
        return next();
      }

      // Verificar si el recurso pertenece a la sucursal del usuario
      if (resource.branch_id && req.user.branch_id && 
          resource.branch_id.toString() === req.user.branch_id.toString()) {
        return next();
      }

      return res.status(403).json({ 
        error: 'Acceso denegado. No eres propietario de este recurso.' 
      });

    } catch (error) {
      console.error('Error verificando propiedad del recurso:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
};

// Middleware para logging de acciones
const logAction = (action) => {
  return (req, res, next) => {
    const logData = {
      action,
      user: req.user ? req.user._id : null,
      userRole: req.user ? req.user.role : null,
      method: req.method,
      path: req.path,
      ip: req.ip,
      timestamp: new Date().toISOString()
    };

    console.log(`🔍 [AUTH LOG] ${JSON.stringify(logData)}`);
    next();
  };
};

module.exports = {
  auth,
  requireRole,
  requireBranchAccess,
  requireOwnership,
  logAction
};
