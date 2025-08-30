const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  branch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  customer_name: {
    type: String,
    required: true,
    trim: true
  },
  customer_phone: {
    type: String,
    required: true,
    trim: true
  },
  items: {
    type: String,
    required: true
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  payment_proof_path: {
    type: String
  },
  invoice_path: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
