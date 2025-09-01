
/* Integración ejemplo con whatsapp-web.js (env: WHATSAPP_PROVIDER=whatsapp-web.js)
Install: npm install whatsapp-web.js qrcode
Notes: MessageMedia requires media to be accessible on disk; LocalAuth persists session in .wwebjs_auth
*/
const qrcode = require('qrcode');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const path = require('path');

class WhatsAppWebJsProvider {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.qrDataUrl = null;
  }

  async initialize() {
    try {
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'fastwings-whatsapp',
          dataPath: '.wwebjs_auth'
        }),
        puppeteer: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      });

      this.client.on('qr', async (qr) => {
        console.log('🔐 QR Code generado para WhatsApp Web');
        try {
          this.qrDataUrl = await qrcode.toDataURL(qr);
        } catch (error) {
          console.error('Error generando QR como imagen:', error);
        }
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        this.qrDataUrl = null;
        console.log('✅ WhatsApp Web conectado exitosamente');
      });

      this.client.on('auth_failure', (msg) => {
        console.error('❌ Error de autenticación WhatsApp:', msg);
      });

      await this.client.initialize();
      return true;
    } catch (error) {
      console.error('Error inicializando WhatsApp Web:', error);
      throw error;
    }
  }

  async sendMessage(to, message) {
    try {
      if (!this.isConnected) {
        throw new Error('WhatsApp no está conectado');
      }

      const chatId = to.includes('@') ? to : `${to}@c.us`;
      await this.client.sendMessage(chatId, message);
      return true;
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      throw error;
    }
  }

  async sendMedia(to, filePath, caption) {
    try {
      if (!this.isConnected) {
        throw new Error('WhatsApp no está conectado');
      }

      const chatId = to.includes('@') ? to : `${to}@c.us`;
      const absPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
      const media = MessageMedia.fromFilePath(absPath);
      await this.client.sendMessage(chatId, media, { caption: caption || '' });
      return true;
    } catch (error) {
      console.error('Error enviando media:', error);
      throw error;
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      qrDataUrl: this.qrDataUrl
    };
  }
}

// Crear instancia singleton
const whatsappWebJsProvider = new WhatsAppWebJsProvider();

module.exports = whatsappWebJsProvider;
