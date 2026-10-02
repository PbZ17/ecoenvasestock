import React, { useState, useEffect } from 'react';
import { 
  X, 
  Scale, 
  Package, 
  Tag, 
  Check, 
  Sparkles, 
  Layers, 
  Bookmark, 
  Calculator, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

const CATEGORIAS_BOLSAS = [
  { id: 'Bolsas de Polietileno', label: 'Bolsas de Polietileno', icon: '🛍️', type: 'plastic' },
  { id: 'Bolsas de Papel Kraft', label: 'Bolsas de Papel Kraft', icon: '📜', type: 'paper' },
  { id: 'Plástico Industrial', label: 'Plástico Industrial', icon: '🏭', type: 'plastic' },
  { id: 'Bolsas de Consorcio', label: 'Bolsas de Consorcio', icon: '🗑️', type: 'plastic' },
  { id: 'Residuos Orgánicos', label: 'Residuos Orgánicos', icon: '🍏', type: 'plastic' },
  { id: 'Plástico Stretch Film', label: 'Plástico Stretch Film', icon: '📦', type: 'plastic' },
];

const MICRONES_COMUNES = [25, 30, 40, 50, 60, 80, 100];
const GRAMAJES_COMUNES = [60, 70, 80, 90, 100, 120];

export default function CargaBolsaPorMarcaModal({ isOpen, onClose, onProductSaved, existingBrands = [] }) {
  const [marca, setMarca] = useState('');
  const [categoria, setCategoria] = useState('Bolsas de Polietileno');
  const [dimensiones, setDimensiones] = useState('');
  const [micrones, setMicrones] = useState('');
  const [gramaje, setGramaje] = useState('');
  const [nombreProducto, setNombreProducto] = useState('');
  const [unidades, setUnidades] = useState('');
  const [unitWeightKg, setUnitWeightKg] = useState('');
  const [kilosBalanza, setKilosBalanza] = useState('');
  const [modoBalanza, setModoBalanza] = useState(false); // false: ingresar peso unitario, true: ingresar kilos de balanza
  const [guardarPlantilla, setGuardarPlantilla] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Modelos guardados para la marca seleccionada
  const [savedModelos, setSavedModelos] = useState([]);
  const [loadingModelos, setLoadingModelos] = useState(false);

  const esPapel = categoria === 'Bolsas de Papel Kraft';

  // Al abrir el modal o cambiar la marca, buscar plantillas guardadas
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (existingBrands.length > 0 && !marca) {
        setMarca(existingBrands[0] !== 'General' ? existingBrands[0] : '');
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (marca.trim()) {
      fetchModelosDeMarca(marca.trim());
    } else {
      setSavedModelos([]);
    }
  }, [marca]);

  const fetchModelosDeMarca = async (marcaBuscada) => {
    setLoadingModelos(true);
    try {
      const res = await api.getModelosBolsas({ marca: marcaBuscada });
      if (res.success) {
        setSavedModelos(res.data || []);
      }
    } catch (err) {
      console.error('Error al cargar modelos de la marca:', err);
    } finally {
      setLoadingModelos(false);
    }
  };

  // Generar nombre sugerido dinámicamente
  useEffect(() => {
    const brandPrefix = marca.trim() ? `${marca.trim()} - ` : '';
    const thickness = esPapel 
      ? (gramaje ? ` ${gramaje}g` : '') 
      : (micrones ? ` ${micrones}μ` : '');
    const dimText = dimensiones.trim() ? ` ${dimensiones.trim()}` : '';
    
    setNombreProducto(`${brandPrefix}${categoria}${dimText}${thickness}`);
  }, [marca, categoria, dimensiones, micrones, gramaje, esPapel]);

  // Si cambia el modo balanza o los kilos de balanza, recalcular el peso unitario
  useEffect(() => {
    if (modoBalanza) {
      const u = parseInt(unidades, 10) || 0;
      const kg = parseFloat(kilosBalanza) || 0;
      if (u > 0 && kg > 0) {
        const calculatedUnit = (kg / u).toFixed(4);
        setUnitWeightKg(calculatedUnit);
      }
    }
  }, [modoBalanza, kilosBalanza, unidades]);

  if (!isOpen) return null;

  // Seleccionar una plantilla guardada de esa marca
  const handleSelectModelo = (m) => {
    setCategoria(m.categoria_material || 'Bolsas de Polietileno');
    setDimensiones(m.dimensiones || '');
    if (m.micrones) setMicrones(m.micrones);
    if (m.gramaje) setGramaje(m.gramaje);
    if (m.peso_unitario_referencia && parseFloat(m.peso_unitario_referencia) > 0) {
      setUnitWeightKg(parseFloat(m.peso_unitario_referencia).toFixed(4));
    }
  };

  const totalCalculatedKg = () => {
    if (modoBalanza && kilosBalanza) {
      return parseFloat(kilosBalanza).toFixed(2);
    }
    const u = parseInt(unidades, 10) || 0;
    const w = parseFloat(unitWeightKg) || 0;
    return (u * w).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!marca.trim()) {
      setError('Debes ingresar la Marca');
      return;
    }
    if (!dimensiones.trim()) {
      setError('Debes ingresar las Dimensiones (ej: 40x50 cm)');
      return;
    }
    const qty = parseInt(unidades, 10);
    if (isNaN(qty) || qty < 0) {
      setError('Las unidades de stock deben ser 0 o un número positivo');
      return;
    }
    const weight = parseFloat(unitWeightKg);
    if (isNaN(weight) || weight <= 0) {
      setError('El peso unitario debe ser mayor a 0 kg');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const generatedSku = `BOL-${marca.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      
      const payload = {
        sku: generatedSku,
        name: nombreProducto.trim(),
        brand: marca.trim(),
        bag_type: categoria,
        material: esPapel ? 'Kraft' : 'Polietileno',
        dimensions: dimensiones.trim(),
        micrones: !esPapel && micrones ? parseInt(micrones, 10) : null,
        gramaje: esPapel && gramaje ? parseInt(gramaje, 10) : null,
        stock_quantity: qty,
        unit_weight_kg: weight,
        min_stock_alert: 50,
        unit_price: 0,
        cost_price: 0,
        description: `Bolsa ${categoria} - Medidas: ${dimensiones}${esPapel ? (gramaje ? ` - Gramaje: ${gramaje}g` : '') : (micrones ? ` - Espesor: ${micrones}μ` : '')}`,
        save_as_template: guardarPlantilla,
      };

      const res = await api.createProduct(payload);
      if (res.success) {
        if (onProductSaved) onProductSaved();
        onClose();
      } else {
        setError(res.error || 'Error al guardar el producto');
      }
    } catch (err) {
      setError('Error al comunicar con el servidor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh]">
        
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Package className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                Carga Rápida de Bolsas por Marca
              </h3>
              <p className="text-xs text-emerald-200/80">
                Guarda dimensiones y características por marca para cargar stock directo por unidades y peso.
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

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          
          {/* PASO 1: MARCA & SELECCIÓN DE MODELOS PREVIOS */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Marca del Producto *
            </label>
            <div className="relative">
              <input
                type="text"
                list="marcas-disponibles"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="Escribe o selecciona la Marca (ej: Plastix, EcoEnvase, etc.)"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <datalist id="marcas-disponibles">
                {existingBrands.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            {/* Medidas y modelos guardados para esta marca */}
            {savedModelos.length > 0 && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-900 flex items-center">
                  <Bookmark className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Medidas y Fichas ya guardadas para "{marca}":
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {savedModelos.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectModelo(m)}
                      className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-emerald-600 hover:text-white border border-emerald-300 text-emerald-800 rounded-lg shadow-2xs transition-all flex items-center space-x-1"
                      title="Cargar automáticamente esta medida"
                    >
                      <span>{m.dimensiones}</span>
                      <span className="text-[10px] opacity-75">
                        ({m.micrones ? `${m.micrones}μ` : m.gramaje ? `${m.gramaje}g` : m.categoria_material})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PASO 2: TIPO DE BOLSA / CATEGORÍA */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Tipo de Bolsa / Material *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIAS_BOLSAS.map((cat) => {
                const isSelected = categoria === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoria(cat.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/80'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-emerald-950' : 'text-slate-700'}`}>
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PASO 3: DIMENSIONES & ESPESOR ADAPTATIVO (MICRONES O GRAMAJE) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            
            {/* Dimensiones */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Dimensiones / Medidas *
              </label>
              <input
                type="text"
                value={dimensiones}
                onChange={(e) => setDimensiones(e.target.value)}
                placeholder="Ej: 40x50 cm / 50x60"
                required
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Ancho × Alto (en cm o pulgadas)</span>
            </div>

            {/* Espesor Técnico Adaptativo */}
            <div>
              {esPapel ? (
                <div>
                  <label className="block text-xs font-bold text-amber-900 uppercase mb-1 flex items-center">
                    <FileText className="w-3.5 h-3.5 mr-1 text-amber-700" />
                    Gramaje de Papel Kraft (g/m²)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="30"
                      value={gramaje}
                      onChange={(e) => setGramaje(e.target.value)}
                      placeholder="Ej: 80"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-bold text-slate-900"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">g/m²</span>
                  </div>
                  {/* Chips rápidos de gramaje */}
                  <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto">
                    <span className="text-[10px] text-slate-400">Rápido:</span>
                    {GRAMAJES_COMUNES.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGramaje(g)}
                        className={`px-1.5 py-0.5 text-[11px] rounded-md font-semibold border transition-all ${
                          gramaje === g ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {g}g
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-teal-900 uppercase mb-1 flex items-center">
                    <Layers className="w-3.5 h-3.5 mr-1 text-teal-700" />
                    Espesor en Micrones (μ)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="5"
                      value={micrones}
                      onChange={(e) => setMicrones(e.target.value)}
                      placeholder="Ej: 30"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-bold text-slate-900"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">μ</span>
                  </div>
                  {/* Chips rápidos de micrones */}
                  <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto">
                    <span className="text-[10px] text-slate-400">Rápido:</span>
                    {MICRONES_COMUNES.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMicrones(m)}
                        className={`px-1.5 py-0.5 text-[11px] rounded-md font-semibold border transition-all ${
                          micrones === m ? 'bg-teal-100 text-teal-900 border-teal-300' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {m}μ
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* PASO 4: UNIDADES, PESO Y KILOS CALCULADOS */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-emerald-900 uppercase flex items-center">
                <Calculator className="w-4 h-4 mr-1 text-emerald-600" />
                Carga de Unidades & Peso Real
              </div>

              {/* Conmutador modo balanza */}
              <button
                type="button"
                onClick={() => setModoBalanza(!modoBalanza)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                  modoBalanza
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>{modoBalanza ? '✓ Modo Kilos de Balanza' : 'Ingresar Kilos de Balanza'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Unidades */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cantidad (Unidades) *
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={unidades}
                  onChange={(e) => setUnidades(e.target.value)}
                  placeholder="Ej: 5000"
                  required
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Si está en modo balanza: Kilos pesados */}
              {modoBalanza ? (
                <div>
                  <label className="block text-xs font-semibold text-teal-900 mb-1">
                    Kilos en Balanza (Total) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={kilosBalanza}
                      onChange={(e) => setKilosBalanza(e.target.value)}
                      placeholder="Ej: 125.50"
                      required={modoBalanza}
                      className="w-full px-3 py-2 text-sm bg-white border border-teal-300 rounded-xl font-bold text-teal-950 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">kg</span>
                  </div>
                </div>
              ) : null}

              {/* Peso Unitario */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Peso Unitario (kg/u) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    value={unitWeightKg}
                    onChange={(e) => setUnitWeightKg(e.target.value)}
                    placeholder="Ej: 0.0250"
                    required
                    readOnly={modoBalanza}
                    className={`w-full px-3 py-2 text-sm border rounded-xl font-mono font-bold ${
                      modoBalanza ? 'bg-teal-50/60 border-teal-200 text-teal-900 cursor-not-allowed' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">kg/u</span>
                </div>
              </div>

              {/* Kilos Totales Calculados */}
              <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200 flex flex-col justify-center">
                <span className="text-[11px] font-bold text-emerald-800 uppercase">Kilos Totales:</span>
                <span className="text-lg font-black text-emerald-950 font-mono">
                  {totalCalculatedKg()} <span className="text-xs font-bold text-emerald-700">kg</span>
                </span>
              </div>

            </div>
          </div>

          {/* Opción guardar plantilla */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="guardarPlantillaCheck"
              checked={guardarPlantilla}
              onChange={(e) => setGuardarPlantilla(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500 border-slate-300"
            />
            <label htmlFor="guardarPlantillaCheck" className="text-xs text-slate-700 font-medium select-none cursor-pointer">
              Guardar estas dimensiones y especificaciones como plantilla para la marca <strong>"{marca || '...'}"</strong>
            </label>
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
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs shadow-emerald-600/30 transition-all flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{submitting ? 'Guardando en Supabase...' : 'Registrar Stock en la Marca'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
