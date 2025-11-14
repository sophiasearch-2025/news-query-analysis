// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db'); // Módulo de conexión a BD

const app = express();
app.use(cors());
app.use(express.json());

// ENDPOINT: Información de la tabla
app.get('/api/info', async (req, res) => {
  try {
    const query = `
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_name = 'Noticias';
    `;
    const { rows: campos } = await db.query(query);
    const { rows: total } = await db.query('SELECT COUNT(*) FROM "Noticias"');

    res.json({
      success: true,
      data: {
        tabla: 'Noticias',
        totalRegistros: parseInt(total[0].count, 10),
        columnas: campos,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener información', mensaje: error.message });
  }
});


// ENDPOINT PRINCIPAL: Búsqueda
app.get('/api/buscar', async (req, res) => {
  try {
    const {
      q,
      fechaInicio,
      fechaFin,
      ordenar = 'fecha_subida',
      orden = 'desc',
      pagina = 1,
      limite = 10
    } = req.query;

    let baseQuery = 'SELECT * FROM "Noticias"';
    let whereClauses = [];
    let queryParams = [];

    // Búsqueda por 'titulo'
    if (q) {
      queryParams.push(`%${q.toLowerCase()}%`);
      whereClauses.push(`titulo ILIKE $${queryParams.length}`);
    }

    // Filtro por rango de fechas
    if (fechaInicio) {
      queryParams.push(fechaInicio);
      whereClauses.push(`fecha_subida >= $${queryParams.length}`);
    }
    if (fechaFin) {
      queryParams.push(fechaFin);
      whereClauses.push(`fecha_subida <= $${queryParams.length}`);
    }

    if (whereClauses.length > 0) {
      baseQuery += ' WHERE ' + whereClauses.join(' AND ');
    }

    // Conteo total para paginación
    const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) AS subquery`;
    const { rows: countRows } = await db.query(countQuery, queryParams);
    const totalResultados = parseInt(countRows[0].count, 10);

    // Ordenamiento (con validación para evitar Inyección SQL)
    const columnasValidas = ['id_noticia', 'titulo', 'fecha_subida', 'largo_noticia', 'url'];
    const ordenValido = ['asc', 'desc'];
    
    const columnaOrden = columnasValidas.includes(ordenar) ? `"${ordenar}"` : 'fecha_subida';
    const direccionOrden = ordenValido.includes(orden) ? orden : 'desc';
    
    baseQuery += ` ORDER BY ${columnaOrden} ${direccionOrden}`;

    // Paginación
    const paginaNum = parseInt(pagina);
    const limiteNum = parseInt(limite);
    const offset = (paginaNum - 1) * limiteNum;
    
    queryParams.push(limiteNum);
    baseQuery += ` LIMIT $${queryParams.length}`;
    queryParams.push(offset);
    baseQuery += ` OFFSET $${queryParams.length}`;

    // Ejecutar Consulta
    const { rows: resultadosPaginados } = await db.query(baseQuery, queryParams);

    res.json({
      success: true,
      data: resultadosPaginados,
      paginacion: {
        total: totalResultados,
        pagina: paginaNum,
        limite: limiteNum,
        totalPaginas: Math.ceil(totalResultados / limiteNum)
      },
      filtrosAplicados: { q, fechaInicio, fechaFin }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error en la búsqueda',
      mensaje: error.message
    });
  }
});

// ENDPOINT: Obtener todas las noticias
app.get('/api/noticias', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM "Noticias" ORDER BY fecha_subida DESC');
    res.json({
      success: true,
      data: rows,
      total: rows.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener noticias', mensaje: error.message });
  }
});

// ENDPOINT: Obtener una noticia por ID
app.get('/api/noticias/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID no válido' });
    }
    
    const { rows } = await db.query('SELECT * FROM "Noticias" WHERE id_noticia = $1', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Noticia no encontrada' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener noticia', mensaje: error.message });
  }
});


// ENDPOINT: Estadísticas
app.get('/api/estadisticas', async (req, res) => {
  try {
    const totalQuery = db.query('SELECT COUNT(*) AS totalRegistros FROM "Noticias"');
    const fechasQuery = db.query('SELECT MIN(fecha_subida) AS mas_antiguo, MAX(fecha_subida) AS mas_reciente FROM "Noticias"');
    
    const [total, fechas] = await Promise.all([totalQuery, fechasQuery]);

    res.json({
      success: true,
      data: {
        totalNoticias: parseInt(total.rows[0].totalregistros, 10),
        rangoFechas: fechas.rows[0],
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener estadísticas', mensaje: error.message });
  }
});


// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado',
    endpoints_disponibles: [ 
      'GET /api/info',
      'GET /api/buscar',
      'GET /api/noticias',
      'GET /api/noticias/:id',
      'GET /api/estadisticas'
    ]
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n API de Búsqueda (PostgreSQL - Noticias) corriendo en http://localhost:${PORT}`);
  console.log(`\n Endpoints disponibles:`);
  console.log(`   GET  /api/info          - Información de la tabla`);
  console.log(`   GET  /api/buscar        - Búsqueda con filtros`);
  console.log(`   GET  /api/noticias      - Ver todas las noticias`);
  console.log(`   GET  /api/noticias/:id  - Ver una noticia`);
  console.log(`   GET  /api/estadisticas  - Estadísticas simples\n`);
});