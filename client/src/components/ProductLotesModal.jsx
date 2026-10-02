import React, { useState, useEffect } from 'react';
import { 
  X, 
  Boxes, 
  Scale, 
  Calendar, 
  Tag, 
  Trash2, 
  RefreshCw, 
  AlertCircle,
  Package,
  Layers,
  Truck,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

export default function ProductLotesModal({ isOpen, onClose, product, onLotesUpdated }) {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingLoteId, setUpdatingLoteId] = useState(null);

  useEffect(() => {
    if (isOpen && product) {
      loadLotes();
    }
  }, [isOpen, product]);

  const loadLotes = async () => {
    if (!product) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getProductLotes(product.id);
      if (res.success) {
        setLotes(res.data || []);
      } else {
        setError(res.error || 'No se pudieron cargar los lotes');
      }
    } catch (err) {
      console.error('Error al cargar lotes:', err);
      setError('Error al comunicar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  const isBobina = product.material === 'Bobinas' || 
                   product.bag_type === 'Bobinas' || 
                   (product.bag_type && product.bag_type.includes('Bobinas')) || 
                   (product.sku && product.sku.startsWith('BOB-'));

  const lotesDisponibles = lotes.filter((l) => l.estado === 'Disponible');
  const lotesEnTransito = lotes.filter((l) => l.estado === 'En Tránsito');
  const lotesPendientes = lotes.filter((l) => l.estado === 'Pendiente');

  const totalDisponibles = lotesDisponibles.reduce((acc, l) => acc + (l.cantidad_actual || 0), 0);
  const totalEnTransito = lotesEnTransito.reduce((acc, l) => acc + (l.cantidad_actual || 0), 0);
  const totalPendientes = lotesPendientes.reduce((acc, l) => acc + (l.cantidad_actual || 0), 0);
  const totalUnidades = totalDisponibles;
  const totalKg = lotesDisponibles.reduce((acc, l) => acc + (l.peso_total_kg || 0), 0);
  const pesoPromedio = totalDisponibles > 0 ? (totalKg / totalDisponibles).toFixed(2) : (product.unit_weight_kg || 0);

  const handleStatusChange = async (loteId, newEstado) => {
    setUpdatingLoteId(loteId);
    try {
      const res = await api.updateProductLoteStatus(loteId, newEstado);
      if (res.success) {
        await loadLotes();
        if (onLotesUpdated) onLotesUpdated();
      } else {
        alert(res.error || 'No se pudo actualizar el estado del lote');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setUpdatingLoteId(null);
    }
  };

  const handleDeleteLote = async (loteId, codigoLote) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el ${codigoLote}? El stock del producto se recalculará automáticamente.`)) {
      return;
    }
    try {
      const res = await api.deleteProductLote(loteId);
      if (res.success) {
        await loadLotes();
        if (onLotesUpdated) onLotesUpdated();
      } else {
        alert(res.error || 'No se pudo eliminar el lote');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Boxes className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {isBobina ? `Lotes e Ingresos de Bobinas - Marca: ${product.brand}` : 'Trazabilidad de Lotes & Pesos Unitarios'}
              </h3>
              <p className="text-xs text-emerald-200/80">
                {isBobina 
                  ? 'Detalle de partidas de bobinas con pesos de balanza y precio por kilo ($/kg)'
                  : 'Detalle de partidas físicas ingresadas para este producto'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ficha Resumen del Producto */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-mono text-xs font-bold text-slate-500">{product.sku}</span>
              <h4 className="text-base font-extrabold text-slate-900">{product.name}</h4>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600">
                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200 font-bold">
                  🏷️ {product.brand || 'Sin Marca'}
                </span>
                {product.dimensions && (
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-semibold">
                    📐 {product.dimensions}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
                  {product.micrones ? `🔬 ${product.micrones}μ` : product.gramaje ? `📜 ${product.gramaje}g` : product.bag_type}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-right px-2">
                <span className="text-[10px] text-emerald-800 uppercase font-bold block flex items-center justify-end">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                  {isBobina ? 'Disponibles' : 'Stock Disponible'}
                </span>
                <span className="text-base font-black font-mono text-emerald-950">
                  {totalDisponibles.toLocaleString()} <span className="text-xs font-semibold text-slate-500">{isBobina ? 'bob.' : 'u.'}</span>
                </span>
              </div>

              {totalEnTransito > 0 && (
                <>
                  <div className="h-7 w-px bg-slate-200" />
                  <div className="text-right px-2">
                    <span className="text-[10px] text-amber-700 uppercase font-bold block flex items-center justify-end">
                      <Truck className="w-3 h-3 mr-1 text-amber-600" />
                      En Tránsito
                    </span>
                    <span className="text-base font-black font-mono text-amber-900">
                      {totalEnTransito.toLocaleString()} <span className="text-xs font-semibold text-slate-500">{isBobina ? 'bob.' : 'u.'}</span>
                    </span>
                  </div>
                </>
              )}

              {totalPendientes > 0 && (
                <>
                  <div className="h-7 w-px bg-slate-200" />
                  <div className="text-right px-2">
                    <span className="text-[10px] text-blue-700 uppercase font-bold block flex items-center justify-end">
                      <Clock className="w-3 h-3 mr-1 text-blue-600" />
                      Pendiente
                    </span>
                    <span className="text-base font-black font-mono text-blue-900">
                      {totalPendientes.toLocaleString()} <span className="text-xs font-semibold text-slate-500">{isBobina ? 'bob.' : 'u.'}</span>
                    </span>
                  </div>
                </>
              )}

              {(isBobina || totalKg > 0) && (
                <>
                  <div className="h-7 w-px bg-slate-200" />
                  <div className="text-right px-2">
                    <span className="text-[10px] text-teal-700 uppercase font-bold block">
                      {isBobina ? 'Kilos Totales Marca' : 'Kilos Totales Reales'}
                    </span>
                    <span className="text-base font-black font-mono text-teal-800">
                      {totalKg.toFixed(2)} <span className="text-xs font-semibold text-teal-600">kg</span>
                    </span>
                  </div>
                </>
              )}

              {isBobina && (
                <>
                  <div className="h-7 w-px bg-slate-200" />
                  <div className="text-right px-2">
                    <span className="text-[10px] text-blue-700 uppercase font-bold block">Precio Venta</span>
                    <span className="text-base font-black font-mono text-blue-900">
                      ${Number(product.unit_price || 0).toLocaleString('es-AR')} <span className="text-[10px] text-blue-600 font-semibold">/kg</span>
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Tabla de Lotes */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
              <Layers className="w-4 h-4 mr-1 text-emerald-600" />
              Partidas Ingresadas ({lotes.length})
            </h5>
            <button
              onClick={loadLotes}
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs flex items-center space-x-1"
              title="Refrescar lotes"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refrescar</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-4 py-3">Código Lote / Remito</th>
                  <th className="px-4 py-3">Fecha Ingreso</th>
                  <th className="px-4 py-3 text-center">{isBobina ? 'Bobinas' : 'Unidades'}</th>
                  <th className="px-4 py-3 text-right bg-emerald-50/70 text-emerald-950 font-extrabold">Kilos del Lote</th>
                  <th className="px-4 py-3 text-right">{isBobina ? 'Promedio' : 'Peso Unitario'}</th>
                  {isBobina && <th className="px-4 py-3 text-right text-blue-900">Precio $/kg</th>}
                  <th className="px-4 py-3 text-center">Estado del Lote</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={isBobina ? 8 : 7} className="text-center py-10 text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-600" />
                      Cargando partidas...
                    </td>
                  </tr>
                ) : lotes.length === 0 ? (
                  <tr>
                    <td colSpan={isBobina ? 8 : 7} className="text-center py-10 text-slate-400">
                      <Boxes className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                      No hay lotes registrados para este producto.
                    </td>
                  </tr>
                ) : (
                  lotes.map((l, index) => (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {l.codigo_lote || `LOTE-${index + 1}`}
                        </span>
                        {l.notas && (
                          <span className="text-[10px] text-slate-500 font-sans block font-normal mt-0.5 max-w-[200px] truncate" title={l.notas}>
                            💬 {l.notas}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                          {new Date(l.fecha_ingreso).toLocaleString('es-AR', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                        {l.cantidad_actual.toLocaleString()} {isBobina ? 'bob.' : 'u.'}
                        {l.cantidad_inicial > l.cantidad_actual && (
                          <span className="text-[10px] text-slate-400 block">
                            (orig: {l.cantidad_inicial.toLocaleString()})
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-black text-emerald-800 bg-emerald-50/40 text-sm whitespace-nowrap">
                        {l.peso_total_kg ? l.peso_total_kg.toFixed(2) : '0.00'} <span className="text-xs font-normal text-emerald-600">kg</span>
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-teal-700 text-xs whitespace-nowrap">
                        {isBobina ? (
                          <span>~{l.peso_unitario_kg ? l.peso_unitario_kg.toFixed(2) : '-'} kg/bob</span>
                        ) : (
                          <span>{l.peso_unitario_kg > 0 ? `${l.peso_unitario_kg.toFixed(4)} kg/u` : '-'}</span>
                        )}
                      </td>

                      {isBobina && (
                        <td className="px-4 py-3 text-right font-mono font-bold text-blue-900 text-xs whitespace-nowrap">
                          {l.precio_kilo ? `$${Number(l.precio_kilo).toLocaleString('es-AR')}` : '-'}
                        </td>
                      )}

                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center">
                          <select
                            value={l.estado || 'Disponible'}
                            disabled={updatingLoteId === l.id || l.estado === 'Agotado'}
                            onChange={(e) => handleStatusChange(l.id, e.target.value)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer focus:outline-none focus:ring-2 shadow-2xs transition-all ${
                              l.estado === 'Disponible'
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 focus:ring-emerald-500/20'
                                : l.estado === 'En Tránsito'
                                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 focus:ring-amber-500/20'
                                : l.estado === 'Pendiente'
                                ? 'bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100 focus:ring-blue-500/20'
                                : 'bg-slate-100 text-slate-500 border-slate-300'
                            }`}
                            title="Cambiar estado del lote (Disponible, En Tránsito, Pendiente)"
                          >
                            <option value="Disponible">🟢 Disponible</option>
                            <option value="En Tránsito">🚚 En Tránsito</option>
                            <option value="Pendiente">⏳ Pendiente</option>
                            {l.estado === 'Agotado' && <option value="Agotado">⚪ Agotado</option>}
                          </select>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteLote(l.id, l.codigo_lote)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Eliminar esta partida y descontar su stock"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
            <div>
              <span className="font-bold block">
                {isBobina ? 'Consolidado Total de la Marca:' : 'Promedio Ponderado de Referencia:'}
              </span>
              <span className="text-slate-600 text-[11px]">
                {isBobina 
                  ? `Suma de partidas disponibles: ${totalKg.toFixed(2)} kg en ${totalUnidades.toLocaleString()} bobinas.` 
                  : `Calculado en vivo sobre las ${totalUnidades.toLocaleString()} unidades disponibles.`}
              </span>
            </div>
            <div className="text-right font-mono">
              <span className="text-base font-black text-emerald-900">
                {isBobina ? `~${pesoPromedio} kg/bobina` : `${pesoPromedio} kg/u`}
              </span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
