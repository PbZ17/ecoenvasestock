import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderArchive, 
  Upload, 
  Download, 
  Trash2, 
  FileText, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  CheckCircle,
  Clock,
  HardDrive
} from 'lucide-react';
import { api } from '../services/api';

export default function DocumentsView({ showToast }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Estado del formulario de subida
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Balance');
  const [period, setPeriod] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await api.getDocuments({ category: categoryFilter, search });
      if (res.success) {
        setDocuments(res.data);
      }
    } catch (err) {
      showToast('Error al cargar informes: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDocs();
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      showToast('Selecciona un archivo para subir', 'error');
      return;
    }

    setUploading(true);
    try {
      const res = await api.uploadDocument(file, {
        title: title || file.name,
        category,
        period,
        notes,
      });

      if (res.success) {
        showToast('Informe subido y archivado correctamente', 'success');
        setFile(null);
        setTitle('');
        setPeriod('');
        setNotes('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchDocs();
      } else {
        showToast(res.error || 'Error al subir informe', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este informe del repositorio?')) return;
    try {
      const res = await api.deleteDocument(id);
      if (res.success) {
        showToast('Informe eliminado', 'success');
        fetchDocs();
      } else {
        showToast(res.error || 'Error al eliminar', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'Balance':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Stock':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Remito':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Certificado':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Encabezado y Formulario de Subida */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center">
              <FolderArchive className="w-5 h-5 mr-2 text-emerald-600" />
              Gestor de Informes y Documentos
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Repositorio para archivar informes de balances, reportes de stock, remitos y documentos adjuntos.
            </p>
          </div>
        </div>

        {/* Formulario de Carga */}
        <form onSubmit={handleUpload} className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-4">
          <div className="text-xs font-bold text-slate-700 uppercase flex items-center">
            <Upload className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Subir Nuevo Informe / Documento
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            
            {/* Selector de Archivo */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Archivo (PDF, Excel, Word, Imagen) <span className="text-rose-500">*</span>
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  const f = e.target.files[0];
                  setFile(f);
                  if (f && !title) setTitle(f.name.replace(/\.[^/.]+$/, ''));
                }}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer bg-white p-1 rounded-xl border border-slate-200"
              />
            </div>

            {/* Título */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Título del Informe</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Balance General Q3 2026"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
              />
            </div>

            {/* Categoría */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
              >
                <option value="Balance">Balance Contable</option>
                <option value="Stock">Reporte de Stock</option>
                <option value="Remito">Remito / Entrega</option>
                <option value="Certificado">Certificado Calidad</option>
                <option value="Otro">Otro Documento</option>
              </select>
            </div>

            {/* Período */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Período / Mes</label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="Ej: Ago 2026"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-10">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas u observaciones sobre el contenido del informe..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={uploading || !file}
                className={`w-full flex items-center justify-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  file && !uploading
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? 'Subiendo...' : 'Guardar'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Lista de Documentos Guardados */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        
        {/* Filtros de Documentos */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar informes archivados..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </form>

          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
            >
              <option value="ALL">Todas las Categorías</option>
              <option value="Balance">Balances</option>
              <option value="Stock">Reportes de Stock</option>
              <option value="Remito">Remitos</option>
              <option value="Certificado">Certificados</option>
              <option value="Otro">Otros</option>
            </select>
          </div>
        </div>

        {/* Tabla de Informes */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Informe / Documento</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Período</th>
                <th className="px-4 py-3">Tamaño</th>
                <th className="px-4 py-3">Fecha de Carga</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Cargando repositorio de informes...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    <FolderArchive className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-600">No hay informes archivados</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Usa el formulario superior para subir balances o reportes.</p>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 flex items-center">
                        <FileText className="w-3.5 h-3.5 mr-1.5 text-emerald-600 shrink-0" />
                        {doc.title}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{doc.original_name}</span>
                      {doc.notes && <p className="text-[11px] text-slate-500 italic mt-0.5">{doc.notes}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadge(doc.category)}`}>
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">
                      {doc.period || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono">
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {doc.created_at ? new Date(doc.created_at).toLocaleDateString('es-AR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <a
                          href={api.getDocumentDownloadUrl(doc.id)}
                          download={doc.original_name}
                          className="p-1.5 text-emerald-700 hover:text-white hover:bg-emerald-600 bg-emerald-50 rounded-lg border border-emerald-200 transition-all"
                          title="Descargar archivo"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Eliminar informe"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
