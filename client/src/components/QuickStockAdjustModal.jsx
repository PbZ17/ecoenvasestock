import React, { useState } from 'react';
import { X, ArrowUpDown, Plus, Minus, Scale, Check } from 'lucide-react';

export default function QuickStockAdjustModal({ isOpen, onClose, onSave, product }) {
  const [adjustmentType, setAdjustmentType] = useState('add'); // 'add' o 'subtract'
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('Ingreso de producción / compras');

  if (!isOpen || !product) return null;

  const currentStock = product.stock_quantity || 0;
  const unitWeight = parseFloat(product.unit_weight_kg) || 0;
  const numAmount = parseInt(amount, 10) || 0;

  const netChange = adjustmentType === 'add' ? numAmount : -numAmount;
  const projectedStock = Math.max(0, currentStock + netChange);
  const projectedKg = (projectedStock * unitWeight).toFixed(2);
  const changedKg = (numAmount * unitWeight).toFixed(3);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (numAmount <= 0) return;
    if (adjustmentType === 'subtract' && numAmount > currentStock) return;

    onSave({
      quantity: netChange,
      reason: reason || (adjustmentType === 'add' ? 'Ingreso de mercadería' : 'Ajuste / Merma de stock'),
      type: adjustmentType === 'add' ? 'IN' : 'ADJUSTMENT',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ArrowUpDown className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold">Ajuste de Stock e Ingreso</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Ficha del Producto */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="font-bold text-slate-900 text-sm">{product.name}</div>
            <div className="flex items-center justify-between text-slate-500">
              <span>SKU: {product.sku}</span>
              <span>Peso: {unitWeight.toFixed(4)} kg/u</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <span className="font-medium text-slate-600">Stock Actual:</span>
              <span className="font-bold text-slate-900 font-mono text-sm">{currentStock} u. ({(product.total_weight_kg || 0).toFixed(2)} kg)</span>
            </div>
          </div>

          {/* Tipo de Operación */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setAdjustmentType('add');
                setReason('Ingreso de producción / compras');
              }}
              className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                adjustmentType === 'add'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Ingresar Stock (+)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAdjustmentType('subtract');
                setReason('Ajuste / Merma / Rotura');
              }}
              className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                adjustmentType === 'subtract'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Minus className="w-4 h-4" />
              <span>Descontar Stock (-)</span>
            </button>
          </div>

          {/* Cantidad a Modificar */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Cantidad de Unidades a {adjustmentType === 'add' ? 'Ingresar' : 'Descontar'}
            </label>
            <input
              type="number"
              min="1"
              max={adjustmentType === 'subtract' ? currentStock : undefined}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ej: 500"
              className="w-full px-3.5 py-2 text-base font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
          </div>

          {/* Proyección de Kilos */}
          {numAmount > 0 && (
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs space-y-1 text-emerald-950">
              <div className="flex items-center justify-between font-semibold">
                <span>Variación de peso:</span>
                <span className="font-mono font-bold">{adjustmentType === 'add' ? '+' : '-'}{changedKg} kg</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60">
                <span>Nuevo Stock Resultante:</span>
                <span className="font-mono font-extrabold text-emerald-800 text-sm">{projectedStock} u. ({projectedKg} kg)</span>
              </div>
            </div>
          )}

          {/* Motivo */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Motivo del Ajuste</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={numAmount <= 0 || (adjustmentType === 'subtract' && numAmount > currentStock)}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Guardar Ajuste</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
