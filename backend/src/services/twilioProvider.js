
/* Ejemplo básico de proveedor Twilio (WhatsApp cloud). 
Requires Twilio credentials and public URL for media (or Twilio Media Storage).
This is a stub showing where to implement the real Twilio logic.
*/
module.exports = {
  sendMessage: async (to, message) => {
    console.log('[Twilio stub] Enviar a', to, message);
    return true;
  },
  sendMedia: async (to, mediaUrl, caption) => {
    console.log('[Twilio stub] Enviar media a', to, mediaUrl, caption);
    // With Twilio, you'd do something like:
    // client.messages.create({ from: 'whatsapp:+1415XXXXXXX', to: `whatsapp:${to}`, body: caption, mediaUrl: [mediaUrl] });
    return true;
  }
};
