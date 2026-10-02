import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import InventoryView from './components/InventoryView';
import SalesView from './components/SalesView';
import ExcelImportView from './components/ExcelImportView';
import BalancesReportsView from './components/BalancesReportsView';
import DocumentsView from './components/DocumentsView';
import RepuestosView from './components/RepuestosView';
import ProductModal from './components/ProductModal';
import QuickStockAdjustModal from './components/QuickStockAdjustModal';
import { api } from './services/api';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados de modales
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [preselectedSaleProduct, setPreselectedSaleProduct] = useState(null);

  // Filtros de navegación cruzada
  const [initialLowStockFilter, setInitialLowStockFilter] = useState(false);

  // Notificaciones Toast
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Carga general de datos
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [productsRes, salesRes, summaryRes] = await Promise.all([
        api.getProducts(),
        api.getSales(),
        api.getDashboardSummary(),
      ]);

      if (productsRes.success) setProducts(productsRes.data);
      if (salesRes.success) setSales(salesRes.data);
      if (summaryRes.success) setSummaryData(summaryRes.data);
    } catch (err) {
      showToast('Error al conectar con el servidor: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handlers para Productos
  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (formData) => {
    try {
      let res;
      if (editingProduct) {
        res = await api.updateProduct(editingProduct.id, formData);
      } else {
        res = await api.createProduct(formData);
      }

      if (res.success) {
        showToast(res.message || 'Producto guardado exitosamente', 'success');
        setIsProductModalOpen(false);
        setEditingProduct(null);
        loadAllData();
      } else {
        showToast(res.error || 'Error al guardar producto', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`¿Estás seguro de eliminar el producto "${product.name}"?`)) return;
    try {
      const res = await api.deleteProduct(product.id);
      if (res.success) {
        showToast('Producto eliminado', 'success');
        loadAllData();
      } else {
        showToast(res.error || 'Error al eliminar', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Ajuste de stock rápido
  const handleOpenAdjust = (product) => {
    setAdjustingProduct(product);
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjust = async (data) => {
    try {
      const res = await api.adjustStock(adjustingProduct.id, data);
      if (res.success) {
        showToast(res.message, 'success');
        setIsAdjustModalOpen(false);
        setAdjustingProduct(null);
        loadAllData();
      } else {
        showToast(res.error || 'Error al ajustar stock', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Venta rápida desde la tabla de inventario
  const handleQuickSale = (product) => {
    setPreselectedSaleProduct(product);
    setActiveTab('sales');
  };

  const handleNavigate = (tab, options = {}) => {
    if (options.lowStock) {
      setInitialLowStockFilter(true);
    } else {
      setInitialLowStockFilter(false);
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Toast Notifications */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-md w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-lg border animate-in slide-in-from-bottom-3 duration-200 ${
              t.type === 'success'
                ? 'bg-emerald-900 text-emerald-50 border-emerald-700'
                : t.type === 'error'
                ? 'bg-rose-900 text-rose-50 border-rose-700'
                : 'bg-slate-900 text-slate-50 border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-2.5 text-xs font-semibold">
              {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {t.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {t.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
              <span>{t.message}</span>
            </div>
            <button onClick={() => removeToast(t.id)} className="ml-2 text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Barra Lateral / Sidebar (Costado) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        summaryData={summaryData}
      />

      {/* Contenedor Principal (Derecha) */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Contenido Principal */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          
          {activeTab === 'dashboard' && (
            <DashboardView
              summary={summaryData}
              onNavigate={handleNavigate}
              onNewSale={() => setActiveTab('sales')}
              onNewProduct={handleOpenNewProduct}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              products={products}
              loading={loading}
              onRefresh={loadAllData}
              onNewProduct={handleOpenNewProduct}
              onEditProduct={handleOpenEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onQuickSale={handleQuickSale}
              onQuickAdjust={handleOpenAdjust}
              onImportExcel={() => setActiveTab('excel')}
              initialLowStockFilter={initialLowStockFilter}
            />
          )}

          {activeTab === 'repuestos' && (
            <RepuestosView showToast={showToast} />
          )}

          {activeTab === 'sales' && (
            <SalesView
              products={products}
              sales={sales}
              loading={loading}
              onRefresh={loadAllData}
              preselectedProduct={preselectedSaleProduct}
              onClearPreselected={() => setPreselectedSaleProduct(null)}
              showToast={showToast}
            />
          )}

          {activeTab === 'excel' && (
            <ExcelImportView
              onImportSuccess={() => {
                loadAllData();
                setActiveTab('inventory');
              }}
              showToast={showToast}
            />
          )}

          {activeTab === 'balances' && (
            <BalancesReportsView showToast={showToast} />
          )}

          {activeTab === 'documents' && (
            <DocumentsView showToast={showToast} />
          )}

        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400 mt-auto">
          Eco Envase — Sistema de Control de Stock, Kilos & Balances
        </footer>

      </div>

      {/* Modales */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        product={editingProduct}
      />

      <QuickStockAdjustModal
        isOpen={isAdjustModalOpen}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setAdjustingProduct(null);
        }}
        onSave={handleSaveAdjust}
        product={adjustingProduct}
      />

    </div>
  );
}
