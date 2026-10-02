import React from 'react';
import { 
  Scale, 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  PlusCircle, 
  ShoppingCart, 
  FileSpreadsheet, 
  ArrowUpRight,
  Layers,
  Calendar
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';

export default function DashboardView({ summary, onNavigate, onNewSale, onNewProduct }) {
  const inv = summary?.inventory || {};
  const sales = summary?.sales || {};
  const materials = summary?.materialsDistribution || [];
  const recentSales = summary?.recentSales || [];

  const COLORS = ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#64748b'];

  return (
    <div className="space-y-6">
      
      {/* Banner de bienvenida y acciones rápidas */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 bg-emerald-700/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 border border-emerald-500/30 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Sistema Operativo - Eco Envase</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Control de Stock, Kilos & Balances
            </h1>
            <p className="text-emerald-100/90 text-sm mt-1 max-w-xl">
              Monitoreo centralizado de unidades, peso en kilogramos, trazabilidad de salidas y reportes financieros.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onNewSale}
              className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-md transition-all hover:scale-105 duration-150"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Registrar Venta</span>
            </button>
            <button
              onClick={onNewProduct}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl border border-white/20 transition-all backdrop-blur-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nuevo Producto</span>
            </button>
            <button
              onClick={() => onNavigate('excel')}
              className="flex items-center space-x-2 bg-emerald-900/80 hover:bg-emerald-900 text-emerald-200 font-semibold px-4 py-2.5 rounded-xl border border-emerald-700/50 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Importar Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Métricas Clave Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Kilos Totales en Stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kilos en Stock</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {(inv.total_weight_kg || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-base font-semibold text-emerald-600 ml-1.5">kg</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center">
              <Layers className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Peso total consolidado en depósito
            </p>
          </div>
        </div>

        {/* Unidades Totales en Stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unidades Disponibles</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {(inv.total_units || 0).toLocaleString()}
              <span className="text-base font-semibold text-blue-600 ml-1.5">u.</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              En <strong className="text-slate-700">{inv.total_products || 0}</strong> productos registrados
            </p>
          </div>
        </div>

        {/* Ventas y Kilos Despachados del Mes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Despachado Este Mes</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {(sales.month_weight_sold_kg || 0).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              <span className="text-base font-semibold text-teal-600 ml-1.5">kg</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {(sales.month_units_sold || 0).toLocaleString()} unidades vendidas (${(sales.month_revenue || 0).toLocaleString()})
            </p>
          </div>
        </div>

        {/* Alertas de Stock Bajo */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Crítico</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              (inv.low_stock_count || 0) > 0 
                ? 'bg-amber-50 text-amber-600 border-amber-200 animate-bounce'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {inv.low_stock_count || 0}
              <span className="text-base font-medium text-slate-500 ml-1.5">productos</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {(inv.low_stock_count || 0) > 0 ? (
                <button onClick={() => onNavigate('inventory', { lowStock: true })} className="text-amber-600 font-semibold hover:underline flex items-center">
                  Ver productos críticos <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </button>
              ) : (
                'Inventario en niveles óptimos'
              )}
            </p>
          </div>
        </div>

      </div>

      {/* Sección de Gráficos y Ventas Recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico de Kilos por Tipo de Material */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Distribución de Kilos por Material</h2>
              <p className="text-xs text-slate-500">Volumen total de peso almacenado según tipo de envase</p>
            </div>
            <button
              onClick={() => onNavigate('balances')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center"
            >
              Ver reporte detallado <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          {materials.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={materials} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="material" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    formatter={(val) => [`${val.toLocaleString()} kg`, 'Peso Total']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', borderRadius: '8px' }}
                  />
                  <Bar dataKey="total_weight_kg" radius={[6, 6, 0, 0]}>
                    {materials.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Package className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm font-medium">Aún no hay productos registrados</p>
              <button
                onClick={onNewProduct}
                className="mt-2 text-xs text-emerald-600 font-semibold hover:underline"
              >
                + Crear el primer producto
              </button>
            </div>
          )}
        </div>

        {/* Ventas Recientes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Últimas Ventas</h2>
              <p className="text-xs text-slate-500">Salidas recientes de inventario</p>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center"
            >
              Historial <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {recentSales.length > 0 ? (
              recentSales.map((sale) => (
                <div key={sale.id} className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">{sale.product_name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Cliente: {sale.client_name || 'Consumidor Final'}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      {sale.total_weight_kg} kg
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200/60">
                    <span>{sale.quantity} unidades</span>
                    <span className="font-semibold text-slate-700">${(sale.total_price || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <ShoppingCart className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs font-medium">No se han registrado ventas aún</p>
                <button onClick={onNewSale} className="mt-1 text-xs text-emerald-600 font-semibold hover:underline">
                  Registrar una venta
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
