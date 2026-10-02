const db = require('../config/db');
const xlsx = require('xlsx');

// Resumen global para el Dashboard principal
exports.getDashboardSummary = async (req, res) => {
  try {
    // 1. Métricas de inventario
    const stockQuery = `
      SELECT 
        COUNT(p.id)::int as total_products,
        COALESCE(SUM(p.stock_quantity), 0)::int as total_units,
        COALESCE(SUM(
          CASE 
            WHEN COALESCE(b_stat.real_bobinas, 0) > 0 THEN b_stat.real_kg
            ELSE (p.stock_quantity * p.unit_weight_kg)
          END
        ), 0)::float as total_weight_kg,
        COALESCE(SUM(p.stock_quantity * p.unit_price), 0)::float as total_inventory_value_sales,
        COALESCE(SUM(p.stock_quantity * p.cost_price), 0)::float as total_inventory_cost,
        COUNT(CASE WHEN p.stock_quantity <= p.min_stock_alert THEN 1 END)::int as low_stock_count
      FROM products p
      LEFT JOIN (
        SELECT product_id, COUNT(*)::int as real_bobinas, SUM(peso_kg)::float as real_kg
        FROM bobinas
        WHERE estado = 'Disponible'
        GROUP BY product_id
      ) b_stat ON p.id = b_stat.product_id
    `;
    const stockRes = await db.query(stockQuery);
    const stockData = stockRes.rows[0];

    // 2. Métricas de ventas globales y del mes actual
    const salesQuery = `
      SELECT 
        COUNT(*)::int as total_sales_count,
        COALESCE(SUM(quantity), 0)::int as total_units_sold,
        COALESCE(SUM(total_weight_kg), 0)::float as total_weight_sold_kg,
        COALESCE(SUM(total_price), 0)::float as total_revenue,
        COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', CURRENT_TIMESTAMP) THEN quantity ELSE 0 END), 0)::int as month_units_sold,
        COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', CURRENT_TIMESTAMP) THEN total_weight_kg ELSE 0 END), 0)::float as month_weight_sold_kg,
        COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', CURRENT_TIMESTAMP) THEN total_price ELSE 0 END), 0)::float as month_revenue
      FROM sales
    `;
    const salesRes = await db.query(salesQuery);
    const salesData = salesRes.rows[0];

    // 3. Distribución por Material (para gráficos)
    const materialQuery = `
      SELECT 
        COALESCE(p.material, 'Sin clasificar') as material,
        COUNT(p.id)::int as product_count,
        SUM(p.stock_quantity)::int as units,
        SUM(
          CASE 
            WHEN COALESCE(b_stat.real_bobinas, 0) > 0 THEN b_stat.real_kg
            ELSE (p.stock_quantity * p.unit_weight_kg)
          END
        )::float as total_weight_kg
      FROM products p
      LEFT JOIN (
        SELECT product_id, COUNT(*)::int as real_bobinas, SUM(peso_kg)::float as real_kg
        FROM bobinas
        WHERE estado = 'Disponible'
        GROUP BY product_id
      ) b_stat ON p.id = b_stat.product_id
      GROUP BY p.material
      ORDER BY total_weight_kg DESC
    `;
    const materialRes = await db.query(materialQuery);

    // 4. Últimos movimientos y ventas recientes
    const recentSalesQuery = `
      SELECT id, product_name, quantity, total_weight_kg::float, total_price::float, client_name, created_at
      FROM sales
      ORDER BY created_at DESC
      LIMIT 5
    `;
    const recentSalesRes = await db.query(recentSalesQuery);

    res.json({
      success: true,
      data: {
        inventory: stockData,
        sales: salesData,
        materialsDistribution: materialRes.rows,
        recentSales: recentSalesRes.rows,
      },
    });
  } catch (error) {
    console.error('Error al generar resumen de dashboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reporte detallado de Stock e Inventario
exports.getStockReport = async (req, res) => {
  try {
    const { material, sortBy = 'total_weight_kg', order = 'DESC' } = req.query;

    let query = `
      SELECT 
        p.id, p.sku, p.name, p.material, p.dimensions,
        p.unit_weight_kg::float as unit_weight_kg,
        p.stock_quantity,
        (p.stock_quantity * p.unit_weight_kg)::float as total_weight_kg,
        p.min_stock_alert,
        p.unit_price::float as unit_price,
        p.cost_price::float as cost_price,
        (p.stock_quantity * p.cost_price)::float as total_cost_value,
        (p.stock_quantity * p.unit_price)::float as total_sale_value,
        (p.stock_quantity <= p.min_stock_alert) as is_low_stock,
        COALESCE(sales_summary.total_sold_units, 0)::int as total_sold_units,
        COALESCE(sales_summary.total_sold_kg, 0)::float as total_sold_kg
      FROM products p
      LEFT JOIN (
        SELECT product_id, SUM(quantity) as total_sold_units, SUM(total_weight_kg) as total_sold_kg
        FROM sales
        GROUP BY product_id
      ) sales_summary ON p.id = sales_summary.product_id
      WHERE 1=1
    `;
    const params = [];

    if (material && material !== 'ALL') {
      params.push(material);
      query += ` AND p.material = $${params.length}`;
    }

    const safeSort = ['name', 'stock_quantity', 'total_weight_kg', 'total_cost_value', 'total_sold_units'].includes(sortBy)
      ? sortBy
      : 'total_weight_kg';
    const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${safeSort} ${safeOrder}`;

    const { rows } = await db.query(query, params);

    // Métricas calculadas
    const totals = rows.reduce(
      (acc, item) => {
        acc.totalUnits += item.stock_quantity;
        acc.totalWeightKg += item.total_weight_kg;
        acc.totalCostValue += item.total_cost_value;
        acc.totalSaleValue += item.total_sale_value;
        if (item.is_low_stock) acc.lowStockCount++;
        return acc;
      },
      { totalUnits: 0, totalWeightKg: 0, totalCostValue: 0, totalSaleValue: 0, lowStockCount: 0 }
    );

    res.json({
      success: true,
      totals: {
        totalUnits: totals.totalUnits,
        totalWeightKg: +totals.totalWeightKg.toFixed(2),
        totalCostValue: +totals.totalCostValue.toFixed(2),
        totalSaleValue: +totals.totalSaleValue.toFixed(2),
        lowStockCount: totals.lowStockCount,
      },
      data: rows,
    });
  } catch (error) {
    console.error('Error al generar reporte de stock:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reporte de Balances (Ventas vs Kilos despachados por mes/día)
exports.getBalanceReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let filterSql = '';
    const params = [];

    if (startDate) {
      params.push(startDate);
      filterSql += ` AND s.created_at >= $${params.length}::timestamp`;
    }
    if (endDate) {
      params.push(endDate);
      filterSql += ` AND s.created_at <= $${params.length}::timestamp + interval '1 day'`;
    }

    // 1. Agrupado mensual/temporal
    const monthlyQuery = `
      SELECT 
        to_char(s.created_at, 'YYYY-MM') as month,
        COUNT(s.id)::int as sales_count,
        SUM(s.quantity)::int as total_units_sold,
        SUM(s.total_weight_kg)::float as total_weight_sold_kg,
        SUM(s.total_price)::float as total_revenue,
        SUM(s.quantity * COALESCE(p.cost_price, 0))::float as total_cost,
        (SUM(s.total_price) - SUM(s.quantity * COALESCE(p.cost_price, 0)))::float as gross_profit
      FROM sales s
      LEFT JOIN products p ON s.product_id = p.id
      WHERE 1=1 ${filterSql}
      GROUP BY to_char(s.created_at, 'YYYY-MM')
      ORDER BY month ASC
    `;
    const monthlyRes = await db.query(monthlyQuery, params);

    // 2. Top productos en kilos vendidos
    const topKgQuery = `
      SELECT 
        s.product_name,
        COALESCE(p.material, 'Otro') as material,
        SUM(s.quantity)::int as units_sold,
        SUM(s.total_weight_kg)::float as weight_sold_kg,
        SUM(s.total_price)::float as revenue
      FROM sales s
      LEFT JOIN products p ON s.product_id = p.id
      WHERE 1=1 ${filterSql}
      GROUP BY s.product_name, p.material
      ORDER BY weight_sold_kg DESC
      LIMIT 10
    `;
    const topKgRes = await db.query(topKgQuery, params);

    // 3. Totales acumulados en el período
    const overallQuery = `
      SELECT 
        COUNT(s.id)::int as total_transactions,
        COALESCE(SUM(s.quantity), 0)::int as total_units,
        COALESCE(SUM(s.total_weight_kg), 0)::float as total_weight_kg,
        COALESCE(SUM(s.total_price), 0)::float as total_revenue,
        COALESCE(SUM(s.quantity * COALESCE(p.cost_price, 0)), 0)::float as total_cost,
        (COALESCE(SUM(s.total_price), 0) - COALESCE(SUM(s.quantity * COALESCE(p.cost_price, 0)), 0))::float as total_profit
      FROM sales s
      LEFT JOIN products p ON s.product_id = p.id
      WHERE 1=1 ${filterSql}
    `;
    const overallRes = await db.query(overallQuery, params);

    res.json({
      success: true,
      totals: overallRes.rows[0],
      timeline: monthlyRes.rows,
      topProducts: topKgRes.rows,
    });
  } catch (error) {
    console.error('Error al generar reporte de balance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Exportar Reporte de Stock a Excel
exports.exportStockExcel = async (req, res) => {
  try {
    const query = `
      SELECT 
        sku as "SKU",
        name as "Nombre del Producto",
        material as "Material",
        dimensions as "Dimensiones / Capacidad",
        unit_weight_kg::float as "Peso Unitario (kg)",
        stock_quantity as "Stock (Unidades)",
        (stock_quantity * unit_weight_kg)::float as "Kilos Totales (kg)",
        min_stock_alert as "Alerta Stock Mínimo",
        unit_price::float as "Precio Unitario ($)",
        cost_price::float as "Costo Unitario ($)",
        (stock_quantity * unit_price)::float as "Valor Total Venta ($)",
        (stock_quantity * cost_price)::float as "Valor Total Costo ($)"
      FROM products
      ORDER BY name ASC
    `;
    const { rows } = await db.query(query);

    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Reporte de Stock');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const filename = `Reporte_Stock_EcoEnvase_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Error al exportar stock a Excel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Exportar Reporte de Balances a Excel
exports.exportBalanceExcel = async (req, res) => {
  try {
    const query = `
      SELECT 
        s.id as "ID Venta",
        to_char(s.created_at, 'YYYY-MM-DD HH24:MI') as "Fecha",
        s.product_name as "Producto",
        s.product_sku as "SKU",
        s.client_name as "Cliente",
        s.quantity as "Unidades Vendidas",
        s.unit_weight_kg::float as "Peso Unitario (kg)",
        s.total_weight_kg::float as "Total Kilos Vendidos (kg)",
        s.unit_price::float as "Precio Unitario ($)",
        s.total_price::float as "Total Facturado ($)",
        (s.quantity * COALESCE(p.cost_price, 0))::float as "Costo Mercadería ($)",
        (s.total_price - (s.quantity * COALESCE(p.cost_price, 0)))::float as "Ganancia Estimada ($)",
        s.invoice_number as "Nro Factura / Remito",
        s.notes as "Notas"
      FROM sales s
      LEFT JOIN products p ON s.product_id = p.id
      ORDER BY s.created_at DESC
    `;
    const { rows } = await db.query(query);

    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Balance de Ventas');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const filename = `Balance_Ventas_EcoEnvase_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Error al exportar balances a Excel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
