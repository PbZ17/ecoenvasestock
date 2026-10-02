const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// Subir un informe / documento
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se ha proporcionado ningún archivo' });
    }

    const { title, category = 'General', notes, period } = req.body;
    const finalTitle = title && title.trim() !== '' ? title.trim() : req.file.originalname;

    const query = `
      INSERT INTO documents (
        title, category, file_name, original_name, file_path, file_size, mime_type, notes, period
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      finalTitle,
      category,
      req.file.filename,
      req.file.originalname,
      req.file.path,
      req.file.size,
      req.file.mimetype,
      notes || '',
      period || '',
    ];

    const { rows } = await db.query(query, values);
    res.status(201).json({
      success: true,
      message: 'Documento subido y guardado exitosamente',
      data: rows[0],
    });
  } catch (error) {
    console.error('Error al guardar documento:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener lista de todos los documentos e informes
exports.getAllDocuments = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = `
      SELECT id, title, category, file_name, original_name, file_size, mime_type, notes, period, created_at
      FROM documents
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'ALL') {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      query += ` AND (LOWER(title) LIKE $${params.length} OR LOWER(COALESCE(notes, '')) LIKE $${params.length} OR LOWER(original_name) LIKE $${params.length})`;
    }

    query += ` ORDER BY created_at DESC`;

    const { rows } = await db.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error al listar documentos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Descargar un documento
exports.downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM documents WHERE id = $1', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Documento no encontrado' });
    }

    const doc = rows[0];
    const absolutePath = path.resolve(doc.file_path);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, error: 'El archivo físico no se encuentra en el servidor' });
    }

    res.download(absolutePath, doc.original_name);
  } catch (error) {
    console.error('Error al descargar documento:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Eliminar un documento
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM documents WHERE id = $1', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Documento no encontrado' });
    }

    const doc = rows[0];
    const absolutePath = path.resolve(doc.file_path);

    if (fs.existsSync(absolutePath)) {
      try {
        fs.unlinkSync(absolutePath);
      } catch (err) {
        console.warn('No se pudo borrar el archivo físico:', err.message);
      }
    }

    await db.query('DELETE FROM documents WHERE id = $1', [id]);

    res.json({ success: true, message: 'Documento eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
