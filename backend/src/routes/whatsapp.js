const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const WhatsAppConfig = require('../models/WhatsAppConfig');
const { auth, requireRole } = require('../middlewares/auth');

// ===== CONFIGURACIÓN DE WHATSAPP =====

// Obtener configuración actual
router.get('/config', auth, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const config = await WhatsAppConfig.findOne().sort({ createdAt: -1 });
    
    if (!config) {
      return res.status(404).json({ error: 'Configuración de WhatsApp no encontrada' });
    }

    res.json({ config });
  } catch (error) {
    console.error('Error obteniendo configuración de WhatsApp:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar configuración
router.put('/config', auth, requireRole(['super_admin']), async (req, res) => {
  try {
    const updateData = req.body;
    
    let config = await WhatsAppConfig.findOne().sort({ createdAt: -1 });
    
    if (!config) {
      config = await WhatsAppConfig.create(updateData);
    } else {
      Object.assign(config, updateData);
      await config.save();
    }

    // Actualizar servicio
    await whatsappService.updateConfig(updateData);

    res.json({ 
      message: 'Configuración actualizada exitosamente',
      config 
    });
  } catch (error) {
    console.error('Error actualizando configuración de WhatsApp:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== ESTADO DE CONEXIÓN =====

// Obtener estado de conexión
router.get('/status', auth, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const status = whatsappService.getConnectionStatus();
    const stats = await whatsappService.getStats();
    
    res.json({
      status,
      stats
    });
  } catch (error) {
    console.error('Error obteniendo estado de WhatsApp:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Inicializar WhatsApp
router.post('/initialize', auth, requireRole(['super_admin']), async (req, res) => {
  try {
    const result = await whatsappService.initialize();
    
    if (result) {
      res.json({ message: 'WhatsApp inicializado exitosamente' });
    } else {
      res.status(400).json({ error: 'No se pudo inicializar WhatsApp' });
    }
  } catch (error) {
    console.error('Error inicializando WhatsApp:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Desconectar WhatsApp
router.post('/disconnect', auth, requireRole(['super_admin']), async (req, res) => {
  try {
    await whatsappService.disconnect();
    res.json({ message: 'WhatsApp desconectado exitosamente' });
  } catch (error) {
    console.error('Error desconectando WhatsApp:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Desvincular sesión de WhatsApp (logout completo)
router.post('/logout', auth, requireRole(['super_admin']), async (req, res) => {
  try {
    const result = await whatsappService.logout();
    
    if (result) {
      res.json({ message: 'Sesión de WhatsApp desvinculada exitosamente' });
    } else {
      res.status(400).json({ error: 'No se pudo desvincular la sesión' });
    }
  } catch (error) {
    console.error('Error desvinculando sesión de WhatsApp:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Reinicializar WhatsApp (útil después de desvincular)
router.post('/reinitialize', auth, requireRole(['super_admin']), async (req, res) => {
  try {
    const result = await whatsappService.reinitialize();
    
    if (result) {
      res.json({ message: 'WhatsApp reinicializado exitosamente' });
    } else {
      res.status(400).json({ error: 'No se pudo reinicializar WhatsApp' });
    }
  } catch (error) {
    console.error('Error reinicializando WhatsApp:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener QR Code como imagen
router.get('/qr', auth, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const status = whatsappService.getConnectionStatus();
    
    if (status.status === 'qr_ready' && status.qrDataUrl) {
      res.json({ 
        qrDataUrl: status.qrDataUrl,
        status: status.status
      });
    } else if (status.status === 'connected') {
      res.json({ 
        message: 'WhatsApp ya está conectado',
        status: status.status
      });
    } else {
      res.json({ 
        message: 'QR no disponible',
        status: status.status
      });
    }
  } catch (error) {
    console.error('Error obteniendo QR:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== ENVÍO DE MENSAJES =====

// Enviar mensaje
router.post('/send', auth, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({ error: 'Número de teléfono y mensaje son requeridos' });
    }

    const result = await whatsappService.sendMessage(to, message);
    
    res.json({ 
      message: 'Mensaje enviado exitosamente',
      result 
    });
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    res.status(500).json({ error: 'Error enviando mensaje' });
  }
});

// Enviar media
router.post('/send-media', auth, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { to, filePath, caption } = req.body;
    
    if (!to || !filePath) {
      return res.status(400).json({ error: 'Número de teléfono y ruta del archivo son requeridos' });
    }

    const result = await whatsappService.sendMedia(to, filePath, caption);
    
    res.json({ 
      message: 'Media enviada exitosamente',
      result 
    });
  } catch (error) {
    console.error('Error enviando media:', error);
    res.status(500).json({ error: 'Error enviando media' });
  }
});

// ===== ESTADÍSTICAS =====

// Obtener estadísticas
router.get('/stats', auth, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const stats = await whatsappService.getStats();
    res.json({ stats });
  } catch (error) {
    console.error('Error obteniendo estadísticas de WhatsApp:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Resetear estadísticas diarias
router.post('/stats/reset', auth, requireRole(['super_admin']), async (req, res) => {
  try {
    await whatsappService.resetDailyStats();
    res.json({ message: 'Estadísticas reseteadas exitosamente' });
  } catch (error) {
    console.error('Error reseteando estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== PRUEBAS =====

// Probar conexión
router.post('/test', auth, requireRole(['super_admin']), async (req, res) => {
  try {
    const { testNumber } = req.body;
    
    if (!testNumber) {
      return res.status(400).json({ error: 'Número de prueba requerido' });
    }

    const testMessage = '🧪 Este es un mensaje de prueba desde FastWings. Si recibes este mensaje, la conexión está funcionando correctamente.';
    
    const result = await whatsappService.sendMessage(testNumber, testMessage);
    
    res.json({ 
      message: 'Mensaje de prueba enviado exitosamente',
      result 
    });
  } catch (error) {
    console.error('Error en prueba de WhatsApp:', error);
    res.status(500).json({ error: 'Error en prueba de WhatsApp' });
  }
});

// ===== WEBHOOK PARA MENSAJES ENTRANTES =====

// Webhook para recibir mensajes (para Twilio o WhatsApp Business API)
router.post('/webhook', async (req, res) => {
  try {
    const { From, Body, MediaUrl0, MessageSid } = req.body;
    
    if (!From || !Body) {
      return res.status(400).json({ error: 'Datos de mensaje incompletos' });
    }

    // Simular mensaje entrante para procesamiento
    const mockMessage = {
      from: From,
      body: Body,
      hasMedia: !!MediaUrl0,
      type: MediaUrl0 ? 'image' : 'text'
    };

    await whatsappService.handleIncomingMessage(mockMessage);
    
    res.json({ message: 'Mensaje procesado exitosamente' });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
});

module.exports = router;

