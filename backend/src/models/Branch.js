const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
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
  logo_path: {
    type: String
  },
  order_number: {
    type: String,
    unique: true,
    trim: true
  },
  system_number: {
    type: String,
    trim: true
  },
  // Configuración de WhatsApp por sucursal
  whatsapp: {
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
    last_connection: {
      type: Date
    },
    qr_code: {
      type: String
    },
    status: {
      type: String,
      enum: ['disconnected', 'connecting', 'connected', 'qr_ready', 'auth_failed'],
      default: 'disconnected'
    }
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Branch', branchSchema);
