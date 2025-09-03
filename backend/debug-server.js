// Servidor simplificado para diagnóstico
console.log('Iniciando servidor...');

const express = require('express');
console.log('Express cargado');

const cors = require('cors');
console.log('CORS cargado');

const path = require('path');
console.log('Path cargado');

const jwt = require('jsonwebtoken');
console.log('JWT cargado');

const multer = require('multer');
console.log('Multer cargado');

const fs = require('fs');
console.log('FS cargado');

const pdf = require('pdf-parse');
console.log('PDF-parse cargado');

const app = express();
console.log('App Express creado');

// Middlewares básicos
app.use(cors());
app.use(express.json());
console.log('Middlewares configurados');

// Ruta de prueba
app.get('/test', (req, res) => {
  console.log('Recibida petición GET /test');
  res.json({ 
    message: 'Servidor funcionando', 
    timestamp: new Date().toISOString() 
  });
});

// Puerto del servidor
const PORT = 4000;

console.log(`Intentando iniciar servidor en puerto ${PORT}...`);

app.listen(PORT, () => {
  console.log(`✅ Servidor ejecutándose en puerto ${PORT}`);
  console.log(`🌐 Prueba: http://localhost:${PORT}/test`);
});
