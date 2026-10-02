import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RotateCcw, 
  Check, 
  AlertCircle, 
  Wrench, 
  User, 
  Cpu 
} from 'lucide-react';
import { api } from '../services/api';

export default function MovimientoRepuestoModal({ 
  isOpen, 
  onClose, 
  onMovimientoCompleted, 
  repuesto = null, 
  allRepuestos = [],
  initialTipo = 'SALIDA'
}) {
  const [selectedRepuestoId, setSelectedRepuestoId] = useState('');
  const [tipo, setTipo] = useState(initialTipo || 'SALIDA'); // 'SALIDA' | 'ENTRADA' | 'AJUSTE'
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [maquinaDestino, setMaquinaDestino] = useState('');
  const [responsable, setResponsable] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (repuesto) {
        setSelectedRepuestoId(repuesto.id.toString());
        setMaquinaDestino(repuesto.categoria_maquina || '');
      } else if (allRepuestos.length > 0) {
        setSelectedRepuestoId(allRepuestos[0].id.toString());
        setMaquinaDestino(allRepuestos[0].categoria_maquina || '');
      }
      const defaultTipo = initialTipo || 'SALIDA';
      setTipo(defaultTipo);
      setCantidad('');
      setMotivo(defaultTipo === 'ENTRADA' ? 'Ingreso / reposición de stock' : '');
      setResponsable('');
      setError(null);
    }
  }, [isOpen, repuesto, initialTipo]);

  if (!isOpen) return null;

  const currentRepuesto = repuesto || allRepuestos.find((r) => r.id.toString() === selectedRepuestoId);

  const handleRepuestoChange = (newId) => {
    setSelectedRepuestoId(newId);
    const found = allRepuestos.find((r) => r.id.toString() === newId);
    if (found) {
      setMaquinaDestino(found.categoria_maquina || '');
    }
  };

  const calculateStockAfter = () => {
    if (!currentRepuesto) return 0;
    const current = currentRepuesto.stock_actual || 0;
    const qty = parseInt(cantidad, 10) || 0;
    if (tipo === 'SALIDA') return Math.max(0, current - qty);
    if (tipo === 'ENTRADA') return current + qty;
    if (tipo === 'AJUSTE') return qty;
    return current;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentRepuesto) {
      setError('Debes seleccionar un repuesto');
      return;
    }

    const qty = parseInt(cantidad, 10);
    if (isNaN(qty) || qty <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }

    if (tipo === 'SALIDA' && qty > currentRepuesto.stock_actual) {
      setError(`Stock insuficiente: solo hay ${currentRepuesto.stock_actual} unidades disponibles`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        tipo,
        cantidad: qty,
        motivo: motivo.trim(),
        maquina_destino: maquinaDestino.trim(),
        responsable: responsable.trim(),
      };

      const res = await api.registrarMovimientoRepuesto(currentRepuesto.id, payload);
      if (res.success) {
        if (onMovimientoCompleted) onMovimientoCompleted();
        onClose();
      } else {
        setError(res.error || 'Error al registrar movimiento');
      }
    } catch (err) {
      setError('Error al comunicar con el servidor: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${
              tipo === 'SALIDA' ? 'bg-rose-500/20 text-rose-300' : tipo === 'ENTRADA' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'
            }`}>
              {tipo === 'SALIDA' && <ArrowDownLeft className="w-5 h-5" />}
              {tipo === 'ENTRADA' && <ArrowUpRight className="w-5 h-5" />}
              {tipo === 'AJUSTE' && <RotateCcw className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold">
                {tipo === 'SALIDA' ? 'Registrar Consumo / Baja de Repuesto' : tipo === 'ENTRADA' ? 'Registrar Ingreso de Repuestos' : 'Ajuste de Stock Físico'}
              </h3>
              <p className="text-xs text-slate-300">
                Movimiento de inventario para mantenimiento de maquinaria
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

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          
          {/* Tipo de Movimiento */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Tipo de Operación
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTipo('SALIDA');
                  if (motivo === 'Ingreso / reposición de stock') setMotivo('');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                  tipo === 'SALIDA'
                    ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-rose-600" />
                <span>Salida (Uso)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipo('ENTRADA');
                  if (!motivo.trim()) setMotivo('Ingreso / reposición de stock');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                  tipo === 'ENTRADA'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                <span>Entrada (Compra)</span>
              </button>

              <button
                type="button"
                onClick={() => setTipo('AJUSTE')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                  tipo === 'AJUSTE'
                    ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <RotateCcw className="w-4 h-4 text-blue-600" />
                <span>Ajuste Físico</span>
              </button>
            </div>
          </div>

          {/* Selección de Repuesto (si no viene fijo) */}
          {!repuesto && allRepuestos.length > 0 ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Repuesto a Mover *
              </label>
              <select
                value={selectedRepuestoId}
                onChange={(e) => handleRepuestoChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-slate-500/20"
              >
                {allRepuestos.map((r) => (
                  <option key={r.id} value={r.id}>
                    [{r.codigo}] {r.nombre} (Stock actual: {r.stock_actual} {r.unidad_medida})
                  </option>
                ))}
              </select>
            </div>
          ) : currentRepuesto ? (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Repuesto Seleccionado</span>
              <div className="flex items-center justify-between mt-1">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-500 block">{currentRepuesto.codigo}</span>
                  <span className="font-bold text-sm text-slate-900">{currentRepuesto.nombre}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block font-semibold">Stock Actual</span>
                  <span className="font-mono font-bold text-sm text-slate-800">
                    {currentRepuesto.stock_actual} {currentRepuesto.unidad_medida}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Cantidad y Preview de Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Cantidad a {tipo === 'SALIDA' ? 'Consumir' : tipo === 'ENTRADA' ? 'Ingresar' : 'Establecer'} *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="Ej: 2"
                required
                className="w-full px-3 py-2 text-base font-bold font-mono bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500/20 text-slate-900"
              />

              {/* Botones de adición rápida (+1, +5, +10, etc.) */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase mr-0.5">Rápido:</span>
                {[1, 5, 10, 20, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      const curr = parseInt(cantidad, 10) || 0;
                      setCantidad((curr + num).toString());
                    }}
                    className={`px-2 py-0.5 text-xs font-bold font-mono rounded-lg border transition-all ${
                      tipo === 'ENTRADA'
                        ? 'bg-emerald-50 hover:bg-emerald-200 text-emerald-800 border-emerald-300'
                        : tipo === 'SALIDA'
                        ? 'bg-rose-50 hover:bg-rose-200 text-rose-800 border-rose-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                    title={`Sumar ${num} a la cantidad`}
                  >
                    +{num}
                  </button>
                ))}
                {cantidad && (
                  <button
                    type="button"
                    onClick={() => setCantidad('')}
                    className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold px-1.5 py-0.5 ml-auto"
                    title="Limpiar cantidad"
                  >
                    Borrar
                  </button>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Stock Resultante</span>
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className="text-xl font-black font-mono text-slate-900">
                  {calculateStockAfter()}
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  {currentRepuesto?.unidad_medida || 'unidades'}
                </span>
              </div>
            </div>
          </div>

          {/* Máquina de Destino & Responsable */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
                <Cpu className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Máquina / Equipo
              </label>
              <input
                type="text"
                value={maquinaDestino}
                onChange={(e) => setMaquinaDestino(e.target.value)}
                placeholder="Ej: Selladora #1 / Extrusora A"
                className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
                <User className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Técnico / Responsable
              </label>
              <input
                type="text"
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                placeholder="Ej: Joaquín / Técnico Mantenimiento"
                className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>
          </div>

          {/* Motivo o Descripción del Trabajo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motivo / Falla / Trabajo Realizado
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows="2"
              placeholder={tipo === 'SALIDA' ? 'Ej: Reemplazo por rotura en turno noche durante sellado.' : 'Ej: Compra de lote mensual de repuestos preventivos.'}
              className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
            />
          </div>

        </form>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all flex items-center space-x-1.5 ${
              tipo === 'SALIDA'
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                : tipo === 'ENTRADA'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{submitting ? 'Procesando...' : tipo === 'SALIDA' ? 'Confirmar Salida' : tipo === 'ENTRADA' ? 'Registrar Ingreso' : 'Guardar Ajuste'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
