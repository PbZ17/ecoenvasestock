const db = require('../config/db');

// Obtener todos los repuestos con filtros y resumen de métricas
exports.getAllRepuestos = async (req, res) => {
  try {
    const { search, categoria, only_low_stock } = req.query;

    let query = `
      SELECT 
        r.id,
        r.codigo,
        r.nombre,
        r.categoria_maquina,
        r.descripcion,
        r.stock_actual,
        r.stock_minimo,
        r.unidad_medida,
        r.costo_unitario::float as costo_unitario,
        (r.stock_actual * r.costo_unitario)::float as valor_total,
        r.ubicacion,
        r.proveedor,
        r.created_at,
        r.updated_at,
        CASE 
          WHEN r.stock_actual = 0 THEN 'Sin Stock'
          WHEN r.stock_actual <= r.stock_minimo THEN 'Stock Bajo'
          ELSE 'Disponible'
        END as estado
      FROM repuestos r
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (
        LOWER(r.codigo) LIKE $${params.length} OR
        LOWER(r.nombre) LIKE $${params.length} OR
        LOWER(COALESCE(r.descripcion, '')) LIKE $${params.length} OR
        LOWER(COALESCE(r.ubicacion, '')) LIKE $${params.length} OR
        LOWER(COALESCE(r.proveedor, '')) LIKE $${params.length}
      )`;
    }

    if (categoria && categoria !== 'ALL') {
      params.push(categoria.trim());
      query += ` AND r.categoria_maquina = $${params.length}`;
    }

    if (only_low_stock === 'true') {
      query += ` AND r.stock_actual <= r.stock_minimo`;
    }

    query += ` ORDER BY 
      CASE WHEN r.stock_actual <= r.stock_minimo THEN 0 ELSE 1 END,
      r.nombre ASC`;

    const { rows: repuestos } = await db.query(query, params);

    // Métricas generales de repuestos
    const statsQuery = `
      SELECT 
        COUNT(*)::int as total_repuestos,
        COALESCE(SUM(stock_actual), 0)::int as total_stock_unidades,
        COALESCE(SUM(stock_actual * costo_unitario), 0)::float as total_valor_inventario,
        COUNT(CASE WHEN stock_actual <= stock_minimo THEN 1 END)::int as repuestos_bajo_stock,
        COUNT(CASE WHEN stock_actual = 0 THEN 1 END)::int as repuestos_sin_stock
      FROM repuestos
    `;
    const { rows: statsRows } = await db.query(statsQuery);
    const stats = statsRows[0] || {
      total_repuestos: 0,
      total_stock_unidades: 0,
      total_valor_inventario: 0,
      repuestos_bajo_stock: 0,
      repuestos_sin_stock: 0,
    };

    // Categorías de máquinas existentes
    const catQuery = `SELECT DISTINCT categoria_maquina FROM repuestos ORDER BY categoria_maquina ASC`;
    const { rows: catRows } = await db.query(catQuery);
    const categoriasExistentes = catRows.map((c) => c.categoria_maquina);

    res.json({
      success: true,
      data: repuestos,
      stats,
      categorias: categoriasExistentes,
    });
  } catch (error) {
    console.error('Error al obtener repuestos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener un repuesto por ID con sus últimos movimientos
exports.getRepuestoById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: repRows } = await db.query(
      `SELECT 
        r.*,
        r.costo_unitario::float as costo_unitario,
        (r.stock_actual * r.costo_unitario)::float as valor_total,
        CASE 
          WHEN r.stock_actual = 0 THEN 'Sin Stock'
          WHEN r.stock_actual <= r.stock_minimo THEN 'Stock Bajo'
          ELSE 'Disponible'
        END as estado
       FROM repuestos r WHERE r.id = $1`,
      [id]
    );

    if (repRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Repuesto no encontrado' });
    }

    // Movimientos del repuesto
    const { rows: movRows } = await db.query(
      `SELECT 
        m.*,
        m.costo_total::float as costo_total
       FROM movimientos_repuestos m
       WHERE m.repuesto_id = $1
       ORDER BY m.created_at DESC
       LIMIT 50`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...repRows[0],
        movimientos: movRows,
      },
    });
  } catch (error) {
    console.error('Error al obtener detalle del repuesto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Crear nuevo repuesto
exports.createRepuesto = async (req, res) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const {
      codigo,
      nombre,
      categoria_maquina = 'General',
      descripcion = '',
      stock_actual = 0,
      stock_minimo = 5,
      unidad_medida = 'unidades',
      costo_unitario = 0,
      ubicacion = '',
      proveedor = '',
    } = req.body;

    if (!nombre || !nombre.trim()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'El nombre del repuesto es obligatorio' });
    }

    const cleanCodigo = codigo && codigo.trim() !== ''
      ? codigo.trim()
      : `REP-${categoria_maquina.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const initialStock = Math.max(0, parseInt(stock_actual, 10) || 0);
    const minStock = Math.max(0, parseInt(stock_minimo, 10) || 0);
    const unitCost = Math.max(0, parseFloat(costo_unitario) || 0);

    const insertQuery = `
      INSERT INTO repuestos (
        codigo, nombre, categoria_maquina, descripcion,
        stock_actual, stock_minimo, unidad_medida,
        costo_unitario, ubicacion, proveedor
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const { rows } = await client.query(insertQuery, [
      cleanCodigo,
      nombre.trim(),
      categoria_maquina.trim(),
      descripcion.trim(),
      initialStock,
      minStock,
      unidad_medida.trim() || 'unidades',
      unitCost,
      ubicacion.trim(),
      proveedor.trim(),
    ]);

    const newRepuesto = rows[0];

    // Si se cargó con stock inicial mayor a 0, asentar el primer movimiento de entrada
    if (initialStock > 0) {
      await client.query(
        `INSERT INTO movimientos_repuestos (
          repuesto_id, tipo, cantidad, stock_anterior, stock_nuevo,
          motivo, responsable, costo_total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          newRepuesto.id,
          'ENTRADA',
          initialStock,
          0,
          initialStock,
          'Carga inicial de inventario',
          'Sistema',
          initialStock * unitCost,
        ]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Repuesto registrado exitosamente',
      data: newRepuesto,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear repuesto:', error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Ya existe un repuesto con ese código SKU' });
    }
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};

// Modificar datos del repuesto
exports.updateRepuesto = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      codigo,
      nombre,
      categoria_maquina,
      descripcion,
      stock_minimo,
      unidad_medida,
      costo_unitario,
      ubicacion,
      proveedor,
    } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ success: false, error: 'El nombre es obligatorio' });
    }

    const updateQuery = `
      UPDATE repuestos
      SET
        codigo = $1,
        nombre = $2,
        categoria_maquina = $3,
        descripcion = $4,
        stock_minimo = $5,
        unidad_medida = $6,
        costo_unitario = $7,
        ubicacion = $8,
        proveedor = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `;

    const { rows } = await db.query(updateQuery, [
      codigo.trim(),
      nombre.trim(),
      categoria_maquina ? categoria_maquina.trim() : 'General',
      descripcion || '',
      parseInt(stock_minimo, 10) || 5,
      unidad_medida || 'unidades',
      parseFloat(costo_unitario) || 0,
      ubicacion || '',
      proveedor || '',
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Repuesto no encontrado' });
    }

    res.json({
      success: true,
      message: 'Repuesto actualizado correctamente',
      data: rows[0],
    });
  } catch (error) {
    console.error('Error al actualizar repuesto:', error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Ya existe otro repuesto con ese código' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// Eliminar un repuesto
exports.deleteRepuesto = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await db.query('DELETE FROM repuestos WHERE id = $1', [id]);

    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Repuesto no encontrado' });
    }

    res.json({ success: true, message: 'Repuesto eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar repuesto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Registrar movimiento de stock (ENTRADA / SALIDA / AJUSTE)
exports.registrarMovimiento = async (req, res) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      tipo, // 'ENTRADA', 'SALIDA', 'AJUSTE'
      cantidad,
      motivo = '',
      maquina_destino = '',
      responsable = '',
    } = req.body;

    const parsedQty = parseInt(cantidad, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'La cantidad debe ser mayor a 0' });
    }

    if (!['ENTRADA', 'SALIDA', 'AJUSTE'].includes(tipo)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Tipo de movimiento inválido (ENTRADA, SALIDA o AJUSTE)' });
    }

    // Obtener repuesto con bloqueo FOR UPDATE
    const { rows: repRows } = await client.query(
      'SELECT id, stock_actual, costo_unitario, nombre FROM repuestos WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (repRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Repuesto no encontrado' });
    }

    const currentRep = repRows[0];
    const stockAnterior = currentRep.stock_actual;
    let stockNuevo = stockAnterior;

    if (tipo === 'ENTRADA') {
      stockNuevo = stockAnterior + parsedQty;
    } else if (tipo === 'SALIDA') {
      if (stockAnterior < parsedQty) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Stock insuficiente: intentas consumir ${parsedQty} pero solo hay ${stockAnterior} unidades disponibles.`,
        });
      }
      stockNuevo = stockAnterior - parsedQty;
    } else if (tipo === 'AJUSTE') {
      stockNuevo = parsedQty; // Cantidad física real contada
    }

    // Actualizar stock del repuesto
    await client.query(
      'UPDATE repuestos SET stock_actual = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [stockNuevo, id]
    );

    // Calcular costo
    const costoTotal = (parseFloat(currentRep.costo_unitario) || 0) * (tipo === 'AJUSTE' ? Math.abs(stockNuevo - stockAnterior) : parsedQty);

    // Registrar en historial de movimientos
    const { rows: movRows } = await client.query(
      `INSERT INTO movimientos_repuestos (
        repuesto_id, tipo, cantidad, stock_anterior, stock_nuevo,
        motivo, maquina_destino, responsable, costo_total
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        id,
        tipo,
        parsedQty,
        stockAnterior,
        stockNuevo,
        motivo.trim() || (tipo === 'SALIDA' ? 'Mantenimiento de máquina' : 'Ingreso de repuesto'),
        maquina_destino.trim(),
        responsable.trim() || 'Operario',
        costoTotal,
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Movimiento de ${tipo} registrado correctamente`,
      data: {
        repuesto_id: id,
        stock_anterior: stockAnterior,
        stock_actual: stockNuevo,
        movimiento: movRows[0],
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al registrar movimiento de repuesto:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};

// Historial general de todos los movimientos para auditoría
exports.getHistorialMovimientos = async (req, res) => {
  try {
    const { limit = 100, repuesto_id, tipo } = req.query;

    let query = `
      SELECT 
        m.id,
        m.repuesto_id,
        m.tipo,
        m.cantidad,
        m.stock_anterior,
        m.stock_nuevo,
        m.motivo,
        m.maquina_destino,
        m.responsable,
        m.costo_total::float as costo_total,
        m.created_at,
        r.codigo as repuesto_codigo,
        r.nombre as repuesto_nombre,
        r.categoria_maquina,
        r.unidad_medida
      FROM movimientos_repuestos m
      JOIN repuestos r ON m.repuesto_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (repuesto_id) {
      params.push(repuesto_id);
      query += ` AND m.repuesto_id = $${params.length}`;
    }

    if (tipo && tipo !== 'ALL') {
      params.push(tipo);
      query += ` AND m.tipo = $${params.length}`;
    }

    query += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit, 10) || 100);

    const { rows } = await db.query(query, params);

    res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error('Error al obtener historial de movimientos de repuestos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
