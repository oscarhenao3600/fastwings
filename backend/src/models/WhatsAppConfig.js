const mongoose = require('mongoose');

const whatsAppConfigSchema = new mongoose.Schema({
  // Configuración básica
  provider: {
    type: String,
    enum: ['whatsapp-web.js', 'twilio', 'stub'],
    default: 'whatsapp-web.js'
  },
  is_active: {
    type: Boolean,
    default: false
  },
  
  // Configuración de números
  primary_number: {
    type: String,
    trim: true,
    required: true
  },
  backup_numbers: [{
    type: String,
    trim: true
  }],
  
  // Configuración de mensajes
  welcome_message: {
    type: String,
    default: '¡Hola! Bienvenido a FastWings. ¿En qué podemos ayudarte?'
  },
  auto_reply_message: {
    type: String,
    default: 'Gracias por tu pedido. Lo procesaremos pronto.'
  },
  order_confirmation_message: {
    type: String,
    default: 'Tu pedido ha sido confirmado. Te notificaremos cuando esté listo.'
  },
  invoice_message: {
    type: String,
    default: 'Tu factura está lista. Gracias por tu compra!'
  },
  
  // Configuración de Twilio (si se usa)
  twilio_account_sid: {
    type: String,
    trim: true
  },
  twilio_auth_token: {
    type: String,
    trim: true
  },
  twilio_phone_number: {
    type: String,
    trim: true
  },
  
  // Configuración de WhatsApp Web.js
  webjs_session_path: {
    type: String,
    default: '.wwebjs_auth'
  },
  webjs_qr_timeout: {
    type: Number,
    default: 60000 // 60 segundos
  },
  
  // Configuración de webhook
  webhook_url: {
    type: String,
    trim: true
  },
  webhook_secret: {
    type: String,
    trim: true
  },
  
  // Configuración de horarios
  business_hours: {
    start: {
      type: String,
      default: '08:00'
    },
    end: {
      type: String,
      default: '20:00'
    },
    timezone: {
      type: String,
      default: 'America/Bogota'
    }
  },
  
  // Configuración de respuestas automáticas
  auto_replies: {
    enabled: {
      type: Boolean,
      default: true
    },
    outside_hours_message: {
      type: String,
      default: 'Estamos cerrados. Te atenderemos mañana de 8:00 AM a 8:00 PM.'
    },
    max_auto_replies_per_day: {
      type: Number,
      default: 100
    }
  },
  
  // Estadísticas
  stats: {
    messages_sent_today: {
      type: Number,
      default: 0
    },
    messages_received_today: {
      type: Number,
      default: 0
    },
    last_reset_date: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Método para resetear estadísticas diarias
whatsAppConfigSchema.methods.resetDailyStats = function() {
  this.stats.messages_sent_today = 0;
  this.stats.messages_received_today = 0;
  this.stats.last_reset_date = new Date();
  return this.save();
};

// Método para incrementar mensajes enviados
whatsAppConfigSchema.methods.incrementSentMessages = function() {
  this.stats.messages_sent_today += 1;
  return this.save();
};

// Método para incrementar mensajes recibidos
whatsAppConfigSchema.methods.incrementReceivedMessages = function() {
  this.stats.messages_received_today += 1;
  return this.save();
};

// Método para verificar si está en horario de atención
whatsAppConfigSchema.methods.isBusinessHours = function() {
  const now = new Date();
  const timezone = this.business_hours.timezone || 'America/Bogota';
  
  // Convertir hora actual a la zona horaria del negocio
  const currentTime = now.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const start = this.business_hours.start;
  const end = this.business_hours.end;
  
  return currentTime >= start && currentTime <= end;
};

module.exports = mongoose.model('WhatsAppConfig', whatsAppConfigSchema);

