import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Upload } from 'lucide-react'; // Eliminé BookOpen porque ya no se usa
import { Button } from '../ui/button';

// --- IMPORTANTE: Importa tu imagen aquí ---
// Asegúrate de que el archivo exista en src/assets/
import logoFasbit from '../components/logoFasbit.png'; 

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-blue-600";
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo (IMAGEN) */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src={logoFasbit} 
                alt="Logo FASBIT" 
                className="h-16 w-auto object-contain" 
              />
            </Link>
          </div>

          {/* Menú de Escritorio */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className={isActive('/')}>Inicio</Link>
            <Link to="/catalog" className={isActive('/catalog')}>Catálogo</Link>
            <Link to="/guide" className={isActive('/guide')}>Guía</Link>
            <Link to="/contact" className={isActive('/contact')}>Contacto</Link>
            <Link to="/admin" className={isActive('/admin')}>Admin</Link>
            
            <Link to="/upload">
              <Button size="sm" className="gap-2">
                <Upload className="h-4 w-4" /> Subir Tesis
              </Button>
            </Link>
          </div>

          {/* Botón Menú Móvil */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Móvil Desplegable */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 pb-4">
          <div className="px-2 pt-2 space-y-1">
            <Link 
              to="/" 
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
            >
              Inicio
            </Link>
            <Link 
              to="/catalog" 
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
            >
              Catálogo
            </Link>
            <Link 
              to="/guide" 
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
            >
              Guía de Publicación
            </Link>
            <Link 
              to="/contact" 
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
            >
              Contacto
            </Link>
            <Link 
              to="/upload" 
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 mt-4 text-center rounded-md bg-blue-50 text-blue-600 font-semibold"
            >
              Subir Tesis
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;