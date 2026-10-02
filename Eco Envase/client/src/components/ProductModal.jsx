import React, { useState, useEffect } from 'react';
import { X, Scale, Package, Sparkles, Check, Bookmark } from 'lucide-react';
import { api } from '../services/api';

export default function ProductModal({ isOpen, onClose, onSave, product }) {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    material: 'Polietileno',
    dimensions: '',
    description: '',
    unit_weight_kg: 0.025,
    stock_quantity: 100,
    min_stock_alert: 20,
    unit_price: 0,
    cost_price: 0,
    brand: 'Sin Marca',
    bag_type: 'Bolsas de Polietileno',
    micrones: '',
    gramaje: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku || '',
        name: product.name || '',
        material: product.material || 'Polietileno',
        dimensions: product.dimensions || '',
        description: product.description || '',
        unit_weight_kg: product.unit_weight_kg || 0,
        stock_quantity: product.stock_quantity || 0,
        min_stock_alert: product.min_stock_alert || 10,
        unit_price: product.unit_price || 0,
        cost_price: product.cost_price || 0,
        brand: product.brand || 'Sin Marca',
        bag_type: product.bag_type || 'Bolsas de Polietileno',
        micrones: product.micrones || '',
        gramaje: product.gramaje || '',
      });
    } else {
      setFormData({
        sku: '',
        name: '',
        material: 'Polietileno',
        dimensions: '',
        description: '',
        unit_weight_kg: 0.030,
        stock_quantity: 500,
        min_stock_alert: 50,
        unit_price: 150,
        cost_price: 90,
        brand: 'General',
        bag_type: 'Bolsas de Polietileno',
        micrones: 30,
        gramaje: '',
      });
    }
    setErrors({});
  }, [product, isOpen]);

  // Modelos guardados para la marca escrita
  const [brandModels, setBrandModels] = useState([]);

  useEffect(() => {
    if (formData.brand && formData.brand.trim().length > 1 && formData.brand !== 'General') {
      api.getModelosBolsas({ marca: formData.brand.trim() })
        .then((res) => {
          if (res.success) setBrandModels(res.data || []);
        })
        .catch(() => setBrandModels([]));
    } else {
      setBrandModels([]);
    }
  }, [formData.brand]);

  const applyBrandModel = (m) => {
    setFormData((prev) => ({
      ...prev,
      bag_type: m.categoria_material || prev.bag_type,
      material: m.categoria_material === 'Bolsas de Papel Kraft' ? 'Kraft' : 'Polietileno',
      dimensions: m.dimensiones || prev.dimensions,
      micrones: m.micrones || '',
      gramaje: m.gramaje || '',
      unit_weight_kg: m.peso_unitario_referencia && parseFloat(m.peso_unitario_referencia) > 0 
        ? parseFloat(m.peso_unitario_referencia) 
        : prev.unit_weight_kg,
    }));
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenerateSku = () => {
    const prefix = formData.material ? formData.material.substring(0, 3).toUpperCase() : 'ENV';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFormData((prev) => ({ ...prev, sku: `ECO-${prefix}-${rand}` }));
  };

  const calculateTotalKg = () => {
    const qty = parseInt(formData.stock_quantity, 10) || 0;
    const weight = parseFloat(formData.unit_weight_kg) || 0;
    return (qty * weight).toFixed(3);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (formData.unit_weight_kg <= 0) newErrors.unit_weight_kg = 'El peso unitario debe ser mayor a 0';
    if (formData.stock_quantity < 0) newErrors.stock_quantity = 'El stock no puede ser negativo';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-emerald-300" />
            <h3 className="text-lg font-bold">
              {product ? 'Editar Producto / Envase' : 'Nuevo Producto / Envase'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Fila 1: SKU y Nombre */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Código SKU
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="ECO-PET-101"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all font-mono"
                />
                {!product && (
                  <button
                    type="button"
                    onClick={handleGenerateSku}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-600 hover:text-emerald-700 p-1 text-xs font-semibold"
                    title="Autogenerar SKU"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="sm:col-span-8">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nombre del Envase / Producto <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Botella PET 500ml Cristal"
                className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all ${
                  errors.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                }`}
              />
              {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
            </div>
          </div>

          {/* Fila 2: Material, Dimensiones / Medidas y Marca */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Material</label>
              <select
                name="material"
                value={formData.material}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
              >
                <option value="Polietileno">Polietileno</option>
                <option value="Kraft">Kraft</option>
                <option value="Industrial">Industrial</option>
                <option value="PET">PET</option>
                <option value="PEAD">PEAD</option>
                <option value="PP">PP (Polipropileno)</option>
                <option value="Biodegradable">Biodegradable</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dimensiones / Medidas</label>
              <input
                type="text"
                name="dimensions"
                value={formData.dimensions}
                onChange={handleChange}
                placeholder="Ej: 20x30 cm / 500ml"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Marca / Fabricante <span className="text-slate-400 lowercase font-normal">(opcional)</span></label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="Ej: Plastix / EcoEnvase"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
              />
              {brandModels.length > 0 && (
                <div className="mt-1.5 p-2 bg-emerald-50/80 rounded-lg border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-900 block mb-1">
                    Fichas técnicas de "{formData.brand}":
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {brandModels.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => applyBrandModel(m)}
                        className="px-2 py-0.5 text-[11px] font-semibold bg-white hover:bg-emerald-600 hover:text-white border border-emerald-300 text-emerald-800 rounded shadow-2xs transition-all"
                        title="Autocompletar especificaciones de esta medida"
                      >
                        ✓ {m.dimensiones} ({m.micrones ? `${m.micrones}μ` : m.gramaje ? `${m.gramaje}g` : m.categoria_material})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fila 2.5: Tipo de Bolsa y Espesor Técnico Adaptativo (Micrones o Gramaje) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tipo de Bolsa / Envase
              </label>
              <select
                name="bag_type"
                value={formData.bag_type}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
              >
                <option value="Bolsas de Polietileno">🛍️ Bolsas de Polietileno</option>
                <option value="Bolsas de Papel Kraft">📜 Bolsas de Papel Kraft</option>
                <option value="Plástico Industrial">🏭 Plástico Industrial</option>
                <option value="Bolsas de Consorcio">🗑️ Bolsas de Consorcio</option>
                <option value="Residuos Orgánicos">🍏 Residuos Orgánicos</option>
                <option value="Plástico Stretch Film">📦 Plástico Stretch Film</option>
              </select>
            </div>

            <div>
              {formData.bag_type === 'Bolsas de Papel Kraft' ? (
                <div>
                  <label className="block text-xs font-bold text-amber-900 uppercase mb-1">
                    Gramaje de Papel Kraft (g/m²)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="gramaje"
                      value={formData.gramaje}
                      onChange={handleChange}
                      placeholder="Ej: 70, 80, 100"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">g/m²</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-teal-900 uppercase mb-1">
                    Espesor en Micrones (μ)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="micrones"
                      value={formData.micrones}
                      onChange={handleChange}
                      placeholder="Ej: 30, 40, 50"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">μ</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fila 3: PESO UNITARIO, STOCK Y KILOS TOTALES CALCULADOS EN VIVO */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80 space-y-3">
            <div className="text-xs font-bold text-emerald-900 uppercase flex items-center">
              <Scale className="w-4 h-4 mr-1 text-emerald-600" />
              Parámetros de Stock y Kilos
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Peso unitario en kg */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Peso por Unidad (kg) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    name="unit_weight_kg"
                    value={formData.unit_weight_kg}
                    onChange={handleChange}
                    className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-emerald-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    kg/u
                  </span>
                </div>
                {errors.unit_weight_kg && <p className="text-xs text-rose-500 mt-1">{errors.unit_weight_kg}</p>}
              </div>

              {/* Cantidad Stock Unidades */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cantidad (Unidades) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleChange}
                    className="w-full pl-3 pr-8 py-2 text-sm bg-white border border-emerald-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    u.
                  </span>
                </div>
                {errors.stock_quantity && <p className="text-xs text-rose-500 mt-1">{errors.stock_quantity}</p>}
              </div>

              {/* Kilos Totales Calculados en Tiempo Real */}
              <div className="bg-white p-2.5 rounded-xl border border-emerald-300 flex flex-col justify-center">
                <span className="text-[11px] font-semibold text-slate-500">Kilos Totales Calculados:</span>
                <div className="text-xl font-extrabold text-emerald-700 font-mono">
                  {calculateTotalKg()} <span className="text-xs font-bold">kg</span>
                </div>
                <span className="text-[10px] text-slate-400">Cálculo automático en stock</span>
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Alerta Stock Mínimo (u.)</label>
                <input
                  type="number"
                  min="0"
                  name="min_stock_alert"
                  value={formData.min_stock_alert}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Precio Venta Sugerido ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="unit_price"
                  value={formData.unit_price}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Costo Unitario ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="cost_price"
                  value={formData.cost_price}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-xl"
                />
              </div>
            </div>

          </div>

          {/* Fila 4: Descripción */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Descripción / Notas Técnicas
            </label>
            <textarea
              name="description"
              rows="2"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detalles sobre uso, resistencia, embalaje por bulto..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/30 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{product ? 'Actualizar Producto' : 'Guardar Producto'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
