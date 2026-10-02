import React, { useState, useEffect } from 'react';
import { 
  X, 
  Scale, 
  Package, 
  Tag, 
  Check, 
  Bookmark, 
  Calculator, 
  AlertCircle,
  FileText,
  Layers,
  ArrowRight,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  Truck,
  Clock
} from 'lucide-react';
import { api } from '../services/api';

export default function CargarStockBolsasModal({ 
  isOpen, 
  onClose, 
  onProductSaved, 
  onOpenConfigurarMarca,
  products = []
}) {
  const [modelos, setModelos] = useState([]);
  const [loadingModelos, setLoadingModelos] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Selección de Marca y Modelo (Marca ahora es opcional y por defecto 'Sin Marca')
  const [selectedMarca, setSelectedMarca] = useState('Sin Marca');
  const [selectedModeloId, setSelectedModeloId] = useState('');

  // Especificaciones manuales para bolsas sin marca o con medida directa
  const [customCategory, setCustomCategory] = useState('Bolsas de Polietileno');
  const [customDimensions, setCustomDimensions] = useState('33x62 + F5 cm');
  const [customMicrones, setCustomMicrones] = useState('40');
  const [customGramaje, setCustomGramaje] = useState('');

  // Campos de Stock y Kilos
  const [unidades, setUnidades] = useState('');
  // Calculadora de Fardos opcional
  const [showFardosCalc, setShowFardosCalc] = useState(false);
  const [cantFardos, setCantFardos] = useState('');
  const [bolsasPorFardo, setBolsasPorFardo] = useState('1500');
  const [fardoPico, setFardoPico] = useState('');

  // Lote / Partida y Estado del Stock
  const [codigoLote, setCodigoLote] = useState('');
  const [estadoLote, setEstadoLote] = useState('Disponible'); // 'Disponible' | 'En Tránsito' | 'Pendiente'
  const [notasLote, setNotasLote] = useState('');

  // Precios opcionales
  const [unitPrice, setUnitPrice] = useState('0');
  const [costPrice, setCostPrice] = useState('0');

  const [existingProducts, setExistingProducts] = useState(products || []);

  useEffect(() => {
    if (products && products.length > 0) {
      setExistingProducts(products);
    }
  }, [products]);

  // Cargar todos los modelos/fichas técnicas de marcas y productos al abrir
  useEffect(() => {
    if (isOpen) {
      loadModelos();
      setError(null);
      setUnidades('');
      setCantFardos('');
      setFardoPico('');
      setCodigoLote('');
      setEstadoLote('Disponible');
      setNotasLote('');
      setSelectedMarca('Sin Marca');
      setCustomDimensions('33x62 + F5 cm');
      setCustomMicrones('40');
    }
  }, [isOpen]);

  const loadModelos = async () => {
    setLoadingModelos(true);
    try {
      const [resModelos, resProducts] = await Promise.all([
        api.getModelosBolsas(),
        api.getProducts(),
      ]);
      if (resModelos.success && resModelos.data) {
        setModelos(resModelos.data);
      }
      if (resProducts.success && resProducts.data) {
        setExistingProducts(resProducts.data);
      }
    } catch (err) {
      console.error('Error al cargar modelos de bolsas:', err);
      setError('No se pudieron cargar las marcas configuradas');
    } finally {
      setLoadingModelos(false);
    }
  };

  // Lista única de marcas configuradas (filtrando 'Sin Marca' para ordenarlo)
  const distinctMarcas = Array.from(new Set(modelos.map((m) => m.marca).filter(Boolean)));

  // Modelos/medidas disponibles para la marca seleccionada
  const modelosDeMarca = modelos.filter(
    (m) => m.marca.toLowerCase() === (selectedMarca || 'Sin Marca').toLowerCase()
  );

  // Modelo actualmente seleccionado
  const currentModelo = modelosDeMarca.find((m) => m.id.toString() === selectedModeloId) || modelosDeMarca[0] || null;

  // Detección de producto idéntico existente en inventario
  const norm = (str) => (str || '').replace(/\s+/g, '').toLowerCase();

  const brandToCompare = (selectedMarca && selectedMarca.trim()) ? selectedMarca.trim() : 'Sin Marca';
  const categoryToCompare = currentModelo ? currentModelo.categoria_material : customCategory;
  const dimensionsToCompare = currentModelo ? currentModelo.dimensiones : customDimensions;
  const micronesToCompare = currentModelo ? currentModelo.micrones : (customMicrones ? parseInt(customMicrones, 10) : null);
  const gramajeToCompare = currentModelo ? currentModelo.gramaje : (customGramaje ? parseInt(customGramaje, 10) : null);

  const matchedProduct = existingProducts.find((p) => {
    const prodBrand = p.brand || 'Sin Marca';
    const sameBrand = prodBrand.trim().toLowerCase() === brandToCompare.toLowerCase();
    const sameType = (p.bag_type || '') === categoryToCompare;
    const sameDim = norm(p.dimensions) === norm(dimensionsToCompare);
    const sameMicrones = (p.micrones || null) === (micronesToCompare || null);
    const sameGramaje = (p.gramaje || null) === (gramajeToCompare || null);

    return sameBrand && sameType && sameDim && sameMicrones && sameGramaje;
  });

  // Actualizar marca
  const handleMarcaChange = (newMarca) => {
    setSelectedMarca(newMarca);
    const disponibles = modelos.filter((m) => m.marca.toLowerCase() === newMarca.toLowerCase());
    if (disponibles.length > 0) {
      setSelectedModeloId(disponibles[0].id.toString());
    } else {
      setSelectedModeloId('');
    }
  };

  const handleModeloSelect = (m) => {
    setSelectedModeloId(m.id.toString());
  };

  // Calculadora de Fardos: aplicar al campo de unidades
  const totalFardosCalculado = () => {
    const f = parseInt(cantFardos, 10) || 0;
    const b = parseInt(bolsasPorFardo, 10) || 0;
    const p = parseInt(fardoPico, 10) || 0;
    return (f * b) + p;
  };

  const handleAplicarFardos = () => {
    const total = totalFardosCalculado();
    if (total > 0) {
      setUnidades(total.toString());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const brandName = (selectedMarca && selectedMarca.trim() && selectedMarca.trim() !== 'Sin Marca') 
      ? selectedMarca.trim() 
      : 'Sin Marca';

    const categoria = currentModelo ? currentModelo.categoria_material : customCategory;
    const dimensiones = currentModelo ? currentModelo.dimensiones : (customDimensions.trim() || '33x62 + F5 cm');
    const micrones = currentModelo ? currentModelo.micrones : (customMicrones ? parseInt(customMicrones, 10) : null);
    const gramaje = currentModelo ? currentModelo.gramaje : (customGramaje ? parseInt(customGramaje, 10) : null);

    if (!dimensiones) {
      setError('Debes especificar las dimensiones de la bolsa (ej: 33x62 + F5 cm)');
      return;
    }

    const qty = parseInt(unidades, 10);
    if (isNaN(qty) || qty <= 0) {
      setError('Debes ingresar una cantidad válida de unidades (ej: 15.720)');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const esPapel = categoria === 'Bolsas de Papel Kraft';
      const cleanBrandTag = brandName !== 'Sin Marca' ? brandName.substring(0, 3).toUpperCase() : 'GEN';
      const sku = matchedProduct 
        ? matchedProduct.sku 
        : `BOL-${cleanBrandTag}-${Date.now().toString().slice(-4)}`;
      
      const thicknessText = esPapel
        ? (gramaje ? ` ${gramaje}g` : '')
        : (micrones ? ` ${micrones}μ` : '');

      const nombreProducto = matchedProduct 
        ? matchedProduct.name 
        : (brandName !== 'Sin Marca' 
            ? `${brandName} - ${categoria} ${dimensiones}${thicknessText}` 
            : `${categoria} ${dimensiones}${thicknessText}`);

      const payload = {
        sku,
        name: nombreProducto,
        brand: brandName,
        bag_type: categoria,
        material: esPapel ? 'Kraft' : 'Polietileno',
        dimensions: dimensiones,
        micrones: micrones || null,
        gramaje: gramaje || null,
        stock_quantity: qty,
        unit_weight_kg: 0, // Las bolsas se controlan exclusivamente por unidades
        min_stock_alert: matchedProduct ? matchedProduct.min_stock_alert : 500,
        unit_price: parseFloat(unitPrice) || 0,
        cost_price: parseFloat(costPrice) || 0,
        codigo_lote: codigoLote.trim() || undefined,
        estado_lote: estadoLote,
        notas_lote: notasLote.trim() || undefined,
        description: brandName !== 'Sin Marca'
          ? `Fardo de bolsas marca ${brandName} (${dimensiones}) - ${categoria}${thicknessText}`
          : `Fardo de bolsas genéricas (${dimensiones}) - ${categoria}${thicknessText}`,
      };

      const res = await api.createProduct(payload);
      if (res.success) {
        if (onProductSaved) onProductSaved();
        onClose();
      } else {
        setError(res.error || 'Error al guardar el stock de bolsas');
      }
    } catch (err) {
      setError('Error al comunicar con el servidor: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh]">
        
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Package className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                Cargar Stock de Bolsas
              </h3>
              <p className="text-xs text-emerald-100/80">
                La marca es opcional. Puedes cargar bolsas con marca o genéricas directamente por unidades de remito.
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
          
          {/* PASO 1: SELECCIÓN DIRECTA DE MARCA (OPCIONAL) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
                <Tag className="w-4 h-4 mr-1 text-emerald-600" />
                1. Marca de la Bolsa <span className="text-slate-400 font-medium normal-case ml-1">(opcional)</span>
              </label>
              {onOpenConfigurarMarca && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenConfigurarMarca();
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 hover:underline"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Configurar nueva marca</span>
                </button>
              )}
            </div>

            {/* Selector de Marca con opción Sin Marca */}
            <div className="space-y-2">
              <select
                value={selectedMarca}
                onChange={(e) => handleMarcaChange(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
              >
                <option value="Sin Marca">🏷️ Sin Marca (Bolsas genéricas sin marca)</option>
                {distinctMarcas.filter(m => m !== 'Sin Marca' && m !== 'General').map((m) => (
                  <option key={m} value={m}>
                    🏷️ {m} ({modelos.filter((mod) => mod.marca.toLowerCase() === m.toLowerCase()).length} medidas registradas)
                  </option>
                ))}
              </select>

              {/* Botones de acceso rápido */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-slate-400 font-medium">Marcas rápidas:</span>
                <button
                  type="button"
                  onClick={() => handleMarcaChange('Sin Marca')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition-all ${
                    selectedMarca === 'Sin Marca' || !selectedMarca
                      ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  🏷️ Sin Marca
                </button>
                {distinctMarcas.filter(m => m !== 'Sin Marca' && m !== 'General').map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMarcaChange(m)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition-all ${
                      selectedMarca === m
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    🏷️ {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Si la marca tiene varias medidas registradas */}
            {modelosDeMarca.length > 1 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-600 uppercase">
                  Medida registrada a cargar:
                </span>
                <div className="flex flex-wrap gap-2">
                  {modelosDeMarca.map((mod) => {
                    const isSelected = mod.id.toString() === selectedModeloId;
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => handleModeloSelect(mod)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1.5 ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>{mod.dimensiones}</span>
                        <span className="text-[10px] opacity-80">
                          ({mod.micrones ? `${mod.micrones}μ` : mod.gramaje ? `${mod.gramaje}g` : mod.categoria_material})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* FICHA TÉCNICA HEREDADA O ENTRADA DIRECTA */}
          {currentModelo ? (
            <div className="bg-gradient-to-br from-slate-50 to-emerald-50/40 p-4 rounded-xl border border-emerald-200/80 space-y-2">
              <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center">
                <Bookmark className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Especificaciones de la Marca Seleccionada
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-semibold">Marca</span>
                  <span className="font-extrabold text-slate-900">{selectedMarca}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-semibold">Tipo</span>
                  <span className="font-bold text-slate-800">{currentModelo.categoria_material}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-semibold">Medidas</span>
                  <span className="font-extrabold text-emerald-700">{currentModelo.dimensiones}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-semibold">Espesor / Gramaje</span>
                  <span className="font-bold text-slate-800">
                    {currentModelo.micrones ? `${currentModelo.micrones} μ` : currentModelo.gramaje ? `${currentModelo.gramaje} g/m²` : 'Estándar'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-800 flex items-center">
                  <Bookmark className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Especificaciones de la Bolsa ({selectedMarca})
                </span>
                <span className="text-[11px] text-slate-500">Sin ficha técnica previa</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Medidas */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Dimensiones / Medidas *
                  </label>
                  <input
                    type="text"
                    value={customDimensions}
                    onChange={(e) => setCustomDimensions(e.target.value)}
                    placeholder="ej: 33x62 + F5 cm o 40x50 cm"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['33x62 + F5 cm', '40x50 cm', '50x60 cm', '60x80 cm'].map((dim) => (
                      <button
                        key={dim}
                        type="button"
                        onClick={() => setCustomDimensions(dim)}
                        className="px-2 py-0.5 text-[10px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded"
                      >
                        {dim}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Micrones */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Espesor en Micrones (μ)
                  </label>
                  <input
                    type="number"
                    value={customMicrones}
                    onChange={(e) => setCustomMicrones(e.target.value)}
                    placeholder="ej: 40"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[30, 40, 50, 60].map((mic) => (
                      <button
                        key={mic}
                        type="button"
                        onClick={() => setCustomMicrones(mic.toString())}
                        className="px-2 py-0.5 text-[10px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded"
                      >
                        {mic}μ
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ALERTA DE PRODUCTO COINCIDENTE EN INVENTARIO */}
          {matchedProduct && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center space-x-2 text-xs text-blue-900">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Se acumulará al producto existente: <strong>{matchedProduct.name}</strong> (Stock actual: {matchedProduct.stock_quantity.toLocaleString()} u.).
              </span>
            </div>
          )}

          {/* PASO 2: INGRESO DE UNIDADES DE STOCK */}
          <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center">
                <Package className="w-4 h-4 mr-1 text-emerald-600" />
                2. Cantidad Total de Bolsas del Remito (Unidades) *
              </label>
              <button
                type="button"
                onClick={() => setShowFardosCalc(!showFardosCalc)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>{showFardosCalc ? 'Ocultar calculadora' : 'Calculadora de fardos'}</span>
              </button>
            </div>

            {/* Asistente Calculadora de Fardos */}
            {showFardosCalc && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-slate-700 flex items-center">
                  <Calculator className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  Calcular total sumando fardos y bolsas sueltas:
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Cant. Fardos</label>
                    <input
                      type="number"
                      value={cantFardos}
                      onChange={(e) => setCantFardos(e.target.value)}
                      placeholder="ej: 10"
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Bolsas x Fardo</label>
                    <input
                      type="number"
                      value={bolsasPorFardo}
                      onChange={(e) => setBolsasPorFardo(e.target.value)}
                      placeholder="1500"
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Fardo Pico / Sueltas</label>
                    <input
                      type="number"
                      value={fardoPico}
                      onChange={(e) => setFardoPico(e.target.value)}
                      placeholder="ej: 720"
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-600 font-medium">
                    Total calculado: <strong className="text-emerald-700 text-sm font-mono">{totalFardosCalculado().toLocaleString()} u.</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleAplicarFardos}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-all"
                  >
                    Usar este total
                  </button>
                </div>
              </div>
            )}

            {/* Input Directo de Unidades */}
            <div className="relative">
              <input
                type="number"
                value={unidades}
                onChange={(e) => setUnidades(e.target.value)}
                placeholder="Ingresa la cantidad exacta (ej: 15720 o 42700)"
                required
                min="1"
                className="w-full px-4 py-3 text-lg font-extrabold text-slate-900 bg-white border-2 border-emerald-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-xs"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                unidades
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              💡 Ingresa el total que figura en el remito. No es necesario pesar los fardos; las bolsas se controlan 100% por unidades.
            </p>
          </div>

          {/* PASO 3: IDENTIFICACIÓN DEL LOTE Y ESTADO DEL STOCK */}
          <div className="space-y-3 bg-gradient-to-br from-slate-50 to-teal-50/20 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center">
                <Layers className="w-4 h-4 mr-1 text-emerald-600" />
                3. Control de Lote / Remito y Estado del Stock
              </label>
              <span className="text-[11px] font-semibold text-slate-500">Seguimiento de partida</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Código de Lote o Remito */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Código de Lote o N° de Remito <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={codigoLote}
                  onChange={(e) => setCodigoLote(e.target.value)}
                  placeholder="ej: REM-4820 o LOTE-B1"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Si se deja vacío se asigna automáticamente (ej: LOTE-1, LOTE-2...)
                </span>
              </div>

              {/* Estado del Lote */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Estado del Lote *
                </label>
                <select
                  value={estadoLote}
                  onChange={(e) => setEstadoLote(e.target.value)}
                  className={`w-full px-3 py-2 text-xs font-bold rounded-lg border focus:outline-none focus:ring-2 shadow-2xs transition-all ${
                    estadoLote === 'Disponible'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 focus:ring-emerald-500/20'
                      : estadoLote === 'En Tránsito'
                      ? 'bg-amber-50 text-amber-900 border-amber-300 focus:ring-amber-500/20'
                      : 'bg-blue-50 text-blue-900 border-blue-300 focus:ring-blue-500/20'
                  }`}
                >
                  <option value="Disponible">🟢 Disponible (En depósito listo para vender)</option>
                  <option value="En Tránsito">🚚 En Tránsito (Despachado / En viaje)</option>
                  <option value="Pendiente">⏳ Pendiente (En depósito pero pendiente de control)</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block font-medium">
                  {estadoLote === 'Disponible' 
                    ? '✅ Sumará inmediatamente al stock disponible para ventas.' 
                    : 'ℹ️ Quedará registrado para seguimiento pero no sumará al stock vendible hasta cambiarlo a Disponible.'}
                </span>
              </div>
            </div>

            {/* Notas opcionales */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Notas / Observaciones del lote <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={notasLote}
                onChange={(e) => setNotasLote(e.target.value)}
                placeholder="ej: Fardos x 1500 u. Transporte La Sevillanita, chofer Carlos..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-md shadow-emerald-600/30 transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Package className="w-4 h-4" />
              <span>{submitting ? 'Guardando...' : 'Confirmar Stock de Bolsas'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
