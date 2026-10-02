const express = require('express');
const cors = require('cors');
const fs = require('fs');
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

// Servir archivos estáticos de uploads de forma segura
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Rutas de API
app.use('/api', apiRoutes);

// Ruta de comprobación de salud del servidor y base de datos
app.get('/api/health', async (req, res) => {
  try {
    const dbTest = await db.query('SELECT 1 as ok, NOW() as server_time');
    res.json({
      status: 'ok',
      system: 'Eco Envase Stock API',
      database: 'connected',
      dbTime: dbTest.rows[0].server_time,
      timestamp: new Date().toISOString(),
    });
  } catch (dbErr) {
    res.status(500).json({
      status: 'error',
      system: 'Eco Envase Stock API',
      database: 'disconnected',
      error: dbErr.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Servir frontend React compilado en producción (client/dist)
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Inicializar DB e iniciar servidor
async function startServer() {
  await db.initDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor de Eco Envase corriendo en el puerto ${PORT}`);
    console.log(`📡 URL API: http://localhost:${PORT}/api`);
  });
}

startServer();
