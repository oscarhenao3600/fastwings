const express = require('express');
const router = express.Router();
const whatsapp = require('../services/whatsappProvider');
const Branch = require('../models/Branch');
const { auth, requireRole } = require('../middlewares/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting para evitar spam
const whatsappLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: 'Demasiadas peticiones, intenta de nuevo más tarde'
});

// Aplicar rate limit a todas las rutas de WhatsApp
router.use(whatsappLimiter);

// ===== WHATSAPP POR SUCURSAL =====

// Obtener estado de WhatsApp de todas las sucursales
router.get('/branches/status', auth, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const branches = await Branch.find({}, 'name whatsapp');
    const branchesWithStatus = [];

    for (const branch of branches) {
      const status = await whatsapp.getStatus(branch._id.toString());
      branchesWithStatus.push({
        id: branch._id,
        name: branch.name,
        whatsapp: {
          ...branch.whatsapp.toObject(),
          ...status
        }
      });
    }

    res.json({ branches: branchesWithStatus });
  } catch (error) {
    console.error('Error obteniendo estado de WhatsApp de sucursales:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener estado de WhatsApp de una sucursal específica
router.get('/branch/:branchId/status', auth, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { branchId } = req.params;
    const status = await whatsapp.getStatus(branchId);
    res.json({ status });
  } catch (error) {
    console.error('Error obteniendo estado de WhatsApp de sucursal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Inicializar WhatsApp para una sucursal
router.post('/branch/:branchId/initialize', auth, requireRole(['super_admin']), async (req, res) => {
  try {
    const { branchId } = req.params;
    const { phoneNumber } = req.body;

    // Verificar que la sucursal existe
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    // Actualizar número de teléfono de la sucursal
    if (phoneNumber) {
      branch.whatsapp.phone_number = phoneNumber;
      branch.whatsapp.sessionId = `branch_${branchId}`;
      await branch.save();
    }

    // Inicializar WhatsApp
    const result = await whatsapp.initialize(branchId);
    
    if (result.ok) {
      res.json({ 
        message: 'WhatsApp inicializado exitosamente para la sucursal',
        status: result.status
      });
    } else {
      res.status(400).json({ error: 'No se pudo inicializar WhatsApp para la sucursal' });
    }
  } catch (error) {
    console.error('Error inicializando WhatsApp para sucursal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Desconectar WhatsApp de una sucursal
router.post('/branch/:branchId/disconnect', auth, requireRole(['super_admin']), async (req, res) => {
  try {
    const { branchId } = req.params;
    
    // Verificar que la sucursal existe
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    const result = await whatsapp.disconnect(branchId);
    
    if (result.ok) {
      // Actualizar estado en la base de datos
      await branch.updateWhatsAppStatus('disconnected');
      res.json({ message: 'WhatsApp desconectado exitosamente de la sucursal' });
    } else {
      res.status(400).json({ error: result.error || 'Error desconectando WhatsApp' });
    }
  } catch (error) {
    console.error('Error desconectando WhatsApp de sucursal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Desvincular sesión de WhatsApp de una sucursal
router.post('/branch/:branchId/logout', auth, requireRole(['super_admin']), async (req, res) => {
  try {
    const { branchId } = req.params;
    
    // Verificar que la sucursal existe
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    const result = await whatsapp.logout(branchId);
    
    if (result.ok) {
      // Actualizar estado en la base de datos
      await branch.updateWhatsAppStatus('not_initialized');
      branch.whatsapp.phone_number = null;
      branch.whatsapp.sessionId = null;
      branch.whatsapp.lastReadyAt = null;
      await branch.save();
      
      res.json({ message: 'Sesión de WhatsApp desvinculada exitosamente de la sucursal' });
    } else {
      res.status(400).json({ error: result.error || 'Error desvinculando WhatsApp' });
    }
  } catch (error) {
    console.error('Error desvinculando sesión de WhatsApp de sucursal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener QR de una sucursal
router.get('/branch/:branchId/qr', auth, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { branchId } = req.params;
    
    // Verificar que la sucursal existe
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    const result = await whatsapp.getQR(branchId);
    
    if (result.ok) {
      res.json({ 
        qrDataUrl: result.dataUrl,
        status: 'qr_ready'
      });
    } else {
      res.status(400).json({ error: result.message || 'QR no disponible' });
    }
  } catch (error) {
    console.error('Error obteniendo QR de sucursal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Enviar mensaje desde una sucursal
router.post('/branch/:branchId/send', auth, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { branchId } = req.params;
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: 'Número de destino y mensaje son requeridos' });
    }

    // Verificar que la sucursal existe
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    const result = await whatsapp.sendMessage(branchId, to, message);
    
    res.json({ 
      message: 'Mensaje enviado exitosamente',
      result
    });
  } catch (error) {
    console.error('Error enviando mensaje desde sucursal:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

// Enviar media desde una sucursal
router.post('/branch/:branchId/send-media', auth, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { branchId } = req.params;
    const { to, filePath, caption } = req.body;

    if (!to || !filePath) {
      return res.status(400).json({ error: 'Número de destino y ruta del archivo son requeridos' });
    }

    // Verificar que la sucursal existe
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    const result = await whatsapp.sendMedia(branchId, to, filePath, caption);
    
    res.json({ 
      message: 'Media enviado exitosamente',
      result
    });
  } catch (error) {
    console.error('Error enviando media desde sucursal:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

// Configurar sucursal (números de WhatsApp)
router.post('/branch/:branchId/config', auth, requireRole(['super_admin']), async (req, res) => {
  try {
    const { branchId } = req.params;
    const { systemNumber, ordersForwardNumber } = req.body;

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    if (systemNumber) {
      branch.systemNumber = systemNumber;
    }
    if (ordersForwardNumber) {
      branch.ordersForwardNumber = ordersForwardNumber;
    }

    await branch.save();
    
    res.json({ 
      message: 'Configuración de sucursal actualizada exitosamente',
      branch: {
        id: branch._id,
        name: branch.name,
        systemNumber: branch.systemNumber,
        ordersForwardNumber: branch.ordersForwardNumber
      }
    });
  } catch (error) {
    console.error('Error configurando sucursal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Métricas y salud del pool
router.get('/health', auth, requireRole(['super_admin']), async (req, res) => {
  try {
    const health = await whatsapp.getHealth();
    res.json({ 
      health,
      timestamp: new Date().toISOString(),
      totalBranches: health.length,
      connectedBranches: health.filter(h => h.status === 'ready').length
    });
  } catch (error) {
    console.error('Error obteniendo salud del pool:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;

