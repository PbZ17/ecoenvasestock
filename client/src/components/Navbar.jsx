import React from 'react';
import { 
  Package, 
  ShoppingCart, 
  FileSpreadsheet, 
  TrendingUp, 
  FolderArchive, 
  LayoutDashboard,
  Recycle,
  Scale,
  Wrench
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, summaryData }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventario & Stock', icon: Package },
    { id: 'repuestos', label: 'Repuestos', icon: Wrench },
    { id: 'sales', label: 'Ventas & Salidas', icon: ShoppingCart },
    { id: 'excel', label: 'Carga Excel', icon: FileSpreadsheet },
    { id: 'balances', label: 'Balances & Reportes', icon: TrendingUp },
    { id: 'documents', label: 'Gestor de Informes', icon: FolderArchive },
  ];

  const totalKg = summaryData?.inventory?.total_weight_kg || 0;
  const totalUnits = summaryData?.inventory?.total_units || 0;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo y Nombre */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Recycle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-900 bg-clip-text text-transparent">
                  Eco Envase
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Stock & Balances
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Control de Inventario y Kilos</p>
            </div>
          </div>

          {/* Métricas rápidas en barra superior */}
          <div className="hidden lg:flex items-center space-x-4 bg-slate-50 py-1.5 px-3.5 rounded-xl border border-slate-200/80">
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500 font-medium">Stock Total:</span>
              <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md shadow-2xs border border-slate-200">
                {totalUnits.toLocaleString()} u.
              </span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center space-x-2 text-xs">
              <Scale className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-500 font-medium">Kilos en Depósito:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md shadow-2xs border border-emerald-200">
                {totalKg.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
              </span>
            </div>
          </div>

          {/* Navegación por Pestañas */}
          <nav className="flex items-center space-x-1 overflow-x-auto py-2 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 ring-1 ring-emerald-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

        </div>
      </div>
    </header>
  );
}
