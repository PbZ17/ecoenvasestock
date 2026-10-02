const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const isProduction = process.env.NODE_ENV === 'production';
const hasSsl = isProduction || 
  Boolean(process.env.DATABASE_URL) || 
  Boolean(process.env.PGHOST && process.env.PGHOST.includes('supabase')) ||
  process.env.PGSSL === 'true';

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: hasSsl ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'postgres',
      ssl: hasSsl ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('⚠️ Error inesperado en el cliente inactivo de PostgreSQL:', err.message);
});

async function initDB() {
  let client;
  try {
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
    console.warn('ℹ️ Verifica tus credenciales de PostgreSQL en el archivo server/.env');
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
