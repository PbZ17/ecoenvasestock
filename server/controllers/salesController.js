const db = require('../config/db');

// Registrar una nueva venta y descontar unidades y kilos del stock automáticamente
exports.createSale = async (req, res) => {
  const client = await db.getClient();
  try {
    const {
      product_id,
      quantity,
      weight_kg,
      peso_kg,
      unit_price,
      client_name,
      invoice_number,
      notes,
    } = req.body;

    await client.query('BEGIN');

    // 1. Obtener producto y bloquear la fila para evitar condiciones de carrera
    const prodRes = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [product_id]);
    if (prodRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }

    const product = prodRes.rows[0];
    const isBobina = product.material === 'Bobinas' || 
                     product.bag_type === 'Bobinas' || 
                     (product.bag_type && product.bag_type.includes('Bobinas')) || 
                     (product.sku && product.sku.startsWith('BOB-'));

    let qty = parseInt(quantity, 10) || 0;
    const requestedWeight = parseFloat(weight_kg || peso_kg || 0);
    const unitWeight = parseFloat(product.unit_weight_kg) || (isBobina ? 21.5 : 0);

    let totalWeightKg = 0;
    let saleUnitPrice = unit_price !== undefined ? parseFloat(unit_price) : parseFloat(product.unit_price) || 0;
    let totalPrice = 0;
    let newStock = product.stock_quantity;

    if (isBobina) {
      // === VENTA DE BOBINAS POR PESO (KILOS / BALANZA) ===
      if (requestedWeight <= 0 && qty <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Para bobinas debes ingresar los kilos pesados en balanza o la cantidad.',
        });
      }

      totalWeightKg = requestedWeight > 0 ? requestedWeight : (qty * unitWeight);
      
      // Si no especificó bobinas pero sí kilos, estimar las bobinas
      if (qty <= 0) {
        qty = Math.max(1, Math.round(totalWeightKg / (unitWeight > 0 ? unitWeight : 21.5)));
      }

      // Validar lotes disponibles para esta bobina
      const { rows: lotesRows } = await client.query(
        `SELECT * FROM lotes_productos 
         WHERE product_id = $1 AND estado = 'Disponible' AND peso_total_kg > 0 
         ORDER BY fecha_ingreso ASC, id ASC 
         FOR UPDATE`,
        [product.id]
      );

      if (lotesRows.length > 0) {
        // Descontar por FIFO de los lotes
        let remainingWeightToDeduct = totalWeightKg;
        let bobinasDeducted = 0;

        for (const lote of lotesRows) {
          if (remainingWeightToDeduct <= 0) break;
          const loteKg = parseFloat(lote.peso_total_kg) || 0;
          const loteUnits = parseInt(lote.cantidad_actual, 10) || 0;
          if (loteKg <= 0) continue;

          if (loteKg <= remainingWeightToDeduct) {
            remainingWeightToDeduct -= loteKg;
            bobinasDeducted += loteUnits;
            await client.query(
              "UPDATE lotes_productos SET cantidad_actual = 0, peso_total_kg = 0, estado = 'Agotado' WHERE id = $1",
              [lote.id]
            );
          } else {
            const newLoteKg = Number((loteKg - remainingWeightToDeduct).toFixed(3));
            const avgPerUnit = loteUnits > 0 ? (loteKg / loteUnits) : 21.5;
            const unitsDeductedFromLote = Math.min(loteUnits, Math.max(1, Math.round(remainingWeightToDeduct / avgPerUnit)));
            const newLoteUnits = Math.max(0, loteUnits - unitsDeductedFromLote);
            bobinasDeducted += unitsDeductedFromLote;
            remainingWeightToDeduct = 0;
            await client.query(
              "UPDATE lotes_productos SET cantidad_actual = $1, peso_total_kg = $2 WHERE id = $3",
              [newLoteUnits, newLoteKg, lote.id]
            );
          }
        }

        // Recalcular stock del producto en base a los lotes restantes
        const { rows: statsRows } = await client.query(
          `SELECT 
            COALESCE(SUM(cantidad_actual), 0)::int as total_unidades,
            COALESCE(SUM(peso_total_kg), 0)::float as total_kg
          FROM lotes_productos
          WHERE product_id = $1 AND estado = 'Disponible'`,
          [product.id]
        );
        newStock = statsRows[0].total_unidades;
      } else {
        // Si no tenía lotes cargados pero tenía stock directo
        newStock = Math.max(0, product.stock_quantity - qty);
      }

      // En bobinas el precio unitario es $/kg
      totalPrice = Number((totalWeightKg * saleUnitPrice).toFixed(2));

    } else {
      // === VENTA REGULAR (BOLSAS DE POLIETILENO / KRAFT POR UNIDADES) ===
      if (qty <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Debe especificar una cantidad de unidades mayor a 0' });
      }

      if (product.stock_quantity < qty) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Stock insuficiente. Stock actual: ${product.stock_quantity} unidades. Solicitado: ${qty} unidades.`,
        });
      }

      totalWeightKg = qty * unitWeight;
      totalPrice = Number((qty * saleUnitPrice).toFixed(2));
      newStock = product.stock_quantity - qty;

      // Descontar de lotes_productos en orden FIFO si el producto tiene lotes Disponibles
      const { rows: bagLotes } = await client.query(
        `SELECT id, cantidad_actual, peso_total_kg, peso_unitario_kg
         FROM lotes_productos 
         WHERE product_id = $1 AND estado = 'Disponible' AND cantidad_actual > 0 
         ORDER BY fecha_ingreso ASC, id ASC FOR UPDATE`,
        [product.id]
      );

      if (bagLotes.length > 0) {
        let remainingQtyToDeduct = qty;
        for (const lote of bagLotes) {
          if (remainingQtyToDeduct <= 0) break;
          const loteQty = parseInt(lote.cantidad_actual, 10) || 0;
          if (loteQty <= 0) continue;

          if (loteQty <= remainingQtyToDeduct) {
            remainingQtyToDeduct -= loteQty;
            await client.query(
              "UPDATE lotes_productos SET cantidad_actual = 0, peso_total_kg = 0, estado = 'Agotado' WHERE id = $1",
              [lote.id]
            );
          } else {
            const newLoteQty = loteQty - remainingQtyToDeduct;
            const unitW = parseFloat(lote.peso_unitario_kg) || 0;
            const newLoteKg = Number((newLoteQty * unitW).toFixed(3));
            remainingQtyToDeduct = 0;
            await client.query(
              "UPDATE lotes_productos SET cantidad_actual = $1, peso_total_kg = $2 WHERE id = $3",
              [newLoteQty, newLoteKg, lote.id]
            );
          }
        }
      }
    }

    // 4. Actualizar stock del producto
    await client.query(
      'UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newStock, product_id]
    );

    // 5. Registrar venta
    const insertSaleQuery = `
      INSERT INTO sales (
        product_id, product_name, product_sku, quantity, unit_weight_kg, 
        total_weight_kg, unit_price, total_price, client_name, invoice_number, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const saleValues = [
      product.id,
      product.name,
      product.sku,
      qty,
      isBobina && qty > 0 ? (totalWeightKg / qty) : (parseFloat(product.unit_weight_kg) || 0),
      totalWeightKg,
      saleUnitPrice,
      totalPrice,
      client_name || 'Consumidor Final',
      invoice_number || null,
      notes || (isBobina ? `Venta de ${totalWeightKg.toFixed(2)} kg @ $${saleUnitPrice}/kg` : null),
    ];
    const saleResult = await client.query(insertSaleQuery, saleValues);
    const sale = saleResult.rows[0];

    // 6. Registrar en auditoría de movimientos
    await client.query(
      `INSERT INTO stock_movements (
        product_id, type, quantity_changed, previous_stock, new_stock, 
        weight_changed_kg, reference_id, reason
      ) VALUES ($1, 'OUT_SALE', $2, $3, $4, $5, $6, $7)`,
      [
        product.id,
        -qty,
        product.stock_quantity,
        newStock,
        totalWeightKg,
        sale.id,
        isBobina 
          ? `Venta #${sale.id} de ${totalWeightKg.toFixed(2)} kg de bobinas a ${client_name || 'Consumidor Final'}`
          : `Venta #${sale.id} a ${client_name || 'Consumidor Final'}`,
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Venta registrada con éxito y stock descontado',
      data: {
        sale,
        stock_summary: {
          product_id: product.id,
          product_name: product.name,
          previous_stock: product.stock_quantity,
          units_sold: qty,
          new_stock: newStock,
          weight_sold_kg: totalWeightKg,
          remaining_weight_kg: newStock * unitWeight,
        },
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al registrar venta:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};

// Obtener todas las ventas con filtros
exports.getAllSales = async (req, res) => {
  try {
    const { startDate, endDate, clientName, search } = req.query;
    let query = `
      SELECT 
        s.id,
        s.product_id,
        s.product_name,
        s.product_sku,
        s.quantity,
        s.unit_weight_kg::float as unit_weight_kg,
        s.total_weight_kg::float as total_weight_kg,
        s.unit_price::float as unit_price,
        s.total_price::float as total_price,
        s.client_name,
        s.invoice_number,
        s.notes,
        s.created_at,
        p.material,
        p.dimensions
      FROM sales s
      LEFT JOIN products p ON s.product_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      params.push(startDate);
      query += ` AND s.created_at >= $${params.length}::timestamp`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND s.created_at <= $${params.length}::timestamp + interval '1 day'`;
    }

    if (clientName) {
      params.push(`%${clientName.toLowerCase()}%`);
      query += ` AND LOWER(s.client_name) LIKE $${params.length}`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      query += ` AND (LOWER(s.product_name) LIKE $${params.length} OR LOWER(COALESCE(s.product_sku, '')) LIKE $${params.length} OR LOWER(COALESCE(s.client_name, '')) LIKE $${params.length})`;
    }

    query += ` ORDER BY s.created_at DESC`;

    const { rows } = await db.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Anular una venta y reingresar el stock
exports.cancelSale = async (req, res) => {
  const client = await db.getClient();
  try {
    const { id } = req.params;
    await client.query('BEGIN');

    const saleRes = await client.query('SELECT * FROM sales WHERE id = $1', [id]);
    if (saleRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Venta no encontrada' });
    }
    const sale = saleRes.rows[0];

    // Reingresar stock si el producto todavía existe
    if (sale.product_id) {
      const prodRes = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [sale.product_id]);
      if (prodRes.rows.length > 0) {
        const product = prodRes.rows[0];
        const restoredStock = product.stock_quantity + sale.quantity;

        await client.query('UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
          restoredStock,
          product.id,
        ]);

        await client.query(
          `INSERT INTO stock_movements (
            product_id, type, quantity_changed, previous_stock, new_stock, 
            weight_changed_kg, reference_id, reason
          ) VALUES ($1, 'ADJUSTMENT', $2, $3, $4, $5, $6, $7)`,
          [
            product.id,
            sale.quantity,
            product.stock_quantity,
            restoredStock,
            sale.total_weight_kg,
            sale.id,
            `Anulación de venta #${sale.id}`,
          ]
        );
      }
    }

    await client.query('DELETE FROM sales WHERE id = $1', [id]);
    await client.query('COMMIT');

    res.json({ success: true, message: 'Venta anulada y stock restituido exitosamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al anular venta:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};
