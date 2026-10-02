import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Calendar, 
  Scale, 
  Package, 
  User, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw,
  PlusCircle,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { api } from '../services/api';

export default function SalesView({
  products,
  sales,
  loading,
  onRefresh,
  preselectedProduct,
  onClearPreselected,
  showToast,
}) {
  // Formulario de venta
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [weightSold, setWeightSold] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [clientName, setClientName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filtros de historial
  const [historySearch, setHistorySearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Si viene un producto preseleccionado desde el inventario
  useEffect(() => {
    if (preselectedProduct) {
      setSelectedProductId(String(preselectedProduct.id));
      setUnitPrice(preselectedProduct.unit_price || '');
      setQuantity('');
      setWeightSold('');
    }
  }, [preselectedProduct]);

  const selectedProduct = products.find((p) => String(p.id) === String(selectedProductId));

  const isBobina = selectedProduct && (
    selectedProduct.material === 'Bobinas' || 
    selectedProduct.bag_type === 'Bobinas' || 
    (selectedProduct.bag_type && selectedProduct.bag_type.includes('Bobinas')) || 
    (selectedProduct.sku && selectedProduct.sku.startsWith('BOB-'))
  );

  const qtyNumber = parseInt(quantity, 10) || 0;
  const weightToSellNumber = parseFloat(weightSold) || 0;
  const unitWeight = selectedProduct ? parseFloat(selectedProduct.unit_weight_kg) : 0;
  const currentStock = selectedProduct ? selectedProduct.stock_quantity : 0;
  const totalKgInStock = selectedProduct ? (selectedProduct.total_weight_kg || (currentStock * (unitWeight || 21.5)) || 0) : 0;

  // Cálculos dinámicos según sea Bobina o Bolsas
  const totalKgToSell = isBobina 
    ? weightToSellNumber.toFixed(2)
    : (qtyNumber * unitWeight).toFixed(3);

  const totalPrice = isBobina 
    ? (weightToSellNumber * (parseFloat(unitPrice) || 0)).toFixed(2)
    : (qtyNumber * (parseFloat(unitPrice) || 0)).toFixed(2);

  const hasEnoughStock = isBobina
    ? (selectedProduct && weightToSellNumber > 0 && (totalKgInStock <= 0 || weightToSellNumber <= totalKgInStock))
    : (selectedProduct && currentStock >= qtyNumber && qtyNumber > 0);

  const remainingUnits = selectedProduct ? Math.max(0, currentStock - (isBobina ? (qtyNumber || Math.round(weightToSellNumber / (unitWeight || 21.5))) : qtyNumber)) : 0;
  const remainingKg = isBobina 
    ? Math.max(0, totalKgInStock - weightToSellNumber).toFixed(2)
    : (selectedProduct ? (remainingUnits * unitWeight).toFixed(2) : 0);

  const handleProductChange = (e) => {
    const pId = e.target.value;
    setSelectedProductId(pId);
    const prod = products.find((p) => String(p.id) === String(pId));
    if (prod) {
      setUnitPrice(prod.unit_price || '');
    }
    setQuantity('');
    setWeightSold('');
    if (onClearPreselected) onClearPreselected();
  };

  const handleCreateSale = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      showToast('Por favor selecciona un producto', 'error');
      return;
    }

    if (isBobina) {
      if (weightToSellNumber <= 0 && qtyNumber <= 0) {
        showToast('Ingresa los kilos pesados en balanza para vender la bobina', 'error');
        return;
      }
      if (weightToSellNumber > totalKgInStock && totalKgInStock > 0) {
        showToast(`Stock insuficiente. Kilos disponibles en depósito: ${totalKgInStock.toFixed(2)} kg`, 'error');
        return;
      }
    } else {
      if (qtyNumber <= 0) {
        showToast('Ingresa una cantidad mayor a 0', 'error');
        return;
      }
      if (qtyNumber > currentStock) {
        showToast(`Stock insuficiente. Disponible: ${currentStock} unidades`, 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await api.createSale({
        product_id: selectedProduct.id,
        quantity: isBobina ? (qtyNumber > 0 ? qtyNumber : Math.max(1, Math.round(weightToSellNumber / (unitWeight || 21.5)))) : qtyNumber,
        weight_kg: isBobina ? weightToSellNumber : undefined,
        unit_price: parseFloat(unitPrice) || 0,
        client_name: clientName,
        invoice_number: invoiceNumber,
        notes: notes,
      });

      if (res.success) {
        showToast(
          isBobina
            ? `Venta registrada: Se vendieron ${weightToSellNumber} kg de bobinas ($${Number(totalPrice).toLocaleString('es-AR')})`
            : `Venta registrada: Se descontaron ${qtyNumber.toLocaleString()} unidades`, 
          'success'
        );
        setQuantity('');
        setWeightSold('');
        setClientName('');
        setInvoiceNumber('');
        setNotes('');
        onRefresh();
      } else {
        showToast(res.error || 'Error al procesar venta', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSale = async (saleId) => {
    if (!window.confirm('¿Estás seguro de anular esta venta? Se restituirá el stock a los productos.')) {
      return;
    }
    try {
      const res = await api.cancelSale(saleId);
      if (res.success) {
        showToast('Venta anulada y stock restituido correctamente', 'success');
        onRefresh();
      } else {
        showToast(res.error || 'Error al anular venta', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Filtrar historial
  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.product_name.toLowerCase().includes(historySearch.toLowerCase()) ||
      (s.product_sku && s.product_sku.toLowerCase().includes(historySearch.toLowerCase())) ||
      (s.client_name && s.client_name.toLowerCase().includes(historySearch.toLowerCase())) ||
      (s.invoice_number && s.invoice_number.toLowerCase().includes(historySearch.toLowerCase()));

    const saleDate = s.created_at ? s.created_at.slice(0, 10) : '';
    const matchesStart = !startDate || saleDate >= startDate;
    const matchesEnd = !endDate || saleDate <= endDate;

    return matchesSearch && matchesStart && matchesEnd;
  });

  const totalKgSoldFiltered = filteredSales.reduce((acc, s) => acc + (parseFloat(s.total_weight_kg) || 0), 0);
  const totalRevenueFiltered = filteredSales.reduce((acc, s) => acc + (parseFloat(s.total_price) || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Sección Superior: Formulario de Nueva Venta */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-emerald-300" />
            <h2 className="text-lg font-bold">Registrar Nueva Venta / Despacho</h2>
          </div>
          <span className="text-xs bg-emerald-700/80 px-3 py-1 rounded-full text-emerald-100 border border-emerald-500/30">
            Deducción Automática de Stock y Kilos
          </span>
        </div>

        <form onSubmit={handleCreateSale} className="p-6 space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            
            {/* Selección de Producto */}
            <div className="md:col-span-6">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Seleccionar Envase / Producto <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedProductId}
                onChange={handleProductChange}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white font-medium"
              >
                <option value="">-- Selecciona un producto del catálogo --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                    [{p.sku}] {p.name} — Stock: {p.stock_quantity} u. ({parseFloat(p.unit_weight_kg).toFixed(3)} kg/u) {p.stock_quantity <= 0 ? '(AGOTADO)' : ''}
                  </option>
                ))}
              </select>

              {/* Ficha rápida del producto seleccionado */}
              {selectedProduct && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Marca / Categoría:</span>
                    <span className="font-semibold text-slate-800">
                      🏷️ {selectedProduct.brand || 'Sin Marca'} • {selectedProduct.material}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">
                      {isBobina ? 'Bobinas en Depósito:' : 'Stock en Depósito:'}
                    </span>
                    <span className="font-bold text-slate-900">
                      {selectedProduct.stock_quantity} {isBobina ? 'bobinas' : 'unidades'}
                    </span>
                  </div>
                  {isBobina ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Kilos Totales en Balanza:</span>
                        <span className="font-mono font-bold text-emerald-800">{totalKgInStock.toFixed(2)} kg</span>
                      </div>
                      <div className="flex items-center justify-between pt-0.5 border-t border-slate-200/60">
                        <span className="text-slate-500">Modalidad:</span>
                        <span className="font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          ⚖️ Venta por Kilo ($/kg)
                        </span>
                      </div>
                    </>
                  ) : unitWeight > 0 ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Peso Unitario:</span>
                        <span className="font-mono font-bold text-slate-900">{parseFloat(selectedProduct.unit_weight_kg).toFixed(4)} kg</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Kilos Totales Actuales:</span>
                        <span className="font-mono font-bold text-emerald-700">{(selectedProduct.total_weight_kg || 0).toFixed(2)} kg</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-600 font-medium text-[11px] flex items-center justify-between pt-1">
                      <span className="text-slate-500">Modalidad:</span>
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">Venta directa x Unidades</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cantidad y Precios */}
            <div className="md:col-span-6 space-y-4">
              
              {isBobina ? (
                /* MODO BOBINA: VENTA POR KILO */
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Kilos a Vender (Balanza) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center">
                        <Scale className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Kilos a Vender (Balanza) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          value={weightSold}
                          onChange={(e) => setWeightSold(e.target.value)}
                          placeholder="Ej: 43.50"
                          disabled={!selectedProduct || totalKgInStock <= 0}
                          className={`w-full pl-3.5 pr-8 py-2.5 text-sm font-black font-mono border-2 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                            weightToSellNumber > totalKgInStock && totalKgInStock > 0
                              ? 'bg-rose-50 border-rose-300 text-rose-900'
                              : 'bg-emerald-50/40 border-emerald-500 text-slate-900'
                          }`}
                        />
                        <span className="absolute right-3 top-3 text-xs font-bold text-emerald-700">kg</span>
                      </div>
                    </div>

                    {/* Precio de Venta por Kilo ($/kg) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                        Precio por Kilo ($/kg) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={unitPrice}
                          onChange={(e) => setUnitPrice(e.target.value)}
                          placeholder="Ej: 3500"
                          disabled={!selectedProduct}
                          className="w-full pl-3.5 pr-10 py-2.5 text-sm font-bold font-mono bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                        <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">$/kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Bobinas retiradas opcional */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Bobinas físicas retiradas (Opcional - estimado automático si se omite)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Ej: 2 bobinas"
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                </div>
              ) : (
                /* MODO REGULAR: VENTA DE BOLSAS POR UNIDAD */
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Cantidad a Vender (u.) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      max={currentStock || undefined}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Ej: 250"
                      disabled={!selectedProduct || currentStock <= 0}
                      className={`w-full px-3.5 py-2.5 text-sm font-bold font-mono border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                        qtyNumber > currentStock
                          ? 'bg-rose-50 border-rose-300 text-rose-900'
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Precio Unitario ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      placeholder="0.00"
                      disabled={!selectedProduct}
                      className="w-full px-3.5 py-2.5 text-sm font-bold font-mono bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Caja de Cálculos en Vivo */}
              {selectedProduct && ((isBobina && weightToSellNumber > 0) || (!isBobina && qtyNumber > 0)) && (
                <div className={`p-4 rounded-xl border transition-all ${
                  (isBobina && weightToSellNumber > totalKgInStock && totalKgInStock > 0) || (!isBobina && qtyNumber > currentStock)
                    ? 'bg-rose-50 border-rose-200' 
                    : 'bg-emerald-50/80 border-emerald-200'
                }`}>
                  {(isBobina && weightToSellNumber > totalKgInStock && totalKgInStock > 0) ? (
                    <div className="flex items-center text-rose-700 text-xs font-bold space-x-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Stock insuficiente. No puedes vender más de {totalKgInStock.toFixed(2)} kg.</span>
                    </div>
                  ) : !isBobina && qtyNumber > currentStock ? (
                    <div className="flex items-center text-rose-700 text-xs font-bold space-x-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Stock insuficiente. No puedes vender más de {currentStock.toLocaleString()} unidades.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {isBobina ? (
                        <>
                          <div className="flex items-center justify-between text-xs text-emerald-950 font-semibold border-b border-emerald-200/60 pb-1.5">
                            <span className="flex items-center">
                              <Scale className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              Kilos a Pesar en Balanza:
                            </span>
                            <span className="text-base font-extrabold font-mono text-emerald-800">
                              {weightToSellNumber.toFixed(2)} kg
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-700 font-bold">
                            <span>Total a Cobrar ({weightToSellNumber.toFixed(2)} kg × ${parseFloat(unitPrice) || 0}/kg):</span>
                            <span className="font-extrabold text-base text-emerald-900">${Number(totalPrice).toLocaleString('es-AR')}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                            <span>Kilos remanentes en depósito:</span>
                            <span className="font-semibold text-slate-700">
                              {remainingKg} kg {remainingUnits > 0 ? `(~${remainingUnits} bobinas)` : ''}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-xs text-emerald-950 font-semibold border-b border-emerald-200/60 pb-1.5">
                            <span className="flex items-center">
                              <TrendingDown className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              Unidades a Descontar:
                            </span>
                            <span className="text-base font-extrabold font-mono text-emerald-800">
                              {qtyNumber.toLocaleString()} u.
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-600">
                            <span>Total de la Venta:</span>
                            <span className="font-bold text-slate-900">${totalPrice}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                            <span>Stock remanente tras venta:</span>
                            <span className="font-semibold text-slate-700">
                              {remainingUnits.toLocaleString()} u.
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>

          {/* Fila 2: Cliente, Factura, Notas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del Cliente / Destino</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ej: Distribuidora Norte"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nro. Factura / Remito (Opcional)</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="R-0001-00045"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Observaciones</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Despacho por transporte..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* Botón de Confirmación */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting || !hasEnoughStock}
              className={`flex items-center space-x-2 px-6 py-2.5 text-sm font-bold rounded-xl shadow-md transition-all ${
                hasEnoughStock && !submitting
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Procesando Venta...' : 'Confirmar Venta y Descontar Stock'}</span>
            </button>
          </div>

        </form>
      </div>

      {/* Sección Inferior: Historial de Ventas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-emerald-600" />
              Historial de Ventas y Despachos
            </h3>
            <p className="text-xs text-slate-500">Trazabilidad de salidas y kilogramos entregados</p>
          </div>

          <div className="flex items-center space-x-3 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-100 text-xs">
            <span className="text-slate-600">Total Kilos Despachados:</span>
            <strong className="text-emerald-800 font-bold font-mono">
              {totalKgSoldFiltered.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
            </strong>
          </div>
        </div>

        {/* Filtros de Historial */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por cliente, producto, SKU o factura..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div className="sm:col-span-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div className="sm:col-span-3">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        {/* Tabla de Historial */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3.5 py-3">Fecha</th>
                <th className="px-3.5 py-3">Producto / SKU</th>
                <th className="px-3.5 py-3">Cliente</th>
                <th className="px-3.5 py-3 text-right">Unidades</th>
                <th className="px-3.5 py-3 text-right">Peso Unit.</th>
                <th className="px-3.5 py-3 text-right font-bold text-emerald-800 bg-emerald-50/60">Total Kilos</th>
                <th className="px-3.5 py-3 text-right">Total $</th>
                <th className="px-3.5 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No se registran ventas con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-3.5 py-2.5 text-slate-500 whitespace-nowrap">
                      {s.created_at ? new Date(s.created_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className="font-bold text-slate-900">{s.product_name}</span>
                      {s.product_sku && <span className="text-[10px] text-slate-400 ml-1">({s.product_sku})</span>}
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-700">
                      {s.client_name || 'Consumidor Final'}
                      {s.invoice_number && (
                        <span className="text-[10px] text-slate-400 block">Doc: {s.invoice_number}</span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-bold font-mono text-slate-800">
                      {s.quantity.toLocaleString()} u.
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-slate-600">
                      {parseFloat(s.unit_weight_kg).toFixed(4)} kg
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-bold font-mono text-emerald-700 bg-emerald-50/30">
                      {(parseFloat(s.total_weight_kg) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-semibold text-slate-900">
                      ${(parseFloat(s.total_price) || 0).toLocaleString()}
                    </td>
                    <td className="px-3.5 py-2.5 text-center">
                      <button
                        onClick={() => handleCancelSale(s.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                        title="Anular venta y restituir stock"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
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
  );
}
