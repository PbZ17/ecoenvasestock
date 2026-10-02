const xlsx = require('xlsx');
const db = require('../config/db');

// Generar y descargar plantilla de Excel
exports.downloadTemplate = (req, res) => {
  try {
    const templateData = [
      {
        SKU: 'ENV-POL-500',
        Nombre: 'Bolsa Polietileno 20x30',
        Material: 'Polietileno',
        Dimensiones: '20x30 cm',
        Peso_Unitario_KG: 0.028,
        Stock_Inicial_Unidades: 1500,
        Alerta_Stock_Minimo: 200,
        Precio_Venta_Unitario: 120.50,
        Costo_Unitario: 75.00,
        Descripcion: 'Bolsa transparente para envasado general',
      },
      {
        SKU: 'ENV-KRF-1000',
        Nombre: 'Bolsa Kraft 15x25',
        Material: 'Kraft',
        Dimensiones: '15x25 cm',
        Peso_Unitario_KG: 0.045,
        Stock_Inicial_Unidades: 800,
        Alerta_Stock_Minimo: 100,
        Precio_Venta_Unitario: 180.00,
        Costo_Unitario: 110.00,
        Descripcion: 'Bolsa de papel kraft biodegradable',
      },
      {
        SKU: 'ENV-IND-250',
        Nombre: 'Bolsa Industrial Gruesa',
        Material: 'Industrial',
        Dimensiones: '40x60 cm',
        Peso_Unitario_KG: 0.075,
        Stock_Inicial_Unidades: 3000,
        Alerta_Stock_Minimo: 500,
        Precio_Venta_Unitario: 250.00,
        Costo_Unitario: 140.00,
        Descripcion: 'Bolsa para carga pesada',
      },
    ];

    const worksheet = xlsx.utils.json_to_sheet(templateData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Plantilla Stock');

    // Configurar anchos de columna
    worksheet['!cols'] = [
      { wch: 16 }, // SKU
      { wch: 30 }, // Nombre
      { wch: 14 }, // Material
      { wch: 25 }, // Dimensiones
      { wch: 18 }, // Peso_Unitario_KG
      { wch: 22 }, // Stock_Inicial_Unidades
      { wch: 20 }, // Alerta_Stock_Minimo
      { wch: 22 }, // Precio_Venta_Unitario
      { wch: 16 }, // Costo_Unitario
      { wch: 35 }, // Descripcion
    ];

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="Plantilla_Eco_Envase_Stock.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Error al generar plantilla Excel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Normalizar nombres de columnas de Excel a claves internas
function normalizeRow(row) {
  const normalized = {};
  for (const key of Object.keys(row)) {
    const cleanKey = key
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_]/g, '_');

    if (cleanKey.includes('sku') || cleanKey.includes('codigo')) {
      normalized.sku = String(row[key]).trim();
    } else if (cleanKey.includes('nom') || cleanKey.includes('producto') || cleanKey.includes('articulo')) {
      normalized.name = String(row[key]).trim();
    } else if (cleanKey.includes('mat')) {
      normalized.material = String(row[key]).trim();
    } else if (cleanKey.includes('dim') || cleanKey.includes('med') || cleanKey.includes('capacidad')) {
      normalized.dimensions = String(row[key]).trim();
    } else if (cleanKey.includes('peso') || cleanKey.includes('kg') || cleanKey.includes('kilo')) {
      normalized.unit_weight_kg = parseFloat(row[key]) || 0;
    } else if (cleanKey.includes('stock') || cleanKey.includes('cant') || cleanKey.includes('unid')) {
      normalized.stock_quantity = parseInt(row[key], 10) || 0;
    } else if (cleanKey.includes('min') || cleanKey.includes('alert')) {
      normalized.min_stock_alert = parseInt(row[key], 10) || 10;
    } else if (cleanKey.includes('precio') || cleanKey.includes('venta')) {
      normalized.unit_price = parseFloat(row[key]) || 0;
    } else if (cleanKey.includes('cost')) {
      normalized.cost_price = parseFloat(row[key]) || 0;
    } else if (cleanKey.includes('desc') || cleanKey.includes('nota') || cleanKey.includes('obs')) {
      normalized.description = String(row[key]).trim();
    }
  }

  // Si no tiene SKU, generar uno
  if (!normalized.sku && normalized.name) {
    normalized.sku = `ECO-${normalized.name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
  }

  // Calcular kilos totales de la fila
  normalized.unit_weight_kg = normalized.unit_weight_kg || 0;
  normalized.stock_quantity = normalized.stock_quantity || 0;
  normalized.total_weight_kg = +(normalized.stock_quantity * normalized.unit_weight_kg).toFixed(4);

  return normalized;
}

// Previsualizar archivo Excel antes de importar
exports.previewExcel = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se ha subido ningún archivo' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rawData = xlsx.utils.sheet_to_json(sheet);

    if (rawData.length === 0) {
      return res.status(400).json({ success: false, error: 'El archivo Excel está vacío o no contiene datos válidos' });
    }

    const previewRows = rawData.map((row, idx) => {
      const parsed = normalizeRow(row);
      return {
        rowNumber: idx + 2,
        ...parsed,
        isValid: !!parsed.name,
      };
    });

    const summary = {
      totalRows: previewRows.length,
      validRows: previewRows.filter((r) => r.isValid).length,
      totalUnits: previewRows.reduce((acc, r) => acc + (r.stock_quantity || 0), 0),
      totalWeightKg: +previewRows.reduce((acc, r) => acc + (r.total_weight_kg || 0), 0).toFixed(2),
    };

    res.json({
      success: true,
      data: {
        summary,
        rows: previewRows,
      },
    });
  } catch (error) {
    console.error('Error al previsualizar Excel:', error);
    res.status(500).json({ success: false, error: 'Error al procesar el archivo Excel: ' + error.message });
  }
};

// Importar datos a la base de datos PostgreSQL
exports.importExcel = async (req, res) => {
  const client = await db.getClient();
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se ha subido ningún archivo' });
    }

    const { updateExistingMode = 'sum' } = req.body; // 'sum' (sumar al stock actual) o 'replace' (reemplazar stock)

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rawData = xlsx.utils.sheet_to_json(sheet);

    if (rawData.length === 0) {
      return res.status(400).json({ success: false, error: 'El archivo Excel no contiene filas de datos' });
    }

    await client.query('BEGIN');

    let createdCount = 0;
    let updatedCount = 0;
    let totalKgAdded = 0;
    const errors = [];

    for (let i = 0; i < rawData.length; i++) {
      const row = normalizeRow(rawData[i]);
      if (!row.name) {
        errors.push(`Fila ${i + 2}: Nombre de producto vacío, se omitió.`);
        continue;
      }

      // Verificar si el SKU ya existe
      const existRes = await client.query('SELECT * FROM products WHERE sku = $1 FOR UPDATE', [row.sku]);

      if (existRes.rows.length > 0) {
        // Actualizar existente
        const existing = existRes.rows[0];
        const newStock =
          updateExistingMode === 'sum'
            ? existing.stock_quantity + (row.stock_quantity || 0)
            : (row.stock_quantity !== undefined ? row.stock_quantity : existing.stock_quantity);

        const newUnitWeight = row.unit_weight_kg > 0 ? row.unit_weight_kg : parseFloat(existing.unit_weight_kg);

        await client.query(
          `UPDATE products SET
            name = COALESCE($1, name),
            material = COALESCE($2, material),
            dimensions = COALESCE($3, dimensions),
            description = COALESCE($4, description),
            unit_weight_kg = $5,
            stock_quantity = $6,
            min_stock_alert = COALESCE($7, min_stock_alert),
            unit_price = COALESCE($8, unit_price),
            cost_price = COALESCE($9, cost_price),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $10`,
          [
            row.name,
            row.material || existing.material,
            row.dimensions || existing.dimensions,
            row.description || existing.description,
            newUnitWeight,
            newStock,
            row.min_stock_alert,
            row.unit_price,
            row.cost_price,
            existing.id,
          ]
        );

        const diff = newStock - existing.stock_quantity;
        if (diff !== 0) {
          const weightDiff = Math.abs(diff) * newUnitWeight;
          totalKgAdded += diff > 0 ? weightDiff : 0;
          await client.query(
            `INSERT INTO stock_movements (
              product_id, type, quantity_changed, previous_stock, new_stock, weight_changed_kg, reason
            ) VALUES ($1, 'EXCEL_IMPORT', $2, $3, $4, $5, $6)`,
            [
              existing.id,
              diff,
              existing.stock_quantity,
              newStock,
              weightDiff,
              `Importación Excel (${updateExistingMode === 'sum' ? 'Suma de stock' : 'Reemplazo'})`,
            ]
          );
        }
        updatedCount++;
      } else {
        // Crear nuevo producto
        const insertRes = await client.query(
          `INSERT INTO products (
            sku, name, material, dimensions, 
            description, unit_weight_kg, stock_quantity, min_stock_alert, 
            unit_price, cost_price, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
          RETURNING id`,
          [
            row.sku,
            row.name,
            row.material || 'Polietileno',
            row.dimensions || '',
            row.description || '',
            row.unit_weight_kg || 0,
            row.stock_quantity || 0,
            row.min_stock_alert || 10,
            row.unit_price || 0,
            row.cost_price || 0,
          ]
        );
        const newId = insertRes.rows[0].id;
        const initialWeight = (row.stock_quantity || 0) * (row.unit_weight_kg || 0);
        totalKgAdded += initialWeight;

        if (row.stock_quantity > 0) {
          await client.query(
            `INSERT INTO stock_movements (
              product_id, type, quantity_changed, previous_stock, new_stock, weight_changed_kg, reason
            ) VALUES ($1, 'EXCEL_IMPORT', $2, 0, $2, $3, 'Carga inicial desde Excel')`,
            [newId, row.stock_quantity, initialWeight]
          );
        }
        createdCount++;
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Importación completada: ${createdCount} creados, ${updatedCount} actualizados.`,
      data: {
        createdCount,
        updatedCount,
        totalKgAdded: +totalKgAdded.toFixed(2),
        errors,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al importar Excel:', error);
    res.status(500).json({ success: false, error: 'Error al importar datos: ' + error.message });
  } finally {
    client.release();
  }
};
