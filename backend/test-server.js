const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Servidor de prueba funcionando' });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de prueba ejecutándose en puerto ${PORT}`);
});
