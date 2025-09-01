const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BranchSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  // Números de WhatsApp
  systemNumber: {
    type: String,
    trim: true,
    description: 'Número que atiende clientes'
  },
  ordersForwardNumber: {
    type: String,
    trim: true,
    description: 'Número receptor de pedidos (cocina)'
  },
  // Configuración WhatsApp
  whatsapp: {
    provider: { 
      type: String, 
      default: 'whatsapp-web.js',
      enum: ['whatsapp-web.js', 'twilio']
    },
    sessionId: { 
      type: String,
      description: 'branch_<branchId> (solo informativo)'
    },
    status: { 
      type: String, 
      default: 'not_initialized',
      enum: ['not_initialized', 'init', 'qr', 'ready', 'disconnected', 'auth_failure', 'destroyed']
    },
    lastReadyAt: { 
      type: Date 
    },
    phone_number: { 
      type: String, 
      trim: true 
    },
    is_connected: { 
      type: Boolean, 
      default: false 
    },
    session_path: { 
      type: String, 
      default: null 
    },
    qr_code: { 
      type: String 
    }
  },
  // Facturación del servicio
  serviceFee: { 
    type: Number, 
    default: 0.05,
    min: 0,
    max: 1
  },
  billingActive: { 
    type: Boolean, 
    default: true 
  },
  // Control administrativo
  isActive: { 
    type: Boolean, 
    default: true 
  },
  // Configuración de menú
  menu: {
    items: [{
      name: { type: String, required: true },
      description: String,
      price: { type: Number, required: true, min: 0 },
      category: String,
      isAvailable: { type: Boolean, default: true }
    }],
    combos: [{
      name: { type: String, required: true },
      description: String,
      items: [{
        itemId: { type: Schema.Types.ObjectId, ref: 'MenuItem' },
        quantity: { type: Number, default: 1 }
      }],
      price: { type: Number, required: true, min: 0 },
      isAvailable: { type: Boolean, default: true }
    }]
  }
}, { 
  timestamps: true 
});

// Métodos del modelo
BranchSchema.methods.updateWhatsAppStatus = function(status, lastReadyAt = null) {
  this.whatsapp.status = status;
  if (lastReadyAt) {
    this.whatsapp.lastReadyAt = lastReadyAt;
  }
  this.whatsapp.is_connected = status === 'ready';
  return this.save();
};

BranchSchema.methods.getMenuItems = function() {
  return this.menu.items.filter(item => item.isAvailable);
};

BranchSchema.methods.getCombos = function() {
  return this.menu.combos.filter(combo => combo.isAvailable);
};

module.exports = mongoose.model('Branch', BranchSchema);
