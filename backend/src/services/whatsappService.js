const WhatsAppConfig = require('../models/WhatsAppConfig');
const whatsappProvider = require('./whatsappProvider');
const qrcode = require('qrcode');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.config = null;
    this.isConnected = false;
    this.qrCode = null;
    this.connectionStatus = 'disconnected';
    this.qrDataUrl = null;
  }

  // Inicializar el servicio
  async initialize() {
    try {
      // Cargar configuración
      await this.loadConfig();
      
      if (!this.config || !this.config.is_active) {
        console.log('WhatsApp no está activo en la configuración');
        return false;
      }

      // Inicializar cliente según el proveedor
      if (this.config.provider === 'whatsapp-web.js') {
        await this.initializeWhatsAppWeb();
      } else if (this.config.provider === 'twilio') {
        await this.initializeTwilio();
      } else {
        console.log('Usando proveedor stub para WhatsApp');
      }

      return true;
    } catch (error) {
      console.error('Error inicializando WhatsApp:', error);
      return false;
    }
  }

  // Cargar configuración desde la base de datos
  async loadConfig() {
    try {
      this.config = await WhatsAppConfig.findOne().sort({ createdAt: -1 });
      
      if (!this.config) {
        // Crear configuración por defecto
        this.config = await WhatsAppConfig.create({
          primary_number: process.env.WHATSAPP_PHONE || '+573001234567',
          provider: 'whatsapp-web.js',
          is_active: true
        });
      }

      return this.config;
    } catch (error) {
      console.error('Error cargando configuración de WhatsApp:', error);
      throw error;
    }
  }

  // Inicializar WhatsApp Web.js
  async initializeWhatsAppWeb() {
    try {
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'fastwings-whatsapp',
          dataPath: this.config.webjs_session_path || '.wwebjs_auth'
        }),
        puppeteer: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      });

      // Eventos del cliente
      this.client.on('qr', async (qr) => {
        this.qrCode = qr;
        this.connectionStatus = 'qr_ready';
        console.log('🔐 QR Code generado para WhatsApp Web');
        
        // Generar QR como imagen base64 para el frontend
        try {
          this.qrDataUrl = await qrcode.toDataURL(qr);
        } catch (error) {
          console.error('Error generando QR como imagen:', error);
        }
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        this.connectionStatus = 'connected';
        this.qrCode = null;
        this.qrDataUrl = null;
        console.log('✅ WhatsApp Web conectado exitosamente');
      });

      this.client.on('authenticated', () => {
        console.log('🔐 WhatsApp Web autenticado');
      });

      this.client.on('auth_failure', (msg) => {
        this.connectionStatus = 'auth_failed';
        console.error('❌ Error de autenticación WhatsApp:', msg);
      });

      this.client.on('disconnected', (reason) => {
        this.isConnected = false;
        this.connectionStatus = 'disconnected';
        console.log('📱 WhatsApp Web desconectado:', reason);
      });

      // Manejar mensajes entrantes
      this.client.on('message', async (message) => {
        await this.handleIncomingMessage(message);
      });

      // Inicializar cliente
      await this.client.initialize();
      
    } catch (error) {
      console.error('Error inicializando WhatsApp Web:', error);
      throw error;
    }
  }

  // Inicializar Twilio (placeholder)
  async initializeTwilio() {
    console.log('🔧 Configuración de Twilio cargada');
    // Aquí se implementaría la inicialización de Twilio
  }

  // Desvincular sesión de WhatsApp
  async logout() {
    try {
      if (this.client) {
        await this.client.logout();
        await this.client.destroy();
        this.isConnected = false;
        this.connectionStatus = 'disconnected';
        this.qrCode = null;
        this.qrDataUrl = null;
        
        // Eliminar archivos de sesión
        const sessionPath = this.config.webjs_session_path || '.wwebjs_auth';
        if (fs.existsSync(sessionPath)) {
          fs.rmSync(sessionPath, { recursive: true, force: true });
          console.log('🗑️ Archivos de sesión eliminados');
        }
        
        console.log('🔓 Sesión de WhatsApp desvinculada exitosamente');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error desvinculando sesión:', error);
      throw error;
    }
  }

  // Reinicializar WhatsApp (útil después de desvincular)
  async reinitialize() {
    try {
      await this.disconnect();
      await this.initialize();
      return true;
    } catch (error) {
      console.error('Error reinicializando WhatsApp:', error);
      throw error;
    }
  }

  // Manejar mensajes entrantes
  async handleIncomingMessage(message) {
    try {
      // Incrementar contador de mensajes recibidos
      await this.config.incrementReceivedMessages();

      const from = message.from;
      const body = message.body;
      const hasMedia = message.hasMedia;

      console.log(`📥 Mensaje recibido de ${from}: ${body}`);

      // Verificar si es un mensaje de pedido
      if (this.isOrderMessage(body)) {
        await this.processOrderMessage(from, body);
      } else if (hasMedia) {
        await this.processMediaMessage(message);
      } else {
        await this.sendAutoReply(from, body);
      }

    } catch (error) {
      console.error('Error procesando mensaje entrante:', error);
    }
  }

  // Verificar si un mensaje es un pedido
  isOrderMessage(body) {
    const orderKeywords = ['pedido', 'orden', 'comprar', 'quiero', 'necesito', 'hamburguesa', 'pizza', 'comida'];
    const lowerBody = body.toLowerCase();
    
    return orderKeywords.some(keyword => lowerBody.includes(keyword));
  }

  // Procesar mensaje de pedido
  async processOrderMessage(from, body) {
    try {
      // Verificar horario de atención
      if (!this.config.isBusinessHours()) {
        await this.sendMessage(from, this.config.auto_replies.outside_hours_message);
        return;
      }

      // Enviar confirmación automática
      await this.sendMessage(from, this.config.auto_reply_message);

      // Aquí se procesaría el pedido en el sistema
      console.log(`🛒 Procesando pedido de ${from}: ${body}`);

    } catch (error) {
      console.error('Error procesando pedido:', error);
    }
  }

  // Procesar mensaje con media
  async processMediaMessage(message) {
    try {
      const from = message.from;
      
      if (message.type === 'image' || message.type === 'document') {
        // Podría ser un comprobante de pago
        const replyMessage = 'Recibimos tu comprobante de pago. Lo verificaremos pronto.';
        
        // Enviar respuesta simple sin procesar la media
        if (this.config.provider === 'whatsapp-web.js' && this.client) {
          const formattedNumber = this.formatPhoneNumber(from);
          const chatId = formattedNumber.includes('@') ? formattedNumber : `${formattedNumber}@c.us`;
          await this.client.sendMessage(chatId, replyMessage);
        }
        
        console.log(`📎 Media recibida de ${from}: ${message.type}`);
      }

    } catch (error) {
      console.error('Error procesando media:', error);
      // No re-lanzar el error para evitar que se rompa el servicio
    }
  }

  // Enviar respuesta automática
  async sendAutoReply(to, originalMessage) {
    try {
      if (!this.config.auto_replies.enabled) return;

      // Verificar límite de respuestas automáticas
      if (this.config.stats.messages_sent_today >= this.config.auto_replies.max_auto_replies_per_day) {
        console.log('Límite de respuestas automáticas alcanzado');
        return;
      }

      const reply = this.config.welcome_message;
      await this.sendMessage(to, reply);

    } catch (error) {
      console.error('Error enviando respuesta automática:', error);
    }
  }

  // Enviar mensaje
  async sendMessage(to, message) {
    try {
      if (!this.isConnected && this.config.provider === 'whatsapp-web.js') {
        throw new Error('WhatsApp no está conectado');
      }

      // Formatear número de teléfono
      const formattedNumber = this.formatPhoneNumber(to);
      
      let result;
      
      if (this.config.provider === 'whatsapp-web.js' && this.client) {
        const chatId = formattedNumber.includes('@') ? formattedNumber : `${formattedNumber}@c.us`;
        result = await this.client.sendMessage(chatId, message);
      } else {
        // Usar proveedor genérico
        result = await whatsappProvider.sendMessage(formattedNumber, message);
      }

      // Incrementar contador de mensajes enviados
      await this.config.incrementSentMessages();

      console.log(`📤 Mensaje enviado a ${formattedNumber}: ${message}`);
      return result;

    } catch (error) {
      console.error('Error enviando mensaje:', error);
      throw error;
    }
  }

  // Enviar media
  async sendMedia(to, filePath, caption = '') {
    try {
      if (!this.isConnected && this.config.provider === 'whatsapp-web.js') {
        throw new Error('WhatsApp no está conectado');
      }

      const formattedNumber = this.formatPhoneNumber(to);
      
      let result;
      
      if (this.config.provider === 'whatsapp-web.js' && this.client) {
        const chatId = formattedNumber.includes('@') ? formattedNumber : `${formattedNumber}@c.us`;
        const absPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
        const media = MessageMedia.fromFilePath(absPath);
        result = await this.client.sendMessage(chatId, media, { caption });
      } else {
        result = await whatsappProvider.sendMedia(formattedNumber, filePath, caption);
      }

      // Incrementar contador de mensajes enviados
      await this.config.incrementSentMessages();

      console.log(`📤 Media enviada a ${formattedNumber}: ${filePath}`);
      return result;

    } catch (error) {
      console.error('Error enviando media:', error);
      throw error;
    }
  }

  // Formatear número de teléfono
  formatPhoneNumber(phone) {
    // Remover caracteres no numéricos
    let cleaned = phone.replace(/\D/g, '');
    
    // Agregar código de país si no tiene
    if (!cleaned.startsWith('57') && cleaned.length === 10) {
      cleaned = '57' + cleaned;
    }
    
    return cleaned;
  }

  // Obtener estado de conexión
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      status: this.connectionStatus,
      qrCode: this.qrCode,
      qrDataUrl: this.qrDataUrl,
      provider: this.config?.provider,
      primaryNumber: this.config?.primary_number
    };
  }

  // Obtener estadísticas
  async getStats() {
    if (!this.config) {
      await this.loadConfig();
    }
    
    return {
      messagesSentToday: this.config.stats.messages_sent_today,
      messagesReceivedToday: this.config.stats.messages_received_today,
      lastResetDate: this.config.stats.last_reset_date,
      isActive: this.config.is_active,
      provider: this.config.provider
    };
  }

  // Actualizar configuración
  async updateConfig(newConfig) {
    try {
      if (!this.config) {
        this.config = await WhatsAppConfig.create(newConfig);
      } else {
        Object.assign(this.config, newConfig);
        await this.config.save();
      }

      // Reinicializar si es necesario
      if (newConfig.provider !== this.config.provider || newConfig.is_active !== this.config.is_active) {
        await this.initialize();
      }

      return this.config;
    } catch (error) {
      console.error('Error actualizando configuración:', error);
      throw error;
    }
  }

  // Resetear estadísticas diarias
  async resetDailyStats() {
    if (this.config) {
      await this.config.resetDailyStats();
    }
  }

  // Cerrar conexión
  async disconnect() {
    if (this.client) {
      await this.client.destroy();
      this.isConnected = false;
      this.connectionStatus = 'disconnected';
    }
  }
}

// Crear instancia singleton
const whatsappService = new WhatsAppService();

module.exports = whatsappService;
