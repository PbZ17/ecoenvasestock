import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  Scale, 
  Package, 
  ShoppingCart, 
  Edit, 
  Trash2, 
  ArrowUpDown, 
  Download, 
  Layers, 
  Info,
  RefreshCw,
  Tag,
  Boxes,
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import { api } from '../services/api';
import BobinasModal from './BobinasModal';
import ConfigurarMarcaModal from './ConfigurarMarcaModal';
import CargarStockBolsasModal from './CargarStockBolsasModal';
import ProductLotesModal from './ProductLotesModal';

export default function InventoryView({
  products,
  loading,
  onRefresh,
  onNewProduct,
  onEditProduct,
  onDeleteProduct,
  onQuickSale,
  onQuickAdjust,
  onImportExcel,
  initialLowStockFilter = false,
}) {
  // Pestañas principales
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'brands_summary' | 'all_bobinas'

  // Filtros
  const [search, setSearch] = useState('');
  const [familyFilter, setFamilyFilter] = useState('ALL'); // 'ALL' | 'BOLSAS_PLASTICO' | 'BOLSAS_KRAFT' | 'BOBINAS'
  const [materialFilter, setMaterialFilter] = useState('ALL');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [bagTypeFilter, setBagTypeFilter] = useState('ALL');
  const [onlyLowStock, setOnlyLowStock] = useState(initialLowStockFilter);

  // Modales: Bobinas, Configurar Marca, Cargar Stock de Bolsas y Lotes/Partidas
  const [isBobinasModalOpen, setIsBobinasModalOpen] = useState(false);
  const [selectedProductForBobinas, setSelectedProductForBobinas] = useState(null);
  const [isConfigurarMarcaOpen, setIsConfigurarMarcaOpen] = useState(false);
  const [isCargarStockBolsasOpen, setIsCargarStockBolsasOpen] = useState(false);
  const [isLotesModalOpen, setIsLotesModalOpen] = useState(false);
  const [selectedProductForLotes, setSelectedProductForLotes] = useState(null);

  // Datos para vista "Englobado por Marcas"
  const [brandsSummary, setBrandsSummary] = useState(null);
  const [loadingBrands, setLoadingBrands] = useState(false);

  // Datos para vista "Todas las Bobinas"
  const [allBobinas, setAllBobinas] = useState([]);
  const [loadingAllBobinas, setLoadingAllBobinas] = useState(false);
  const [configuredBrands, setConfiguredBrands] = useState([]);

  // Cargar marcas configuradas en la ficha técnica
  const loadConfiguredBrands = async () => {
    try {
      const res = await api.getModelosBolsas();
      if (res.success && res.data) {
        const distinct = Array.from(new Set(res.data.map((m) => m.marca).filter(Boolean)));
        setConfiguredBrands(distinct);
      }
    } catch (err) {
      console.error('Error al cargar marcas configuradas:', err);
    }
  };

  // Lista de materiales y marcas únicas (incluyendo marcas configuradas, productos y bobinas)
  const materialsList = ['ALL', ...Array.from(new Set(products.map((p) => p.material).filter(Boolean)))];
  const brandsList = ['ALL', ...Array.from(new Set([
    ...products.map((p) => p.brand),
    ...allBobinas.map((b) => b.marca),
    ...configuredBrands,
  ].filter(Boolean)))];

  // Cargar resumen por marcas
  const loadBrandsSummary = async () => {
    setLoadingBrands(true);
    try {
      const res = await api.getBobinasSummaryByBrand();
      if (res.success) {
        setBrandsSummary(res.data);
      }
    } catch (err) {
      console.error('Error al cargar resumen por marcas:', err);
    } finally {
      setLoadingBrands(false);
    }
  };

  // Cargar todas las bobinas
  const loadAllBobinas = async () => {
    setLoadingAllBobinas(true);
    try {
      const res = await api.getBobinas();
      if (res.success) {
        setAllBobinas(res.data || []);
      }
    } catch (err) {
      console.error('Error al cargar todas las bobinas:', err);
    } finally {
      setLoadingAllBobinas(false);
    }
  };

  useEffect(() => {
    loadBrandsSummary();
    loadConfiguredBrands();
    if (activeTab === 'all_bobinas') {
      loadAllBobinas();
    }
  }, [activeTab]);

  const handleRefreshAll = () => {
    onRefresh();
    loadBrandsSummary();
    loadConfiguredBrands();
    if (activeTab === 'all_bobinas') {
      loadAllBobinas();
    }
  };

  const handleOpenBobinas = (product = null) => {
    setSelectedProductForBobinas(product);
    setIsBobinasModalOpen(true);
  };

  const handleBobinasUpdated = () => {
    onRefresh();
    loadBrandsSummary();
    if (activeTab === 'all_bobinas') {
      loadAllBobinas();
    }
  };

  // Filtrado local en vivo de productos
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
      (p.material && p.material.toLowerCase().includes(search.toLowerCase())) ||
      (p.bag_type && p.bag_type.toLowerCase().includes(search.toLowerCase())) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));

    const isBobina = p.material === 'Bobinas' || p.bag_type === 'Bobinas' || p.bag_type === 'Bobinas de Polietileno' || (p.total_bobinas || 0) > 0 || (p.sku && p.sku.startsWith('BOB-'));
    const isKraft = p.bag_type === 'Bolsas de Papel Kraft' || p.material === 'Kraft';
    const isPlasticBag = !isBobina && !isKraft;

    const matchesFamily = 
      familyFilter === 'ALL' ||
      (familyFilter === 'BOLSAS_PLASTICO' && isPlasticBag) ||
      (familyFilter === 'BOLSAS_KRAFT' && isKraft) ||
      (familyFilter === 'BOBINAS' && isBobina);

    const matchesMaterial = materialFilter === 'ALL' || p.material === materialFilter;
    const matchesBrand = brandFilter === 'ALL' || (p.brand || 'General') === brandFilter;
    const matchesBagType = bagTypeFilter === 'ALL' || (p.bag_type || 'Bolsas de Polietileno') === bagTypeFilter;
    const matchesLowStock = !onlyLowStock || p.stock_quantity <= p.min_stock_alert;

    return matchesSearch && matchesFamily && matchesMaterial && matchesBrand && matchesBagType && matchesLowStock;
  });

  // Totales de la selección filtrada de productos
  const totalFilteredUnits = filteredProducts.reduce((acc, p) => acc + (p.stock_quantity || 0), 0);
  const totalFilteredKg = filteredProducts.reduce((acc, p) => acc + (p.total_weight_kg || 0), 0);
  const totalFilteredBobinas = filteredProducts.reduce((acc, p) => {
    const isBob = p.material === 'Bobinas' || p.bag_type === 'Bobinas' || p.bag_type === 'Bobinas de Polietileno' || (p.total_bobinas || 0) > 0 || (p.sku && p.sku.startsWith('BOB-'));
    return acc + (isBob ? (p.total_bobinas || p.stock_quantity || 0) : 0);
  }, 0);
  const totalFilteredBolsasUnits = filteredProducts.reduce((acc, p) => {
    const isBob = p.material === 'Bobinas' || p.bag_type === 'Bobinas' || p.bag_type === 'Bobinas de Polietileno' || (p.total_bobinas || 0) > 0 || (p.sku && p.sku.startsWith('BOB-'));
    return acc + (!isBob ? (p.stock_quantity || 0) : 0);
  }, 0);

  // Bobinas filtradas para la pestaña "Todas las Bobinas"
  const filteredBobinas = allBobinas.filter((b) => {
    const matchesSearch =
      (b.codigo_bobina && b.codigo_bobina.toLowerCase().includes(search.toLowerCase())) ||
      (b.marca && b.marca.toLowerCase().includes(search.toLowerCase())) ||
      (b.product_name && b.product_name.toLowerCase().includes(search.toLowerCase()));
    const matchesBrand = brandFilter === 'ALL' || (b.marca || 'General') === brandFilter;
    return matchesSearch && matchesBrand;
  });

  return (
    <div className="space-y-5">
      
      {/* Barra superior de controles */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center">
              <Package className="w-5 h-5 mr-2 text-emerald-600" />
              Inventario & Control de Kilos y Bobinas
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestión de stock con pesos variables de bobinas, división y englobado por marcas y unidades.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRefreshAll}
              className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all"
              title="Refrescar datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading || loadingBrands ? 'animate-spin' : ''}`} />
            </button>
            
            <a
              href={api.getExportStockUrl()}
              download
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl border border-slate-200 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Excel</span>
            </a>

            <button
              onClick={onImportExcel}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cargar Excel</span>
            </button>

            {/* Botón 1: Configurar Marca (Ficha Técnica sin stock) */}
            <button
              onClick={() => setIsConfigurarMarcaOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200/90 rounded-xl border border-slate-300 shadow-xs transition-all"
              title="Configurar marcas, dimensiones y micrones/gramaje"
            >
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>+ Configurar Marca</span>
            </button>

            {/* Botón 2: Cargar Stock de Bolsas (Seleccionar Marca y cargar unidades/kilos) */}
            <button
              onClick={() => setIsCargarStockBolsasOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200/80 rounded-xl border border-emerald-300 shadow-xs transition-all"
              title="Cargar stock en unidades y kilos seleccionando una marca registrada"
            >
              <Bookmark className="w-4 h-4 text-emerald-700" />
              <span>+ Cargar Stock de Bolsas</span>
            </button>

            {/* Botón Cargar Bobinas */}
            <button
              onClick={() => handleOpenBobinas(null)}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-xl border border-teal-200 shadow-xs transition-all"
            >
              <Boxes className="w-4 h-4 text-teal-600" />
              <span>+ Cargar Bobina</span>
            </button>

            <button
              onClick={onNewProduct}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs shadow-emerald-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Producto</span>
            </button>
          </div>
        </div>

        {/* Pestañas de Vista */}
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'products'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Catálogo de Productos</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'products' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {products.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('brands_summary')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'brands_summary'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Englobado por Marcas</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'brands_summary' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {brandsSummary?.marcas?.length || 0} marcas
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all_bobinas')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'all_bobinas'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Detalle de Bobinas</span>
          </button>
        </div>

        {/* Selector Rápido de Familias de Productos (3 tipos distintos) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Familia:</span>
          {[
            { id: 'ALL', label: 'Todos los Productos', icon: '📦' },
            { id: 'BOLSAS_PLASTICO', label: 'Bolsas de Plástico (x Unidad)', icon: '🛍️' },
            { id: 'BOLSAS_KRAFT', label: 'Bolsas Papel Kraft (x Unidad)', icon: '📜' },
            { id: 'BOBINAS', label: 'Bobinas de Polietileno (x Kilo)', icon: '🏭' },
          ].map((f) => {
            const active = familyFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFamilyFilter(f.id)}
                className={`px-3 py-1 text-xs rounded-xl font-bold transition-all flex items-center space-x-1.5 ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
              >
                <span>{f.icon}</span>
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filtros y Búsqueda */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          
          {/* Buscador */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, SKU, marca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Filtro Marca */}
          <div className="sm:col-span-3">
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
            >
              <option value="ALL">Todas las Marcas</option>
              {brandsList.filter((b) => b !== 'ALL').map((b) => (
                <option key={b} value={b}>
                  Marca: {b}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Tipo de Bolsa / Categoría */}
          <div className="sm:col-span-3">
            <select
              value={bagTypeFilter}
              onChange={(e) => setBagTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold text-slate-800"
            >
              <option value="ALL">Todos los Tipos de Bolsa</option>
              <option value="Bolsas de Polietileno">🛍️ Bolsas de Polietileno</option>
              <option value="Bolsas de Papel Kraft">📜 Bolsas de Papel Kraft</option>
              <option value="Plástico Industrial">🏭 Plástico Industrial</option>
              <option value="Bolsas de Consorcio">🗑️ Bolsas de Consorcio</option>
              <option value="Residuos Orgánicos">🍏 Residuos Orgánicos</option>
              <option value="Plástico Stretch Film">📦 Plástico Stretch Film</option>
            </select>
          </div>

          {/* Switch Solo Stock Bajo */}
          <div className="sm:col-span-2 flex items-center">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 w-full select-none">
              <input
                type="checkbox"
                checked={onlyLowStock}
                onChange={(e) => setOnlyLowStock(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500 border-slate-300"
              />
              <span className="flex items-center text-amber-800 text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600 shrink-0" />
                Stock Crítico
              </span>
            </label>
          </div>

        </div>

        {/* Barra de totales dinámicos */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs">
          <div className="text-emerald-950 font-bold flex items-center space-x-2">
            <span>📦 Mostrando <strong>{filteredProducts.length}</strong> de <strong>{products.length}</strong> productos</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {totalFilteredBolsasUnits > 0 && (
              <span className="text-blue-900 font-medium bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                🛍️ Bolsas: <strong className="text-blue-950 font-bold">{totalFilteredBolsasUnits.toLocaleString()} u.</strong>
              </span>
            )}
            {totalFilteredBobinas > 0 && (
              <span className="text-teal-900 font-medium bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                🏭 Bobinas: <strong className="text-teal-950 font-bold">{totalFilteredBobinas} bobinas</strong>
              </span>
            )}
            <span className="text-emerald-900 font-medium bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300">
              ⚖️ Kilos Totales: <strong className="text-emerald-800 font-extrabold">{totalFilteredKg.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg</strong>
            </span>
          </div>
        </div>

      </div>

      {/* ========================================================
          CONTENIDO SEGÚN LA PESTAÑA SELECCIONADA
         ======================================================== */}

      {/* PESTAÑA 1: CATÁLOGO DE PRODUCTOS */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/90 text-slate-700 text-xs uppercase tracking-wider font-extrabold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Marca</th>
                  <th className="px-5 py-3.5">Producto / Descripción</th>
                  <th className="px-5 py-3.5 text-center">Cantidad en Stock</th>
                  <th className="px-5 py-3.5 text-right bg-emerald-50/70 text-emerald-950 font-extrabold">Peso Total</th>
                  <th className="px-5 py-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                      Cargando inventario...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold text-slate-600">No se encontraron productos</p>
                      <p className="text-xs text-slate-400 mt-1">Prueba cambiando los filtros o registra una nueva bobina o fardo de bolsas.</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isBobina = p.material === 'Bobinas' || p.bag_type === 'Bobinas' || p.bag_type === 'Bobinas de Polietileno' || (p.total_bobinas || 0) > 0 || (p.sku && p.sku.startsWith('BOB-'));
                    const isKraft = p.bag_type === 'Bolsas de Papel Kraft' || p.material === 'Kraft';
                    const isLow = p.stock_quantity <= p.min_stock_alert;
                    const bobinasCount = (p.total_bobinas && p.total_bobinas > 0) ? p.total_bobinas : (isBobina ? p.stock_quantity : 0);
                    const realKg = p.total_weight_kg || 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                        
                        {/* 1. MARCA (Con etiqueta destacada o Sin Marca neutral) */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {p.brand && p.brand !== 'Sin Marca' && p.brand !== 'General' ? (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-xl font-black text-sm bg-purple-100/90 text-purple-900 border border-purple-300 shadow-2xs">
                              <Tag className="w-3.5 h-3.5 mr-1.5 text-purple-700" />
                              {p.brand}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-xl font-bold text-xs bg-slate-100 text-slate-600 border border-slate-300 shadow-2xs">
                              <Tag className="w-3 h-3 mr-1 text-slate-400" />
                              Sin Marca
                            </span>
                          )}
                        </td>

                        {/* 2. PRODUCTO / DESCRIPCIÓN */}
                        <td className="px-5 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-slate-900 text-base">
                              {p.name}
                            </span>
                            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                              {p.sku}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {isBobina ? (
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                                  🏭 Bobinas de Polietileno (Venta x kg)
                                </span>
                                {p.unit_price > 0 && (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-50 text-blue-900 border border-blue-200">
                                    💰 ${Number(p.unit_price).toLocaleString('es-AR')}/kg
                                  </span>
                                )}
                                {p.total_lotes > 0 && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                    📦 {p.total_lotes} {p.total_lotes === 1 ? 'lote' : 'lotes'}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  {p.bag_type || 'Bolsas'}
                                </span>
                                {p.dimensions && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                    📐 {p.dimensions}
                                  </span>
                                )}
                                {p.micrones && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                                    ⚡ {p.micrones} μ
                                  </span>
                                )}
                                {p.gramaje && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                    📜 {p.gramaje} g/m²
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </td>

                        {/* 3. CANTIDAD EN STOCK (Con su etiqueta) */}
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          {isBobina ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-sm font-black bg-teal-100 text-teal-950 border border-teal-300 shadow-2xs font-mono">
                                <Boxes className="w-4 h-4 mr-1.5 text-teal-700" />
                                {bobinasCount} {bobinasCount === 1 ? 'bobina' : 'bobinas'}
                              </span>
                              {isLow && (
                                <span className="text-[10px] font-bold text-amber-700 mt-1 flex items-center">
                                  <AlertTriangle className="w-3 h-3 mr-0.5 text-amber-600" /> Stock bajo (mín: {p.min_stock_alert})
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-sm font-black bg-blue-100 text-blue-950 border border-blue-300 shadow-2xs font-mono">
                                <Package className="w-4 h-4 mr-1.5 text-blue-700" />
                                {p.stock_quantity.toLocaleString()} u.
                              </span>
                              {p.lotes_en_transito_unidades > 0 && (
                                <span className="text-[10px] font-bold text-amber-800 mt-1 flex items-center bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" title="Unidades de lotes en tránsito">
                                  🚚 +{p.lotes_en_transito_unidades.toLocaleString()} u. en viaje
                                </span>
                              )}
                              {p.lotes_pendientes_unidades > 0 && (
                                <span className="text-[10px] font-bold text-blue-800 mt-1 flex items-center bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200" title="Unidades pendientes de control">
                                  ⏳ +{p.lotes_pendientes_unidades.toLocaleString()} u. pend.
                                </span>
                              )}
                              {isLow ? (
                                <span className="text-[10px] font-bold text-amber-700 mt-1 flex items-center">
                                  <AlertTriangle className="w-3 h-3 mr-0.5 text-amber-600" /> Stock bajo (mín: {p.min_stock_alert} u.)
                                </span>
                              ) : (!p.lotes_en_transito_unidades && !p.lotes_pendientes_unidades) && (
                                <span className="text-[10px] text-slate-400 mt-0.5 font-medium">Control por remito</span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 4. PESO TOTAL (Con balanza o Venta x Unidad) */}
                        <td className="px-5 py-4 text-right bg-emerald-50/40 whitespace-nowrap">
                          {isBobina || realKg > 0 ? (
                            <div>
                              <div className="flex items-center justify-end space-x-1.5">
                                <Scale className="w-4 h-4 text-emerald-600" />
                                <span className="font-extrabold text-emerald-900 text-lg font-mono">
                                  {realKg.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-xs font-bold text-emerald-700">kg</span>
                              </div>
                              <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                                {isBobina ? 'Peso real de balanza' : 'Peso acumulado'}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg border border-slate-200">
                                Venta directa x Unidad
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">Sin pesaje de fardos</span>
                            </div>
                          )}
                        </td>

                        {/* 5. ACCIONES */}
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1.5">
                            {isBobina ? (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedProductForLotes(p);
                                    setIsLotesModalOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-all flex items-center space-x-1"
                                  title="Ver los lotes y partidas de esta marca"
                                >
                                  <Layers className="w-3.5 h-3.5 text-slate-600" />
                                  <span>Lotes</span>
                                </button>
                                <button
                                  onClick={() => handleOpenBobinas(p)}
                                  className="px-2.5 py-1.5 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-all flex items-center space-x-1"
                                  title="Cargar nuevo lote para esta marca"
                                >
                                  <Boxes className="w-3.5 h-3.5 text-teal-600" />
                                  <span>+ Lote</span>
                                </button>
                                <button
                                  onClick={() => onQuickSale(p)}
                                  className="p-1.5 text-emerald-700 hover:text-white hover:bg-emerald-600 bg-emerald-50 rounded-lg border border-emerald-200 transition-all"
                                  title="Registrar venta por kilo"
                                >
                                  <ShoppingCart className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onEditProduct(p)}
                                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white rounded-lg border border-slate-200 transition-all"
                                  title="Editar precio por kilo o detalles"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedProductForLotes(p);
                                    setIsLotesModalOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-all flex items-center space-x-1"
                                  title="Ver y gestionar partidas y lotes de este producto"
                                >
                                  <Layers className="w-3.5 h-3.5 text-slate-600" />
                                  <span>Lotes</span>
                                </button>
                                <button
                                  onClick={() => setIsCargarStockBolsasOpen(true)}
                                  className="px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-all flex items-center space-x-1"
                                  title="Cargar remito de bolsas"
                                >
                                  <Package className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>+ Stock</span>
                                </button>
                                <button
                                  onClick={() => onQuickSale(p)}
                                  className="p-1.5 text-emerald-700 hover:text-white hover:bg-emerald-600 bg-emerald-50 rounded-lg border border-emerald-200 transition-all"
                                  title="Registrar venta por unidades"
                                >
                                  <ShoppingCart className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onEditProduct(p)}
                                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white rounded-lg border border-slate-200 transition-all"
                                  title="Editar producto"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => onDeleteProduct(p)}
                              className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 rounded-lg border border-rose-200 transition-all"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: ENGLOBADO POR MARCAS (MÉTRICAS Y CONSOLIDADO) */}
      {activeTab === 'brands_summary' && (
        <div className="space-y-5">
          
          {/* Tarjetas Ejecutivas de Totales Globales */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Marcas Activas</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {brandsSummary?.totales_globales?.marcas_activas || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                <Tag className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-teal-600 uppercase tracking-wider">Bobinas en Stock</p>
                <p className="text-2xl font-black text-teal-950 mt-1">
                  {(brandsSummary?.totales_globales?.bobinas_disponibles || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
                <Boxes className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs flex items-center justify-between bg-gradient-to-br from-white to-emerald-50/40">
              <div>
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Kilos Totales Reales</p>
                <p className="text-2xl font-black text-emerald-900 mt-1">
                  {(brandsSummary?.totales_globales?.kilos_totales || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-base font-bold text-emerald-700">kg</span>
                </p>
              </div>
              <div className="p-3 bg-emerald-100/80 text-emerald-700 rounded-2xl">
                <Scale className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Unidades Totales</p>
                <p className="text-2xl font-black text-blue-950 mt-1">
                  {(brandsSummary?.totales_globales?.unidades_totales || 0).toLocaleString()} <span className="text-base font-bold text-blue-700">u.</span>
                </p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Package className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Tabla de Marcas Englobadas */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center">
                  <Tag className="w-4 h-4 mr-1.5 text-emerald-600" />
                  Consolidado y Englobado de Stock por Marca
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Engloba la suma exacta de los pesos de todas las bobinas y unidades pertenecientes a cada marca.
                </p>
              </div>
              <button
                onClick={() => handleOpenBobinas(null)}
                className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-all flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Bobina a Marca</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Marca / Fabricante</th>
                    <th className="px-5 py-3.5 text-center">Bobinas Disponibles</th>
                    <th className="px-5 py-3.5 text-right bg-emerald-50/70 text-emerald-950 font-bold">Kilos Totales Englobados</th>
                    <th className="px-5 py-3.5 text-right font-bold text-blue-950">Precio Venta ($/kg)</th>
                    <th className="px-5 py-3.5 text-center">Partidas / Lotes</th>
                    <th className="px-5 py-3.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingBrands ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                        Calculando englobado de marcas...
                      </td>
                    </tr>
                  ) : !brandsSummary?.marcas || brandsSummary.marcas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        <Tag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="font-semibold text-slate-600">No hay bobinas registradas para englobar</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Haz clic en "+ Cargar Bobina" para registrar la primera partida con su peso de balanza.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    brandsSummary.marcas.map((b, idx) => {
                      const prod = products.find(p => 
                        p.id === b.product_id || 
                        (p.brand && b.marca && p.brand.toLowerCase() === b.marca.toLowerCase() && (p.material === 'Bobinas' || (p.sku && p.sku.startsWith('BOB-'))))
                      ) || {
                        id: b.product_id,
                        name: `Bobinas de Polietileno ${b.marca}`,
                        brand: b.marca,
                        material: 'Bobinas',
                        unit_price: b.precio_kilo || 0,
                        unit_weight_kg: 21.5,
                        stock_quantity: b.bobinas_disponibles || 0,
                        total_weight_kg: b.total_kg_disponible || 0
                      };

                      return (
                        <tr key={b.marca || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center space-x-2">
                              <span className="p-2 bg-purple-50 text-purple-700 rounded-xl border border-purple-200">
                                <Tag className="w-4 h-4" />
                              </span>
                              <div>
                                <span className="font-extrabold text-slate-900 text-base">{b.marca}</span>
                                <span className="text-xs text-slate-400 block">{b.total_bobinas} bobinas registradas</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-teal-50 text-teal-800 border border-teal-200 font-mono">
                              <Boxes className="w-3.5 h-3.5 mr-1 text-teal-600" />
                              {b.bobinas_disponibles} bobinas
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right bg-emerald-50/40">
                            <div className="flex items-center justify-end space-x-1.5">
                              <Scale className="w-4 h-4 text-emerald-600" />
                              <span className="text-lg font-black text-emerald-800 font-mono">
                                {Number(b.total_kg_disponible || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                              </span>
                              <span className="text-xs font-bold text-emerald-700">kg</span>
                            </div>
                            <span className="text-[11px] text-emerald-600/80 block mt-0.5">
                              Peso real acumulado de balanza
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <span className="text-base font-black text-blue-900 font-mono">
                              {b.precio_kilo ? `$${Number(b.precio_kilo).toLocaleString('es-AR')}` : 'Sin fijar'}
                            </span>
                            {b.precio_kilo > 0 && <span className="text-xs text-blue-600 ml-1">/kg</span>}
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              📦 {b.total_lotes ? `${b.total_lotes} lote(s)` : 'Directo'}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => {
                                  setSelectedProductForLotes(prod);
                                  setIsLotesModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-all flex items-center space-x-1"
                                title="Ver los lotes de esta marca"
                              >
                                <Layers className="w-3.5 h-3.5 text-slate-600" />
                                <span>Ver Lotes</span>
                              </button>

                              <button
                                onClick={() => handleOpenBobinas(prod)}
                                className="px-2.5 py-1.5 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-all flex items-center space-x-1"
                                title="Ingresar nuevo lote para esta marca"
                              >
                                <Boxes className="w-3.5 h-3.5 text-teal-600" />
                                <span>+ Lote</span>
                              </button>

                              <button
                                onClick={() => onQuickSale(prod)}
                                className="p-1.5 text-emerald-700 hover:text-white hover:bg-emerald-600 bg-emerald-50 rounded-lg border border-emerald-200 transition-all"
                                title="Vender por kilo"
                              >
                                <ShoppingCart className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* PESTAÑA 3: DETALLE INDIVIDUAL DE TODAS LAS BOBINAS */}
      {activeTab === 'all_bobinas' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center">
                <Boxes className="w-4 h-4 mr-1.5 text-emerald-600" />
                Listado Individual de Bobinas & Rollos
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cada bobina con su marca, código, peso medido en balanza y unidades.
              </p>
            </div>
            <button
              onClick={() => handleOpenBobinas(null)}
              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-all flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Cargar Bobina</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Código / Lote</th>
                  <th className="px-4 py-3">Marca</th>
                  <th className="px-4 py-3">Producto Asociado</th>
                  <th className="px-4 py-3 text-right text-emerald-950 font-black">Peso Real (kg)</th>
                  <th className="px-4 py-3 text-right">Unidades</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingAllBobinas ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-600" />
                      Cargando bobinas...
                    </td>
                  </tr>
                ) : filteredBobinas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      No hay bobinas que coincidan con la búsqueda o el filtro de marca.
                    </td>
                  </tr>
                ) : (
                  filteredBobinas.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">
                        {b.codigo_bobina || `BOB-${b.id}`}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          🏷️ {b.marca || 'General'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-semibold">
                        {b.product_name ? (
                          <span>{b.product_name} <span className="text-slate-400 font-mono text-[10px]">({b.product_sku})</span></span>
                        ) : (
                          <span className="text-slate-400 italic">Sin producto específico</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-emerald-800 text-sm">
                        {Number(b.peso_kg).toFixed(3)} kg
                      </td>
                      <td className="px-4 py-3 text-right text-slate-800 font-semibold">
                        {(b.unidades || 0).toLocaleString()} u.
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.estado === 'Disponible'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {b.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleOpenBobinas(b.product_id ? { id: b.product_id, name: b.product_name, sku: b.product_sku } : null)}
                          className="px-2 py-1 text-[11px] text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-all font-semibold"
                        >
                          Gestionar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Bobinas */}
      <BobinasModal
        isOpen={isBobinasModalOpen}
        onClose={() => {
          setIsBobinasModalOpen(false);
          setSelectedProductForBobinas(null);
        }}
        product={selectedProductForBobinas}
        onBobinasUpdated={handleBobinasUpdated}
        existingBrands={brandsList.filter((b) => b !== 'ALL')}
      />

      {/* Modal 1: Configurar Marca (Ficha Técnica sin stock) */}
      <ConfigurarMarcaModal
        isOpen={isConfigurarMarcaOpen}
        onClose={() => setIsConfigurarMarcaOpen(false)}
        onMarcaSaved={handleRefreshAll}
        existingBrands={brandsList.filter((b) => b !== 'ALL')}
      />

      {/* Modal 2: Cargar Stock de Bolsas (Seleccionar Marca y cargar unidades/kilos) */}
      <CargarStockBolsasModal
        isOpen={isCargarStockBolsasOpen}
        onClose={() => setIsCargarStockBolsasOpen(false)}
        onProductSaved={handleRefreshAll}
        onOpenConfigurarMarca={() => setIsConfigurarMarcaOpen(true)}
        products={products}
      />

      {/* Modal de Lotes / Partidas y Trazabilidad de Pesos Unitarios */}
      <ProductLotesModal
        isOpen={isLotesModalOpen}
        onClose={() => {
          setIsLotesModalOpen(false);
          setSelectedProductForLotes(null);
        }}
        product={selectedProductForLotes}
        onLotesUpdated={handleRefreshAll}
      />

    </div>
  );
}
