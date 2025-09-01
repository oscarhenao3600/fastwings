const provider = (process.env.WHATSAPP_PROVIDER || 'whatsapp-web.js').toLowerCase();
let impl;

if (provider === 'twilio') {
  impl = require('./twilioProvider'); // TODO: implementar sendMessage/sendMedia(branchId,...)
} else {
  impl = require('./whatsappWebJsProvider');
}

module.exports = impl;
