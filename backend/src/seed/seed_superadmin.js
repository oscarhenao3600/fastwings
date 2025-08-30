require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Branch = require('../models/Branch');
const User = require('../models/User');
const Order = require('../models/Order');

async function seedSuperAdmin() {
  try {
    console.log('🌱 Iniciando seed de super admin...');

    // Conectar a MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fastwings';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Verificar si ya existe un super admin
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });

    if (existingSuperAdmin) {
      console.log('✅ Super admin ya existe, saltando seed...');
      return;
    }

    // Crear sucursal principal
    console.log('🏪 Creando sucursal principal...');
    const branch = await Branch.create({
      name: 'Sucursal Principal',
      address: 'Calle Principal #123, Bogotá, Colombia',
      phone: '+57 1 234 5678',
      order_number: '+573001234567', // Número de WhatsApp para pedidos
      system_number: '+573001234567@c.us', // Número del sistema
      is_active: true
    });

    console.log(`✅ Sucursal creada con ID: ${branch._id}`);

    // Crear super admin
    console.log('👑 Creando super admin...');
    const hashedPassword = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD || 'admin123', 12);
    
    const user = await User.create({
      email: process.env.SUPER_ADMIN_EMAIL || 'admin@fastwings.com',
      password: hashedPassword,
      name: process.env.SUPER_ADMIN_NAME || 'Administrador Principal',
      role: 'super_admin',
      branch_id: branch._id,
      is_active: true
    });

    console.log(`✅ Super admin creado con ID: ${user._id}`);

    // Crear algunos pedidos de ejemplo
    console.log('📝 Creando pedidos de ejemplo...');
    
    const sampleOrders = [
      {
        branch_id: branch._id,
        customer_name: 'Juan Pérez',
        customer_phone: '+573001234567',
        items: JSON.stringify([
          { name: 'Hamburguesa Clásica', price: 15.00, quantity: 2, subtotal: 30.00 },
          { name: 'Papas Fritas', price: 8.00, quantity: 1, subtotal: 8.00 },
          { name: 'Bebida', price: 5.00, quantity: 2, subtotal: 10.00 }
        ]),
        total_amount: 48.00,
        status: 'confirmed',
        notes: 'Pedido de ejemplo para demostración'
      },
      {
        branch_id: branch._id,
        customer_name: 'María García',
        customer_phone: '+573001234568',
        items: JSON.stringify([
          { name: 'Pizza Margherita', price: 20.00, quantity: 1, subtotal: 20.00 },
          { name: 'Ensalada César', price: 12.00, quantity: 1, subtotal: 12.00 }
        ]),
        total_amount: 32.00,
        status: 'preparing',
        notes: 'Sin cebolla en la pizza'
      }
    ];

    for (const orderData of sampleOrders) {
      const order = await Order.create(orderData);
      console.log(`✅ Pedido de ejemplo creado con ID: ${order._id}`);
    }

    console.log('🎉 Seed completado exitosamente!');
    console.log('\n📋 Información de acceso:');
    console.log(`   Email: ${process.env.SUPER_ADMIN_EMAIL || 'admin@fastwings.com'}`);
    console.log(`   Password: ${process.env.SUPER_ADMIN_PASSWORD || 'admin123'}`);
    console.log(`   URL: http://localhost:4000`);

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

// Ejecutar el seed
seedSuperAdmin();
