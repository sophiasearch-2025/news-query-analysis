import React, { useState, useEffect } from 'react';
import { Search, Filter, X, BarChart, Download, RefreshCw } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3000/api';

export default function APISearchClient() {
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paginacion, setPaginacion] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [campos, setCampos] = useState([]);
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);
  
  const [filtros, setFiltros] = useState({
    q: '',
    fechaInicio: '',
    fechaFin: '',
    pagina: 1,
    limite: 10,
    ordenar: 'fecha_subida',
    orden: 'desc'
  });

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
  
  const cargarEstadisticas = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/estadisticas`);
      const data = await res.json();
      if (data.success) {
        setEstadisticas(data.data);
      }
    } catch (err) {
      console.error('No se pudieron cargar las estadísticas:', err.message);
    }
  };

  const buscarNoticias = async () => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams();
    params.append('pagina', filtros.pagina);
    params.append('limite', filtros.limite);
    params.append('ordenar', filtros.ordenar);
    params.append('orden', filtros.orden);
    if (filtros.q) params.append('q', filtros.q);
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

  useEffect(() => {
    cargarInfo();
    cargarEstadisticas();
  }, []);

  useEffect(() => {
    buscarNoticias();
  }, [filtros]); 

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
      fechaInicio: '',
      fechaFin: '',
      pagina: 1,
      limite: 10,
      ordenar: 'fecha_subida',
      orden: 'desc'
    });
  };

  const cambiarPagina = (nuevaPagina) => {
    setFiltros(prev => ({ ...prev, pagina: nuevaPagina }));
  };

  const exportarResultados = () => {
    const contenidoCSV = [
      campos.join(','),
      ...resultados.map(row => 
        campos.map(campo => `"${row[campo] || ''}"`).join(',')
      )
    ].join('\n');

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
            📊 Visor de Noticias
          </h1>
          <p className="text-gray-600">
            Conectado a la API de Busqueda
          </p>
        </div>

        <>
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
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

            {mostrarEstadisticas && estadisticas && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-800 mb-3">📈 Estadísticas (Desde API)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white rounded p-3">
                    <p className="text-sm text-gray-600">Total Noticias</p>
                    <p className="text-2xl font-bold text-blue-600">{estadisticas.totalNoticias}</p>
                  </div>
                  <div className="bg-white rounded p-3">
                    <p className="text-sm text-gray-600">Fecha más antigua</p>
                    <p className="text-lg font-bold text-purple-600">
                      {estadisticas.rangoFechas?.mas_antiguo ? new Date(estadisticas.rangoFechas.mas_antiguo).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white rounded p-3">
                    <p className="text-sm text-gray-600">Fecha más reciente</p>
                    <p className="text-lg font-bold text-green-600">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar por Título
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="text"
                    name="q"
                    value={filtros.q}
                    onChange={handleFiltroChange}
                    placeholder="Buscar en títulos..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  name="fechaInicio"
                  value={filtros.fechaInicio}
                  onChange={handleFiltroChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  name="fechaFin"
                  value={filtros.fechaFin}
                  onChange={handleFiltroChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
                <p>Buscando...</p>
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
                      {resultados.map((row) => (
                        <tr key={row.id_noticia} className="hover:bg-gray-50 border-b">
                          {campos.map(campo => (
                            <td key={campo} className="px-4 py-3 text-gray-600 max-w-xs truncate">
                              {campo === 'fecha_subida' 
                                ? new Date(row[campo]).toLocaleString()
                                : row[campo]
                              }
                            </td>
                          ))}
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
      </div>
    </div>
  );
}