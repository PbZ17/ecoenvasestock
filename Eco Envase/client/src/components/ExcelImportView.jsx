import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  UploadCloud, 
  CheckCircle, 
  AlertTriangle, 
  Layers, 
  Scale, 
  ArrowRight,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import { api } from '../services/api';

export default function ExcelImportView({ onImportSuccess, showToast }) {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [updateMode, setUpdateMode] = useState('sum'); // 'sum' o 'replace'
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    await processPreview(selected);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = e.dataTransfer.files[0];
      setFile(dropped);
      await processPreview(dropped);
    }
  };

  const processPreview = async (fileToProcess) => {
    setLoadingPreview(true);
    try {
      const res = await api.previewExcel(fileToProcess);
      if (res.success) {
        setPreviewData(res.data);
        showToast(`Archivo procesado: ${res.data.summary.totalRows} filas detectadas`, 'info');
      } else {
        showToast(res.error || 'Error al procesar archivo Excel', 'error');
        setPreviewData(null);
      }
    } catch (err) {
      showToast(err.message, 'error');
      setPreviewData(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const res = await api.importExcel(file, updateMode);
      if (res.success) {
        showToast(res.message, 'success');
        setFile(null);
        setPreviewData(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (onImportSuccess) onImportSuccess();
      } else {
        showToast(res.error || 'Error al importar datos a la base de datos', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center">
            <FileSpreadsheet className="w-6 h-6 mr-2 text-emerald-600" />
            Carga Masiva de Stock desde Excel
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Importa y actualiza rápidamente tu catálogo de envases, pesos unitarios y unidades desde una planilla de cálculo.
          </p>
        </div>

        {/* Botón Descargar Plantilla */}
        <a
          href={api.getExcelTemplateUrl()}
          download="Plantilla_Eco_Envase_Stock.xlsx"
          className="inline-flex items-center space-x-2 px-4 py-2.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 shadow-xs transition-all shrink-0"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Descargar Plantilla Excel</span>
        </a>
      </div>

      {/* Zona de Subida Drag & Drop */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`bg-white rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          file ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".xlsx, .xls, .csv"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shadow-xs">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-800">
              {file ? file.name : 'Arrastra tu archivo Excel aquí o haz clic para seleccionarlo'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Formatos soportados: .xlsx, .xls, .csv (hasta 15 MB)
            </p>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-all"
          >
            {file ? 'Cambiar archivo' : 'Seleccionar archivo desde la computadora'}
          </button>
        </div>
      </div>

      {/* Previsualización de Datos */}
      {loadingPreview && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
          <p className="text-sm font-semibold">Procesando y analizando datos del Excel...</p>
        </div>
      )}

      {previewData && !loadingPreview && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 animate-in fade-in duration-200">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <FileCheck className="w-5 h-5 mr-1.5 text-emerald-600" />
                Previsualización de Datos a Importar
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verifica las columnas y filas detectadas antes de guardar en PostgreSQL.
              </p>
            </div>

            {/* Opciones de actualización */}
            <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium pl-1">Si el SKU ya existe:</span>
              <button
                type="button"
                onClick={() => setUpdateMode('sum')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  updateMode === 'sum' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Sumar Stock
              </button>
              <button
                type="button"
                onClick={() => setUpdateMode('replace')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  updateMode === 'replace' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Reemplazar Stock
              </button>
            </div>
          </div>

          {/* Tarjetas de Resumen Previo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 font-medium">Filas Válidas</span>
              <div className="text-lg font-extrabold text-slate-900">{previewData.summary.validRows}</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
              <span className="text-[11px] text-blue-600 font-medium">Total Unidades</span>
              <div className="text-lg font-extrabold text-blue-900 font-mono">
                {previewData.summary.totalUnits.toLocaleString()} u.
              </div>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
              <span className="text-[11px] text-emerald-700 font-medium">Kilos Totales a Cargar</span>
              <div className="text-lg font-extrabold text-emerald-800 font-mono">
                {previewData.summary.totalWeightKg.toLocaleString()} kg
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 font-medium">Modo de Stock</span>
              <div className="text-sm font-bold text-slate-800 mt-1">
                {updateMode === 'sum' ? 'Suma acumulativa' : 'Reemplazo'}
              </div>
            </div>
          </div>

          {/* Tabla previa de primeras filas */}
          <div className="overflow-x-auto border border-slate-100 rounded-xl max-h-72">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2">Fila</th>
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Material</th>
                  <th className="px-3 py-2 text-right">Peso Unit. (kg)</th>
                  <th className="px-3 py-2 text-right">Unidades</th>
                  <th className="px-3 py-2 text-right font-bold text-emerald-800 bg-emerald-50">Kilos Totales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewData.rows.slice(0, 50).map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-3 py-1.5 text-slate-400 font-mono">#{row.rowNumber}</td>
                    <td className="px-3 py-1.5 font-mono font-semibold text-slate-700">{row.sku}</td>
                    <td className="px-3 py-1.5 font-bold text-slate-900">{row.name}</td>
                    <td className="px-3 py-1.5 text-slate-600">{row.material || '-'}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-slate-700">{row.unit_weight_kg} kg</td>
                    <td className="px-3 py-1.5 text-right font-mono font-bold text-slate-900">{row.stock_quantity}</td>
                    <td className="px-3 py-1.5 text-right font-mono font-bold text-emerald-700 bg-emerald-50/50">
                      {row.total_weight_kg} kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Botón de Confirmación */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPreviewData(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={importing}
              onClick={handleConfirmImport}
              className="flex items-center space-x-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{importing ? 'Importando a PostgreSQL...' : 'Confirmar e Importar al Stock'}</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
