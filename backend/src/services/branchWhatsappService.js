const Branch = require('../models/Branch');
const qrcode = require('qrcode');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

class BranchWhatsAppService {
  constructor() {
    this.clients = new Map(); // branchId -> client
  }

  // Inicializar WhatsApp para una sucursal específica
  async initializeBranchWhatsApp(branchId) {
    try {
      const branch = await Branch.findById(branchId);
      if (!branch) {
        throw new Error('Sucursal no encontrada');
      }

      // Si ya hay un cliente activo, lo desconectamos
      if (this.clients.has(branchId)) {
        await this.disconnectBranchWhatsApp(branchId);
      }

      // Crear directorio de sesión específico para la sucursal
      const sessionPath = path.join('.wwebjs_auth', `branch_${branchId}`);
      if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
      }

      // Crear cliente de WhatsApp
      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: `fastwings-branch-${branchId}`,
          dataPath: sessionPath
        }),
        puppeteer: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      });

      // Eventos del cliente
      client.on('qr', async (qr) => {
        console.log(`🔐 QR Code generado para sucursal ${branch.name}`);
        
        try {
          const qrDataUrl = await qrcode.toDataURL(qr);
          
          // Actualizar estado en la base de datos
          await Branch.findByIdAndUpdate(branchId, {
            'whatsapp.status': 'qr_ready',
            'whatsapp.qr_code': qrDataUrl,
            'whatsapp.is_connected': false
          });
        } catch (error) {
          console.error('Error generando QR como imagen:', error);
        }
      });

      client.on('ready', async () => {
        console.log(`✅ WhatsApp conectado para sucursal ${branch.name}`);
        
        // Actualizar estado en la base de datos
        await Branch.findByIdAndUpdate(branchId, {
          'whatsapp.status': 'connected',
          'whatsapp.is_connected': true,
          'whatsapp.last_connection': new Date(),
          'whatsapp.qr_code': null
        });
      });

      client.on('authenticated', () => {
        console.log(`🔐 WhatsApp autenticado para sucursal ${branch.name}`);
      });

      client.on('auth_failure', async (msg) => {
        console.error(`❌ Error de autenticación WhatsApp para sucursal ${branch.name}:`, msg);
        
        await Branch.findByIdAndUpdate(branchId, {
          'whatsapp.status': 'auth_failed',
          'whatsapp.is_connected': false
        });
      });

      client.on('disconnected', async (reason) => {
        console.log(`📱 WhatsApp desconectado para sucursal ${branch.name}:`, reason);
        
        await Branch.findByIdAndUpdate(branchId, {
          'whatsapp.status': 'disconnected',
          'whatsapp.is_connected': false
        });
        
        // Remover cliente del mapa
        this.clients.delete(branchId);
      });

      // Manejar mensajes entrantes
      client.on('message', async (message) => {
        await this.handleIncomingMessage(branchId, message);
      });

      // Inicializar cliente
      await client.initialize();
      
      // Guardar cliente en el mapa
      this.clients.set(branchId, client);
      
      // Actualizar estado inicial
      await Branch.findByIdAndUpdate(branchId, {
        'whatsapp.status': 'connecting',
        'whatsapp.session_path': sessionPath
      });

      return true;
    } catch (error) {
      console.error(`Error inicializando WhatsApp para sucursal ${branchId}:`, error);
      
      await Branch.findByIdAndUpdate(branchId, {
        'whatsapp.status': 'disconnected',
        'whatsapp.is_connected': false
      });
      
      throw error;
    }
  }

  // Desconectar WhatsApp de una sucursal
  async disconnectBranchWhatsApp(branchId) {
    try {
      const client = this.clients.get(branchId);
      if (client) {
        await client.destroy();
        this.clients.delete(branchId);
      }

      await Branch.findByIdAndUpdate(branchId, {
        'whatsapp.status': 'disconnected',
        'whatsapp.is_connected': false
      });

      console.log(`📱 WhatsApp desconectado para sucursal ${branchId}`);
      return true;
    } catch (error) {
      console.error(`Error desconectando WhatsApp para sucursal ${branchId}:`, error);
      throw error;
    }
  }

  // Desvincular sesión de WhatsApp de una sucursal
  async logoutBranchWhatsApp(branchId) {
    try {
      const client = this.clients.get(branchId);
      if (client) {
        await client.logout();
        await client.destroy();
        this.clients.delete(branchId);
      }

      // Eliminar archivos de sesión
      const branch = await Branch.findById(branchId);
      if (branch && branch.whatsapp.session_path) {
        if (fs.existsSync(branch.whatsapp.session_path)) {
          fs.rmSync(branch.whatsapp.session_path, { recursive: true, force: true });
        }
      }

      await Branch.findByIdAndUpdate(branchId, {
        'whatsapp.status': 'disconnected',
        'whatsapp.is_connected': false,
        'whatsapp.session_path': null,
        'whatsapp.qr_code': null
      });

      console.log(`🔓 Sesión de WhatsApp desvinculada para sucursal ${branchId}`);
      return true;
    } catch (error) {
      console.error(`Error desvinculando sesión de WhatsApp para sucursal ${branchId}:`, error);
      throw error;
    }
  }

  // Enviar mensaje desde una sucursal
  async sendMessageFromBranch(branchId, to, message) {
    try {
      const client = this.clients.get(branchId);
      if (!client) {
        throw new Error('WhatsApp no está conectado para esta sucursal');
      }

      const formattedNumber = this.formatPhoneNumber(to);
      const chatId = formattedNumber.includes('@') ? formattedNumber : `${formattedNumber}@c.us`;
      
      const result = await client.sendMessage(chatId, message);
      console.log(`📤 Mensaje enviado desde sucursal ${branchId} a ${formattedNumber}`);
      
      return result;
    } catch (error) {
      console.error(`Error enviando mensaje desde sucursal ${branchId}:`, error);
      throw error;
    }
  }

  // Enviar media desde una sucursal
  async sendMediaFromBranch(branchId, to, filePath, caption = '') {
    try {
      const client = this.clients.get(branchId);
      if (!client) {
        throw new Error('WhatsApp no está conectado para esta sucursal');
      }

      const formattedNumber = this.formatPhoneNumber(to);
      const chatId = formattedNumber.includes('@') ? formattedNumber : `${formattedNumber}@c.us`;
      
      const absPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
      const media = MessageMedia.fromFilePath(absPath);
      
      const result = await client.sendMessage(chatId, media, { caption });
      console.log(`📤 Media enviada desde sucursal ${branchId} a ${formattedNumber}`);
      
      return result;
    } catch (error) {
      console.error(`Error enviando media desde sucursal ${branchId}:`, error);
      throw error;
    }
  }

  // Obtener estado de WhatsApp de una sucursal
  async getBranchWhatsAppStatus(branchId) {
    try {
      const branch = await Branch.findById(branchId);
      if (!branch) {
        throw new Error('Sucursal no encontrada');
      }

      const client = this.clients.get(branchId);
      const isConnected = client ? true : false;

      return {
        branchId,
        branchName: branch.name,
        phoneNumber: branch.whatsapp.phone_number,
        status: branch.whatsapp.status,
        isConnected: isConnected || branch.whatsapp.is_connected,
        qrCode: branch.whatsapp.qr_code,
        lastConnection: branch.whatsapp.last_connection
      };
    } catch (error) {
      console.error(`Error obteniendo estado de WhatsApp para sucursal ${branchId}:`, error);
      throw error;
    }
  }

  // Manejar mensajes entrantes
  async handleIncomingMessage(branchId, message) {
    try {
      const from = message.from;
      const body = message.body;
      const hasMedia = message.hasMedia;

      console.log(`📥 Mensaje recibido en sucursal ${branchId} de ${from}: ${body}`);

      // Aquí puedes implementar la lógica específica para cada sucursal
      // Por ejemplo, procesar pedidos, responder automáticamente, etc.

    } catch (error) {
      console.error(`Error procesando mensaje entrante en sucursal ${branchId}:`, error);
    }
  }

  // Formatear número de teléfono
  formatPhoneNumber(phone) {
    let cleaned = phone.replace(/\D/g, '');
    
    if (!cleaned.startsWith('57') && cleaned.length === 10) {
      cleaned = '57' + cleaned;
    }
    
    return cleaned;
  }

  // Obtener todas las sucursales con estado de WhatsApp
  async getAllBranchesWhatsAppStatus() {
    try {
      const branches = await Branch.find({}, 'name whatsapp');
      return branches.map(branch => ({
        id: branch._id,
        name: branch.name,
        whatsapp: branch.whatsapp
      }));
    } catch (error) {
      console.error('Error obteniendo estado de WhatsApp de todas las sucursales:', error);
      throw error;
    }
  }
}

// Crear instancia singleton
const branchWhatsappService = new BranchWhatsAppService();

module.exports = branchWhatsappService;

