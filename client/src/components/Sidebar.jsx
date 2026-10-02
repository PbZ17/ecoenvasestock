import React, { useState } from 'react';
import { 
  Package, 
  ShoppingCart, 
  FileSpreadsheet, 
  TrendingUp, 
  FolderArchive, 
  LayoutDashboard,
  Recycle,
  Scale,
  Wrench,
  Menu,
  X,
  Boxes,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, summaryData }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const mainNavItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      description: 'Panel general y métricas',
      icon: LayoutDashboard,
      badge: null
    },
    { 
      id: 'inventory', 
      label: 'Inventario & Stock', 
      description: 'Bolsas, bobinas y lotes',
      icon: Package,
      badge: summaryData?.inventory?.total_items ? `${summaryData.inventory.total_items}` : null
    },
    { 
      id: 'repuestos', 
      label: 'Repuestos & Mant.', 
      description: 'Piezas, repuestos y consumos',
      icon: Wrench,
      badge: null
    },
    { 
      id: 'sales', 
      label: 'Ventas & Salidas', 
      description: 'Facturación, remitos y FIFO',
      icon: ShoppingCart,
      badge: null
    },
  ];

  const toolsNavItems = [
    { 
      id: 'excel', 
      label: 'Carga Excel', 
      description: 'Importador masivo',
      icon: FileSpreadsheet,
      badge: null
    },
    { 
      id: 'balances', 
      label: 'Balances & Reportes', 
      description: 'Cierres de stock y kilos',
      icon: TrendingUp,
      badge: null
    },
    { 
      id: 'documents', 
      label: 'Gestor de Informes', 
      description: 'Archivos y documentos',
      icon: FolderArchive,
      badge: null
    },
  ];

  const totalKg = summaryData?.inventory?.total_weight_kg || 0;
  const totalUnits = summaryData?.inventory?.total_units || 0;

  const handleSelectTab = (id) => {
    setActiveTab(id);
    setMobileOpen(false); // Cierra menú móvil al seleccionar
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      
      {/* Zona Superior: Marca y Menús */}
      <div className="space-y-6">
        
        {/* Logo y Encabezado de la Marca */}
        <div className="flex items-center space-x-3 px-2 py-1">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0 ring-4 ring-emerald-500/10">
            <Recycle className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-xl tracking-tight text-slate-900 truncate">
                Eco Envase
              </span>
            </div>
            <p className="text-[11px] font-semibold text-emerald-700 tracking-wide uppercase">
              Control de Stock & Balances
            </p>
          </div>
        </div>

        {/* Grupo 1: Módulos Principales de Operación */}
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
            Operaciones Principales
          </span>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left font-semibold transition-all duration-150 group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800'
                  }`}>
                    <Icon className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold block truncate">{item.label}</span>
                    <span className={`text-[10px] font-medium block truncate ${
                      isActive ? 'text-emerald-100' : 'text-slate-400'
                    }`}>
                      {item.description}
                    </span>
                  </div>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Grupo 2: Herramientas, Reportes y Archivos */}
        <div className="space-y-1 pt-2 border-t border-slate-100">
          <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
            Análisis & Herramientas
          </span>
          {toolsNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left font-semibold transition-all duration-150 group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800'
                  }`}>
                    <Icon className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold block truncate">{item.label}</span>
                    <span className={`text-[10px] font-medium block truncate ${
                      isActive ? 'text-emerald-100' : 'text-slate-400'
                    }`}>
                      {item.description}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

      </div>

      {/* Zona Inferior: Resumen Rápido de Depósito */}
      <div className="pt-4 border-t border-slate-200/80 space-y-3 mt-6">
        
        {/* Tarjeta de métricas en vivo */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/90 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span className="flex items-center">
              <Boxes className="w-3 h-3 mr-1 text-slate-400" />
              Depósito en Vivo
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Sistema conectado" />
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[11px] font-medium">Bolsas / Unid.:</span>
              <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                {totalUnits.toLocaleString()} u.
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[11px] font-medium flex items-center">
                <Scale className="w-3 h-3 mr-1 text-emerald-600" />
                Kilos Bobinas:
              </span>
              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                {totalKg.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg
              </span>
            </div>
          </div>
        </div>

        {/* Pie de versión */}
        <div className="px-1 flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <span className="flex items-center">
            <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
            Eco Envase v2.4
          </span>
          <span>Online</span>
        </div>

      </div>

    </div>
  );

  return (
    <>
      {/* Barra Superior Móvil (solo en pantallas chicas < md) */}
      <header className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
            <Recycle className="w-5 h-5" />
          </div>
          <div>
            <span className="font-black text-base text-slate-900 leading-tight block">
              Eco Envase
            </span>
            <span className="text-[10px] font-bold text-emerald-700 uppercase block">
              {mainNavItems.concat(toolsNavItems).find(i => i.id === activeTab)?.label || 'Menú'}
            </span>
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-slate-200"
          aria-label="Abrir Menú"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Drawer / Desplegable para Móviles */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex">
          <div className="w-72 bg-white h-full p-5 overflow-y-auto shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Sidebar Lateral Fijo para Desktop (>= md) */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 bg-white border-r border-slate-200/90 p-5 h-screen sticky top-0 overflow-y-auto z-30 shadow-xs">
        {navContent}
      </aside>
    </>
  );
}
