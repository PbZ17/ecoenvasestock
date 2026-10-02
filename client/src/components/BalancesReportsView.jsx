import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Scale, 
  Package, 
  Download, 
  Printer, 
  Calendar, 
  DollarSign, 
  Layers, 
  RefreshCw,
  BarChart3,
  PieChart as PieIcon
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { api } from '../services/api';

export default function BalancesReportsView({ showToast }) {
  const [subTab, setSubTab] = useState('balances'); // 'balances' o 'stock'
  const [loading, setLoading] = useState(false);
  const [balanceData, setBalanceData] = useState(null);
  const [stockReportData, setStockReportData] = useState(null);

  // Filtros de fecha para balances
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stockMaterialFilter, setStockMaterialFilter] = useState('ALL');

  const fetchReports = async () => {
    setLoading(true);
    try {
      if (subTab === 'balances') {
        const res = await api.getBalanceReport({ startDate, endDate });
        if (res.success) setBalanceData(res);
      } else {
        const res = await api.getStockReport({ material: stockMaterialFilter });
        if (res.success) setStockReportData(res);
      }
    } catch (err) {
      showToast('Error al cargar reporte: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [subTab, startDate, endDate, stockMaterialFilter]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Barra Superior con Selector de Subpestañas y Exportación */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-emerald-600" />
            Reportes Financieros, Balances y Stock
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Análisis de ingresos, costos, márgenes y volumen de kilos despachados.
          </p>
        </div>

        {/* Subpestañas */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setSubTab('balances')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'balances'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Balance de Ventas & Kilos
          </button>
          <button
            onClick={() => setSubTab('stock')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'stock'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Valorización de Stock
          </button>
        </div>

        {/* Botones de Exportación / Impresión */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-all"
            title="Imprimir o guardar como PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir PDF</span>
          </button>

          <a
            href={subTab === 'balances' ? api.getExportBalanceUrl() : api.getExportStockUrl()}
            download
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar a Excel</span>
          </a>
        </div>
      </div>

      {/* VISTA 1: BALANCE DE VENTAS Y KILOS */}
      {subTab === 'balances' && (
        <div className="space-y-6">
          
          {/* Filtro de Fechas */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-700 uppercase flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Período del Balance:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
            <span className="text-xs text-slate-400">hasta</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-xs text-rose-600 font-semibold hover:underline"
              >
                Limpiar fechas
              </button>
            )}
          </div>

          {/* Tarjetas de Totales del Balance */}
          {balanceData?.totals && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Total Facturado */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase">Facturación Total</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-2">
                  ${(balanceData.totals.total_revenue || 0).toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  En {balanceData.totals.total_transactions || 0} operaciones
                </p>
              </div>

              {/* Total Kilos Despachados */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-emerald-700 uppercase flex items-center">
                  <Scale className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Kilos Despachados
                </span>
                <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-2">
                  {(balanceData.totals.total_weight_kg || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-sm font-bold ml-1">kg</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {(balanceData.totals.total_units || 0).toLocaleString()} unidades entregadas
                </p>
              </div>

              {/* Costo Mercadería */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase">Costo Mercadería</span>
                <div className="text-2xl font-extrabold text-slate-700 mt-2">
                  ${(balanceData.totals.total_cost || 0).toLocaleString()}
                </div>
                <p className="text-xs text-slate-400 mt-1">Costo unitario ponderado</p>
              </div>

              {/* Margen / Ganancia Estimada */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-teal-700 uppercase">Margen Bruto Est.</span>
                <div className="text-2xl font-extrabold text-teal-700 mt-2">
                  ${(balanceData.totals.total_profit || 0).toLocaleString()}
                </div>
                <p className="text-xs text-teal-600/80 mt-1 font-semibold">
                  {balanceData.totals.total_revenue > 0
                    ? `${(((balanceData.totals.total_profit || 0) / balanceData.totals.total_revenue) * 100).toFixed(1)}% margen`
                    : '0% margen'}
                </p>
              </div>

            </div>
          )}

          {/* Gráfico de Evolución Mensual */}
          {balanceData?.timeline && balanceData.timeline.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-1">Evolución de Ventas y Kilos Despachados</h3>
              <p className="text-xs text-slate-500 mb-4">Relación entre ingresos generados y volumen en kg por período</p>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={balanceData.timeline} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#059669', fontSize: 12 }} />
                    <Tooltip 
                      formatter={(val, name) => [
                        name === 'Kilos Vendidos' ? `${val.toLocaleString()} kg` : `$${val.toLocaleString()}`, 
                        name
                      ]}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="total_revenue" name="Facturación ($)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="total_weight_sold_kg" name="Kilos Vendidos" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Top Productos Más Vendidos en Kilos */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Top Productos por Volumen de Kilos Vendidos</h3>
            <p className="text-xs text-slate-500 mb-4">Productos con mayor rotación en peso total despachado</p>
            
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Material</th>
                    <th className="px-4 py-3 text-right">Unidades Vendidas</th>
                    <th className="px-4 py-3 text-right font-bold text-emerald-800 bg-emerald-50/60">Kilos Totales</th>
                    <th className="px-4 py-3 text-right">Total Facturado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {balanceData?.topProducts?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-400">
                        No hay ventas registradas en el período seleccionado.
                      </td>
                    </tr>
                  ) : (
                    balanceData?.topProducts?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-bold text-slate-900">{item.product_name}</td>
                        <td className="px-4 py-2.5 text-slate-600">{item.material}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold">{item.units_sold.toLocaleString()} u.</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                          {item.weight_sold_kg.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-800">
                          ${item.revenue.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* VISTA 2: VALORIZACIÓN Y REPORTE DE STOCK */}
      {subTab === 'stock' && (
        <div className="space-y-6">
          
          {/* Métricas de Valorización de Stock */}
          {stockReportData?.totals && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-emerald-700 uppercase">Kilos Totales en Depósito</span>
                <div className="text-2xl font-extrabold text-emerald-800 font-mono mt-2">
                  {stockReportData.totals.totalWeightKg.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-sm font-bold ml-1">kg</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {stockReportData.totals.totalUnits.toLocaleString()} unidades físicas
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase">Valuación a Precio de Venta</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-2">
                  ${stockReportData.totals.totalSaleValue.toLocaleString()}
                </div>
                <p className="text-xs text-slate-400 mt-1">Potencial bruto de realización</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase">Valuación a Precio de Costo</span>
                <div className="text-2xl font-extrabold text-slate-700 mt-2">
                  ${stockReportData.totals.totalCostValue.toLocaleString()}
                </div>
                <p className="text-xs text-slate-400 mt-1">Capital invertido en mercadería</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-amber-700 uppercase">Alerta de Stock Crítico</span>
                <div className="text-2xl font-extrabold text-amber-700 mt-2">
                  {stockReportData.totals.lowStockCount}
                  <span className="text-sm font-medium text-slate-500 ml-1">productos</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Por debajo del stock mínimo</p>
              </div>
            </div>
          )}

          {/* Tabla de Reporte de Inventario Completo */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Detalle Valuado por Producto</h3>
            
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-3">SKU / Producto</th>
                    <th className="px-3.5 py-3">Material</th>
                    <th className="px-3.5 py-3 text-right">Peso Unit.</th>
                    <th className="px-3.5 py-3 text-right">Stock (u.)</th>
                    <th className="px-3.5 py-3 text-right font-bold text-emerald-800 bg-emerald-50/70">Kilos Totales</th>
                    <th className="px-3.5 py-3 text-right">Val. Costo</th>
                    <th className="px-3.5 py-3 text-right">Val. Venta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockReportData?.data?.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-3.5 py-2.5">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <span className="text-[10px] text-slate-400 font-mono">{p.sku}</span>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-600">{p.material}</td>
                      <td className="px-3.5 py-2.5 text-right font-mono">{parseFloat(p.unit_weight_kg).toFixed(4)} kg</td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-800">{p.stock_quantity.toLocaleString()}</td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                        {p.total_weight_kg.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono text-slate-600">${p.total_cost_value.toLocaleString()}</td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-slate-900">${p.total_sale_value.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
