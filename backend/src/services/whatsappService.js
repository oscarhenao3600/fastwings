const whatsappProvider = require('./whatsappProvider');
const Branch = require('../models/Branch');
const Order = require('../models/Order');
const WhatsAppConfig = require('../models/WhatsAppConfig');

class WhatsAppService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('✅ WhatsApp Service inicializado correctamente');
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Error inicializando WhatsApp Service:', error);
      return false;
    }
  }

  // Manejar mensajes entrantes por sucursal
  async handleIncoming({ branchId, from, body, hasMedia, timestamp }) {
    try {
      console.log(`📥 Mensaje recibido en sucursal ${branchId} de ${from}: ${body}`);

      // Obtener configuración de la sucursal
      const branch = await Branch.findById(branchId);
      if (!branch) {
        console.error(`❌ Sucursal ${branchId} no encontrada`);
        return;
      }

      // Obtener configuración de WhatsApp
      let config = await WhatsAppConfig.findOne({ branch_id: branchId });
      if (!config) {
        config = new WhatsAppConfig({
          branch_id: branchId,
          auto_reply: true,
          auto_reply_message: '¡Hola! Gracias por contactarnos. En breve te atenderemos.',
          received_messages: 0,
          sent_messages: 0
        });
        await config.save();
      }

      // Incrementar contador de mensajes recibidos
      await config.incrementReceivedMessages();

      // Procesar el mensaje según el contenido
      const message = body.toLowerCase().trim();
      
      // Detectar si es un pedido
      if (this.isOrderMessage(message)) {
        await this.processOrder(branchId, from, body, config);
      } else if (this.isMenuRequest(message)) {
        await this.sendMenu(branchId, from, branch);
      } else if (this.isHelpRequest(message)) {
        await this.sendHelp(branchId, from);
      } else {
        // Respuesta automática
        if (config.auto_reply) {
          await this.sendAutoReply(branchId, from, config.auto_reply_message);
        }
      }

    } catch (error) {
      console.error(`Error procesando mensaje entrante en sucursal ${branchId}:`, error);
    }
  }

  // Detectar si el mensaje es un pedido
  isOrderMessage(message) {
    const orderKeywords = ['quiero', 'necesito', 'pedido', 'orden', 'comprar', 'llevar', 'delivery'];
    return orderKeywords.some(keyword => message.includes(keyword));
  }

  // Detectar si el mensaje solicita el menú
  isMenuRequest(message) {
    const menuKeywords = ['menú', 'carta', 'productos', 'qué tienen', 'precios'];
    return menuKeywords.some(keyword => message.includes(keyword));
  }

  // Detectar si el mensaje solicita ayuda
  isHelpRequest(message) {
    const helpKeywords = ['ayuda', 'ayudame', 'info', 'información', 'horarios'];
    return helpKeywords.some(keyword => message.includes(keyword));
  }

  // Procesar pedido
  async processOrder(branchId, from, body, config) {
    try {
      // Crear pedido en la base de datos
      const order = new Order({
        branch_id: branchId,
        customer_phone: from.replace('@c.us', ''),
        customer_name: 'Cliente WhatsApp',
        items: body,
        total_amount: 0, // Se calculará después
        status: 'pending',
        source: 'whatsapp'
      });

      await order.save();

      // Enviar confirmación al cliente
      const confirmationMessage = `✅ Pedido recibido #${order._id}\n\nGracias por tu pedido. Te contactaremos pronto para confirmar los detalles y el total.`;
      await this.sendMessage(branchId, from, confirmationMessage);

      // Enviar pedido al número de cocina si está configurado
      if (config.orders_forward_number) {
        const kitchenMessage = `🍽️ NUEVO PEDIDO #${order._id}\n\nCliente: ${from}\nPedido: ${body}\n\nRevisar y confirmar.`;
        await this.sendMessage(branchId, config.orders_forward_number, kitchenMessage);
      }

    } catch (error) {
      console.error('Error procesando pedido:', error);
      await this.sendMessage(branchId, from, '❌ Lo sentimos, hubo un error procesando tu pedido. Por favor, intenta de nuevo.');
    }
  }

  // Enviar menú de la sucursal
  async sendMenu(branchId, from, branch) {
    try {
      const menuItems = branch.getMenuItems();
      const combos = branch.getCombos();

      let menuMessage = `🍽️ *MENÚ ${branch.name.toUpperCase()}*\n\n`;

      if (menuItems.length > 0) {
        menuMessage += '*Platos Individuales:*\n';
        menuItems.forEach(item => {
          menuMessage += `• ${item.name} - $${item.price}\n`;
        });
        menuMessage += '\n';
      }

      if (combos.length > 0) {
        menuMessage += '*Combos:*\n';
        combos.forEach(combo => {
          menuMessage += `• ${combo.name} - $${combo.price}\n`;
        });
        menuMessage += '\n';
      }

      menuMessage += 'Para hacer un pedido, escribe: "Quiero [producto]" o "Necesito [producto]"';
      
      await this.sendMessage(branchId, from, menuMessage);
    } catch (error) {
      console.error('Error enviando menú:', error);
      await this.sendMessage(branchId, from, '❌ Error cargando el menú. Por favor, contacta directamente.');
    }
  }

  // Enviar información de ayuda
  async sendHelp(branchId, from) {
    const helpMessage = `ℹ️ *INFORMACIÓN Y AYUDAS*\n\n` +
      `• Escribe "menú" para ver nuestros productos\n` +
      `• Escribe "quiero [producto]" para hacer un pedido\n` +
      `• Escribe "ayuda" para ver esta información\n\n` +
      `📞 *Contacto:* ${branchId}\n` +
      `🕒 *Horarios:* Lunes a Domingo 8:00 AM - 10:00 PM\n` +
      `🚚 *Delivery:* Disponible en toda la ciudad`;

    await this.sendMessage(branchId, from, helpMessage);
  }

  // Enviar respuesta automática
  async sendAutoReply(branchId, from, message) {
    try {
      await this.sendMessage(branchId, from, message);
      
      // Incrementar contador de mensajes enviados
      const config = await WhatsAppConfig.findOne({ branch_id: branchId });
      if (config) {
        await config.incrementSentMessages();
      }
    } catch (error) {
      console.error('Error enviando respuesta automática:', error);
    }
  }

  // Enviar mensaje usando el provider
  async sendMessage(branchId, to, message) {
    try {
      if (!this.isInitialized) {
        throw new Error('WhatsApp Service no está inicializado');
      }

      const result = await whatsappProvider.sendMessage(branchId, to, message);
      console.log(`📤 Mensaje enviado desde sucursal ${branchId} a ${to}`);
      return result;
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      throw error;
    }
  }

  // Enviar media usando el provider
  async sendMedia(branchId, to, filePath, caption = '') {
    try {
      if (!this.isInitialized) {
        throw new Error('WhatsApp Service no está inicializado');
      }

      const result = await whatsappProvider.sendMedia(branchId, to, filePath, caption);
      console.log(`📤 Media enviado desde sucursal ${branchId} a ${to}`);
      return result;
    } catch (error) {
      console.error('Error enviando media:', error);
      throw error;
    }
  }

  // Enviar pedido a cocina
  async sendOrderToKitchen(branchId, order) {
    try {
      const branch = await Branch.findById(branchId);
      if (!branch || !branch.ordersForwardNumber) {
        console.log(`No hay número de cocina configurado para la sucursal ${branchId}`);
        return;
      }

      const kitchenMessage = `🍽️ *PEDIDO #${order._id}*\n\n` +
        `👤 Cliente: ${order.customer_name}\n` +
        `📱 Teléfono: ${order.customer_phone}\n` +
        `📋 Pedido: ${order.items}\n` +
        `💰 Total: $${order.total_amount}\n` +
        `📅 Fecha: ${new Date(order.created_at).toLocaleString('es-CO')}`;

      await this.sendMessage(branchId, branch.ordersForwardNumber, kitchenMessage);
    } catch (error) {
      console.error('Error enviando pedido a cocina:', error);
    }
  }

  // Obtener estado de conexión
  getConnectionStatus() {
    return {
      isInitialized: this.isInitialized,
      provider: process.env.WHATSAPP_PROVIDER || 'whatsapp-web.js'
    };
  }
}

// Crear instancia singleton
const whatsappService = new WhatsAppService();

module.exports = whatsappService;
