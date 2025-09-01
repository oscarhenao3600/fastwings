const express = require('express');
const router = express.Router();
const branchWhatsappService = require('../services/branchWhatsappService');
const Branch = require('../models/Branch');
const { auth, requireRole } = require('../middlewares/auth');

// ===== WHATSAPP POR SUCURSAL =====

// Obtener estado de WhatsApp de todas las sucursales
router.get('/branches/status', auth, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const branchesStatus = await branchWhatsappService.getAllBranchesWhatsAppStatus();
    res.json({ branches: branchesStatus });
  } catch (error) {
    console.error('Error obteniendo estado de WhatsApp de sucursales:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener estado de WhatsApp de una sucursal específica
router.get('/branch/:branchId/status', auth, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { branchId } = req.params;
    const status = await branchWhatsappService.getBranchWhatsAppStatus(branchId);
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

    // Actualizar número de teléfono de la sucursal
    if (phoneNumber) {
      await Branch.findByIdAndUpdate(branchId, {
        'whatsapp.phone_number': phoneNumber
      });
    }

    const result = await branchWhatsappService.initializeBranchWhatsApp(branchId);
    
    if (result) {
      res.json({ message: 'WhatsApp inicializado exitosamente para la sucursal' });
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
    await branchWhatsappService.disconnectBranchWhatsApp(branchId);
    res.json({ message: 'WhatsApp desconectado exitosamente de la sucursal' });
  } catch (error) {
    console.error('Error desconectando WhatsApp de sucursal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Desvincular sesión de WhatsApp de una sucursal
router.post('/branch/:branchId/logout', auth, requireRole(['super_admin']), async (req, res) => {
  try {
    const { branchId } = req.params;
    const result = await branchWhatsappService.logoutBranchWhatsApp(branchId);
    
    if (result) {
      res.json({ message: 'Sesión de WhatsApp desvinculada exitosamente de la sucursal' });
    } else {
      res.status(400).json({ error: 'No se pudo desvincular la sesión de WhatsApp de la sucursal' });
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
    const branch = await Branch.findById(branchId);
    
    if (!branch) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    if (branch.whatsapp.status === 'qr_ready' && branch.whatsapp.qr_code) {
      res.json({ 
        qrDataUrl: branch.whatsapp.qr_code,
        status: branch.whatsapp.status
      });
    } else if (branch.whatsapp.status === 'connected') {
      res.json({ 
        message: 'WhatsApp ya está conectado para esta sucursal',
        status: branch.whatsapp.status
      });
    } else {
      res.json({ 
        message: 'QR no disponible para esta sucursal',
        status: branch.whatsapp.status
      });
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
      return res.status(400).json({ error: 'Número de teléfono y mensaje son requeridos' });
    }

    const result = await branchWhatsappService.sendMessageFromBranch(branchId, to, message);
    
    res.json({ 
      message: 'Mensaje enviado exitosamente desde la sucursal',
      result 
    });
  } catch (error) {
    console.error('Error enviando mensaje desde sucursal:', error);
    res.status(500).json({ error: 'Error enviando mensaje' });
  }
});

// Enviar media desde una sucursal
router.post('/branch/:branchId/send-media', auth, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { branchId } = req.params;
    const { to, filePath, caption } = req.body;
    
    if (!to || !filePath) {
      return res.status(400).json({ error: 'Número de teléfono y ruta del archivo son requeridos' });
    }

    const result = await branchWhatsappService.sendMediaFromBranch(branchId, to, filePath, caption);
    
    res.json({ 
      message: 'Media enviada exitosamente desde la sucursal',
      result 
    });
  } catch (error) {
    console.error('Error enviando media desde sucursal:', error);
    res.status(500).json({ error: 'Error enviando media' });
  }
});

// Actualizar configuración de WhatsApp de una sucursal
router.put('/branch/:branchId/config', auth, requireRole(['super_admin']), async (req, res) => {
  try {
    const { branchId } = req.params;
    const { phoneNumber } = req.body;
    
    const updateData = {};
    if (phoneNumber) {
      updateData['whatsapp.phone_number'] = phoneNumber;
    }

    const branch = await Branch.findByIdAndUpdate(branchId, updateData, { new: true });
    
    res.json({ 
      message: 'Configuración de WhatsApp actualizada exitosamente',
      branch 
    });
  } catch (error) {
    console.error('Error actualizando configuración de WhatsApp de sucursal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;

