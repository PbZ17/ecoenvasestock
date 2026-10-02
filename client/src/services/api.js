const API_BASE = '/api';

async function safeRequest(url, options = {}) {
  try {
    const res = await fetch(url, options);
    
    // Obtener texto crudo primero para evitar fallos de parsing si la respuesta viene vacía
    const text = await res.text();
    if (!text || text.trim() === '') {
      if (!res.ok) {
        return {
          success: false,
          error: `Error del servidor (Código ${res.status}): Sin respuesta de datos.`,
        };
      }
      return { success: true, data: null };
    }

    try {
      const data = JSON.parse(text);
      return data;
    } catch (parseErr) {
      console.error('Error al parsear JSON:', parseErr, text);
      return {
        success: false,
        error: `Respuesta no válida del servidor (${res.status}). Asegúrate de que el servidor backend esté corriendo en el puerto 5000.`,
      };
    }
  } catch (netErr) {
    console.error('Error de conexión con la API:', netErr);
    return {
      success: false,
      error: 'No se pudo conectar con el backend. Inicia el sistema ejecutando iniciar_sistema.bat.',
    };
  }
}

export const api = {
  // --- PRODUCTOS & INVENTARIO ---
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return safeRequest(`${API_BASE}/products?${query}`);
  },

  async getProductById(id) {
    return safeRequest(`${API_BASE}/products/${id}`);
  },

  async createProduct(productData) {
    return safeRequest(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
  },

  async updateProduct(id, productData) {
    return safeRequest(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
  },

  async deleteProduct(id) {
    return safeRequest(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
    });
  },

  async adjustStock(id, data) {
    return safeRequest(`${API_BASE}/products/${id}/adjust-stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async getProductLotes(id) {
    return safeRequest(`${API_BASE}/products/${id}/lotes`);
  },

  async createProductLote(productId, loteData) {
    const url = productId ? `${API_BASE}/products/${productId}/lotes` : `${API_BASE}/products/lotes`;
    return safeRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loteData),
    });
  },

  async updateProductLoteStatus(loteId, estado) {
    return safeRequest(`${API_BASE}/products/lotes/${loteId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    });
  },

  async deleteProductLote(loteId) {
    return safeRequest(`${API_BASE}/products/lotes/${loteId}`, {
      method: 'DELETE',
    });
  },

  // --- BOBINAS & ENGOBADO POR MARCA ---
  async getBobinas(params = {}) {
    const query = new URLSearchParams(params).toString();
    return safeRequest(`${API_BASE}/bobinas?${query}`);
  },

  async getBobinasSummaryByBrand() {
    return safeRequest(`${API_BASE}/bobinas/summary-by-brand`);
  },

  async createBobina(bobinaData) {
    return safeRequest(`${API_BASE}/bobinas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bobinaData),
    });
  },

  async updateBobina(id, bobinaData) {
    return safeRequest(`${API_BASE}/bobinas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bobinaData),
    });
  },

  async deleteBobina(id) {
    return safeRequest(`${API_BASE}/bobinas/${id}`, {
      method: 'DELETE',
    });
  },

  // --- MODELOS & PLANTILLAS DE BOLSAS POR MARCA ---
  async getModelosBolsas(params = {}) {
    const query = new URLSearchParams(params).toString();
    return safeRequest(`${API_BASE}/modelos-bolsas?${query}`);
  },

  async getMarcasCatalog() {
    return safeRequest(`${API_BASE}/modelos-bolsas/marcas-catalog`);
  },

  async saveModeloBolsa(data) {
    return safeRequest(`${API_BASE}/modelos-bolsas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async deleteModeloBolsa(id) {
    return safeRequest(`${API_BASE}/modelos-bolsas/${id}`, {
      method: 'DELETE',
    });
  },

  // --- REPUESTOS & MANTENIMIENTO ---
  async getRepuestos(params = {}) {
    const query = new URLSearchParams(params).toString();
    return safeRequest(`${API_BASE}/repuestos?${query}`);
  },

  async getRepuestoById(id) {
    return safeRequest(`${API_BASE}/repuestos/${id}`);
  },

  async createRepuesto(repuestoData) {
    return safeRequest(`${API_BASE}/repuestos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(repuestoData),
    });
  },

  async updateRepuesto(id, repuestoData) {
    return safeRequest(`${API_BASE}/repuestos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(repuestoData),
    });
  },

  async deleteRepuesto(id) {
    return safeRequest(`${API_BASE}/repuestos/${id}`, {
      method: 'DELETE',
    });
  },

  async registrarMovimientoRepuesto(id, movimientoData) {
    return safeRequest(`${API_BASE}/repuestos/${id}/movimiento`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movimientoData),
    });
  },

  async getHistorialMovimientosRepuestos(params = {}) {
    const query = new URLSearchParams(params).toString();
    return safeRequest(`${API_BASE}/repuestos/movimientos/historial?${query}`);
  },

  // --- VENTAS ---
  async getSales(params = {}) {
    const query = new URLSearchParams(params).toString();
    return safeRequest(`${API_BASE}/sales?${query}`);
  },

  async createSale(saleData) {
    return safeRequest(`${API_BASE}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData),
    });
  },

  async cancelSale(id) {
    return safeRequest(`${API_BASE}/sales/${id}`, {
      method: 'DELETE',
    });
  },

  // --- EXCEL & IMPORTACIÓN ---
  getExcelTemplateUrl() {
    return `${API_BASE}/excel/template`;
  },

  async previewExcel(file) {
    const formData = new FormData();
    formData.append('file', file);
    return safeRequest(`${API_BASE}/excel/preview`, {
      method: 'POST',
      body: formData,
    });
  },

  async importExcel(file, updateExistingMode = 'sum') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('updateExistingMode', updateExistingMode);
    return safeRequest(`${API_BASE}/excel/import`, {
      method: 'POST',
      body: formData,
    });
  },

  // --- REPORTES & BALANCES ---
  async getDashboardSummary() {
    return safeRequest(`${API_BASE}/reports/dashboard`);
  },

  async getStockReport(params = {}) {
    const query = new URLSearchParams(params).toString();
    return safeRequest(`${API_BASE}/reports/stock?${query}`);
  },

  async getBalanceReport(params = {}) {
    const query = new URLSearchParams(params).toString();
    return safeRequest(`${API_BASE}/reports/balances?${query}`);
  },

  getExportStockUrl() {
    return `${API_BASE}/reports/export/stock`;
  },

  getExportBalanceUrl() {
    return `${API_BASE}/reports/export/balances`;
  },

  // --- DOCUMENTOS E INFORMES ---
  async getDocuments(params = {}) {
    const query = new URLSearchParams(params).toString();
    return safeRequest(`${API_BASE}/documents?${query}`);
  },

  async uploadDocument(file, meta = {}) {
    const formData = new FormData();
    formData.append('file', file);
    if (meta.title) formData.append('title', meta.title);
    if (meta.category) formData.append('category', meta.category);
    if (meta.notes) formData.append('notes', meta.notes);
    if (meta.period) formData.append('period', meta.period);

    return safeRequest(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
  },

  getDocumentDownloadUrl(id) {
    return `${API_BASE}/documents/${id}/download`;
  },

  async deleteDocument(id) {
    return safeRequest(`${API_BASE}/documents/${id}`, {
      method: 'DELETE',
    });
  },
};
