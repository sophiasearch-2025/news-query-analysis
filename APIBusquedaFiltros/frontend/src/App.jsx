// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, X, BarChart, Download, RefreshCw, Globe } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3000/api';

export default function APISearchClient() {
  // Estado principal de la aplicación
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paginacion, setPaginacion] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  // Campos dinámicos de la tabla, obtenidos desde el backend (estructura del índice/tabla)
  const [campos, setCampos] = useState([]); 
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);
  
  // Objeto de filtros de búsqueda y paginación
  const [filtros, setFiltros] = useState({
    q: '',
    pais: '', 
    fechaInicio: '',
    fechaFin: '',
    pagina: 1,
    limite: 10,
    ordenar: 'fecha_subida',
    orden: 'desc'
  });

  // Helper para acceder a propiedades anidadas de objetos (típico en resultados de Elasticsearch)
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  // Carga la información de las columnas disponibles
  const cargarInfo = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/info`);
      const data = await res.json();
      if (data.success) {
        setCampos(data.data.columnas.map(c => c.column_name));
      }
    } catch (err) {
      setError('No se pudo cargar la información de la tabla.');
    }
  };
  
  // Carga las estadísticas del índice (para dashboard/insights)
  const cargarEstadisticas = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/estadisticas`);
      const data = await res.json();
      if (data.success) {
        setEstadisticas(data.data);
      }
    } catch (err) {
      // Error de estadísticas no es crítico, solo se logea
      console.error('No se pudieron cargar las estadísticas:', err.message);
    }
  };

  // Ejecuta la búsqueda de noticias contra el endpoint de la API
  const buscarNoticias = async () => {
    setLoading(true);
    setError('');

    // Construcción de parámetros de URL desde el objeto de filtros
    const params = new URLSearchParams();
    params.append('pagina', filtros.pagina);
    params.append('limite', filtros.limite);
    params.append('ordenar', filtros.ordenar);
    params.append('orden', filtros.orden);
    if (filtros.q) params.append('q', filtros.q);
    if (filtros.pais) params.append('pais', filtros.pais);
    if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);

    try {
      const res = await fetch(`${API_BASE_URL}/buscar?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      
      if (data.success) {
        setResultados(data.data);
        setPaginacion(data.paginacion);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(`Error de conexión: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Efecto: Carga inicial de metadatos y estadísticas.
  useEffect(() => {
    cargarInfo();
    cargarEstadisticas();
  }, []);

  // Efecto: Re-ejecuta la búsqueda cada vez que los filtros cambian.
  useEffect(() => {
    buscarNoticias();
  }, [filtros]); 

  // Maneja cambios en los inputs de filtro, reseteando la página a 1
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value,
      pagina: 1 
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      q: '',
      pais: '',
      fechaInicio: '',
      fechaFin: '',
      pagina: 1,
      limite: 10,
      ordenar: 'fecha_subida',
      orden: 'desc'
    });
  };

  // Actualiza solo el número de página
  const cambiarPagina = (nuevaPagina) => {
    setFiltros(prev => ({ ...prev, pagina: nuevaPagina }));
  };

  // Genera y descarga un CSV de los resultados de la página actual
  const exportarResultados = () => {
    const contenidoCSV = [
      // Encabezados
      campos.join(','),
      // Filas: mapea resultados usando campos dinámicos
      ...resultados.map(row => 
        campos.map(campo => {
          const val = getNestedValue(row, campo);
          // Asegura que los valores estén entre comillas para manejar comas internas
          return `"${val || ''}"`;
        }).join(',')
      )
    ].join('\n');

    // Crea un blob y un enlace para forzar la descarga en el navegador
    const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultados_pagina_${filtros.pagina}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📊 Visor de Noticias (Elasticsearch)
          </h1>
          <p className="text-gray-600">
            Búsqueda inteligente por país, contenido y fechas
          </p>
        </div>

        {/* Panel Principal */}
        <>
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-700">
                  {paginacion ? `Mostrando ${resultados.length} de ${paginacion.total} noticias` : 'Cargando...'}
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
                  Exportar Página
                </button>
                <button
                  onClick={() => {
                    cargarEstadisticas();
                    buscarNoticias();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <RefreshCw size={18} />
                  Recargar
                </button>
              </div>
            </div>

            {/* Estadísticas */}
            {mostrarEstadisticas && estadisticas && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-4 border border-blue-100">
                <h3 className="font-semibold text-gray-800 mb-3">📈 Estadísticas del Índice</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white rounded p-3 shadow-sm">
                    <p className="text-sm text-gray-600">Total Noticias</p>
                    <p className="text-2xl font-bold text-blue-600">{estadisticas.totalNoticias}</p>
                  </div>
                  <div className="bg-white rounded p-3 shadow-sm">
                    <p className="text-sm text-gray-600">Países Únicos</p>
                    <p className="text-2xl font-bold text-orange-500">{estadisticas.paisesUnicos || 0}</p>
                  </div>
                  <div className="bg-white rounded p-3 shadow-sm">
                    <p className="text-sm text-gray-600">Fecha más antigua</p>
                    <p className="text-sm font-bold text-gray-700">
                      {estadisticas.rangoFechas?.mas_antiguo ? new Date(estadisticas.rangoFechas.mas_antiguo).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white rounded p-3 shadow-sm">
                    <p className="text-sm text-gray-600">Fecha más reciente</p>
                    <p className="text-sm font-bold text-gray-700">
                      {estadisticas.rangoFechas?.mas_reciente ? new Date(estadisticas.rangoFechas.mas_reciente).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                <Filter size={20} />
                Filtros de Búsqueda
              </h2>
              <button
                type="button"
                onClick={limpiarFiltros}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
              >
                <X size={16} />
                Limpiar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Búsqueda General */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Búsqueda Libre (Título, Contenido, Medio)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="text"
                    name="q"
                    value={filtros.q}
                    onChange={handleFiltroChange}
                    placeholder="Ej: incendio, el sur..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filtro País (Nuevo) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  País del Medio
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="text"
                    name="pais"
                    value={filtros.pais}
                    onChange={handleFiltroChange}
                    placeholder="Ej: Chile"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Rango de Fechas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rango Fechas
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    name="fechaInicio"
                    value={filtros.fechaInicio}
                    onChange={handleFiltroChange}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    name="fechaFin"
                    value={filtros.fechaFin}
                    onChange={handleFiltroChange}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </form>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              📋 Resultados {paginacion && `(${paginacion.total} encontrados)`}
            </h2>

            {loading && (
              <div className="text-center py-12 text-gray-500">
                <RefreshCw size={48} className="mx-auto mb-4 opacity-50 animate-spin" />
                <p>Buscando en Elastic...</p>
              </div>
            )}
            
            {!loading && error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
                {error}
              </div>
            )}

            {!loading && !error && resultados.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Search size={48} className="mx-auto mb-4 opacity-50" />
                <p>No se encontraron resultados</p>
              </div>
            )}

            {!loading && !error && resultados.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  {/* Renderizado dinámico de la tabla basado en los campos obtenidos de la API */}
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 uppercase">
                      <tr>
                        {campos.map(campo => (
                          <th key={campo} className="px-6 py-3 font-bold border-b whitespace-nowrap">
                            {campo.replace('_', ' ').replace('.', ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resultados.map((row) => (
                        <tr key={row.id_noticia} className="hover:bg-gray-50 border-b">
                          {campos.map(campo => {
                            let valor = getNestedValue(row, campo);

                            // Lógica de presentación para tipos de datos específicos
                            if (campo === 'fecha_subida' && valor) {
                              valor = new Date(valor).toLocaleDateString();
                            }

                            if (campo === 'url' && valor) {
                              return (
                                <td key={campo} className="px-6 py-4 max-w-xs truncate">
                                  <a href={valor} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                    Ver Link
                                  </a>
                                </td>
                              );
                            }

                            return (
                              <td key={campo} className="px-6 py-4 max-w-xs truncate" title={valor}>
                                {valor}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {paginacion && paginacion.totalPaginas > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => cambiarPagina(filtros.pagina - 1)}
                      disabled={filtros.pagina === 1}
                      className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                    >
                      Anterior
                    </button>
                    
                    <span className="px-4 py-2 text-gray-600">
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
      </div>
    </div>
  );
}