const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./config/db');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos de uploads de forma segura si se requiere
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas de API
app.use('/api', apiRoutes);

// Ruta de comprobación de salud del servidor
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Eco Envase Stock API',
    timestamp: new Date().toISOString(),
  });
});

// Inicializar DB e iniciar servidor
async function startServer() {
  await db.initDB();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor de Eco Envase corriendo en el puerto ${PORT}`);
    console.log(`📡 URL API: http://localhost:${PORT}/api`);
  });
}

startServer();
