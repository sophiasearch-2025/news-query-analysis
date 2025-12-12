// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
// Importa la conexión al cliente de Elasticsearch
const client = require('./db'); 

const app = express();
app.use(cors());
app.use(express.json());

const INDEX_NAME = process.env.ELASTIC_INDEX || 'noticias';

// Función para transformar los resultados ('hits') de Elastic al formato del frontend
const formatHits = (hits) => {
  return hits.map(hit => ({
    id_noticia: hit._id,
    ...hit._source
  }));
};

// ENDPOINT: Búsqueda Principal
app.get('/api/buscar', async (req, res) => {
  try {
    const {
      q,
      pais,
      fechaInicio,
      fechaFin,
      ordenar = 'fecha_subida',
      orden = 'desc',
      pagina = 1,
      limite = 10
    } = req.query;

    // Cálculo de la posición inicial para la paginación de Elastic
    const from = (parseInt(pagina) - 1) * parseInt(limite);
    const size = parseInt(limite);

    // Estructura base de la consulta bool de Elasticsearch
    const esQuery = {
      bool: {
        must: [], // Cláusulas que deben coincidir (relevancia)
        filter: [] // Cláusulas que deben coincidir (filtrado, sin impacto en score)
      }
    };

    // 1. Manejo del Query de Texto Libre (q)
    if (q) {
      esQuery.bool.must.push({
        multi_match: {
          query: q,
          fields: ['titulo', 'texto_noticia', 'medio.nombre'],
          fuzziness: 'AUTO' // Permite pequeñas incorrecciones
        }
      });
    } else {
      // Si no hay query, usar match_all para devolver todos los documentos
      esQuery.bool.must.push({ match_all: {} });
    }

    // 2. Filtro de País
    if (pais) {
      esQuery.bool.must.push({
        match: { "medio.pais": pais }
      });
    }

    // 3. Rango de Fechas (usa 'filter' para mejor rendimiento en rango)
    if (fechaInicio || fechaFin) {
      const rangeConfig = {};
      if (fechaInicio) rangeConfig.gte = fechaInicio; // Greater than or equal
      if (fechaFin) rangeConfig.lte = fechaFin;   // Less than or equal
      esQuery.bool.filter.push({ range: { fecha_subida: rangeConfig } });
    }

    // Ejecutar la consulta en Elasticsearch
    const result = await client.search({
      index: INDEX_NAME,
      body: {
        from,
        size,
        query: esQuery,
        sort: [{ [ordenar]: { order: orden } }] // Ordenamiento dinámico
      }
    });

    const totalResultados = result.hits.total.value;

    res.json({
      success: true,
      data: formatHits(result.hits.hits),
      paginacion: {
        total: totalResultados,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        totalPaginas: Math.ceil(totalResultados / size)
      },
      filtrosAplicados: { q, pais, fechaInicio, fechaFin }
    });

  } catch (error) {
    console.error('Error en búsqueda:', error.message);
    // Manejo específico si el índice no existe (404 de Elastic)
    if (error.meta && error.meta.statusCode === 404) {
        return res.status(404).json({ 
            success: false, 
            error: `El índice '${INDEX_NAME}' no existe. Asegúrate de ejecutar los scripts de carga de datos primero.` 
        });
    }
    res.status(500).json({ success: false, error: 'Error interno del servidor', mensaje: error.message });
  }
});

// ENDPOINT: Info del Dataset (metadatos para construir la UI)
app.get('/api/info', async (req, res) => {
    // Se definen las columnas hardcodeadas para la UI, ya que la estructura es conocida
    res.json({
        success: true,
        data: {
            columnas: [
                { column_name: 'titulo' },
                { column_name: 'texto_noticia' },
                { column_name: 'fecha_subida' },
                { column_name: 'url' },
                { column_name: 'medio.nombre' },
                { column_name: 'medio.pais' }
            ]
        }
    });
});

// ENDPOINT: Estadísticas (Agregaciones de Elastic)
app.get('/api/estadisticas', async (req, res) => {
  try {
    // Se usa size: 0 para evitar cargar documentos, solo calcular agregaciones
    const result = await client.search({
      index: INDEX_NAME,
      size: 0,
      body: {
        aggs: {
          min_fecha: { min: { field: 'fecha_subida' } },
          max_fecha: { max: { field: 'fecha_subida' } },
          // Agregación para contar valores únicos (cardinality)
          total_paises: { cardinality: { field: 'medio.pais.keyword' } } 
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalNoticias: result.hits.total.value,
        rangoFechas: {
          mas_antiguo: result.aggregations.min_fecha.value_as_string,
          mas_reciente: result.aggregations.max_fecha.value_as_string
        },
        paisesUnicos: result.aggregations.total_paises.value
      }
    });
  } catch (error) {
     // Respuesta por defecto si hay un error (ej. índice vacío o inexistente)
     res.json({
        success: true, 
        data: { totalNoticias: 0, rangoFechas: {}, paisesUnicos: 0 }
     });
  }
});

// Manejo de errores 404 para rutas no definidas
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint no encontrado' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 API Gateway (Elasticsearch) corriendo en http://localhost:${PORT}`);
  console.log(`📡 Esperando índice: ${INDEX_NAME}`);
});