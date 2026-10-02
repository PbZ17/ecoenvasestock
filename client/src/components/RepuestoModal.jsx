import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wrench, 
  Sparkles, 
  Check, 
  AlertCircle, 
  MapPin, 
  Boxes, 
  DollarSign, 
  Tag, 
  Truck 
} from 'lucide-react';
import { api } from '../services/api';

const CATEGORIAS_MAQUINAS = [
  { id: 'Selladoras', label: 'Selladoras (Mordazas, Teflón, Resistencias)', icon: '⚡' },
  { id: 'Extrusoras', label: 'Extrusoras (Cabezal, Tornillo, Calefactores)', icon: '🌀' },
  { id: 'Rebobinadoras / Cortadoras', label: 'Rebobinadoras / Cortadoras (Cuchillas, Ejes)', icon: '✂️' },
  { id: 'Impresoras Flexo', label: 'Impresoras Flexográficas (Rodillos, Bombas)', icon: '🖨️' },
  { id: 'Balanzas & Pesaje', label: 'Balanzas & Equipos de Pesaje (Celdas, Display)', icon: '⚖️' },
  { id: 'Compresores / Neumática', label: 'Compresores & Neumática (Válvulas, Pistones)', icon: '💨' },
  { id: 'Mantenimiento General', label: 'Mantenimiento General / Taller', icon: '🔧' },
];

const UNIDADES_MEDIDA = ['unidades', 'metros', 'rollos', 'kits', 'piezas', 'pares'];

export default function RepuestoModal({ isOpen, onClose, onSaved, repuesto = null }) {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    categoria_maquina: 'Selladoras',
    descripcion: '',
    stock_actual: 10,
    stock_minimo: 5,
    unidad_medida: 'unidades',
    costo_unitario: 0,
    ubicacion: '',
    proveedor: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (repuesto) {
      setFormData({
        codigo: repuesto.codigo || '',
        nombre: repuesto.nombre || '',
        categoria_maquina: repuesto.categoria_maquina || 'Selladoras',
        descripcion: repuesto.descripcion || '',
        stock_actual: repuesto.stock_actual || 0,
        stock_minimo: repuesto.stock_minimo || 5,
        unidad_medida: repuesto.unidad_medida || 'unidades',
        costo_unitario: repuesto.costo_unitario || 0,
        ubicacion: repuesto.ubicacion || '',
        proveedor: repuesto.proveedor || '',
      });
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        categoria_maquina: 'Selladoras',
        descripcion: '',
        stock_actual: 10,
        stock_minimo: 5,
        unidad_medida: 'unidades',
        costo_unitario: 0,
        ubicacion: '',
        proveedor: '',
      });
    }
    setError(null);
  }, [repuesto, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenerateCodigo = () => {
    const prefix = formData.categoria_maquina 
      ? formData.categoria_maquina.substring(0, 3).toUpperCase() 
      : 'REP';
    const rand = Math.floor(100 + Math.random() * 900);
    setFormData((prev) => ({ ...prev, codigo: `REP-${prefix}-${rand}` }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      setError('El nombre del repuesto es obligatorio');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let res;
      if (repuesto) {
        res = await api.updateRepuesto(repuesto.id, formData);
      } else {
        res = await api.createRepuesto(formData);
      }

      if (res.success) {
        if (onSaved) onSaved();
        onClose();
      } else {
        setError(res.error || 'Error al guardar el repuesto');
      }
    } catch (err) {
      setError('Error al comunicar con el servidor: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 via-orange-700 to-amber-800 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Wrench className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {repuesto ? 'Editar Repuesto / Pieza' : 'Nuevo Repuesto para Mantenimiento'}
              </h3>
              <p className="text-xs text-amber-100/80">
                Control de piezas, componentes de máquinas y stock preventivo
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
          
          {/* Fila 1: Código y Nombre */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Código / SKU
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleChange}
                  placeholder="REP-SEL-101"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono font-bold"
                />
                {!repuesto && (
                  <button
                    type="button"
                    onClick={handleGenerateCodigo}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-600 hover:text-amber-700 p-1 text-xs font-semibold"
                    title="Autogenerar código"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="sm:col-span-8">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nombre del Repuesto / Pieza <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Resistencia plana 3mm / Teflón 50mm / Cuchilla dentada"
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold"
              />
            </div>
          </div>

          {/* Fila 2: Máquina / Equipo y Unidad de Medida */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Equipo / Máquina de Destino
              </label>
              <select
                name="categoria_maquina"
                value={formData.categoria_maquina}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-900"
              >
                {CATEGORIAS_MAQUINAS.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Unidad de Medida
              </label>
              <select
                name="unidad_medida"
                value={formData.unidad_medida}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-900"
              >
                {UNIDADES_MEDIDA.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila 3: Especificaciones y Detalles */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Descripción Técnica / Medidas / Compatibilidad
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows="2"
              placeholder="Ej: Ancho 3mm x largo 600mm, 220V 400W. Compatible con Selladora Continua y Selladora de Pedal."
              className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Fila 4: Control de Stock y Costos */}
          <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center">
                <Boxes className="w-3.5 h-3.5 mr-1 text-amber-700" />
                Stock Actual
              </label>
              <input
                type="number"
                step="1"
                min="0"
                name="stock_actual"
                value={formData.stock_actual}
                onChange={handleChange}
                disabled={Boolean(repuesto)} // Para repuestos existentes, se ajusta mediante movimientos
                className={`w-full px-3 py-1.5 text-sm rounded-xl font-bold font-mono ${
                  repuesto
                    ? 'bg-slate-100 text-slate-600 border border-slate-200 cursor-not-allowed'
                    : 'bg-white text-slate-900 border border-amber-300 focus:ring-2 focus:ring-amber-500'
                }`}
              />
              {repuesto && (
                <span className="text-[10px] text-slate-400 block mt-0.5">Usa "Movimientos" para cambiar stock</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-700" />
                Stock Mínimo (Alerta)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                name="stock_minimo"
                value={formData.stock_minimo}
                onChange={handleChange}
                placeholder="5"
                className="w-full px-3 py-1.5 text-sm bg-white border border-amber-300 rounded-xl font-bold font-mono text-slate-900 focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">Avisa cuando baje de esta cantidad</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center">
                <DollarSign className="w-3.5 h-3.5 mr-1 text-amber-700" />
                Costo Unitario ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="costo_unitario"
                value={formData.costo_unitario}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full px-3 py-1.5 text-sm bg-white border border-amber-300 rounded-xl font-bold font-mono text-slate-900 focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">Valor unitario de reposición</span>
            </div>
          </div>

          {/* Fila 5: Ubicación y Proveedor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Ubicación en Depósito / Taller
              </label>
              <input
                type="text"
                name="ubicacion"
                value={formData.ubicacion}
                onChange={handleChange}
                placeholder="Ej: Estantería B - Gaveta 4"
                className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
                <Truck className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Proveedor Habitual
              </label>
              <input
                type="text"
                name="proveedor"
                value={formData.proveedor}
                onChange={handleChange}
                placeholder="Ej: Repuestos Industriales SA"
                className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>
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
            className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-xs shadow-amber-600/30 transition-all flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{submitting ? 'Guardando...' : repuesto ? 'Guardar Cambios' : 'Registrar Repuesto'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
