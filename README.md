# 🌿 Eco Envase — Sistema de Control de Stock, Kilos & Balances

Sistema integral de gestión de stock, pesaje de bobinas y bolsas, ventas con deducción atómica, importación masiva de Excel y generación de balances e informes para **Eco Envase**.

---

## 🚀 Despliegue en Railway (Paso a Paso)

Este repositorio está 100% optimizado para desplegarse en **Railway** como un servicio Full-Stack (Backend Express + Frontend React Vite + Base de Datos PostgreSQL).

### Paso 1: Crear el proyecto en Railway
1. Ingresa a [railway.com](https://railway.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"New Project"** -> **"Deploy from GitHub repo"**.
3. Selecciona el repositorio **`PbZ17/ecoenvasestock`**.

### Paso 2: Agregar la base de datos PostgreSQL
1. Dentro de tu proyecto en Railway, haz clic en **"+ New"** -> **"Database"** -> **"Add PostgreSQL"**.
2. Railway creará automáticamente la base de datos y generará la variable de entorno `DATABASE_URL`.

### Paso 3: Conectar la base de datos con la aplicación Web
1. Selecciona el servicio web de tu aplicación en el dashboard de Railway.
2. Ve a la pestaña **"Variables"** -> **"Add Reference"** (o **"New Variable"**).
3. Selecciona `DATABASE_URL` del servicio PostgreSQL (Railway lo vincula automáticamente como `${{Postgres.DATABASE_URL}}`).
4. En **"Settings"** -> **"Networking"**, haz clic en **"Generate Domain"** para obtener tu URL pública (ejemplo: `https://ecoenvasestock-production.up.railway.app`).

### Paso 4: ¡Listo!
Al iniciar, el servidor creará automáticamente todas las tablas e índices necesarios definidos en `server/schema.sql` y servirá tanto la API (`/api`) como la interfaz web interactiva.

---

## 💻 Desarrollo e Instalación Local

### Requisitos:
- **Node.js** (v18 o superior)
- **PostgreSQL** instalado localmente o una base de datos remota (Supabase / Railway / Neon).

### 1. Configurar variables de entorno
Crea un archivo `.env` dentro de la carpeta `server/` tomando como base `server/.env.example`:
```env
PORT=5000
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=tu_contraseña
PGDATABASE=eco_envase
```

### 2. Instalar Dependencias
Desde la raíz del proyecto:
```bash
npm run install:all
```

### 3. Iniciar el Sistema Localmente
Puedes hacer doble clic en `iniciar_sistema.bat` o ejecutar:
```bash
# Iniciar backend y frontend en desarrollo
npm run dev:server
npm run dev:client
```
Abre tu navegador en: **http://localhost:3000**

---

## 📁 Estructura del Proyecto

```text
├── client/                 # Frontend React + Vite + Tailwind CSS + Lucide Icons + Recharts
│   ├── src/
│   │   ├── components/     # Modales, Vistas de Inventario, Ventas, Balances, Reportes
│   │   ├── services/api.js # Cliente HTTP con manejo de errores
│   │   └── App.jsx
│   └── package.json
├── server/                 # Backend Node.js + Express + PostgreSQL (pg) + Multer + XLSX
│   ├── config/db.js        # Conexión automática con DATABASE_URL y pool de PostgreSQL
│   ├── controllers/        # Controladores de productos, ventas, bobinas, repuestos, etc.
│   ├── routes/api.js       # Endpoints RESTful
│   ├── schema.sql          # DDL de tablas e índices PostgreSQL (auto-ejecutable)
│   ├── index.js            # Servidor Express y servidor de estáticos en producción
│   └── package.json
├── .gitignore              # Protección de .env, node_modules y dist
├── railway.json            # Configuración de build y deploy para Railway Nixpacks
├── Procfile                # Definición del proceso web para Railway
├── package.json            # Scripts unificados de construcción y arranque
└── README.md
```
