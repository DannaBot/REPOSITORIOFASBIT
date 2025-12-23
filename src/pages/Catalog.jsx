import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, X, Download, Calendar, User } from 'lucide-react';
import { motion } from 'framer-motion';
// RUTAS CORREGIDAS
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { supabase } from '../lib/supabase';

const Catalog = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [theses, setTheses] = useState([]);
  const [filteredTheses, setFilteredTheses] = useState([]);
  const [showFilters, setShowFilters] = useState(true);
  
  const [filters, setFilters] = useState({
    yearRange: [2015, 2025],
    advisors: [],
    careers: [],
    keywords: []
  });

  const [selectedFilters, setSelectedFilters] = useState({
    advisors: [],
    careers: [],
    keywords: []
  });

  useEffect(() => {
    loadTheses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedFilters, theses]);

  const loadTheses = async () => {
    try {
      const { data, error } = await supabase
        .from('theses')
        .select('*')
        .eq('status', 'approved');

      if (error) throw error;
      
      const sortedData = (data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setTheses(sortedData);
      
      const advisors = [...new Set(sortedData.map(t => t.advisor).filter(Boolean))];
      const careers = [...new Set(sortedData.map(t => t.career).filter(Boolean))];
      const keywords = [...new Set(sortedData.flatMap(t => t.keywords || []))];

      setFilters(prev => ({
        ...prev,
        advisors,
        careers,
        keywords
      }));
    } catch (error) {
      console.error('Error loading theses:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...theses];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(thesis =>
        thesis.title?.toLowerCase().includes(query) ||
        thesis.author?.toLowerCase().includes(query) ||
        thesis.abstract?.toLowerCase().includes(query) ||
        thesis.keywords?.some(k => k.toLowerCase().includes(query))
      );
    }

    if (selectedFilters.advisors.length > 0) {
      filtered = filtered.filter(thesis =>
        selectedFilters.advisors.includes(thesis.advisor)
      );
    }

    if (selectedFilters.careers.length > 0) {
      filtered = filtered.filter(thesis =>
        selectedFilters.careers.includes(thesis.career)
      );
    }

    if (selectedFilters.keywords.length > 0) {
      filtered = filtered.filter(thesis =>
        thesis.keywords?.some(k => selectedFilters.keywords.includes(k))
      );
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
    setSelectedFilters({
      advisors: [],
      careers: [],
      keywords: []
    });
    setSearchQuery('');
  };

  return (
    <>
      <Helmet>
        <title>Catálogo de Tesis - FASBIT</title>
        <meta name="description" content="Explora el catálogo completo de tesis y trabajos de investigación de FASBIT. Busca por título, autor o palabras clave." />
      </Helmet>

      <div className="bg-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-6">Catálogo de Tesis</h1>
          <div className="bg-white rounded-lg p-2 flex items-center gap-2">
            <Search className="h-5 w-5 text-gray-400 ml-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, autor, palabras clave..."
              className="flex-1 px-4 py-2 text-gray-900 outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="mr-2">
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <aside className={`${showFilters ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden`}>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros
                </h2>
                <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-700">
                  Limpiar
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Año</h3>
                  <Slider
                    defaultValue={filters.yearRange}
                    max={2025}
                    min={2015}
                    step={1}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{filters.yearRange[0]}</span>
                    <span>{filters.yearRange[1]}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Asesor</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {filters.advisors.length > 0 ? (
                      filters.advisors.slice(0, 5).map((advisor) => (
                        <div key={advisor} className="flex items-center space-x-2">
                          <Checkbox
                            id={`advisor-${advisor}`}
                            checked={selectedFilters.advisors.includes(advisor)}
                            onCheckedChange={() => toggleFilter('advisors', advisor)}
                          />
                          <Label htmlFor={`advisor-${advisor}`} className="text-sm cursor-pointer">
                            {advisor}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400">Sin asesores</p>
                    )}
                  </div>
                </div>

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
                          <Label htmlFor={`career-${career}`} className="text-sm cursor-pointer">
                            {career}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400">Sin carreras</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Palabras Clave</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {filters.keywords.length > 0 ? (
                      filters.keywords.slice(0, 8).map((keyword) => (
                        <div key={keyword} className="flex items-center space-x-2">
                          <Checkbox
                            id={`keyword-${keyword}`}
                            checked={selectedFilters.keywords.includes(keyword)}
                            onCheckedChange={() => toggleFilter('keywords', keyword)}
                          />
                          <Label htmlFor={`keyword-${keyword}`} className="text-sm cursor-pointer">
                            {keyword}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400">Sin palabras clave</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <div className="text-gray-600">
                {filteredTheses.length} resultado{filteredTheses.length !== 1 ? 's' : ''} encontrado{filteredTheses.length !== 1 ? 's' : ''}
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
              {filteredTheses.map((thesis, index) => (
                <motion.div
                  key={thesis.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link to={`/thesis/${thesis.id}`}>
                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 hover:text-blue-600 transition-colors">
                        {thesis.title}
                      </h3>
                      
                      <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {thesis.author}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {thesis.year}
                        </div>
                        {thesis.downloads > 0 && (
                          <div className="flex items-center gap-1">
                            <Download className="h-4 w-4" />
                            {thesis.downloads} descargas
                          </div>
                        )}
                      </div>

                      <p className="text-gray-700 mb-4 line-clamp-3">
                        {thesis.abstract}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {thesis.keywords?.map((keyword, i) => (
                          <span key={i} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}

              {filteredTheses.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg mb-4">No se encontraron resultados</p>
                  <Button onClick={clearFilters} variant="outline">
                    Limpiar filtros
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Catalog;