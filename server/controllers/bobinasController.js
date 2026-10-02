const db = require('../config/db');

// Obtener todas las bobinas con datos del producto asociado
exports.getAllBobinas = async (req, res) => {
  try {
    const { product_id, marca, estado } = req.query;
    let query = `
      SELECT 
        b.id,
        b.product_id,
        p.name as product_name,
        p.sku as product_sku,
        b.codigo_bobina,
        b.marca,
        b.peso_kg::float as peso_kg,
        b.unidades,
        b.estado,
        b.notas,
        b.created_at,
        b.updated_at
      FROM bobinas b
      LEFT JOIN products p ON b.product_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (product_id) {
      params.push(product_id);
      query += ` AND b.product_id = $${params.length}`;
    }

    if (marca && marca !== 'ALL') {
      params.push(marca);
      query += ` AND LOWER(b.marca) = LOWER($${params.length})`;
    }

    if (estado && estado !== 'ALL') {
      params.push(estado);
      query += ` AND b.estado = $${params.length}`;
    }

    query += ` ORDER BY b.marca ASC, b.created_at DESC`;

    const { rows } = await db.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error al obtener bobinas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener el consolidado / englobado por Marca (Kilos totales, Cantidad de bobinas, Lotes y Precio por kilo)
exports.getBobinasSummaryByBrand = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id as product_id,
        COALESCE(NULLIF(TRIM(p.brand), ''), 'Sin Marca') as marca,
        p.sku,
        p.name,
        p.unit_price::float as precio_kilo,
        COALESCE(l_stat.total_lotes, 0)::int as total_lotes,
        GREATEST(COALESCE(l_stat.lotes_unidades, 0), COALESCE(b_stat.bobinas_disponibles, 0), p.stock_quantity)::int as bobinas_disponibles,
        GREATEST(COALESCE(l_stat.lotes_unidades, 0), COALESCE(b_stat.total_bobinas, 0), p.stock_quantity)::int as total_bobinas,
        CASE 
          WHEN COALESCE(l_stat.total_lotes, 0) > 0 AND COALESCE(l_stat.lotes_kg, 0) > 0 THEN l_stat.lotes_kg
          WHEN COALESCE(b_stat.total_kg_disponible, 0) > 0 THEN b_stat.total_kg_disponible
          ELSE (p.stock_quantity * p.unit_weight_kg)::float
        END as total_kg_disponible,
        CASE 
          WHEN COALESCE(l_stat.total_lotes, 0) > 0 AND COALESCE(l_stat.lotes_kg, 0) > 0 THEN l_stat.lotes_kg
          WHEN COALESCE(b_stat.total_kg_general, 0) > 0 THEN b_stat.total_kg_general
          ELSE (p.stock_quantity * p.unit_weight_kg)::float
        END as total_kg_general
      FROM products p
      LEFT JOIN (
        SELECT 
          product_id,
          COUNT(*)::int as total_bobinas,
          SUM(CASE WHEN estado = 'Disponible' THEN 1 ELSE 0 END)::int as bobinas_disponibles,
          SUM(CASE WHEN estado = 'Disponible' THEN peso_kg ELSE 0 END)::float as total_kg_disponible,
          SUM(peso_kg)::float as total_kg_general
        FROM bobinas
        GROUP BY product_id
      ) b_stat ON p.id = b_stat.product_id
      LEFT JOIN (
        SELECT 
          product_id,
          COUNT(*)::int as total_lotes,
          COALESCE(SUM(cantidad_actual), 0)::int as lotes_unidades,
          COALESCE(SUM(peso_total_kg), 0)::float as lotes_kg
        FROM lotes_productos
        WHERE estado = 'Disponible' AND cantidad_actual > 0
        GROUP BY product_id
      ) l_stat ON p.id = l_stat.product_id
      WHERE p.material = 'Bobinas' OR p.sku LIKE 'BOB-%' OR p.bag_type LIKE 'Bobinas%'
      ORDER BY total_kg_disponible DESC, marca ASC
    `;

    const { rows: brandsSummary } = await db.query(query);

    // Totales globales
    const totalGlobalBobinas = brandsSummary.reduce((acc, b) => acc + (b.bobinas_disponibles || 0), 0);
    const totalGlobalKg = brandsSummary.reduce((acc, b) => acc + (b.total_kg_disponible || 0), 0);

    res.json({
      success: true,
      data: {
        totales_globales: {
          marcas_activas: brandsSummary.length,
          bobinas_disponibles: totalGlobalBobinas,
          kilos_totales: Number(totalGlobalKg.toFixed(3)),
          unidades_totales: totalGlobalBobinas,
        },
        marcas: brandsSummary,
      },
    });
  } catch (error) {
    console.error('Error al obtener resumen por marcas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Crear una nueva bobina
exports.createBobina = async (req, res) => {
  try {
    const {
      product_id,
      codigo_bobina,
      marca,
      peso_kg,
      unidades = 0,
      estado = 'Disponible',
      notas,
    } = req.body;

    if (!marca || !marca.trim()) {
      return res.status(400).json({ success: false, error: 'La marca de la bobina es obligatoria' });
    }

    if (!peso_kg || parseFloat(peso_kg) <= 0) {
      return res.status(400).json({ success: false, error: 'El peso de la bobina debe ser mayor a 0 kg' });
    }

    // Si no tiene product_id, buscar o crear producto para la marca en la familia Bobinas
    let targetProductId = product_id || null;
    if (!targetProductId && marca && marca.trim()) {
      const existingProd = await db.query(
        `SELECT id FROM products 
         WHERE LOWER(brand) = LOWER($1) 
           AND (material = 'Bobinas' OR bag_type = 'Bobinas de Polietileno' OR sku LIKE 'BOB-%')
         LIMIT 1`,
        [marca.trim()]
      );
      if (existingProd.rows.length > 0) {
        targetProductId = existingProd.rows[0].id;
      } else {
        const cleanBrand = marca.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        const sku = `BOB-${cleanBrand || 'GEN'}`;
        const newProd = await db.query(
          `INSERT INTO products (
            sku, name, material, bag_type, brand, stock_quantity, unit_weight_kg, min_stock_alert, description
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id`,
          [
            sku,
            'Bobinas de Polietileno',
            'Bobinas',
            'Bobinas de Polietileno',
            marca.trim(),
            0,
            21.5,
            2,
            `Bobinas de polietileno marca ${marca.trim()} para pesaje y venta por kilo.`
          ]
        );
        targetProductId = newProd.rows[0].id;
      }
    }

    const rollCode = codigo_bobina && codigo_bobina.trim() !== ''
      ? codigo_bobina.trim()
      : `BOB-${Date.now().toString().slice(-6)}`;

    const insertQuery = `
      INSERT INTO bobinas (
        product_id,
        codigo_bobina,
        marca,
        peso_kg,
        unidades,
        estado,
        notas
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const { rows } = await db.query(insertQuery, [
      targetProductId,
      rollCode,
      marca.trim(),
      parseFloat(peso_kg),
      parseInt(unidades, 10) || 0,
      estado,
      notas || null,
    ]);

    // Sincronizar stock del producto asociado
    if (targetProductId) {
      await syncProductStockWithBobinas(targetProductId);
    }

    res.status(201).json({
      success: true,
      message: 'Bobina registrada exitosamente',
      data: rows[0],
    });
  } catch (error) {
    console.error('Error al crear bobina:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Actualizar una bobina existente
exports.updateBobina = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      product_id,
      codigo_bobina,
      marca,
      peso_kg,
      unidades,
      estado,
      notas,
    } = req.body;

    const query = `
      UPDATE bobinas
      SET
        product_id = COALESCE($1, product_id),
        codigo_bobina = COALESCE($2, codigo_bobina),
        marca = COALESCE($3, marca),
        peso_kg = COALESCE($4, peso_kg),
        unidades = COALESCE($5, unidades),
        estado = COALESCE($6, estado),
        notas = COALESCE($7, notas),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `;

    const { rows } = await db.query(query, [
      product_id !== undefined ? product_id : null,
      codigo_bobina,
      marca ? marca.trim() : null,
      peso_kg !== undefined ? parseFloat(peso_kg) : null,
      unidades !== undefined ? parseInt(unidades, 10) : null,
      estado,
      notas,
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Bobina no encontrada' });
    }

    const updatedBobina = rows[0];
    if (updatedBobina.product_id) {
      await syncProductStockWithBobinas(updatedBobina.product_id);
    }

    res.json({
      success: true,
      message: 'Bobina actualizada correctamente',
      data: updatedBobina,
    });
  } catch (error) {
    console.error('Error al actualizar bobina:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Eliminar una bobina
exports.deleteBobina = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener product_id antes de borrar
    const checkQuery = `SELECT product_id FROM bobinas WHERE id = $1`;
    const { rows: checkRows } = await db.query(checkQuery, [id]);
    
    if (checkRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Bobina no encontrada' });
    }
    
    const productId = checkRows[0].product_id;

    await db.query(`DELETE FROM bobinas WHERE id = $1`, [id]);

    if (productId) {
      await syncProductStockWithBobinas(productId);
    }

    res.json({ success: true, message: 'Bobina eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar bobina:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Función auxiliar para recalcular el stock de un producto si tiene bobinas
async function syncProductStockWithBobinas(productId) {
  try {
    const syncQuery = `
      SELECT 
        COUNT(*)::int as total_bobinas,
        COALESCE(SUM(unidades), 0)::int as total_units,
        COALESCE(SUM(peso_kg), 0)::float as total_kg
      FROM bobinas
      WHERE product_id = $1 AND estado = 'Disponible'
    `;
    const { rows } = await db.query(syncQuery, [productId]);
    const totalBobinas = rows.length > 0 ? rows[0].total_bobinas : 0;
    const totalUnits = rows.length > 0 ? rows[0].total_units : 0;
    const finalQuantity = totalUnits > 0 ? totalUnits : totalBobinas;

    await db.query(
      `UPDATE products 
       SET stock_quantity = $1, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [finalQuantity, productId]
    );
  } catch (err) {
    console.warn('Advertencia al sincronizar stock de bobinas con producto:', err.message);
  }
}
