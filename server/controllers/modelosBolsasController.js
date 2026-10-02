const db = require('../config/db');

// Obtener todos los modelos/plantillas de bolsas con filtros opcionales
exports.getModelos = async (req, res) => {
  try {
    const { marca, categoria_material } = req.query;
    let query = `
      SELECT 
        id,
        marca,
        nombre_tipo,
        categoria_material,
        dimensiones,
        micrones,
        gramaje,
        caracteristicas,
        peso_unitario_referencia::float as peso_unitario_referencia,
        created_at
      FROM marca_modelos_bolsas
      WHERE 1=1
    `;
    const params = [];

    if (marca && marca !== 'ALL') {
      params.push(marca.trim());
      query += ` AND LOWER(marca) = LOWER($${params.length})`;
    }

    if (categoria_material && categoria_material !== 'ALL') {
      params.push(categoria_material.trim());
      query += ` AND categoria_material = $${params.length}`;
    }

    query += ` ORDER BY marca ASC, nombre_tipo ASC, dimensiones ASC`;

    const { rows } = await db.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error al obtener modelos de bolsas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Guardar o registrar un nuevo modelo / plantilla de bolsa para una marca
exports.saveModelo = async (req, res) => {
  try {
    const {
      id,
      marca,
      nombre_tipo,
      categoria_material = 'Bolsas de Polietileno',
      dimensiones,
      micrones,
      gramaje,
      caracteristicas,
      peso_unitario_referencia = 0,
    } = req.body;

    const brandToSave = (marca && typeof marca === 'string' && marca.trim()) 
      ? marca.trim() 
      : 'Sin Marca';

    if (!dimensiones || !dimensiones.trim()) {
      return res.status(400).json({ success: false, error: 'Las dimensiones son obligatorias' });
    }

    const cleanName = nombre_tipo && nombre_tipo.trim() !== '' 
      ? nombre_tipo.trim() 
      : `${categoria_material} ${dimensiones.trim()}`;

    if (id) {
      // Actualizar modelo existente
      const updateQuery = `
        UPDATE marca_modelos_bolsas
        SET
          marca = $1,
          nombre_tipo = $2,
          categoria_material = $3,
          dimensiones = $4,
          micrones = $5,
          gramaje = $6,
          caracteristicas = $7,
          peso_unitario_referencia = $8
        WHERE id = $9
        RETURNING *
      `;
      const { rows } = await db.query(updateQuery, [
        brandToSave,
        cleanName,
        categoria_material,
        dimensiones.trim(),
        micrones ? parseInt(micrones, 10) : null,
        gramaje ? parseInt(gramaje, 10) : null,
        caracteristicas || '',
        parseFloat(peso_unitario_referencia) || 0,
        id,
      ]);

      if (rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Modelo no encontrado' });
      }

      return res.json({
        success: true,
        message: 'Modelo actualizado correctamente',
        data: rows[0],
      });
    }

    // Insertar nuevo modelo
    const insertQuery = `
      INSERT INTO marca_modelos_bolsas (
        marca,
        nombre_tipo,
        categoria_material,
        dimensiones,
        micrones,
        gramaje,
        caracteristicas,
        peso_unitario_referencia
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const { rows } = await db.query(insertQuery, [
      brandToSave,
      cleanName,
      categoria_material,
      dimensiones.trim(),
      micrones ? parseInt(micrones, 10) : null,
      gramaje ? parseInt(gramaje, 10) : null,
      caracteristicas || '',
      parseFloat(peso_unitario_referencia) || 0,
    ]);

    res.status(201).json({
      success: true,
      message: 'Modelo de bolsa guardado para la marca',
      data: rows[0],
    });
  } catch (error) {
    console.error('Error al guardar modelo de bolsa:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener catálogo organizado por marcas con sus modelos
exports.getMarcasCatalog = async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        marca,
        nombre_tipo,
        categoria_material,
        dimensiones,
        micrones,
        gramaje,
        caracteristicas,
        peso_unitario_referencia::float as peso_unitario_referencia
      FROM marca_modelos_bolsas
      ORDER BY marca ASC, nombre_tipo ASC, dimensiones ASC
    `;
    const { rows } = await db.query(query);

    // Agrupar por marca
    const marcasMap = {};
    rows.forEach((m) => {
      const brand = m.marca || 'General';
      if (!marcasMap[brand]) {
        marcasMap[brand] = [];
      }
      marcasMap[brand].push(m);
    });

    const catalog = Object.keys(marcasMap).map((brandName) => ({
      marca: brandName,
      modelos: marcasMap[brandName],
    }));

    res.json({ success: true, data: catalog });
  } catch (error) {
    console.error('Error al obtener catálogo por marcas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Eliminar un modelo
exports.deleteModelo = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM marca_modelos_bolsas WHERE id = $1', [id]);
    res.json({ success: true, message: 'Modelo de bolsa eliminado' });
  } catch (error) {
    console.error('Error al eliminar modelo de bolsa:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
