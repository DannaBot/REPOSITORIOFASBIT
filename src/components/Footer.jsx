import React from 'react';
import { Link } from 'react-router-dom';
import { getUser } from '../lib/auth';
import { Github, Twitter, Facebook, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Columna 1: Info */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-white text-lg font-bold mb-4">FASBIT</h3>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Repositorio Institucional de la Facultad de Sistemas Biológicos e Innovación Tecnológica.
              Preservando el conocimiento para el futuro.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-blue-400 transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="hover:text-blue-400 transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="hover:text-blue-400 transition-colors"><Github className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div>
            <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Enlaces</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/catalog" className="hover:text-white transition-colors">Catálogo de Tesis</Link></li>
              {(() => { const user = getUser(); return user && user.role === 'coordinator' ? <li><Link to="/upload" className="hover:text-white transition-colors">Subir Documento</Link></li> : null })()}
              <li><Link to="/guide" className="hover:text-white transition-colors">Guía de Autores</Link></li>
              <li><Link to="/admin" className="hover:text-white transition-colors">Acceso Admin</Link></li>
            </ul>
          </div>

          {/* Columna 3: Legal */}
          <div>
            <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">Sobre Nosotros</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Política de Privacidad</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Términos de Uso</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Derechos de Autor</a></li>
            </ul>
          </div>

          {/* Columna 4: Contacto */}
          <div>
            <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 text-blue-500 shrink-0" />
                <span>Av. Universidad S/N, Ciudad Universitaria, Oaxaca.</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-blue-500 shrink-0" />
                <span>(951) 511 2345</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-blue-500 shrink-0" />
                <span>repositorio@fasbit.uabjo.mx</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {currentYear} Facultad de Sistemas Biológicos e Innovación Tecnológica. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;