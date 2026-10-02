import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Scale, 
  Tag, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Layers,
  FileSpreadsheet,
  Check,
  Sparkles,
  Calendar,
  Boxes,
  DollarSign,
  Info
} from 'lucide-react';
import { api } from '../services/api';

export default function BobinasModal({ isOpen, onClose, product, onBobinasUpdated, existingBrands = [] }) {
  const [availableBrands, setAvailableBrands] = useState([]);
  const [brandProducts, setBrandProducts] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Formulario de Ingreso de Lote de Bobinas
  const [marca, setMarca] = useState('');
  const [isCustomMarca, setIsCustomMarca] = useState(false);
  const [codigoLote, setCodigoLote] = useState('');
  const [cantidadBobinas, setCantidadBobinas] = useState('');
  const [pesoTotalKg, setPesoTotalKg] = useState('');
  const [precioKilo, setPrecioKilo] = useState('');
  const [costoKilo, setCostoKilo] = useState('');
  const [notas, setNotas] = useState('');

  // Asistente sumador rápido (por si pesan varias bobinas en la balanza)
  const [showSumador, setShowSumador] = useState(false);
  const [sumadorText, setSumadorText] = useState('');

  // Lotes existentes para la marca seleccionada
  const [brandLotes, setBrandLotes] = useState([]);
  const [loadingLotes, setLoadingLotes] = useState(false);

  // Cargar marcas disponibles y productos de bobinas
  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resProducts, resModelos] = await Promise.all([
        api.getProducts({ material: 'Bobinas' }),
        api.getModelosBolsas()
      ]);

      const marcasModelos = resModelos.success && resModelos.data ? resModelos.data.map(m => m.marca) : [];
      const prodsList = resProducts.success && resProducts.data ? resProducts.data : [];
      
      const marcasProds = prodsList.map(p => p.brand).filter(Boolean);
      const marcasMap = {};
      prodsList.forEach(p => {
        if (p.brand) marcasMap[p.brand.toLowerCase()] = p;
      });
      setBrandProducts(marcasMap);

      const marcasCombinadas = Array.from(new Set([
        ...existingBrands,
        ...marcasModelos,
        ...marcasProds
      ].filter(Boolean)));

      setAvailableBrands(marcasCombinadas);

      // Preseleccionar marca
      let selectedB = '';
      if (product?.brand && product.brand !== 'General' && product.brand !== 'Sin Marca') {
        selectedB = product.brand;
      } else if (marcasCombinadas.length > 0) {
        selectedB = marcasCombinadas[0];
      }
      setMarca(selectedB);

      if (product?.unit_price && parseFloat(product.unit_price) > 0) {
        setPrecioKilo(String(product.unit_price));
      }

      if (selectedB) {
        loadLotesForBrand(selectedB, marcasMap[selectedB.toLowerCase()]?.id || product?.id);
      }
    } catch (err) {
      console.error('Error al inicializar datos:', err);
      setError('Error al conectar con el catálogo de bobinas');
    } finally {
      setLoading(false);
    }
  };

  // Cargar lotes de la marca seleccionada
  const loadLotesForBrand = async (brandName, prodId = null) => {
    if (!brandName) return;
    setLoadingLotes(true);
    try {
      let targetId = prodId;
      if (!targetId) {
        const prod = brandProducts[brandName.toLowerCase()];
        targetId = prod?.id;
      }
      if (targetId) {
        const res = await api.getProductLotes(targetId);
        if (res.success) {
          setBrandLotes(res.data || []);
        } else {
          setBrandLotes([]);
        }
      } else {
        setBrandLotes([]);
      }
    } catch (err) {
      console.warn('No se pudieron cargar lotes para la marca:', err);
      setBrandLotes([]);
    } finally {
      setLoadingLotes(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const todayCode = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      setCodigoLote(`LOTE-${todayCode}`);
      setCantidadBobinas('');
      setPesoTotalKg('');
      setPrecioKilo(product?.unit_price ? String(product.unit_price) : '');
      setCostoKilo('');
      setNotas('');
      setError(null);
      setSuccessMsg(null);
      setShowSumador(false);
      setSumadorText('');
      setIsCustomMarca(false);
      loadInitialData();
    }
  }, [isOpen, product]);

  // Al cambiar la marca
  const handleMarcaChange = (newMarca) => {
    setMarca(newMarca);
    const prod = brandProducts[newMarca.toLowerCase()];
    if (prod && prod.unit_price && parseFloat(prod.unit_price) > 0) {
      setPrecioKilo(String(prod.unit_price));
    }
    loadLotesForBrand(newMarca, prod?.id);
  };

  // Sumador rápido de pesadas en balanza (ej: 21.5 + 22.0 + 23.4)
  const parseSumadorWeights = () => {
    if (!sumadorText.trim()) return [];
    const matches = sumadorText.match(/\d+(?:[.,]\d+)?/g) || [];
    return matches
      .map(w => parseFloat(w.replace(',', '.')))
      .filter(w => !isNaN(w) && w > 0);
  };

  const sumadorWeights = parseSumadorWeights();
  const sumadorTotalKg = sumadorWeights.reduce((acc, w) => acc + w, 0);

  const handleApplySumador = () => {
    if (sumadorWeights.length > 0) {
      setCantidadBobinas(String(sumadorWeights.length));
      setPesoTotalKg(String(sumadorTotalKg.toFixed(2)));
      setShowSumador(false);
    }
  };

  // Cálculos en vivo
  const parsedQty = parseInt(cantidadBobinas, 10) || 0;
  const parsedTotalKg = parseFloat(pesoTotalKg) || 0;
  const parsedPrecioKg = parseFloat(precioKilo) || 0;
  const avgKgPerBobina = parsedQty > 0 ? (parsedTotalKg / parsedQty).toFixed(2) : 0;
  const valorTotalLote = (parsedTotalKg * parsedPrecioKg).toFixed(2);

  // Totales acumulados de la marca
  const totalBobinasMarca = brandLotes.reduce((acc, l) => acc + (l.cantidad_actual || 0), 0);
  const totalKgMarca = brandLotes.reduce((acc, l) => acc + (l.peso_total_kg || 0), 0);

  // Manejador para guardar el lote
  const handleSaveLote = async (e) => {
    e.preventDefault();
    if (!marca.trim()) {
      setError('Debes seleccionar o escribir la Marca de las bobinas');
      return;
    }
    if (parsedTotalKg <= 0) {
      setError('El peso total del lote en balanza debe ser mayor a 0 kg');
      return;
    }
    if (parsedQty <= 0) {
      setError('Debes ingresar la cantidad de bobinas que entraron');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const prod = brandProducts[marca.trim().toLowerCase()] || product;
      const targetProductId = prod?.id || null;

      const res = await api.createProductLote(targetProductId, {
        marca: marca.trim(),
        codigo_lote: codigoLote.trim() || `LOTE-${Date.now().toString().slice(-4)}`,
        cantidad_inicial: parsedQty,
        cantidad_actual: parsedQty,
        peso_total_kg: parsedTotalKg,
        precio_kilo: parsedPrecioKg,
        costo_unitario: parseFloat(costoKilo) || 0,
        notas: notas.trim()
      });

      if (res.success) {
        setSuccessMsg(`¡Lote ${codigoLote} guardado con éxito! Se sumaron ${parsedQty} bobinas (${parsedTotalKg} kg) para la marca "${marca.trim()}".`);
        setPesoTotalKg('');
        setCantidadBobinas('');
        setNotas('');
        const todayCode = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        setCodigoLote(`LOTE-${todayCode}-${Date.now().toString().slice(-3)}`);
        
        await loadLotesForBrand(marca.trim(), targetProductId);
        if (onBobinasUpdated) onBobinasUpdated();
      } else {
        setError(res.error || 'No se pudo guardar el lote de bobinas');
      }
    } catch (err) {
      console.error('Error al guardar lote:', err);
      setError('Error al comunicar con el servidor: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLote = async (loteId, code) => {
    if (!window.confirm(`¿Estás seguro de anular el ${code}? Se restarán los kilos y bobinas del stock de la marca.`)) return;
    try {
      const res = await api.deleteProductLote(loteId);
      if (res.success) {
        setSuccessMsg(`Lote ${code} eliminado y stock recalculado.`);
        await loadLotesForBrand(marca);
        if (onBobinasUpdated) onBobinasUpdated();
      } else {
        setError(res.error || 'Error al eliminar lote');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh]">
        
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-cyan-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Boxes className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                Ingreso de Lotes de Bobinas
                <span className="text-xs bg-emerald-700/80 px-2 py-0.5 rounded-full text-emerald-200 border border-emerald-500/30">
                  Control por Balanza & Precio $/kg
                </span>
              </h3>
              <p className="text-xs text-emerald-200/80">
                Almacena bobinas agrupadas por marca y lote con pesaje de balanza y cálculo de venta por kilo.
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

        {/* Notificaciones */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-6">

          {/* Formulario Principal de Carga de Lote */}
          <form onSubmit={handleSaveLote} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-5">
            
            {/* 1. SELECCIÓN DE MARCA */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center">
                  <Tag className="w-4 h-4 mr-1.5 text-emerald-600" />
                  1. Marca / Fabricante de la Bobina *
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomMarca(!isCustomMarca)}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
                >
                  {isCustomMarca ? '← Elegir de la lista' : '+ Nueva marca'}
                </button>
              </div>

              {isCustomMarca ? (
                <input
                  type="text"
                  value={marca}
                  onChange={(e) => handleMarcaChange(e.target.value)}
                  placeholder="Ej: Ivana, El Marqués, Romipack..."
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-white border-2 border-emerald-500 rounded-xl font-bold text-slate-900 focus:outline-none shadow-xs"
                />
              ) : (
                <div className="space-y-2">
                  <select
                    value={marca}
                    onChange={(e) => handleMarcaChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                  >
                    <option value="">-- Elige la marca que ingresa --</option>
                    {availableBrands.map((b) => (
                      <option key={b} value={b}>
                        🏷️ Marca: {b}
                      </option>
                    ))}
                  </select>

                  {/* Chips rápidos de marcas registradas */}
                  {availableBrands.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-slate-400 font-medium">Sugerencias:</span>
                      {availableBrands.slice(0, 8).map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => handleMarcaChange(b)}
                          className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition-all flex items-center space-x-1 ${
                            marca === b 
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs' 
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span>{b}</span>
                          {marca === b && <Check className="w-3 h-3 ml-0.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. CAMPOS DEL LOTE: CÓDIGO, CANTIDAD, PESO TOTAL Y PRECIO */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              
              {/* Código de Lote o Remito */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  Nº Lote / Remito *
                </label>
                <input
                  type="text"
                  value={codigoLote}
                  onChange={(e) => setCodigoLote(e.target.value)}
                  placeholder="Ej: REM-504 o LOTE-1"
                  required
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Cantidad de Bobinas Físicas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                  <Boxes className="w-3.5 h-3.5 mr-1 text-teal-600" />
                  Cantidad de Bobinas *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={cantidadBobinas}
                    onChange={(e) => setCantidadBobinas(e.target.value)}
                    placeholder="Ej: 10"
                    required
                    className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">bob.</span>
                </div>
              </div>

              {/* Peso Total en Balanza (kg) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center">
                    <Scale className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Peso Total Lote *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSumador(!showSumador)}
                    className="text-[10px] text-teal-700 hover:text-teal-900 font-bold underline"
                    title="Si pesaste en tandas en la balanza"
                  >
                    {showSumador ? 'Cerrar sumador' : '+ Sumar pesadas'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    step="0.01"
                    value={pesoTotalKg}
                    onChange={(e) => setPesoTotalKg(e.target.value)}
                    placeholder="Ej: 215.5"
                    required
                    className="w-full pl-3 pr-8 py-2 text-sm bg-white border-2 border-emerald-500 rounded-xl font-mono font-black text-emerald-950 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-emerald-700">kg</span>
                </div>
              </div>

              {/* Precio de Venta por Kilo ($/kg) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                  <DollarSign className="w-3.5 h-3.5 mr-0.5 text-blue-600" />
                  Precio Venta ($/kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={precioKilo}
                    onChange={(e) => setPrecioKilo(e.target.value)}
                    placeholder="Ej: 3500"
                    className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">$/kg</span>
                </div>
              </div>

            </div>

            {/* Sumador rápido desplegable si pesaron varias tandas */}
            {showSumador && (
              <div className="bg-teal-50/80 p-3.5 rounded-xl border border-teal-200 space-y-2 animate-in fade-in duration-150">
                <span className="text-xs font-bold text-teal-950 flex items-center">
                  <Scale className="w-3.5 h-3.5 mr-1 text-teal-700" />
                  Sumador de Balanza: Pega o escribe los pesos separados por espacio o suma (ej: 21.4 22.1 20.8 23.5)
                </span>
                <textarea
                  rows={2}
                  value={sumadorText}
                  onChange={(e) => setSumadorText(e.target.value)}
                  placeholder="21.5 22.0 21.8 22.5 23.0"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-teal-300 rounded-lg font-mono font-semibold"
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-teal-900 font-medium">
                    Detectadas: <strong>{sumadorWeights.length} bobinas</strong> | Total: <strong>{sumadorTotalKg.toFixed(2)} kg</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleApplySumador}
                    disabled={sumadorWeights.length === 0}
                    className="px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold text-xs shadow-2xs disabled:opacity-50"
                  >
                    Usar estos valores en el lote
                  </button>
                </div>
              </div>
            )}

            {/* Notas opcionales */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Notas / Micronaje / Observaciones del lote
              </label>
              <input
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej: Remito distribuidor, 40 micrones, ancho 60cm..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
              />
            </div>

            {/* Tarjeta de Cálculo en Vivo & Resumen del Lote */}
            {parsedTotalKg > 0 && (
              <div className="bg-white p-4 rounded-xl border border-emerald-300 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-6 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Bobinas</span>
                    <strong className="text-base text-slate-800 font-mono">{parsedQty} bobinas</strong>
                  </div>
                  <div className="h-7 w-px bg-slate-200" />
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Peso Promedio</span>
                    <strong className="text-base text-teal-800 font-mono">~{avgKgPerBobina} kg/bobina</strong>
                  </div>
                  <div className="h-7 w-px bg-slate-200" />
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Kilos Totales</span>
                    <strong className="text-base text-emerald-700 font-mono">{parsedTotalKg.toFixed(2)} kg</strong>
                  </div>
                  {parsedPrecioKg > 0 && (
                    <>
                      <div className="h-7 w-px bg-slate-200" />
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Valor Estimado</span>
                        <strong className="text-base text-blue-700 font-mono">${Number(valorTotalLote).toLocaleString('es-AR')}</strong>
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting || !marca.trim() || parsedTotalKg <= 0}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-black text-sm shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{submitting ? 'Guardando...' : `Guardar Lote de ${marca}`}</span>
                </button>
              </div>
            )}

            {!parsedTotalKg && (
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !marca.trim() || parsedTotalKg <= 0}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Guardar Lote de Bobinas</span>
                </button>
              </div>
            )}

          </form>

          {/* SECCIÓN 3: LOTES Y PARTIDAS EXISTENTES DE LA MARCA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center">
                  <Layers className="w-4 h-4 mr-1 text-emerald-600" />
                  Lotes Ingresados para "{marca || 'Selecciona una marca'}" ({brandLotes.length})
                </h4>
                <p className="text-[11px] text-slate-400">
                  Histórico de partidas de esta marca con su peso restante y precio por kilo
                </p>
              </div>

              {/* Ficha Resumen de la Marca en General */}
              {marca && totalKgMarca > 0 && (
                <div className="flex items-center space-x-3 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs">
                  <span className="text-emerald-950 font-bold">Total Marca:</span>
                  <span className="font-mono font-bold text-teal-800">{totalBobinasMarca} bobinas</span>
                  <span className="text-slate-300">|</span>
                  <span className="font-mono font-black text-emerald-900">{totalKgMarca.toFixed(2)} kg</span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    <th className="px-4 py-2.5">Código Lote / Remito</th>
                    <th className="px-4 py-2.5">Fecha</th>
                    <th className="px-4 py-2.5 text-center">Bobinas</th>
                    <th className="px-4 py-2.5 text-right bg-emerald-50/70 text-emerald-950">Kilos Lote</th>
                    <th className="px-4 py-2.5 text-right">Promedio</th>
                    <th className="px-4 py-2.5 text-right">Precio $/kg</th>
                    <th className="px-4 py-2.5 text-center">Estado</th>
                    <th className="px-4 py-2.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingLotes ? (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-600" />
                        Cargando lotes de la marca...
                      </td>
                    </tr>
                  ) : brandLotes.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-slate-400">
                        <Boxes className="w-7 h-7 mx-auto mb-1 text-slate-300" />
                        No hay lotes ingresados aún para esta marca.
                      </td>
                    </tr>
                  ) : (
                    brandLotes.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-2.5 font-mono font-bold text-slate-900">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            {l.codigo_lote}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                          {new Date(l.fecha_ingreso).toLocaleDateString('es-AR')}
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono font-bold text-slate-800">
                          {l.cantidad_actual} <span className="text-[10px] text-slate-400 font-normal">/ {l.cantidad_inicial}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-black text-emerald-800 bg-emerald-50/40 text-sm whitespace-nowrap">
                          {l.peso_total_kg.toFixed(2)} <span className="text-xs font-normal text-emerald-600">kg</span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-teal-700 text-xs">
                          {l.peso_unitario_kg ? l.peso_unitario_kg.toFixed(2) : '-'} kg
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-blue-900">
                          {l.precio_kilo ? `$${Number(l.precio_kilo).toLocaleString('es-AR')}` : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            l.estado === 'Disponible' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {l.estado}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            onClick={() => handleDeleteLote(l.id, l.codigo_lote)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Eliminar este lote y recalcular stock"
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
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center">
            <Info className="w-3.5 h-3.5 mr-1 text-slate-400" />
            <span>Al cargar el lote, los kilos y bobinas se suman automáticamente a la marca en el inventario.</span>
          </div>
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
