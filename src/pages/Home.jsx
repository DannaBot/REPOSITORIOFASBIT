import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, FileText, Download, TrendingUp, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
// RUTAS CORREGIDAS
import { Button } from "../ui/button";
import { getUser } from '../lib/auth';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const Home = () => {
  const [featuredTheses, setFeaturedTheses] = useState([]);
  const user = getUser();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API}/api/theses`);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        // take first 3
        setFeaturedTheses((data || []).slice(0, 3));
      } catch (e) {
        console.error('Failed to fetch recent theses', e);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Hero Section */}
      <section className="relative py-20 px-4 md:px-6 lg:px-8 bg-gradient-to-br from-blue-900 to-indigo-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop')] opacity-10 bg-cover bg-center" />
        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold tracking-tight"
          >
            Repositorio Digital FASBIT
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto"
          >
            Preservando el conocimiento académico. Accede a las tesis e investigaciones de la Facultad de Sistemas Biológicos e Innovación Tecnológica.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar por título, autor o palabra clave..." 
                className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white">
              Buscar Tesis
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats removed: no fake statistics shown on home */}

      {/* Recent Uploads */}
      <section className="max-w-7xl mx-auto px-4 w-full space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Agregadas Recientemente</h2>
          <Link to="/catalog" className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium">
            Ver todo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredTheses.length > 0 ? (
            featuredTheses.map((thesis) => (
              <div key={thesis.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{thesis.title}</h3>
                <p className="text-gray-500 text-sm mb-4">Por {thesis.author}</p>
                <div className="flex justify-between items-center mt-auto">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{thesis.year || '2024'}</span>
                  <Link to={`/thesis/${thesis.id}`}>
                    <Button variant="outline" size="sm">Ver Detalles</Button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-10 bg-gray-50 rounded-lg border-dashed border-2">
              <p className="text-gray-500">Aún no hay tesis destacadas cargadas en el sistema.</p>
              {user && user.role === 'coordinator' && (
                <Link to="/upload" className="mt-4 inline-block">
                  <Button>Subir la primera tesis</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;