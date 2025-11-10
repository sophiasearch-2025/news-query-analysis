import React, { useState, useEffect } from 'react';
import { Search, Upload, Filter, X, BarChart, Download, RefreshCw } from 'lucide-react';

export default function CSVSearchClient() {
  const [datos, setDatos] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paginacion, setPaginacion] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [campos, setCampos] = useState([]);
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);
  
  const [filtros, setFiltros] = useState({
    q: '',
    campo: '',
    palabrasClave: '',
    fechaInicio: '',
    fechaFin: '',
    pagina: 1,
    limite: 10
  });

  // Cargar archivo CSV
  const cargarCSV = (event) => {
    const archivo = event.target.files[0];
    if (!archivo) return;

    setLoading(true);
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const texto = e.target.result;
        const lineas = texto.split('\n');
        const headers = lineas[0].split(',').map(h => h.trim());
        
        const datosParseados = [];
        for (let i = 1; i < lineas.length; i++) {
          if (!lineas[i].trim()) continue;
          
          const valores = lineas[i].split(',');
          const objeto = {};
          headers.forEach((header, index) => {
            objeto[header] = valores[index]?.trim() || '';
          });
          objeto.id = i;
          datosParseados.push(objeto);
        }

        setDatos(datosParseados);
        setResultados(datosParseados);
        setCampos(headers);
        calcularEstadisticas(datosParseados, headers);
        setLoading(false);
      } catch (err) {
        setError('Error al procesar el archivo CSV');
        setLoading(false);
      }
    };

    reader.readAsText(archivo);
  };

  // Calcular estadísticas
  const calcularEstadisticas = (datosArr, camposArr) => {
    const stats = {
      totalRegistros: datosArr.length,
      campos: camposArr.length,
      distribucion: {}
    };

    camposArr.forEach(campo => {
      const valores = datosArr.map(d => d[campo]);
      const unicos = [...new Set(valores)].filter(v => v);
      
      if (unicos.length < 20) {
        const dist = {};
        valores.forEach(valor => {
          if (valor) {
            dist[valor] = (dist[valor] || 0) + 1;
          }
        });
        stats.distribucion[campo] = dist;
      }
    });

    setEstadisticas(stats);
  };

  // Buscar en los datos
  const buscar = () => {
    setLoading(true);
    
    setTimeout(() => {
      let resultadosFiltrados = [...datos];

      // Filtro por búsqueda general
      if (filtros.q && !filtros.campo) {
        const query = filtros.q.toLowerCase();
        resultadosFiltrados = resultadosFiltrados.filter(item =>
          Object.values(item).some(valor =>
            valor.toString().toLowerCase().includes(query)
          )
        );
      }

      // Filtro por campo específico
      if (filtros.q && filtros.campo) {
        const query = filtros.q.toLowerCase();
        resultadosFiltrados = resultadosFiltrados.filter(item =>
          item[filtros.campo]?.toString().toLowerCase().includes(query)
        );
      }

      // Filtro por palabras clave
      if (filtros.palabrasClave) {
        const palabras = filtros.palabrasClave.toLowerCase().split(',').map(p => p.trim());
        resultadosFiltrados = resultadosFiltrados.filter(item =>
          palabras.some(palabra =>
            Object.values(item).some(valor =>
              valor.toString().toLowerCase().includes(palabra)
            )
          )
        );
      }

      // Filtro por fechas (si hay columnas de fecha)
      if (filtros.fechaInicio || filtros.fechaFin) {
        const campoFecha = campos.find(c => 
          c.toLowerCase().includes('fecha') || 
          c.toLowerCase().includes('date')
        );
        
        if (campoFecha) {
          resultadosFiltrados = resultadosFiltrados.filter(item => {
            try {
              const fecha = new Date(item[campoFecha]);
              if (filtros.fechaInicio && filtros.fechaFin) {
                return fecha >= new Date(filtros.fechaInicio) && 
                       fecha <= new Date(filtros.fechaFin);
              } else if (filtros.fechaInicio) {
                return fecha >= new Date(filtros.fechaInicio);
              } else {
                return fecha <= new Date(filtros.fechaFin);
              }
            } catch {
              return false;
            }
          });
        }
      }

      // Paginación
      const inicio = (filtros.pagina - 1) * filtros.limite;
      const fin = inicio + filtros.limite;
      const resultadosPaginados = resultadosFiltrados.slice(inicio, fin);

      setResultados(resultadosPaginados);
      setPaginacion({
        total: resultadosFiltrados.length,
        pagina: filtros.pagina,
        totalPaginas: Math.ceil(resultadosFiltrados.length / filtros.limite)
      });
      setLoading(false);
    }, 300);
  };

  const limpiarFiltros = () => {
    setFiltros({
      q: '',
      campo: '',
      palabrasClave: '',
      fechaInicio: '',
      fechaFin: '',
      pagina: 1,
      limite: 10
    });
    setResultados(datos);
    setPaginacion(null);
  };

  const cambiarPagina = (nuevaPagina) => {
    setFiltros({ ...filtros, pagina: nuevaPagina });
    setTimeout(() => buscar(), 0);
  };

  const exportarResultados = () => {
    const contenidoCSV = [
      campos.join(','),
      ...resultados.map(row => 
        campos.map(campo => row[campo] || '').join(',')
      )
    ].join('\n');

    const blob = new Blob([contenidoCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultados_filtrados_${new Date().getTime()}.csv`;
    a.click();
  };

  useEffect(() => {
    if (datos.length > 0) {
      buscar();
    }
  }, [filtros.pagina]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📊 Buscador CSV con Filtros Avanzados
          </h1>
          <p className="text-gray-600">
            Carga tu archivo dataset_prueba.csv y aplica filtros inteligentes
          </p>
        </div>

        {/* Cargar CSV */}
        {datos.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6 text-center">
            <Upload size={48} className="mx-auto mb-4 text-blue-600" />
            <h2 className="text-2xl font-semibold mb-4">Cargar Archivo CSV</h2>
            <input
              type="file"
              accept=".csv"
              onChange={cargarCSV}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg cursor-pointer transition-colors"
            >
              Seleccionar dataset_prueba.csv
            </label>
            <p className="text-sm text-gray-500 mt-4">
              Formatos soportados: CSV con encabezados en la primera fila
            </p>
          </div>
        )}

        {/* Panel de Control */}
        {datos.length > 0 && (
          <>
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold text-gray-700">
                    📁 {datos.length} registros cargados
                  </h2>
                  <button
                    onClick={() => setMostrarEstadisticas(!mostrarEstadisticas)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    <BarChart size={18} />
                    Estadísticas
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={exportarResultados}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download size={18} />
                    Exportar
                  </button>
                  <label
                    htmlFor="file-upload"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <RefreshCw size={18} />
                    Cambiar CSV
                  </label>
                </div>
              </div>

              {/* Estadísticas */}
              {mostrarEstadisticas && estadisticas && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-gray-800 mb-3">📈 Estadísticas del Dataset</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-white rounded p-3">
                      <p className="text-sm text-gray-600">Registros</p>
                      <p className="text-2xl font-bold text-blue-600">{estadisticas.totalRegistros}</p>
                    </div>
                    <div className="bg-white rounded p-3">
                      <p className="text-sm text-gray-600">Campos</p>
                      <p className="text-2xl font-bold text-purple-600">{estadisticas.campos}</p>
                    </div>
                    <div className="bg-white rounded p-3">
                      <p className="text-sm text-gray-600">Resultados Filtrados</p>
                      <p className="text-2xl font-bold text-green-600">{paginacion?.total || datos.length}</p>
                    </div>
                    <div className="bg-white rounded p-3">
                      <p className="text-sm text-gray-600">Campos Únicos</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {Object.keys(estadisticas.distribucion).length}
                      </p>
                    </div>
                  </div>

                  {/* Distribución */}
                  {Object.keys(estadisticas.distribucion).length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Distribución por Campos:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(estadisticas.distribucion).slice(0, 6).map(([campo, valores]) => (
                          <div key={campo} className="bg-white rounded p-3">
                            <p className="font-semibold text-sm text-gray-700 mb-2">{campo}</p>
                            <div className="space-y-1">
                              {Object.entries(valores).slice(0, 3).map(([valor, cantidad]) => (
                                <div key={valor} className="flex justify-between text-xs">
                                  <span className="truncate max-w-[150px]">{valor}</span>
                                  <span className="font-semibold text-blue-600">{cantidad}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                  <Filter size={20} />
                  Filtros de Búsqueda
                </h2>
                <button
                  onClick={limpiarFiltros}
                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                >
                  <X size={16} />
                  Limpiar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {/* Búsqueda general */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Búsqueda General
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={filtros.q}
                      onChange={(e) => setFiltros({ ...filtros, q: e.target.value })}
                      placeholder="Buscar en todos los campos..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Campo específico */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buscar en Campo
                  </label>
                  <select
                    value={filtros.campo}
                    onChange={(e) => setFiltros({ ...filtros, campo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos los campos</option>
                    {campos.map(campo => (
                      <option key={campo} value={campo}>{campo}</option>
                    ))}
                  </select>
                </div>

                {/* Palabras clave */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Palabras Clave
                  </label>
                  <input
                    type="text"
                    value={filtros.palabrasClave}
                    onChange={(e) => setFiltros({ ...filtros, palabrasClave: e.target.value })}
                    placeholder="palabra1, palabra2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Fecha inicio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={filtros.fechaInicio}
                    onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Fecha fin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={filtros.fechaFin}
                    onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                onClick={buscar}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                <Search size={20} />
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {/* Resultados */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                📋 Resultados {paginacion && `(${paginacion.total} encontrados)`}
              </h2>

              {resultados.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Search size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No se encontraron resultados</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {campos.map(campo => (
                            <th key={campo} className="px-4 py-3 text-left font-semibold text-gray-700 border-b">
                              {campo}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {resultados.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 border-b">
                            {campos.map(campo => (
                              <td key={campo} className="px-4 py-3 text-gray-600">
                                {row[campo]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación */}
                  {paginacion && paginacion.totalPaginas > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <button
                        onClick={() => cambiarPagina(filtros.pagina - 1)}
                        disabled={filtros.pagina === 1}
                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                      >
                        Anterior
                      </button>
                      
                      <span className="px-4 py-2">
                        Página {paginacion.pagina} de {paginacion.totalPaginas}
                      </span>
                      
                      <button
                        onClick={() => cambiarPagina(filtros.pagina + 1)}
                        disabled={filtros.pagina === paginacion.totalPaginas}
                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                      >
                        Siguiente
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}