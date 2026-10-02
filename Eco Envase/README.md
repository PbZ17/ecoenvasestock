# Eco Envase — Sistema de Control de Stock, Kilos & Balances

Sistema integral de gestión de stock, pesaje, ventas, importación de planillas de cálculo y generación de balances e informes desarrollado para **Eco Envase**.

---

## 🌟 Características Principales

1. **Control de Stock y Kilos**:
   - Registro de envases con características técnicas (Material, Medidas, Color, Tipo de tapa/cierre, SKU).
   - Ingreso de peso por unidad en kilogramos ($kg/u$).
   - **Cálculo automático de Kilos Totales** en tiempo real: $\text{Kilos Totales} = \text{Unidades} \times \text{Peso Unitario}$.
   - Alertas visuales y filtros de productos con stock crítico.

2. **Módulo de Ventas & Despachos**:
   - Registro de ventas con selector de productos y validación de stock disponible.
   - Cálculo instantáneo de kilos a descontar.
   - **Deducción atómica de unidades y kilos** en el inventario.
   - Historial cronológico de ventas con opción de anulación y restitución de stock.

3. **Carga Masiva desde Excel (.xlsx / .csv)**:
   - Descarga de plantilla oficial de Excel en 1 clic.
   - Subida y previsualización de datos con resumen previo (unidades y kilos a incorporar).
   - Opciones para sumar al stock existente o reemplazar.

4. **Balances, Reportes & Valuación**:
   - Balance de ventas periódicas (facturación vs costo vs margen bruto).
   - Volumen de kilos despachados y evolución mensual con gráficos interactivos.
   - Valuación total del inventario a precio de costo y precio de venta.
   - Exportación de reportes a **Excel (.xlsx)** y opción de impresión en **PDF**.

5. **Gestor de Informes y Documentos**:
   - Repositorio para subir, categorizar y archivar balances contables, remitos, certificados de calidad y documentos adjuntos.
   - Descarga directa de archivos almacenados.

---

## 🚀 Requisitos e Instalación

### Requisitos:
- **Node.js** (v18 o superior)
- **PostgreSQL** (base de datos configurada en `server/.env`)

### 1. Configurar Base de Datos PostgreSQL
Crea una base de datos en PostgreSQL llamada `eco_envase` (o edita los datos en `server/.env`):
```env
PORT=5000
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=tu_contraseña
PGDATABASE=eco_envase
```

### 2. Instalar Dependencias
Ejecuta desde la terminal:
```bash
cd server
npm.cmd install

cd ../client
npm.cmd install
```

### 3. Iniciar el Sistema
Puedes hacer doble clic en el archivo `iniciar_sistema.bat` o correr en dos terminales:
```bash
# Terminal 1 (Servidor API)
cd server
npm.cmd run dev

# Terminal 2 (Interfaz Web)
cd client
npm.cmd run dev
```

Abre tu navegador en: **http://localhost:3000**
