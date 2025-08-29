
const providerName = process.env.WHATSAPP_PROVIDER || 'whatsapp-web.js';
let impl = null;
try{
  if(providerName === 'whatsapp-web.js'){
    impl = require('./whatsappWebJsProvider');
  }else if(providerName === 'twilio'){
    impl = require('./twilioProvider');
  }else{
    impl = { sendMessage: async (to,msg)=>{ console.log('[WA stub] ',to,msg); return true; }, sendMedia: async (to,src,caption)=>{ console.log('[WA stub media]',to,src,caption); return true; } };
  }
}catch(e){
  console.warn('WhatsApp provider load failed, using stub', e.message);
  impl = { sendMessage: async (to,msg)=>{ console.log('[WA stub] ',to,msg); return true; }, sendMedia: async (to,src,caption)=>{ console.log('[WA stub media]',to,src,caption); return true; } };
}
module.exports = impl;
