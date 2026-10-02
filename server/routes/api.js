const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear carpeta uploads si no existe
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer en memoria para archivos Excel
const excelStorage = multer.memoryStorage();
const uploadExcel = multer({
  storage: excelStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

// Multer en disco para documentos e informes generales
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'doc-' + uniqueSuffix + ext);
  },
});
const uploadDoc = multer({
  storage: documentStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Importar controladores
const productsController = require('../controllers/productsController');
const salesController = require('../controllers/salesController');
const excelController = require('../controllers/excelController');
const reportsController = require('../controllers/reportsController');
const documentsController = require('../controllers/documentsController');
const bobinasController = require('../controllers/bobinasController');
const modelosBolsasController = require('../controllers/modelosBolsasController');
const repuestosController = require('../controllers/repuestosController');

// --- REPUESTOS & MANTENIMIENTO ---
router.get('/repuestos', repuestosController.getAllRepuestos);
router.get('/repuestos/movimientos/historial', repuestosController.getHistorialMovimientos);
router.get('/repuestos/:id', repuestosController.getRepuestoById);
router.post('/repuestos', repuestosController.createRepuesto);
router.put('/repuestos/:id', repuestosController.updateRepuesto);
router.delete('/repuestos/:id', repuestosController.deleteRepuesto);
router.post('/repuestos/:id/movimiento', repuestosController.registrarMovimiento);

// --- MODELOS & PLANTILLAS DE BOLSAS POR MARCA ---
router.get('/modelos-bolsas', modelosBolsasController.getModelos);
router.get('/modelos-bolsas/marcas-catalog', modelosBolsasController.getMarcasCatalog);
router.post('/modelos-bolsas', modelosBolsasController.saveModelo);
router.delete('/modelos-bolsas/:id', modelosBolsasController.deleteModelo);

// --- BOBINAS & MARCAS (STOCK VARIABLE Y ENGLOBADO) ---
router.get('/bobinas', bobinasController.getAllBobinas);
router.get('/bobinas/summary-by-brand', bobinasController.getBobinasSummaryByBrand);
router.post('/bobinas', bobinasController.createBobina);
router.put('/bobinas/:id', bobinasController.updateBobina);
router.delete('/bobinas/:id', bobinasController.deleteBobina);

// --- PRODUCTOS & STOCK ---
router.get('/products', productsController.getAllProducts);
router.get('/products/:id', productsController.getProductById);
router.get('/products/:id/lotes', productsController.getProductLotes);
router.post('/products/:id/lotes', productsController.createProductLote);
router.post('/products/lotes', productsController.createProductLote);
router.put('/products/lotes/:loteId/status', productsController.updateProductLoteStatus);
router.delete('/products/lotes/:loteId', productsController.deleteProductLote);
router.post('/products', productsController.createProduct);
router.put('/products/:id', productsController.updateProduct);
router.delete('/products/:id', productsController.deleteProduct);
router.post('/products/:id/adjust-stock', productsController.adjustStock);

// --- VENTAS ---
router.get('/sales', salesController.getAllSales);
router.post('/sales', salesController.createSale);
router.delete('/sales/:id', salesController.cancelSale);

// --- EXCEL & IMPORTACIÓN ---
router.get('/excel/template', excelController.downloadTemplate);
router.post('/excel/preview', uploadExcel.single('file'), excelController.previewExcel);
router.post('/excel/import', uploadExcel.single('file'), excelController.importExcel);

// --- REPORTES & BALANCES ---
router.get('/reports/dashboard', reportsController.getDashboardSummary);
router.get('/reports/stock', reportsController.getStockReport);
router.get('/reports/balances', reportsController.getBalanceReport);
router.get('/reports/export/stock', reportsController.exportStockExcel);
router.get('/reports/export/balances', reportsController.exportBalanceExcel);

// --- INFORMES Y DOCUMENTOS ---
router.get('/documents', documentsController.getAllDocuments);
router.post('/documents/upload', uploadDoc.single('file'), documentsController.uploadDocument);
router.get('/documents/:id/download', documentsController.downloadDocument);
router.delete('/documents/:id', documentsController.deleteDocument);

module.exports = router;
