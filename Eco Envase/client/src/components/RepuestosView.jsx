import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  Boxes, 
  History, 
  RefreshCw, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RotateCcw, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  DollarSign, 
  Cpu, 
  User, 
  Clock 
} from 'lucide-react';
import { api } from '../services/api';
import RepuestoModal from './RepuestoModal';
import MovimientoRepuestoModal from './MovimientoRepuestoModal';

export default function RepuestosView({ showToast }) {
  const [repuestos, setRepuestos] = useState([]);
  const [stats, setStats] = useState({
    total_repuestos: 0,
    total_stock_unidades: 0,
    total_valor_inventario: 0,
    repuestos_bajo_stock: 0,
    repuestos_sin_stock: 0,
  });
  const [categorias, setCategorias] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);

  // Pestañas internas: 'catalogo' | 'historial'
  const [activeTab, setActiveTab] = useState('catalogo');

  // Filtros
  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('ALL');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modales
  const [isRepuestoModalOpen, setIsRepuestoModalOpen] = useState(false);
  const [editingRepuesto, setEditingRepuesto] = useState(null);
  const [isMovimientoModalOpen, setIsMovimientoModalOpen] = useState(false);
  const [selectedRepuestoForMovimiento, setSelectedRepuestoForMovimiento] = useState(null);
  const [movimientoTipo, setMovimientoTipo] = useState('ENTRADA');

  const loadRepuestos = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (categoriaFilter !== 'ALL') params.categoria = categoriaFilter;
      if (onlyLowStock) params.only_low_stock = 'true';

      const res = await api.getRepuestos(params);
      if (res.success) {
        setRepuestos(res.data || []);
        if (res.stats) setStats(res.stats);
        if (res.categorias) setCategorias(res.categorias);
      }
    } catch (err) {
      console.error('Error al cargar repuestos:', err);
      if (showToast) showToast('Error al cargar catálogo de repuestos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadHistorial = async () => {
    setLoadingMovimientos(true);
    try {
      const res = await api.getHistorialMovimientosRepuestos({ limit: 100 });
      if (res.success) {
        setMovimientos(res.data || []);
      }
    } catch (err) {
      console.error('Error al cargar historial de movimientos:', err);
    } finally {
      setLoadingMovimientos(false);
    }
  };

  useEffect(() => {
    loadRepuestos();
  }, [search, categoriaFilter, onlyLowStock]);

  useEffect(() => {
    if (activeTab === 'historial') {
      loadHistorial();
    }
  }, [activeTab]);

  const handleOpenNew = () => {
    setEditingRepuesto(null);
    setIsRepuestoModalOpen(true);
  };

  const handleOpenEdit = (rep) => {
    setEditingRepuesto(rep);
    setIsRepuestoModalOpen(true);
  };

  const handleOpenMovimiento = (rep = null, tipo = 'ENTRADA') => {
    setSelectedRepuestoForMovimiento(rep);
    setMovimientoTipo(tipo);
    setIsMovimientoModalOpen(true);
  };

  const handleDeleteRepuesto = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el repuesto "${nombre}"? Esta acción borrará también su historial.`)) {
      return;
    }
    try {
      const res = await api.deleteRepuesto(id);
      if (res.success) {
        if (showToast) showToast('Repuesto eliminado exitosamente', 'success');
        loadRepuestos();
        if (activeTab === 'historial') loadHistorial();
      } else {
        if (showToast) showToast(res.error || 'No se pudo eliminar el repuesto', 'error');
      }
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    }
  };

  const handleSavedOrMoved = () => {
    loadRepuestos();
    if (activeTab === 'historial') loadHistorial();
    if (showToast) showToast('Operación completada con éxito', 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* Barra superior y controles */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center">
              <Wrench className="w-5 h-5 mr-2 text-amber-600" />
              Gestión de Repuestos & Mantenimiento
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Control de componentes, piezas de máquinas, alertas de stock mínimo y registro de consumos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                loadRepuestos();
                if (activeTab === 'historial') loadHistorial();
              }}
              className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all"
              title="Refrescar catálogo"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Ingreso Rápido de Stock */}
            <button
              onClick={() => handleOpenMovimiento(null, 'ENTRADA')}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200/90 rounded-xl border border-emerald-300 shadow-xs transition-all"
              title="Ingresar o reponer stock de repuestos existentes"
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-700" />
              <span>+ Ingreso de Stock</span>
            </button>

            {/* Registrar Consumo / Uso */}
            <button
              onClick={() => handleOpenMovimiento(null, 'SALIDA')}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200/90 rounded-xl border border-amber-300 shadow-xs transition-all"
              title="Registrar consumo o baja por reparación"
            >
              <ArrowDownLeft className="w-4 h-4 text-amber-700" />
              <span>⚡ Consumo / Uso</span>
            </button>

            {/* Nuevo Repuesto */}
            <button
              onClick={handleOpenNew}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-xs shadow-amber-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Repuesto</span>
            </button>
          </div>
        </div>

        {/* Tarjetas de Métricas Rápidas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Repuestos</span>
              <span className="text-xl font-black text-slate-900 font-mono">
                {stats.total_repuestos} <span className="text-xs text-slate-500 font-normal">ítems</span>
              </span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-700">
              <Boxes className="w-5 h-5 text-slate-600" />
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
            stats.repuestos_bajo_stock > 0 
              ? 'bg-amber-50/80 border-amber-300 text-amber-950' 
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div>
              <span className="text-[11px] font-bold uppercase block text-amber-800">Stock Bajo (Alerta)</span>
              <span className="text-xl font-black font-mono text-amber-900">
                {stats.repuestos_bajo_stock} <span className="text-xs font-normal">por reponer</span>
              </span>
            </div>
            <div className={`p-2.5 rounded-xl ${stats.repuestos_bajo_stock > 0 ? 'bg-amber-500 text-white' : 'bg-white text-slate-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
            stats.repuestos_sin_stock > 0 
              ? 'bg-rose-50 border-rose-300 text-rose-950' 
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div>
              <span className="text-[11px] font-bold uppercase block text-rose-800">Agotados (Sin Stock)</span>
              <span className="text-xl font-black font-mono text-rose-900">
                {stats.repuestos_sin_stock} <span className="text-xs font-normal">piezas</span>
              </span>
            </div>
            <div className={`p-2.5 rounded-xl ${stats.repuestos_sin_stock > 0 ? 'bg-rose-500 text-white' : 'bg-white text-slate-400'}`}>
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Valor Total Repuestos</span>
              <span className="text-xl font-black text-slate-900 font-mono">
                ${stats.total_valor_inventario.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

        </div>

        {/* Pestañas de Vista */}
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
          <button
            onClick={() => setActiveTab('catalogo')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'catalogo'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Catálogo de Repuestos</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'catalogo' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {repuestos.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('historial')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'historial'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historial de Movimientos / Bajas</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'historial' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {movimientos.length}
            </span>
          </button>
        </div>

        {/* Barra de Filtros (si está en catálogo) */}
        {activeTab === 'catalogo' && (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
            {/* Buscador */}
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por código, nombre, ubicación o proveedor..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
              />
            </div>

            {/* Filtro por Máquina / Categoría */}
            <div className="sm:col-span-3">
              <select
                value={categoriaFilter}
                onChange={(e) => setCategoriaFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-700"
              >
                <option value="ALL">Todas las Máquinas</option>
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Conmutador solo bajo stock */}
            <div className="sm:col-span-3 flex items-center justify-end">
              <button
                onClick={() => setOnlyLowStock(!onlyLowStock)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                  onlyLowStock
                    ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-2xs ring-1 ring-rose-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{onlyLowStock ? '✓ Filtrando: Bajo Stock' : 'Solo Stock Bajo'}</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Contenido según pestaña */}
      {activeTab === 'catalogo' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Repuesto / Pieza</th>
                  <th className="px-4 py-3">Máquina / Sector</th>
                  <th className="px-4 py-3">Ubicación</th>
                  <th className="px-4 py-3 text-center">Stock Actual</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right">Costo Unit.</th>
                  <th className="px-4 py-3 text-right">Valor Total</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-12 text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                      Cargando catálogo de repuestos...
                    </td>
                  </tr>
                ) : repuestos.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-12 text-slate-400">
                      <Wrench className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      No se encontraron repuestos con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  repuestos.map((r) => {
                    const isLow = r.stock_actual <= r.stock_minimo;
                    const isZero = r.stock_actual === 0;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* Código */}
                        <td className="px-4 py-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                          {r.codigo}
                        </td>

                        {/* Nombre & Descripción */}
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 text-xs">{r.nombre}</div>
                          {r.descripcion && (
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">{r.descripcion}</div>
                          )}
                        </td>

                        {/* Máquina */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            ⚙️ {r.categoria_maquina}
                          </span>
                        </td>

                        {/* Ubicación */}
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 text-[11px]">
                          {r.ubicacion ? (
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                              {r.ubicacion}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No especificada</span>
                          )}
                        </td>

                        {/* Stock Actual y Barra */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="font-mono font-extrabold text-sm text-slate-900">
                            {r.stock_actual} <span className="text-[10px] font-normal text-slate-500">{r.unidad_medida}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Min: {r.stock_minimo} {r.unidad_medida}
                          </div>
                        </td>

                        {/* Estado */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isZero
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isLow
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {r.estado}
                          </span>
                        </td>

                        {/* Costo Unitario */}
                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                          ${r.costo_unitario.toFixed(2)}
                        </td>

                        {/* Valor Total */}
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          ${r.valor_total.toFixed(2)}
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1.5">
                            {/* Botón rápido + Stock */}
                            <button
                              onClick={() => handleOpenMovimiento(r, 'ENTRADA')}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold transition-all flex items-center space-x-1 shadow-2xs"
                              title={`Agregar más stock a ${r.nombre}`}
                            >
                              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                              <span>+ Stock</span>
                            </button>

                            {/* Botón Consumo / Uso */}
                            <button
                              onClick={() => handleOpenMovimiento(r, 'SALIDA')}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold transition-all flex items-center space-x-1"
                              title={`Registrar consumo o baja de ${r.nombre}`}
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5 text-amber-600" />
                              <span>Uso</span>
                            </button>

                            <button
                              onClick={() => handleOpenEdit(r)}
                              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                              title="Editar repuesto"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteRepuesto(r.id, r.nombre)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Eliminar repuesto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Pestaña Historial de Movimientos */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Auditoría de Consumo y Movimientos de Repuestos
              </h3>
              <p className="text-[11px] text-slate-500">
                Registro de bajas por reparación, mantenimiento en máquinas e ingresos de stock.
              </p>
            </div>
            <button
              onClick={loadHistorial}
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg text-xs flex items-center space-x-1 font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingMovimientos ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-4 py-3">Fecha / Hora</th>
                  <th className="px-4 py-3">Operación</th>
                  <th className="px-4 py-3">Repuesto</th>
                  <th className="px-4 py-3 text-center">Cantidad</th>
                  <th className="px-4 py-3 text-center">Stock</th>
                  <th className="px-4 py-3">Máquina Destino</th>
                  <th className="px-4 py-3">Responsable</th>
                  <th className="px-4 py-3">Motivo / Trabajo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingMovimientos ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                      Cargando historial de movimientos...
                    </td>
                  </tr>
                ) : movimientos.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-slate-400">
                      <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      No hay movimientos de repuestos registrados aún.
                    </td>
                  </tr>
                ) : (
                  movimientos.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Fecha */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-slate-400" />
                          {new Date(m.created_at).toLocaleString('es-AR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </td>

                      {/* Operación */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center w-fit space-x-1 ${
                          m.tipo === 'SALIDA'
                            ? 'bg-rose-100 text-rose-800'
                            : m.tipo === 'ENTRADA'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {m.tipo === 'SALIDA' && <ArrowDownLeft className="w-3 h-3" />}
                          {m.tipo === 'ENTRADA' && <ArrowUpRight className="w-3 h-3" />}
                          {m.tipo === 'AJUSTE' && <RotateCcw className="w-3 h-3" />}
                          <span>{m.tipo === 'SALIDA' ? 'Consumo' : m.tipo === 'ENTRADA' ? 'Ingreso' : 'Ajuste'}</span>
                        </span>
                      </td>

                      {/* Repuesto */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">{m.repuesto_nombre}</span>
                        <span className="font-mono text-[10px] text-slate-400">{m.repuesto_codigo}</span>
                      </td>

                      {/* Cantidad */}
                      <td className="px-4 py-3 text-center font-mono font-bold whitespace-nowrap">
                        <span className={m.tipo === 'SALIDA' ? 'text-rose-600' : 'text-emerald-600'}>
                          {m.tipo === 'SALIDA' ? `-${m.cantidad}` : `+${m.cantidad}`} {m.unidad_medida}
                        </span>
                      </td>

                      {/* Stock antes -> después */}
                      <td className="px-4 py-3 text-center font-mono text-[11px] whitespace-nowrap text-slate-600">
                        {m.stock_anterior} ➔ <strong className="text-slate-900">{m.stock_nuevo}</strong>
                      </td>

                      {/* Máquina */}
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-700">
                        {m.maquina_destino ? (
                          <span className="flex items-center">
                            <Cpu className="w-3 h-3 mr-1 text-slate-400" />
                            {m.maquina_destino}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>

                      {/* Responsable */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                        <span className="flex items-center font-semibold">
                          <User className="w-3 h-3 mr-1 text-slate-400" />
                          {m.responsable || 'Operario'}
                        </span>
                      </td>

                      {/* Motivo */}
                      <td className="px-4 py-3 text-slate-600 text-[11px]">
                        {m.motivo || '-'}
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para Crear / Editar Repuesto */}
      <RepuestoModal
        isOpen={isRepuestoModalOpen}
        onClose={() => setIsRepuestoModalOpen(false)}
        onSaved={handleSavedOrMoved}
        repuesto={editingRepuesto}
      />

      {/* Modal para Registrar Movimiento de Consumo o Entrada */}
      <MovimientoRepuestoModal
        isOpen={isMovimientoModalOpen}
        onClose={() => {
          setIsMovimientoModalOpen(false);
          setSelectedRepuestoForMovimiento(null);
        }}
        onMovimientoCompleted={handleSavedOrMoved}
        repuesto={selectedRepuestoForMovimiento}
        allRepuestos={repuestos}
        initialTipo={movimientoTipo}
      />

    </div>
  );
}
