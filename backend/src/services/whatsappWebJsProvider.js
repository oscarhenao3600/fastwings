
/* Integración ejemplo con whatsapp-web.js (env: WHATSAPP_PROVIDER=whatsapp-web.js)
Install: npm install whatsapp-web.js qrcode-terminal
Notes: MessageMedia requires media to be accessible on disk; LocalAuth persists session in .wwebjs_auth
*/
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const path = require('path');

const client = new Client({ authStrategy: new LocalAuth() });

client.on('qr', qr => { qrcode.generate(qr, {small:true}); console.log('QR generado. Escanéalo con tu teléfono.'); });
client.on('ready', () => console.log('WhatsApp client listo (whatsapp-web.js)'));
client.on('auth_failure', msg => console.error('Auth failure', msg));
client.initialize();

async function sendMessage(to, message){
  try{
    const chatId = to.includes('@') ? to : `${to}@c.us`;
    await client.sendMessage(chatId, message);
    return true;
  }catch(e){ console.error('WA send error', e); throw e; }
}

async function sendMedia(to, filePath, caption){
  try{
    const chatId = to.includes('@') ? to : `${to}@c.us`;
    const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    const media = MessageMedia.fromFilePath(abs);
    await client.sendMessage(chatId, media, { caption: caption || '' });
    return true;
  }catch(e){ console.error('WA sendMedia error', e); throw e; }
}

module.exports = { sendMessage, sendMedia };
