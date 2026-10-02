import React, { useState, useEffect } from 'react';
import { 
  X, 
  Tag, 
  Check, 
  Bookmark, 
  AlertCircle, 
  FileText, 
  Layers, 
  Trash2,
  CheckCircle2,
  Sparkles
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

export default function ConfigurarMarcaModal({ isOpen, onClose, onMarcaSaved, existingBrands = [] }) {
  const [marca, setMarca] = useState('');
  const [categoria, setCategoria] = useState('Bolsas de Polietileno');
  const [dimensiones, setDimensiones] = useState('');
  const [micrones, setMicrones] = useState('');
  const [gramaje, setGramaje] = useState('');
  const [pesoReferencia, setPesoReferencia] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Fichas guardadas para la marca seleccionada
  const [savedModelos, setSavedModelos] = useState([]);
  const [loadingModelos, setLoadingModelos] = useState(false);

  const esPapel = categoria === 'Bolsas de Papel Kraft';

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      if (existingBrands.length > 0 && !marca) {
        const first = existingBrands[0];
        setMarca(first !== 'General' && first !== 'Sin Marca' ? first : '');
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const brandToFetch = marca.trim() || 'Sin Marca';
    fetchModelosDeMarca(brandToFetch);
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

  const handleSelectModelo = (m) => {
    setCategoria(m.categoria_material || 'Bolsas de Polietileno');
    setDimensiones(m.dimensiones || '');
    if (m.micrones) setMicrones(m.micrones.toString());
    if (m.gramaje) setGramaje(m.gramaje.toString());
    if (m.peso_unitario_referencia && parseFloat(m.peso_unitario_referencia) > 0) {
      setPesoReferencia(m.peso_unitario_referencia.toString());
    }
  };

  const handleDeleteModelo = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('¿Seguro que deseas eliminar esta ficha técnica de la marca?')) return;
    try {
      const res = await api.deleteModeloBolsa(id);
      if (res.success) {
        const brandToFetch = marca.trim() || 'Sin Marca';
        fetchModelosDeMarca(brandToFetch);
        if (onMarcaSaved) onMarcaSaved();
      }
    } catch (err) {
      console.error('Error al eliminar modelo:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalMarca = marca.trim() || 'Sin Marca';
    
    if (!dimensiones.trim()) {
      setError('Debes ingresar las Dimensiones / Medidas (ej: 40x50 cm o 33x62 + F5 cm)');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = {
        marca: finalMarca,
        nombre_tipo: `${categoria} ${dimensiones.trim()}`,
        categoria_material: categoria,
        dimensiones: dimensiones.trim(),
        micrones: !esPapel && micrones ? parseInt(micrones, 10) : null,
        gramaje: esPapel && gramaje ? parseInt(gramaje, 10) : null,
        peso_unitario_referencia: pesoReferencia ? parseFloat(pesoReferencia) : 0,
        caracteristicas: esPapel 
          ? `Papel Kraft ${gramaje ? `${gramaje}g` : ''}` 
          : `Polietileno ${micrones ? `${micrones}μ` : ''}`,
      };

      const res = await api.saveModeloBolsa(payload);
      if (res.success) {
        setSuccessMsg(`¡Ficha técnica guardada exitosamente para "${finalMarca}"!`);
        fetchModelosDeMarca(finalMarca);
        if (onMarcaSaved) onMarcaSaved();
        
        // Limpiar campos para permitir agregar otra medida si se desea
        setDimensiones('');
        setMicrones('');
        setGramaje('');
        setPesoReferencia('');
      } else {
        setError(res.error || 'Error al guardar la ficha técnica');
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
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Tag className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                Configurar Ficha Técnica de Bolsas
              </h3>
              <p className="text-xs text-emerald-200/80">
                La marca es opcional. Puedes guardar especificaciones para marcas específicas o genéricas (Sin Marca).
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

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          
          {/* 1. MARCA DEL PRODUCTO (OPCIONAL) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Marca del Producto <span className="text-slate-400 font-medium normal-case">(opcional - vacío para "Sin Marca")</span>
              </label>
              {marca && (
                <button
                  type="button"
                  onClick={() => setMarca('')}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold underline"
                >
                  Dejar Sin Marca
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                list="marcas-existentes-list"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="Escribe la Marca o deja vacío si es Sin Marca (ej: ivana, salvador...)"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <datalist id="marcas-existentes-list">
                {existingBrands.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            {/* Chips rápidos de sugerencia */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-slate-400 font-medium">Sugeridos:</span>
              <button
                type="button"
                onClick={() => setMarca('')}
                className={`px-2 py-0.5 text-xs rounded-lg font-bold border transition-all ${
                  !marca.trim() ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                🏷️ Sin Marca
              </button>
              {existingBrands.filter(b => b && b !== 'General' && b !== 'Sin Marca').map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setMarca(b)}
                  className={`px-2 py-0.5 text-xs rounded-lg font-bold border transition-all ${
                    marca === b ? 'bg-purple-700 text-white border-purple-700' : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                  }`}
                >
                  🏷️ {b}
                </button>
              ))}
            </div>

            {/* Fichas guardadas para esta marca */}
            {savedModelos.length > 0 && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-900 flex items-center">
                  <Bookmark className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Medidas y Fichas ya registradas para "{marca.trim() || 'Sin Marca'}":
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {savedModelos.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => handleSelectModelo(m)}
                      className="group cursor-pointer px-2.5 py-1 text-xs font-medium bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg shadow-2xs transition-all flex items-center space-x-1.5"
                      title="Haz clic para cargar estos valores en el formulario"
                    >
                      <span className="font-bold">{m.dimensiones}</span>
                      <span className="text-[10px] text-slate-500">
                        ({m.micrones ? `${m.micrones}μ` : m.gramaje ? `${m.gramaje}g` : m.categoria_material})
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteModelo(m.id, e)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-all ml-1"
                        title="Eliminar esta medida"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. TIPO DE BOLSA / MATERIAL (6 CATEGORÍAS EXACTAS) */}
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
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold shadow-xs' 
                        : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-base">{cat.icon}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <span className="text-xs leading-tight">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. MEDIDAS Y ESPECIFICACIONES TÉCNICAS */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
              3. Medidas y Especificaciones Técnicas *
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Dimensiones */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Dimensiones / Medidas *
                </label>
                <input
                  type="text"
                  value={dimensiones}
                  onChange={(e) => setDimensiones(e.target.value)}
                  placeholder={esPapel ? "ej: 22x30 + F10 cm" : "ej: 33x62 + F5 cm o 40x50 cm"}
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(esPapel 
                    ? ['18x24 + F8 cm', '22x30 + F10 cm', '26x35 + F12 cm', '32x40 + F14 cm']
                    : ['33x62 + F5 cm', '40x50 cm', '50x60 cm', '60x80 cm']
                  ).map((dim) => (
                    <button
                      key={dim}
                      type="button"
                      onClick={() => setDimensiones(dim)}
                      className="px-2 py-0.5 text-[10px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded"
                    >
                      {dim}
                    </button>
                  ))}
                </div>
              </div>

              {/* Espesor (Micrones) o Gramaje (Papel) */}
              <div>
                {esPapel ? (
                  <>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Gramaje del Papel (g/m²)
                    </label>
                    <input
                      type="number"
                      value={gramaje}
                      onChange={(e) => setGramaje(e.target.value)}
                      placeholder="ej: 80"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {GRAMAJES_COMUNES.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGramaje(g.toString())}
                          className="px-2 py-0.5 text-[10px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded"
                        >
                          {g}g
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Espesor en Micrones (μ)
                    </label>
                    <input
                      type="number"
                      value={micrones}
                      onChange={(e) => setMicrones(e.target.value)}
                      placeholder="ej: 40"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {MICRONES_COMUNES.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMicrones(m.toString())}
                          className="px-2 py-0.5 text-[10px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded"
                        >
                          {m}μ
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* BOTONES */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-md shadow-emerald-600/30 transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Tag className="w-4 h-4" />
              <span>{submitting ? 'Guardando...' : 'Guardar Ficha Técnica'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
