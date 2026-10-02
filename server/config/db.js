const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const isProduction = process.env.NODE_ENV === 'production';

// Detectar URL de base de datos desde múltiples variables de entorno posibles
const rawDbUrl = process.env.DATABASE_URL || 
                 process.env.POSTGRES_URL || 
                 process.env.SUPABASE_DATABASE_URL || 
                 process.env.DATABASE_URI ||
                 process.env.POSTGRESQL_URL;

const connectionString = rawDbUrl ? rawDbUrl.trim() : null;

const hasSsl = isProduction || 
  Boolean(connectionString) || 
  Boolean(process.env.PGHOST && process.env.PGHOST.includes('supabase')) ||
  process.env.PGSSL === 'true';

const poolConfig = connectionString
  ? {
      connectionString,
      ssl: hasSsl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 15000,
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'postgres',
      ssl: hasSsl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 15000,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('⚠️ Error inesperado en el cliente inactivo de PostgreSQL:', err.message);
});

async function initDB() {
  let client;
  try {
    if (connectionString) {
      // Mascarar contraseña en logs por seguridad
      const maskedUrl = connectionString.replace(/:([^:@]+)@/, ':****@');
      console.log(`🔌 Conectando a PostgreSQL remoto: ${maskedUrl}`);
    } else {
      console.warn('⚠️ No se detectó DATABASE_URL en las variables de entorno. Intentando conectar a localhost:5432...');
    }

    client = await pool.connect();
    console.log('✅ Conexión exitosa a PostgreSQL');

    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      await client.query(schemaSql);
      console.log('✅ Tablas de la base de datos inicializadas / verificadas correctamente');
    }
  } catch (err) {
    console.error('❌ Error al conectar o inicializar PostgreSQL:', err.message);
    if (!connectionString) {
      console.error('👉 RECUERDA: Debes agregar la variable DATABASE_URL en la pestaña "Variables" de Railway con tu URL de Supabase.');
    }
  } finally {
    if (client) client.release();
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
  initDB,
};
