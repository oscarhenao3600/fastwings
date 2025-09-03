
/* Integración ejemplo con whatsapp-web.js (env: WHATSAPP_PROVIDER=whatsapp-web.js)
Install: npm install whatsapp-web.js qrcode
Notes: MessageMedia requires media to be accessible on disk; LocalAuth persists session in .wwebjs_auth
*/
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');

const clients = new Map();              // branchId -> { client, status, qrDataUrl, lastReadyAt }
const defaultPptr = {
  headless: true,
  executablePath: process.env.CHROME_PATH || '/usr/bin/chromium-browser',
  args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--no-first-run','--no-zygote']
};

function getClientEntry(branchId) {
  let entry = clients.get(branchId);
  if (!entry) {
    const client = new Client({
      authStrategy: new LocalAuth({ clientId: `branch_${branchId}` }),
      puppeteer: defaultPptr
    });

    entry = { client, status: 'init', qrDataUrl: null, lastReadyAt: null };
    clients.set(branchId, entry);

    client.on('qr', async (qr) => {
      console.log(`🔐 QR generado para sucursal ${branchId}`);
      entry.status = 'qr';
      entry.qrDataUrl = await qrcode.toDataURL(qr, { margin: 1, scale: 6 });
    });

    client.on('ready', () => {
      console.log(`✅ WhatsApp conectado para sucursal ${branchId}`);
      entry.status = 'ready';
      entry.qrDataUrl = null;
      entry.lastReadyAt = new Date().toISOString();
    });

    client.on('disconnected', (reason) => {
      console.log(`📱 WhatsApp desconectado para sucursal ${branchId}: ${reason}`);
      entry.status = `disconnected:${reason || 'unknown'}`;
    });

    client.on('auth_failure', (msg) => {
      console.error(`❌ Error de autenticación para sucursal ${branchId}: ${msg}`);
      entry.status = `auth_failure:${msg || ''}`;
    });

    // Enrutamiento de mensajes entrantes por sucursal
    client.on('message', async (msg) => {
      try {
        // Importante: evita require cíclico arriba, impórtalo aquí
        const whatsappService = require('./whatsappService');
        await whatsappService.handleIncoming({
          branchId,
          from: msg.from,
          body: msg.body,
          hasMedia: msg.hasMedia,
          timestamp: msg.timestamp
        });
      } catch (e) {
        console.error(`[WA inbound][${branchId}]`, e);
      }
    });

    client.initialize().catch(e => {
      console.error(`❌ Error inicializando WhatsApp para sucursal ${branchId}:`, e);
      entry.status = `init_error:${e.message}`;
    });
  }
  return entry;
}

async function initialize(branchId) {
  const entry = getClientEntry(branchId);
  return { ok: true, status: entry.status };
}

async function getStatus(branchId) {
  const entry = clients.get(branchId);
  if (!entry) return { status: 'not_initialized' };
  return {
    status: entry.status,
    lastReadyAt: entry.lastReadyAt || null,
    hasQR: !!entry.qrDataUrl
  };
}

async function getQR(branchId) {
  const entry = clients.get(branchId);
  if (!entry || !entry.qrDataUrl) return { ok: false, message: 'QR no disponible' };
  return { ok: true, dataUrl: entry.qrDataUrl };
}

async function logout(branchId) {
  const entry = clients.get(branchId);
  if (!entry) return { ok: true };
  try {
    await entry.client.logout();
    clients.delete(branchId);
    console.log(`🔓 WhatsApp desvinculado para sucursal ${branchId}`);
    return { ok: true };
  } catch (e) {
    console.error(`❌ Error desvinculando WhatsApp para sucursal ${branchId}:`, e);
    return { ok: false, error: e.message };
  }
}

async function disconnect(branchId) {
  const entry = clients.get(branchId);
  if (!entry) return { ok: true };
  try {
    await entry.client.destroy();
    entry.status = 'destroyed';
    console.log(`📱 WhatsApp desconectado para sucursal ${branchId}`);
    return { ok: true };
  } catch (e) {
    console.error(`❌ Error desconectando WhatsApp para sucursal ${branchId}:`, e);
    return { ok: false, error: e.message };
  }
}

function ensureReady(branchId) {
  const entry = clients.get(branchId);
  if (!entry) throw new Error('WhatsApp no inicializado para la sucursal');
  if (entry.status !== 'ready') throw new Error(`WhatsApp no listo: ${entry.status}`);
  return entry.client;
}

async function sendMessage(branchId, to, message) {
  const client = ensureReady(branchId);
  const chatId = to.includes('@') ? to : `${to.replace(/\D/g, '')}@c.us`;
  console.log(`📤 Enviando mensaje desde sucursal ${branchId} a ${chatId}`);
  return client.sendMessage(chatId, message);
}

async function sendMedia(branchId, to, filePath, caption) {
  const client = ensureReady(branchId);
  const chatId = to.includes('@') ? to : `${to.replace(/\D/g, '')}@c.us`;
    const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    const media = MessageMedia.fromFilePath(abs);
  console.log(`📤 Enviando media desde sucursal ${branchId} a ${chatId}`);
  return client.sendMessage(chatId, media, { caption: caption || '' });
}

// Métricas y salud del pool
async function getHealth() {
  const health = [];
  for (const [branchId, entry] of clients.entries()) {
    health.push({
      branchId,
      status: entry.status,
      lastReadyAt: entry.lastReadyAt,
      hasQR: !!entry.qrDataUrl
    });
  }
  return health;
}

module.exports = {
  initialize, getStatus, getQR, logout, disconnect,
  sendMessage, sendMedia, getHealth,
  // para uso interno/diagnóstico
  _clients: clients
};
