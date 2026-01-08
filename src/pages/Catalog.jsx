import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { Search, Filter, X, Download, Calendar as CalendarIcon, User, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';

const Catalog = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [theses, setTheses] = useState([]);
  const [filteredTheses, setFilteredTheses] = useState([]);
  const [showFilters, setShowFilters] = useState(true);
  
  // Hook de ubicación para detectar cuando regresamos a esta página
  const location = useLocation();

  // --- PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(1);
  const thesesPerPage = 5; 

  // --- FILTROS DE FECHA ---
  const [dateRange, setDateRange] = useState({
    startDate: '', 
    endDate: ''
  });
  
  const [filters, setFilters] = useState({
    advisors: [],
    careers: [],
    keywords: []
  });

  const [selectedFilters, setSelectedFilters] = useState({
    advisors: [],
    careers: [],
    keywords: []
  });

  // Cargar datos al montar y CADA VEZ que la ubicación cambia (ej. al volver)
  useEffect(() => {
    loadTheses();
  }, [location.key]); // location.key cambia cada vez que entras a la página

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedFilters, theses, dateRange]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredTheses.length]);

  const loadTheses = async () => {
    try {
      const q = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
      
      // TRUCO ANTI-CACHÉ: Agregamos timestamp
      // Si ya hay interrogación (?), usamos &, si no, usamos ?
      const separator = q.includes('?') ? '&' : (q ? '&' : '?');
      const timeStamp = `_t=${Date.now()}`;
      
      const url = `http://localhost:4000/api/theses${q}${separator}${timeStamp}`;

      const res = await fetch(url, { 
        cache: 'no-store',
        headers: { 
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        } 
      });
      
      if (!res.ok) throw new Error('Error fetching theses');
      const data = await res.json();
      const sortedData = (data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setTheses(sortedData);
      
      const advisors = [...new Set(sortedData.map(t => t.advisor).filter(Boolean))];
      const careers = [...new Set(sortedData.map(t => t.career).filter(Boolean))];
      const keywords = [...new Set(sortedData.flatMap(t => t.keywords || []))];

      setFilters(prev => ({ ...prev, advisors, careers, keywords }));
    } catch (error) {
      console.error('Error loading theses:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...theses];

    // 1. Búsqueda de texto
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(thesis =>
        thesis.title?.toLowerCase().includes(query) ||
        thesis.author?.toLowerCase().includes(query) ||
        thesis.abstract?.toLowerCase().includes(query) ||
        thesis.keywords?.some(k => k.toLowerCase().includes(query))
      );
    }

    // 2. Filtro de Calendario
    if (dateRange.startDate) {
      filtered = filtered.filter(thesis => {
        const thesisDate = thesis.thesis_date ? new Date(thesis.thesis_date) : new Date(`${thesis.year}-01-01`);
        return thesisDate >= new Date(dateRange.startDate);
      });
    }
    if (dateRange.endDate) {
      filtered = filtered.filter(thesis => {
        const thesisDate = thesis.thesis_date ? new Date(thesis.thesis_date) : new Date(`${thesis.year}-12-31`);
        return thesisDate <= new Date(dateRange.endDate);
      });
    }

    // 3. Otros filtros
    if (selectedFilters.advisors.length > 0) {
      filtered = filtered.filter(thesis => selectedFilters.advisors.includes(thesis.advisor));
    }
    if (selectedFilters.careers.length > 0) {
      filtered = filtered.filter(thesis => selectedFilters.careers.includes(thesis.career));
    }
    if (selectedFilters.keywords.length > 0) {
      filtered = filtered.filter(thesis => thesis.keywords?.some(k => selectedFilters.keywords.includes(k)));
    }

    setFilteredTheses(filtered);
  };

  const toggleFilter = (category, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(v => v !== value)
        : [...prev[category], value]
    }));
  };

  const clearFilters = () => {
    setSelectedFilters({ advisors: [], careers: [], keywords: [] });
    setDateRange({ startDate: '', endDate: '' });
    setSearchQuery('');
  };

  // --- LÓGICA DE PAGINACIÓN ---
  const indexOfLastThesis = currentPage * thesesPerPage;
  const indexOfFirstThesis = indexOfLastThesis - thesesPerPage;
  const currentTheses = filteredTheses.slice(indexOfFirstThesis, indexOfLastThesis);
  const totalPages = Math.ceil(filteredTheses.length / thesesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <>
      <Helmet>
        <title>Catálogo de Tesis - FASBIT</title>
        <meta name="description" content="Explora el catálogo completo de tesis y trabajos de investigación de FASBIT." />
      </Helmet>

      <div className="bg-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-6">Catálogo de Tesis</h1>
          <div className="bg-white rounded-lg p-2 flex items-center gap-2 shadow-lg">
            <Search className="h-5 w-5 text-gray-400 ml-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, autor, palabras clave..."
              className="flex-1 px-4 py-2 text-gray-900 outline-none placeholder-gray-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="mr-2 hover:bg-gray-100 p-1 rounded-full transition">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* BARRA LATERAL DE FILTROS */}
          <aside className={`${showFilters ? 'w-full md:w-64' : 'hidden'} transition-all duration-300`}>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20 border border-gray-100">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Filter className="h-5 w-5 text-blue-600" />
                  Filtros
                </h2>
                <button onClick={clearFilters} className="text-xs font-medium text-red-500 hover:text-red-700 uppercase tracking-wide">
                  Limpiar Todo
                </button>
              </div>

              <div className="space-y-8">
                
                {/* FILTRO DE FECHAS */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    Rango de Fechas
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Desde:</label>
                      <input 
                        type="date" 
                        className="w-full border rounded p-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Hasta:</label>
                      <input 
                        type="date" 
                        className="w-full border rounded p-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* FILTRO CARRERA */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Carrera</h3>
                  <div className="space-y-2">
                    {filters.careers.length > 0 ? (
                      filters.careers.map((career) => (
                        <div key={career} className="flex items-center space-x-2">
                          <Checkbox
                            id={`career-${career}`}
                            checked={selectedFilters.careers.includes(career)}
                            onCheckedChange={() => toggleFilter('careers', career)}
                          />
                          <Label htmlFor={`career-${career}`} className="text-sm cursor-pointer text-gray-600 hover:text-blue-600">
                            {career}
                          </Label>
                        </div>
                      ))
                    ) : <p className="text-xs text-gray-400 italic">No hay carreras disponibles</p>}
                  </div>
                </div>

                {/* FILTRO PALABRAS CLAVE */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Palabras Clave</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                    {filters.keywords.length > 0 ? (
                      filters.keywords.slice(0, 15).map((keyword) => (
                        <div key={keyword} className="flex items-center space-x-2">
                          <Checkbox
                            id={`keyword-${keyword}`}
                            checked={selectedFilters.keywords.includes(keyword)}
                            onCheckedChange={() => toggleFilter('keywords', keyword)}
                          />
                          <Label htmlFor={`keyword-${keyword}`} className="text-sm cursor-pointer text-gray-600 hover:text-blue-600">
                            {keyword}
                          </Label>
                        </div>
                      ))
                    ) : <p className="text-xs text-gray-400 italic">No hay palabras clave</p>}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* LISTA DE RESULTADOS */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <div className="text-gray-600 text-sm">
                Mostrando <strong>{filteredTheses.length > 0 ? indexOfFirstThesis + 1 : 0}-{Math.min(indexOfLastThesis, filteredTheses.length)}</strong> de <strong>{filteredTheses.length}</strong> tesis
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
              </Button>
            </div>

            <div className="space-y-6">
              {currentTheses.map((thesis, index) => (
                <motion.div
                  key={thesis.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Link to={`/thesis/${thesis.id}`}>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all hover:-translate-y-1 hover:border-blue-200 group">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {thesis.title}
                      </h3>
                      
                      {/* DATOS DE LA TARJETA */}
                      <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-500 border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-1.5">
                          <User className="h-4 w-4 text-blue-500" />
                          <span className="font-medium text-gray-700">{thesis.author}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="h-4 w-4 text-orange-500" />
                          <span>{thesis.year}</span>
                        </div>
                        {/* AQUI AGREGAMOS LA CARRERA */}
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="h-4 w-4 text-purple-500" />
                          <span>{thesis.career || 'Sin carrera'}</span>
                        </div>
                        
                        {thesis.downloads > 0 && (
                          <div className="flex items-center gap-1.5 ml-auto">
                            <Download className="h-4 w-4 text-green-500" />
                            <span>{thesis.downloads} descargas</span>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-600 mb-5 line-clamp-3 leading-relaxed">
                        {thesis.abstract}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {thesis.keywords?.slice(0, 4).map((keyword, i) => (
                          <span key={i} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            {keyword}
                          </span>
                        ))}
                        {thesis.keywords?.length > 4 && (
                          <span className="text-xs text-gray-400 self-center px-1">+{thesis.keywords.length - 4} más</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}

              {filteredTheses.length === 0 && (
                <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
                  <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No se encontraron resultados</h3>
                  <p className="text-gray-500 mt-1 mb-6">Intenta ajustar los filtros o buscar con otros términos.</p>
                  <Button onClick={clearFilters} variant="outline">
                    Limpiar todos los filtros
                  </Button>
                </div>
              )}
            </div>

            {/* CONTROLES DE PAGINACIÓN */}
            {filteredTheses.length > thesesPerPage && (
              <div className="mt-10 flex justify-center items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-10 w-10 rounded-full"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => paginate(i + 1)}
                      className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                        currentPage === i + 1
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-10 w-10 rounded-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Catalog;