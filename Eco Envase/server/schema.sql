-- Esquema para Sistema de Control de Stock y Balances - Eco Envase

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    material VARCHAR(100),
    dimensions VARCHAR(100),
    description TEXT,
    unit_weight_kg NUMERIC(10, 4) NOT NULL DEFAULT 0.0000,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock_alert INTEGER NOT NULL DEFAULT 10,
    unit_price NUMERIC(12, 2) DEFAULT 0.00,
    cost_price NUMERIC(12, 2) DEFAULT 0.00,
    brand VARCHAR(150) DEFAULT 'General',
    bag_type VARCHAR(100) DEFAULT 'Bolsas de Polietileno',
    micrones INTEGER,
    gramaje INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    quantity INTEGER NOT NULL,
    unit_weight_kg NUMERIC(10, 4) NOT NULL DEFAULT 0.0000,
    total_weight_kg NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    unit_price NUMERIC(12, 2) DEFAULT 0.00,
    total_price NUMERIC(12, 2) DEFAULT 0.00,
    client_name VARCHAR(255),
    invoice_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'IN', 'OUT_SALE', 'ADJUSTMENT', 'EXCEL_IMPORT'
    quantity_changed INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    weight_changed_kg NUMERIC(12, 4) DEFAULT 0.0000,
    reference_id INTEGER,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'General', -- 'Balance', 'Stock', 'Remito', 'Certificado', 'Otro'
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    notes TEXT,
    period VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bobinas (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    codigo_bobina VARCHAR(100),
    marca VARCHAR(150) NOT NULL,
    peso_kg NUMERIC(10, 3) NOT NULL,
    unidades INTEGER NOT NULL DEFAULT 0,
    estado VARCHAR(50) DEFAULT 'Disponible', -- 'Disponible', 'En Uso', 'Agotada'
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marca_modelos_bolsas (
    id SERIAL PRIMARY KEY,
    marca VARCHAR(150) NOT NULL,
    nombre_tipo VARCHAR(255) NOT NULL,
    categoria_material VARCHAR(100) NOT NULL DEFAULT 'Bolsas de Polietileno',
    dimensiones VARCHAR(100) NOT NULL,
    micrones INTEGER,
    gramaje INTEGER,
    caracteristicas TEXT,
    peso_unitario_referencia NUMERIC(10, 4) DEFAULT 0.0000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Catálogo de Repuestos y Mantenimiento
CREATE TABLE IF NOT EXISTS repuestos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    categoria_maquina VARCHAR(100) NOT NULL DEFAULT 'General',
    descripcion TEXT,
    stock_actual INTEGER NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo INTEGER NOT NULL DEFAULT 5,
    unidad_medida VARCHAR(30) DEFAULT 'unidades',
    costo_unitario NUMERIC(12, 2) DEFAULT 0.00,
    ubicacion VARCHAR(100),
    proveedor VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Movimientos y Consumo de Repuestos
CREATE TABLE IF NOT EXISTS movimientos_repuestos (
    id SERIAL PRIMARY KEY,
    repuesto_id INTEGER NOT NULL REFERENCES repuestos(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL,
    cantidad INTEGER NOT NULL,
    stock_anterior INTEGER NOT NULL,
    stock_nuevo INTEGER NOT NULL,
    motivo TEXT,
    maquina_destino VARCHAR(100),
    responsable VARCHAR(100),
    costo_total NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsqueda rápida de repuestos
CREATE INDEX IF NOT EXISTS idx_repuestos_categoria ON repuestos(categoria_maquina);
CREATE INDEX IF NOT EXISTS idx_repuestos_codigo ON repuestos(codigo);
CREATE INDEX IF NOT EXISTS idx_movimientos_repuesto_id ON movimientos_repuestos(repuesto_id);

-- Tabla de Lotes / Partidas de Productos con Pesos Unitarios Variables
CREATE TABLE IF NOT EXISTS lotes_productos (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    codigo_lote VARCHAR(50) NOT NULL,
    cantidad_inicial INTEGER NOT NULL,
    cantidad_actual INTEGER NOT NULL CHECK (cantidad_actual >= 0),
    peso_unitario_kg NUMERIC(10, 4) DEFAULT 0.0000 CHECK (peso_unitario_kg >= 0),
    peso_total_kg NUMERIC(12, 3) DEFAULT 0.000,
    costo_unitario NUMERIC(12, 2) DEFAULT 0.00,
    precio_kilo NUMERIC(12, 2) DEFAULT 0.00,
    fecha_ingreso TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(30) DEFAULT 'Disponible',
    notas TEXT
);

CREATE INDEX IF NOT EXISTS idx_lotes_product_id ON lotes_productos(product_id);

