const db = require('../config/db');

// Obtener todos los productos con cálculo de total_weight_kg, bobinas asociadas y alerta de stock
exports.getAllProducts = async (req, res) => {
  try {
    const { search, material, lowStock, brand, bag_type } = req.query;
    let query = `
      SELECT 
        p.id, 
        p.sku, 
        p.name, 
        p.material, 
        p.dimensions, 
        p.description, 
        COALESCE(NULLIF(p.brand, 'General'), 'Sin Marca') as brand,
        COALESCE(p.bag_type, 'Bolsas de Polietileno') as bag_type,
        p.micrones,
        p.gramaje,
        p.unit_weight_kg::float as unit_weight_kg, 
        p.stock_quantity, 
        CASE 
          WHEN p.material = 'Bobinas' OR p.bag_type LIKE 'Bobinas%' OR p.sku LIKE 'BOB-%' THEN
            GREATEST(COALESCE(b_stat.real_bobinas, 0), COALESCE(l_stat.lotes_unidades, 0), p.stock_quantity)
          ELSE COALESCE(b_stat.real_bobinas, 0)
        END::int as total_bobinas,
        COALESCE(l_stat.total_lotes, 0)::int as total_lotes,
        COALESCE(l_stat.lotes_en_transito_unidades, 0)::int as lotes_en_transito_unidades,
        COALESCE(l_stat.lotes_pendientes_unidades, 0)::int as lotes_pendientes_unidades,
        CASE 
          WHEN COALESCE(l_stat.total_lotes, 0) > 0 AND COALESCE(l_stat.lotes_kg, 0) > 0 THEN l_stat.lotes_kg
          WHEN COALESCE(b_stat.real_bobinas, 0) > 0 THEN b_stat.real_kg
          ELSE (p.stock_quantity * p.unit_weight_kg)::float 
        END as total_weight_kg,
        p.min_stock_alert, 
        p.unit_price::float as unit_price, 
        p.cost_price::float as cost_price,
        (p.stock_quantity <= p.min_stock_alert) as is_low_stock,
        p.created_at, 
        p.updated_at
      FROM products p
      LEFT JOIN (
        SELECT 
          product_id, 
          COUNT(*)::int as real_bobinas, 
          SUM(peso_kg)::float as real_kg
        FROM bobinas
        WHERE estado = 'Disponible'
        GROUP BY product_id
      ) b_stat ON p.id = b_stat.product_id
      LEFT JOIN (
        SELECT 
          product_id,
          COUNT(*)::int as total_lotes,
          COALESCE(SUM(CASE WHEN estado = 'Disponible' THEN cantidad_actual ELSE 0 END), 0)::int as lotes_unidades,
          COALESCE(SUM(CASE WHEN estado = 'Disponible' THEN peso_total_kg ELSE 0 END), 0)::float as lotes_kg,
          COALESCE(SUM(CASE WHEN estado = 'En Tránsito' THEN cantidad_actual ELSE 0 END), 0)::int as lotes_en_transito_unidades,
          COALESCE(SUM(CASE WHEN estado = 'Pendiente' THEN cantidad_actual ELSE 0 END), 0)::int as lotes_pendientes_unidades
        FROM lotes_productos
        WHERE cantidad_actual > 0
        GROUP BY product_id
      ) l_stat ON p.id = l_stat.product_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      query += ` AND (LOWER(p.name) LIKE $${params.length} OR LOWER(p.sku) LIKE $${params.length} OR LOWER(COALESCE(p.description, '')) LIKE $${params.length} OR LOWER(COALESCE(p.brand, '')) LIKE $${params.length} OR LOWER(COALESCE(p.bag_type, '')) LIKE $${params.length})`;
    }

    if (material && material !== 'ALL') {
      params.push(material);
      query += ` AND p.material = $${params.length}`;
    }

    if (brand && brand !== 'ALL') {
      params.push(brand);
      query += ` AND LOWER(p.brand) = LOWER($${params.length})`;
    }

    if (bag_type && bag_type !== 'ALL') {
      params.push(bag_type);
      query += ` AND p.bag_type = $${params.length}`;
    }

    if (lowStock === 'true') {
      query += ` AND p.stock_quantity <= p.min_stock_alert`;
    }

    query += ` ORDER BY p.name ASC`;

    const { rows } = await db.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener un producto por ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        p.id, p.sku, p.name, p.material, p.dimensions, p.description, 
        COALESCE(p.brand, 'General') as brand,
        COALESCE(p.bag_type, 'Bolsas de Polietileno') as bag_type,
        p.micrones, p.gramaje,
        p.unit_weight_kg::float as unit_weight_kg, p.stock_quantity, 
        COALESCE(b_stat.real_bobinas, 0)::int as total_bobinas,
        COALESCE(l_stat.total_lotes, 0)::int as total_lotes,
        COALESCE(l_stat.lotes_en_transito_unidades, 0)::int as lotes_en_transito_unidades,
        COALESCE(l_stat.lotes_pendientes_unidades, 0)::int as lotes_pendientes_unidades,
        CASE 
          WHEN COALESCE(b_stat.real_bobinas, 0) > 0 THEN b_stat.real_kg
          WHEN COALESCE(l_stat.total_lotes, 0) > 0 THEN l_stat.lotes_kg
          ELSE (p.stock_quantity * p.unit_weight_kg)::float 
        END as total_weight_kg,
        p.min_stock_alert, p.unit_price::float as unit_price, p.cost_price::float as cost_price,
        (p.stock_quantity <= p.min_stock_alert) as is_low_stock,
        p.created_at, p.updated_at
      FROM products p
      LEFT JOIN (
        SELECT 
          product_id, 
          COUNT(*)::int as real_bobinas, 
          SUM(peso_kg)::float as real_kg
        FROM bobinas
        WHERE estado = 'Disponible'
        GROUP BY product_id
      ) b_stat ON p.id = b_stat.product_id
      LEFT JOIN (
        SELECT 
          product_id,
          COUNT(*)::int as total_lotes,
          COALESCE(SUM(CASE WHEN estado = 'Disponible' THEN cantidad_actual ELSE 0 END), 0)::int as lotes_unidades,
          COALESCE(SUM(CASE WHEN estado = 'Disponible' THEN peso_total_kg ELSE 0 END), 0)::float as lotes_kg,
          COALESCE(SUM(CASE WHEN estado = 'En Tránsito' THEN cantidad_actual ELSE 0 END), 0)::int as lotes_en_transito_unidades,
          COALESCE(SUM(CASE WHEN estado = 'Pendiente' THEN cantidad_actual ELSE 0 END), 0)::int as lotes_pendientes_unidades
        FROM lotes_productos
        WHERE cantidad_actual > 0
        GROUP BY product_id
      ) l_stat ON p.id = l_stat.product_id
      WHERE p.id = $1
    `;
    const { rows } = await db.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error al buscar producto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Crear un nuevo producto
exports.createProduct = async (req, res) => {
  const client = await db.getClient();
  try {
    const {
      sku,
      name,
      material,
      dimensions,
      description,
      brand,
      bag_type = 'Bolsas de Polietileno',
      micrones,
      gramaje,
      save_as_template,
      unit_weight_kg = 0,
      stock_quantity = 0,
      min_stock_alert = 10,
      unit_price = 0,
      cost_price = 0,
      codigo_lote,
      estado_lote,
      notas_lote,
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'El nombre del producto es obligatorio' });
    }

    const generatedSku = sku && sku.trim() !== '' ? sku.trim() : `ECO-${Date.now().toString().slice(-6)}`;
    const validStates = ['Disponible', 'En Tránsito', 'Pendiente'];
    const targetEstadoLote = validStates.includes(estado_lote) ? estado_lote : 'Disponible';

    await client.query('BEGIN');

    // 1. Verificar si ya existe un producto con las mismas características técnicas
    // (Misma marca, tipo de bolsa, dimensiones y micrones/gramaje)
    const cleanBrand = (brand && brand.trim() && brand.trim() !== 'General') ? brand.trim() : 'Sin Marca';
    const cleanDimensions = dimensions ? dimensions.trim() : '';
    const cleanMicrones = micrones ? parseInt(micrones, 10) : null;
    const cleanGramaje = gramaje ? parseInt(gramaje, 10) : null;
    const cleanBagType = bag_type || 'Bolsas de Polietileno';
    const cleanQty = parseInt(stock_quantity, 10) || 0;
    const cleanUnitWeight = parseFloat(unit_weight_kg) || 0;

    let findQuery = `
      SELECT * FROM products 
      WHERE 
        LOWER(TRIM(brand)) = LOWER(TRIM($1))
        AND bag_type = $2
        AND LOWER(REPLACE(TRIM(dimensions), ' ', '')) = LOWER(REPLACE(TRIM($3), ' ', ''))
        AND COALESCE(micrones, 0) = COALESCE($4, 0)
        AND COALESCE(gramaje, 0) = COALESCE($5, 0)
      LIMIT 1
      FOR UPDATE
    `;
    const findParams = [cleanBrand, cleanBagType, cleanDimensions, cleanMicrones, cleanGramaje];

    let { rows: existingRows } = await client.query(findQuery, findParams);

    // Si no encontró por características exactas pero el SKU fue especificado y ya existe
    if (existingRows.length === 0 && sku && sku.trim()) {
      const skuCheck = await client.query('SELECT * FROM products WHERE sku = $1 FOR UPDATE', [sku.trim()]);
      if (skuCheck.rows.length > 0) {
        existingRows = skuCheck.rows;
      }
    }

    if (existingRows.length > 0) {
      // PRODUCTO EXISTENTE ENCONTRADO: Crear nueva partida/lote sin pisar los anteriores
      const existingProduct = existingRows[0];
      const previousStock = existingProduct.stock_quantity;
      const batchUnitWeight = cleanUnitWeight > 0 ? cleanUnitWeight : (parseFloat(existingProduct.unit_weight_kg) || 0);
      const batchTotalKg = cleanQty * batchUnitWeight;

      // 1. Obtener número del nuevo lote
      const { rows: countRows } = await client.query(
        'SELECT COUNT(*)::int as count FROM lotes_productos WHERE product_id = $1',
        [existingProduct.id]
      );
      const nextLoteNum = (countRows[0].count || 0) + 1;
      const codigoLote = (codigo_lote && codigo_lote.trim()) ? codigo_lote.trim() : `LOTE-${nextLoteNum}`;

      // 2. Registrar el nuevo lote para el producto (bolsas o bobinas)
      if (cleanQty > 0) {
        await client.query(`
          INSERT INTO lotes_productos (
            product_id, codigo_lote, cantidad_inicial, cantidad_actual,
            peso_unitario_kg, peso_total_kg, costo_unitario, estado, notas
          ) VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8)
        `, [
          existingProduct.id,
          codigoLote,
          cleanQty,
          batchUnitWeight,
          batchTotalKg,
          parseFloat(cost_price) || 0,
          targetEstadoLote,
          notas_lote || `Ingreso de ${cleanQty} u (${targetEstadoLote})`
        ]);
      }

      // 3. Recalcular unidades totales y kilos reales de los lotes DISPONIBLES
      const { rows: statsLotes } = await client.query(`
        SELECT 
          COUNT(*)::int as lotes_count,
          COALESCE(SUM(CASE WHEN estado = 'Disponible' THEN cantidad_actual ELSE 0 END), 0)::int as total_unidades,
          COALESCE(SUM(CASE WHEN estado = 'Disponible' THEN peso_total_kg ELSE 0 END), 0)::float as total_kg
        FROM lotes_productos
        WHERE product_id = $1
      `, [existingProduct.id]);

      let totalLotesUnits = 0;
      let totalLotesKg = 0;

      if (statsLotes[0].lotes_count > 0) {
        totalLotesUnits = statsLotes[0].total_unidades;
        totalLotesKg = statsLotes[0].total_kg;
      } else {
        totalLotesUnits = targetEstadoLote === 'Disponible' ? (previousStock + cleanQty) : previousStock;
      }

      const weightedAvgUnitWeight = totalLotesUnits > 0 && totalLotesKg > 0
        ? (totalLotesKg / totalLotesUnits)
        : batchUnitWeight;

      const updateQuery = `
        UPDATE products 
        SET 
          stock_quantity = $1,
          unit_weight_kg = $2,
          unit_price = CASE WHEN $3 > 0 THEN $3 ELSE unit_price END,
          cost_price = CASE WHEN $4 > 0 THEN $4 ELSE cost_price END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *, (stock_quantity * unit_weight_kg)::float as total_weight_kg
      `;
      const updateResult = await client.query(updateQuery, [
        totalLotesUnits,
        weightedAvgUnitWeight,
        parseFloat(unit_price) || 0,
        parseFloat(cost_price) || 0,
        existingProduct.id,
      ]);

      const updatedProduct = updateResult.rows[0];

      // Registrar movimiento de stock de entrada consolidada SOLO si es Disponible
      if (cleanQty > 0 && targetEstadoLote === 'Disponible') {
        const movementQuery = `
          INSERT INTO stock_movements (
            product_id, type, quantity_changed, previous_stock, new_stock, 
            weight_changed_kg, reason
          ) VALUES ($1, 'IN', $2, $3, $4, $5, $6)
        `;
        const reasonText = `Ingreso de lote ${codigoLote} (${cleanQty} u)`;
        await client.query(movementQuery, [existingProduct.id, cleanQty, previousStock, totalLotesUnits, batchTotalKg, reasonText]);
      }

      await client.query('COMMIT');

      const estadoMsg = targetEstadoLote === 'Disponible'
        ? `Stock disponible total: ${totalLotesUnits.toLocaleString()} u.`
        : `Lote registrado en estado '${targetEstadoLote}'. No suma stock vendible hasta ser recepcionado como 'Disponible'.`;

      return res.json({
        success: true,
        consolidated: true,
        lote_creado: codigoLote,
        estado_lote: targetEstadoLote,
        peso_unitario_lote: batchUnitWeight,
        message: `Lote ${codigoLote} (${targetEstadoLote}) guardado exitosamente (+${cleanQty.toLocaleString()} u). ${estadoMsg}`,
        data: updatedProduct,
      });
    }

    // SI NO EXISTE: Crear nuevo producto en el catálogo
    const initialAvailableStock = targetEstadoLote === 'Disponible' ? cleanQty : 0;
    const insertQuery = `
      INSERT INTO products (
        sku, name, material, dimensions, 
        description, brand, bag_type, micrones, gramaje, 
        unit_weight_kg, stock_quantity, min_stock_alert, 
        unit_price, cost_price, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)
      RETURNING *, (stock_quantity * unit_weight_kg)::float as total_weight_kg
    `;
    const values = [
      generatedSku,
      name,
      material || 'Polietileno',
      dimensions || '',
      description || '',
      cleanBrand,
      cleanBagType,
      cleanMicrones,
      cleanGramaje,
      cleanUnitWeight,
      initialAvailableStock,
      parseInt(min_stock_alert, 10) || 10,
      parseFloat(unit_price) || 0,
      parseFloat(cost_price) || 0,
    ];

    const { rows } = await client.query(insertQuery, values);
    const newProduct = rows[0];

    // Si se indicó guardar como plantilla para la marca
    if (save_as_template && brand && dimensions) {
      await client.query(`
        INSERT INTO marca_modelos_bolsas (
          marca, nombre_tipo, categoria_material, dimensiones, micrones, gramaje, caracteristicas, peso_unitario_referencia
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        cleanBrand,
        name.trim(),
        cleanBagType,
        dimensions.trim(),
        cleanMicrones,
        cleanGramaje,
        description || '',
        cleanUnitWeight
      ]);
    }

    // Registrar lote inicial siempre que cleanQty > 0
    if (cleanQty > 0) {
      const loteCode = (codigo_lote && codigo_lote.trim()) ? codigo_lote.trim() : 'LOTE-1';
      const initialTotalKg = cleanQty * cleanUnitWeight;
      await client.query(`
        INSERT INTO lotes_productos (
          product_id, codigo_lote, cantidad_inicial, cantidad_actual,
          peso_unitario_kg, peso_total_kg, costo_unitario, estado, notas
        ) VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8)
      `, [
        newProduct.id,
        loteCode,
        cleanQty,
        cleanUnitWeight,
        initialTotalKg,
        parseFloat(cost_price) || 0,
        targetEstadoLote,
        notas_lote || `Carga inicial de producto (${targetEstadoLote})`
      ]);

      if (targetEstadoLote === 'Disponible') {
        const movementQuery = `
          INSERT INTO stock_movements (
            product_id, type, quantity_changed, previous_stock, new_stock, 
            weight_changed_kg, reason
          ) VALUES ($1, 'IN', $2, 0, $2, $3, 'Carga inicial de producto')
        `;
        await client.query(movementQuery, [newProduct.id, cleanQty, initialTotalKg]);
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Producto creado exitosamente', data: newProduct });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear producto:', error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Ya existe un producto con ese código SKU' });
    }
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};

// Actualizar un producto existente
exports.updateProduct = async (req, res) => {
  const client = await db.getClient();
  try {
    const { id } = req.params;
    const {
      sku,
      name,
      material,
      dimensions,
      description,
      brand,
      bag_type,
      micrones,
      gramaje,
      unit_weight_kg,
      stock_quantity,
      min_stock_alert,
      unit_price,
      cost_price,
    } = req.body;

    await client.query('BEGIN');

    // Obtener estado anterior para verificar cambio de stock
    const prevRes = await client.query('SELECT * FROM products WHERE id = $1', [id]);
    if (prevRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }
    const prev = prevRes.rows[0];

    const updateQuery = `
      UPDATE products SET
        sku = COALESCE($1, sku),
        name = COALESCE($2, name),
        material = COALESCE($3, material),
        dimensions = COALESCE($4, dimensions),
        description = COALESCE($5, description),
        brand = COALESCE($6, brand),
        bag_type = COALESCE($7, bag_type),
        micrones = COALESCE($8, micrones),
        gramaje = COALESCE($9, gramaje),
        unit_weight_kg = COALESCE($10, unit_weight_kg),
        stock_quantity = COALESCE($11, stock_quantity),
        min_stock_alert = COALESCE($12, min_stock_alert),
        unit_price = COALESCE($13, unit_price),
        cost_price = COALESCE($14, cost_price),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *, (stock_quantity * unit_weight_kg)::float as total_weight_kg
    `;

    const newStock = stock_quantity !== undefined ? parseInt(stock_quantity, 10) : prev.stock_quantity;
    const newUnitWeight = unit_weight_kg !== undefined ? parseFloat(unit_weight_kg) : prev.unit_weight_kg;

    const values = [
      sku,
      name,
      material,
      dimensions,
      description,
      brand ? brand.trim() : null,
      bag_type || null,
      micrones !== undefined ? (micrones ? parseInt(micrones, 10) : null) : prev.micrones,
      gramaje !== undefined ? (gramaje ? parseInt(gramaje, 10) : null) : prev.gramaje,
      newUnitWeight,
      newStock,
      min_stock_alert,
      unit_price,
      cost_price,
      id,
    ];

    const { rows } = await client.query(updateQuery, values);
    const updatedProduct = rows[0];

    // Si cambió la cantidad de stock, registrar movimiento de auditoría
    if (prev.stock_quantity !== newStock) {
      const diff = newStock - prev.stock_quantity;
      const type = diff > 0 ? 'IN' : 'ADJUSTMENT';
      const weightDiff = Math.abs(diff) * newUnitWeight;
      await client.query(
        `INSERT INTO stock_movements (
          product_id, type, quantity_changed, previous_stock, new_stock, weight_changed_kg, reason
        ) VALUES ($1, $2, $3, $4, $5, $6, 'Ajuste manual de inventario')`,
        [id, type, diff, prev.stock_quantity, newStock, weightDiff]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Producto actualizado exitosamente', data: updatedProduct });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};

// Eliminar un producto
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await db.query('DELETE FROM products WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }
    res.json({ success: true, message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Ingreso / Ajuste rápido de stock
exports.adjustStock = async (req, res) => {
  const client = await db.getClient();
  try {
    const { id } = req.params;
    const { quantity, reason = 'Ingreso de mercadería', type = 'IN' } = req.body;
    const qtyNum = parseInt(quantity, 10);

    if (isNaN(qtyNum) || qtyNum === 0) {
      return res.status(400).json({ success: false, error: 'Cantidad inválida' });
    }

    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [id]);
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }
    const product = rows[0];

    const newStock = product.stock_quantity + qtyNum;
    if (newStock < 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'El stock no puede ser negativo' });
    }

    await client.query(
      'UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newStock, id]
    );

    const weightChanged = Math.abs(qtyNum) * parseFloat(product.unit_weight_kg);
    await client.query(
      `INSERT INTO stock_movements (
        product_id, type, quantity_changed, previous_stock, new_stock, weight_changed_kg, reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, type, qtyNum, product.stock_quantity, newStock, weightChanged, reason]
    );

    await client.query('COMMIT');
    res.json({
      success: true,
      message: 'Stock actualizado correctamente',
      data: {
        id,
        previous_stock: product.stock_quantity,
        new_stock: newStock,
        unit_weight_kg: product.unit_weight_kg,
        total_weight_kg: newStock * parseFloat(product.unit_weight_kg),
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al ajustar stock:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};

// Obtener todos los lotes de un producto
exports.getProductLotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT 
        l.id,
        l.product_id,
        l.codigo_lote,
        l.cantidad_inicial,
        l.cantidad_actual,
        l.peso_unitario_kg::float as peso_unitario_kg,
        l.peso_total_kg::float as peso_total_kg,
        l.costo_unitario::float as costo_unitario,
        COALESCE(l.precio_kilo, 0)::float as precio_kilo,
        l.fecha_ingreso,
        l.estado,
        l.notas
      FROM lotes_productos l
      WHERE l.product_id = $1
      ORDER BY l.fecha_ingreso DESC, l.id DESC`,
      [id]
    );
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error al obtener lotes del producto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Crear un nuevo lote / partida de producto (Ideal para bobinas agrupadas por marca o partidas de bolsas)
exports.createProductLote = async (req, res) => {
  const client = await db.getClient();
  try {
    const { id } = req.params;
    const {
      product_id,
      marca,
      codigo_lote,
      cantidad_inicial,
      cantidad_actual,
      cantidad,
      peso_total_kg,
      peso_unitario_kg,
      costo_unitario = 0,
      precio_kilo = 0,
      estado = 'Disponible',
      notas,
      fecha_ingreso
    } = req.body;

    let targetProductId = id || product_id;

    // Si no viene product_id directo pero sí la marca (típico al ingresar bobinas por marca)
    if (!targetProductId && marca && marca.trim()) {
      const cleanBrand = marca.trim();
      const existingProd = await client.query(
        `SELECT id FROM products 
         WHERE LOWER(brand) = LOWER($1) 
           AND (material = 'Bobinas' OR bag_type LIKE 'Bobinas%' OR sku LIKE 'BOB-%')
         LIMIT 1`,
        [cleanBrand]
      );
      if (existingProd.rows.length > 0) {
        targetProductId = existingProd.rows[0].id;
      } else {
        const skuBrand = cleanBrand.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const sku = `BOB-${skuBrand || 'GEN'}`;
        const newProd = await client.query(
          `INSERT INTO products (
            sku, name, material, bag_type, brand, stock_quantity, unit_weight_kg, min_stock_alert, unit_price, description
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id`,
          [
            sku,
            'Bobinas de Polietileno',
            'Bobinas',
            'Bobinas de Polietileno',
            cleanBrand,
            0,
            21.5,
            2,
            parseFloat(precio_kilo) || 0,
            'Bobinas de polietileno marca ' + cleanBrand + ' para pesaje y venta por kilo.'
          ]
        );
        targetProductId = newProd.rows[0].id;
      }
    }

    if (!targetProductId) {
      return res.status(400).json({ success: false, error: 'Debe especificar el producto o la marca' });
    }

    const cantidadBobinas = parseInt(cantidad || cantidad_actual || cantidad_inicial, 10) || 0;
    const pesoTotal = parseFloat(peso_total_kg) || 0;

    if (cantidadBobinas <= 0 && pesoTotal <= 0) {
      return res.status(400).json({ success: false, error: 'Debe ingresar una cantidad o peso total mayor a 0' });
    }

    const validStates = ['Disponible', 'En Tránsito', 'Pendiente'];
    const targetEstado = validStates.includes(estado) ? estado : 'Disponible';
    const pesoUnitario = parseFloat(peso_unitario_kg) || (cantidadBobinas > 0 ? (pesoTotal / cantidadBobinas) : 0);
    const loteCode = (codigo_lote && codigo_lote.trim()) || `LOTE-${Date.now().toString().slice(-6)}`;
    const precioKg = parseFloat(precio_kilo) || 0;

    await client.query('BEGIN');

    // 1. Insertar en lotes_productos
    const insertLoteQuery = `
      INSERT INTO lotes_productos (
        product_id, codigo_lote, cantidad_inicial, cantidad_actual,
        peso_unitario_kg, peso_total_kg, costo_unitario, precio_kilo, fecha_ingreso, estado, notas
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, CURRENT_TIMESTAMP), $10, $11)
      RETURNING *
    `;

    const { rows: newLoteRows } = await client.query(insertLoteQuery, [
      targetProductId,
      loteCode,
      cantidadBobinas,
      cantidadBobinas,
      pesoUnitario,
      pesoTotal,
      parseFloat(costo_unitario) || 0,
      precioKg,
      fecha_ingreso || null,
      targetEstado,
      notas || null
    ]);

    const createdLote = newLoteRows[0];

    // 2. Recalcular stock y kilos totales consolidados del producto (SOLO DISPONIBLES)
    const { rows: statsRows } = await client.query(
      `SELECT 
        COALESCE(SUM(cantidad_actual), 0)::int as total_unidades,
        COALESCE(SUM(peso_total_kg), 0)::float as total_kg
      FROM lotes_productos
      WHERE product_id = $1 AND estado = 'Disponible'`,
      [targetProductId]
    );

    const totalUnits = statsRows[0].total_unidades;
    const totalKg = statsRows[0].total_kg;
    const avgWeight = totalUnits > 0 ? (totalKg / totalUnits) : pesoUnitario;

    let updateProdQuery = `
      UPDATE products 
      SET stock_quantity = $1, 
          unit_weight_kg = $2, 
          updated_at = CURRENT_TIMESTAMP
    `;
    const updateParams = [totalUnits, avgWeight];

    if (precioKg > 0) {
      updateParams.push(precioKg);
      updateProdQuery += `, unit_price = $${updateParams.length}`;
    }

    updateParams.push(targetProductId);
    updateProdQuery += ` WHERE id = $${updateParams.length}`;

    await client.query(updateProdQuery, updateParams);

    // 3. Registrar movimiento en auditoría SOLO si es Disponible
    if (targetEstado === 'Disponible') {
      await client.query(
        `INSERT INTO stock_movements (
          product_id, type, quantity_changed, previous_stock, new_stock, 
          weight_changed_kg, reason
        ) VALUES ($1, 'IN', $2, $3, $4, $5, $6)`,
        [
          targetProductId,
          cantidadBobinas,
          totalUnits - cantidadBobinas,
          totalUnits,
          pesoTotal,
          `Ingreso de lote ${loteCode} (${cantidadBobinas} u / ${pesoTotal} kg)`
        ]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `Lote ${loteCode} registrado exitosamente (${targetEstado})`,
      data: createdLote
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear lote de producto:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};

// Eliminar o anular un lote específico
exports.deleteProductLote = async (req, res) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { loteId } = req.params;

    const { rows: loteRows } = await client.query(
      'SELECT * FROM lotes_productos WHERE id = $1 FOR UPDATE',
      [loteId]
    );

    if (loteRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Lote no encontrado' });
    }

    const lote = loteRows[0];
    const productId = lote.product_id;

    // Eliminar el lote
    await client.query('DELETE FROM lotes_productos WHERE id = $1', [loteId]);

    // Recalcular totales del producto
    const { rows: statsRows } = await client.query(
      `SELECT 
        COALESCE(SUM(cantidad_actual), 0)::int as total_unidades,
        COALESCE(SUM(peso_total_kg), 0)::float as total_kg
      FROM lotes_productos
      WHERE product_id = $1 AND estado = 'Disponible'`,
      [productId]
    );

    const totalUnits = statsRows[0].total_unidades;
    const totalKg = statsRows[0].total_kg;
    const avgWeight = totalUnits > 0 ? (totalKg / totalUnits) : 0.025;

    await client.query(
      'UPDATE products SET stock_quantity = $1, unit_weight_kg = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [totalUnits, avgWeight, productId]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Lote eliminado y stock recalculado exitosamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar lote:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};

// Actualizar el estado de un lote (Disponible, En Tránsito, Pendiente, Agotado)
exports.updateProductLoteStatus = async (req, res) => {
  const client = await db.getClient();
  try {
    const { loteId } = req.params;
    const { estado } = req.body;

    const validStates = ['Disponible', 'En Tránsito', 'Pendiente', 'Agotado'];
    if (!validStates.includes(estado)) {
      return res.status(400).json({
        success: false,
        error: `Estado inválido. Debe ser uno de: ${validStates.join(', ')}`
      });
    }

    await client.query('BEGIN');

    const { rows: loteRows } = await client.query(
      'SELECT * FROM lotes_productos WHERE id = $1 FOR UPDATE',
      [loteId]
    );

    if (loteRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Lote no encontrado' });
    }

    const lote = loteRows[0];
    const oldEstado = lote.estado;
    const productId = lote.product_id;

    if (oldEstado === estado) {
      await client.query('COMMIT');
      return res.json({ success: true, message: 'El lote ya se encuentra en este estado', data: lote });
    }

    // Actualizar estado del lote
    const { rows: updatedLoteRows } = await client.query(
      'UPDATE lotes_productos SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, loteId]
    );
    const updatedLote = updatedLoteRows[0];

    // Obtener producto para previousStock
    const { rows: prodRows } = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [productId]);
    const product = prodRows[0];
    const previousStock = product ? product.stock_quantity : 0;

    // Recalcular stock y kilos de lotes DISPONIBLES
    const { rows: statsRows } = await client.query(
      `SELECT 
        COALESCE(SUM(cantidad_actual), 0)::int as total_unidades,
        COALESCE(SUM(peso_total_kg), 0)::float as total_kg
      FROM lotes_productos
      WHERE product_id = $1 AND estado = 'Disponible'`,
      [productId]
    );

    const totalUnits = statsRows[0].total_unidades;
    const totalKg = statsRows[0].total_kg;
    const avgWeight = totalUnits > 0 && totalKg > 0 ? (totalKg / totalUnits) : (product ? product.unit_weight_kg : 0);

    await client.query(
      'UPDATE products SET stock_quantity = $1, unit_weight_kg = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [totalUnits, avgWeight, productId]
    );

    // Registrar en auditoría según el cambio hacia o desde 'Disponible'
    if (oldEstado !== 'Disponible' && estado === 'Disponible') {
      await client.query(
        `INSERT INTO stock_movements (
          product_id, type, quantity_changed, previous_stock, new_stock, 
          weight_changed_kg, reason
        ) VALUES ($1, 'IN', $2, $3, $4, $5, $6)`,
        [
          productId,
          lote.cantidad_actual,
          previousStock,
          totalUnits,
          lote.peso_total_kg,
          `Lote ${lote.codigo_lote} pasó a Disponible (Recepcionado en depósito)`
        ]
      );
    } else if (oldEstado === 'Disponible' && estado !== 'Disponible') {
      await client.query(
        `INSERT INTO stock_movements (
          product_id, type, quantity_changed, previous_stock, new_stock, 
          weight_changed_kg, reason
        ) VALUES ($1, 'ADJUSTMENT', $2, $3, $4, $5, $6)`,
        [
          productId,
          -lote.cantidad_actual,
          previousStock,
          totalUnits,
          -lote.peso_total_kg,
          `Lote ${lote.codigo_lote} cambió de Disponible a ${estado}`
        ]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Estado del lote ${lote.codigo_lote} actualizado a '${estado}'`,
      data: updatedLote,
      new_stock: totalUnits
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar estado del lote:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};

