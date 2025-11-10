// API de Búsqueda con Filtros - Carga desde CSV
// Requiere: npm install express cors date-fns csv-parser fs

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const csv = require('csv-parser');
const { parseISO, isWithinInterval } = require('date-fns');

const app = express();
app.use(cors());
app.use(express.json());

// Variable para almacenar los datos del CSV
let articulos = [];
let csvCargado = false;

// Función para cargar el CSV
function cargarCSV(rutaArchivo = './dataset_prueba.csv') {
  return new Promise((resolve, reject) => {
    const resultados = [];
    
    if (!fs.existsSync(rutaArchivo)) {
      reject(new Error(`Archivo ${rutaArchivo} no encontrado`));
      return;
    }

    fs.createReadStream(rutaArchivo)
      .pipe(csv())
      .on('data', (data) => {
        // Procesar cada fila del CSV
        // Adaptar según la estructura de tu CSV
        const registro = {
          id: resultados.length + 1,
          ...data,
          // Si el CSV tiene palabras clave como string, convertir a array
          palabrasClave: data.palabrasClave 
            ? data.palabrasClave.split(',').map(k => k.trim())
            : [],
          // Asegurar que la fecha esté en formato ISO
          fecha: data.fecha || new Date().toISOString()
        };
        resultados.push(registro);
      })
      .on('end', () => {
        articulos = resultados;
        csvCargado = true;
        console.log(`✅ CSV cargado: ${articulos.length} registros`);
        resolve(resultados);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Cargar CSV al iniciar
cargarCSV().catch(error => {
  console.error('❌ Error al cargar CSV:', error.message);
  console.log('💡 Usando datos de ejemplo...');
  // Datos de respaldo si no se puede cargar el CSV
  articulos = [
    {
      id: 1,
      titulo: "Ejemplo de Artículo",
      contenido: "Contenido de ejemplo",
      palabrasClave: ["ejemplo"],
      medio: "blog",
      autor: "Sistema",
      fecha: new Date().toISOString(),
      categoria: "General"
    }
  ];
  csvCargado = true;
});

// Middleware para verificar que el CSV esté cargado
function verificarCSV(req, res, next) {
  if (!csvCargado) {
    return res.status(503).json({
      success: false,
      error: 'CSV aún no cargado. Intente nuevamente en unos segundos.'
    });
  }
  next();
}

// ENDPOINT: Recargar CSV
app.post('/api/recargar-csv', async (req, res) => {
  try {
    const rutaArchivo = req.body.rutaArchivo || './dataset_prueba.csv';
    await cargarCSV(rutaArchivo);
    res.json({
      success: true,
      mensaje: `CSV recargado exitosamente: ${articulos.length} registros`,
      totalRegistros: articulos.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al recargar CSV',
      mensaje: error.message
    });
  }
});

// ENDPOINT: Información del dataset
app.get('/api/info-dataset', verificarCSV, (req, res) => {
  // Obtener estructura del dataset
  const primerRegistro = articulos[0] || {};
  const campos = Object.keys(primerRegistro);
  
  // Obtener valores únicos para cada campo
  const valoresUnicos = {};
  campos.forEach(campo => {
    const valores = [...new Set(articulos.map(a => a[campo]))];
    valoresUnicos[campo] = {
      total: valores.length,
      ejemplos: valores.slice(0, 5)
    };
  });

  res.json({
    success: true,
    data: {
      totalRegistros: articulos.length,
      campos: campos,
      estructura: primerRegistro,
      valoresUnicos: valoresUnicos
    }
  });
});

// ENDPOINT PRINCIPAL: Búsqueda con filtros
app.get('/api/buscar', verificarCSV, (req, res) => {
  try {
    const {
      q,              // query de búsqueda general
      campo,          // campo específico para buscar
      palabrasClave,  // filtro por palabras clave
      fechaInicio,    // fecha inicio
      fechaFin,       // fecha fin
      medio,          // tipo de medio
      categoria,      // categoría
      autor,          // autor
      ordenar = 'fecha',
      orden = 'desc',
      pagina = 1,
      limite = 10
    } = req.query;

    let resultados = [...articulos];

    // Búsqueda general en todos los campos de texto
    if (q) {
      const queryLower = q.toLowerCase();
      resultados = resultados.filter(art => {
        return Object.values(art).some(valor => {
          if (typeof valor === 'string') {
            return valor.toLowerCase().includes(queryLower);
          }
          if (Array.isArray(valor)) {
            return valor.some(v => 
              typeof v === 'string' && v.toLowerCase().includes(queryLower)
            );
          }
          return false;
        });
      });
    }

    // Búsqueda en campo específico
    if (campo && q) {
      const [nombreCampo, valorBusqueda] = [campo, q.toLowerCase()];
      resultados = resultados.filter(art => {
        const valor = art[nombreCampo];
        if (typeof valor === 'string') {
          return valor.toLowerCase().includes(valorBusqueda);
        }
        return false;
      });
    }

    // Filtro por palabras clave
    if (palabrasClave && articulos[0]?.palabrasClave) {
      const palabras = palabrasClave.toLowerCase().split(',').map(p => p.trim());
      resultados = resultados.filter(art => {
        if (!art.palabrasClave || !Array.isArray(art.palabrasClave)) return false;
        return palabras.some(palabra =>
          art.palabrasClave.some(kw => 
            kw.toString().toLowerCase().includes(palabra)
          )
        );
      });
    }

    // Filtro por rango de fechas
    if ((fechaInicio || fechaFin) && articulos[0]?.fecha) {
      resultados = resultados.filter(art => {
        if (!art.fecha) return false;
        
        try {
          const fechaArticulo = parseISO(art.fecha);
          
          if (fechaInicio && fechaFin) {
            return isWithinInterval(fechaArticulo, {
              start: parseISO(fechaInicio),
              end: parseISO(fechaFin)
            });
          } else if (fechaInicio) {
            return fechaArticulo >= parseISO(fechaInicio);
          } else {
            return fechaArticulo <= parseISO(fechaFin);
          }
        } catch (error) {
          return false;
        }
      });
    }

    // Filtros dinámicos por cualquier campo
    const filtrosCampos = ['medio', 'categoria', 'autor'];
    filtrosCampos.forEach(campoFiltro => {
      const valorFiltro = req.query[campoFiltro];
      if (valorFiltro && articulos[0]?.[campoFiltro]) {
        const valores = valorFiltro.toLowerCase().split(',').map(v => v.trim());
        resultados = resultados.filter(art =>
          art[campoFiltro] && 
          valores.some(v => art[campoFiltro].toLowerCase().includes(v))
        );
      }
    });

    // Ordenamiento
    if (articulos[0]?.[ordenar]) {
      resultados.sort((a, b) => {
        let valorA = a[ordenar];
        let valorB = b[ordenar];

        // Manejo especial para fechas
        if (ordenar === 'fecha' || ordenar.toLowerCase().includes('fecha')) {
          try {
            valorA = new Date(valorA);
            valorB = new Date(valorB);
          } catch (e) {
            // Si falla, mantener valores originales
          }
        }

        if (orden === 'asc') {
          return valorA > valorB ? 1 : -1;
        } else {
          return valorA < valorB ? 1 : -1;
        }
      });
    }

    // Paginación
    const paginaNum = parseInt(pagina);
    const limiteNum = parseInt(limite);
    const inicio = (paginaNum - 1) * limiteNum;
    const fin = inicio + limiteNum;
    const resultadosPaginados = resultados.slice(inicio, fin);

    // Respuesta
    res.json({
      success: true,
      data: resultadosPaginados,
      paginacion: {
        total: resultados.length,
        pagina: paginaNum,
        limite: limiteNum,
        totalPaginas: Math.ceil(resultados.length / limiteNum)
      },
      filtrosAplicados: {
        q,
        campo,
        palabrasClave,
        fechaInicio,
        fechaFin,
        medio,
        categoria,
        autor
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error en la búsqueda',
      mensaje: error.message
    });
  }
});

// ENDPOINT: Obtener todos los registros
app.get('/api/articulos', verificarCSV, (req, res) => {
  res.json({
    success: true,
    data: articulos,
    total: articulos.length
  });
});

// ENDPOINT: Obtener registro por ID
app.get('/api/articulos/:id', verificarCSV, (req, res) => {
  const id = parseInt(req.params.id);
  const articulo = articulos.find(a => a.id === id);
  
  if (!articulo) {
    return res.status(404).json({
      success: false,
      error: 'Registro no encontrado'
    });
  }
  
  res.json({
    success: true,
    data: articulo
  });
});

// ENDPOINT: Obtener valores únicos para filtros
app.get('/api/filtros', verificarCSV, (req, res) => {
  const campos = Object.keys(articulos[0] || {});
  const filtros = {};

  campos.forEach(campo => {
    const valores = [...new Set(articulos.map(a => a[campo]))].filter(v => v);
    
    // Solo incluir campos con valores razonables para filtros
    if (valores.length > 0 && valores.length < 100) {
      filtros[campo] = valores;
    }
  });

  res.json({
    success: true,
    data: filtros
  });
});

// ENDPOINT: Buscar en campo específico
app.get('/api/buscar/:campo/:valor', verificarCSV, (req, res) => {
  const { campo, valor } = req.params;
  
  if (!articulos[0]?.[campo]) {
    return res.status(400).json({
      success: false,
      error: `Campo "${campo}" no existe en el dataset`
    });
  }

  const valorLower = valor.toLowerCase();
  const resultados = articulos.filter(art => {
    const valorCampo = art[campo];
    if (typeof valorCampo === 'string') {
      return valorCampo.toLowerCase().includes(valorLower);
    }
    if (Array.isArray(valorCampo)) {
      return valorCampo.some(v => 
        typeof v === 'string' && v.toLowerCase().includes(valorLower)
      );
    }
    return false;
  });

  res.json({
    success: true,
    data: resultados,
    total: resultados.length,
    busqueda: { campo, valor }
  });
});

// ENDPOINT: Estadísticas del dataset
app.get('/api/estadisticas', verificarCSV, (req, res) => {
  const campos = Object.keys(articulos[0] || {});
  const stats = {
    totalRegistros: articulos.length,
    campos: campos,
    distribucion: {}
  };

  // Calcular distribución para campos categóricos
  campos.forEach(campo => {
    const valores = articulos.map(a => a[campo]);
    const unicos = [...new Set(valores)];
    
    if (unicos.length < 50) { // Solo para campos con valores limitados
      const distribucion = {};
      valores.forEach(valor => {
        distribucion[valor] = (distribucion[valor] || 0) + 1;
      });
      stats.distribucion[campo] = distribucion;
    }
  });

  // Rango de fechas si existe campo fecha
  const campoFecha = campos.find(c => 
    c.toLowerCase().includes('fecha') || c.toLowerCase() === 'date'
  );
  
  if (campoFecha) {
    const fechas = articulos
      .map(a => a[campoFecha])
      .filter(f => f)
      .sort();
    
    stats.rangoFechas = {
      campo: campoFecha,
      mas_antiguo: fechas[0],
      mas_reciente: fechas[fechas.length - 1]
    };
  }

  res.json({
    success: true,
    data: stats
  });
});

// ENDPOINT: Exportar resultados filtrados como JSON
app.post('/api/exportar', verificarCSV, (req, res) => {
  const { filtros } = req.body;
  
  // Aplicar filtros (reutilizar lógica de búsqueda)
  let resultados = [...articulos];
  
  // Aquí aplicarías los filtros...
  
  res.json({
    success: true,
    data: resultados,
    total: resultados.length,
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado',
    endpoints_disponibles: [
      'GET /api/info-dataset',
      'GET /api/buscar',
      'GET /api/articulos',
      'GET /api/filtros',
      'GET /api/estadisticas',
      'POST /api/recargar-csv'
    ]
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 API de Búsqueda CSV corriendo en http://localhost:${PORT}`);
  console.log(`📁 Buscando archivo: dataset_prueba.csv`);
  console.log(`\n📚 Endpoints disponibles:`);
  console.log(`   GET  /api/info-dataset - Información del dataset`);
  console.log(`   GET  /api/buscar - Búsqueda con filtros`);
  console.log(`   GET  /api/articulos - Todos los registros`);
  console.log(`   GET  /api/filtros - Valores para filtros`);
  console.log(`   GET  /api/estadisticas - Estadísticas del dataset`);
  console.log(`   POST /api/recargar-csv - Recargar CSV\n`);
});