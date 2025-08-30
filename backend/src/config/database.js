const mongoose = require('mongoose');

// Conectar a MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fastwings';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB conectado exitosamente');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

// Manejar eventos de conexión
mongoose.connection.on('error', (err) => {
  console.error('Error de MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB desconectado');
});

// Manejar cierre graceful
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB desconectado por terminación de la aplicación');
  process.exit(0);
});

module.exports = { connectDB };
