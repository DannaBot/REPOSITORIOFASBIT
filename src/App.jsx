import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from './ui/toaster';

// Importamos Navbar y Footer (¡Ahora sí existen!)
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Rutas de páginas
import Home from './pages/Home';
import Upload from './pages/Upload';
import ThesisDetail from './pages/ThesisDetail';
import Guide from './pages/Guide';
import Contact from './pages/Contact';
import Catalog from './pages/Catalog';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Coordinator from './pages/Coordinator';
import ProtectedRoute from './components/ProtectedRoute';
import About from './pages/About';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        
        {/* Aquí agregamos el Navbar para que se vea arriba */}
        <Navbar />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/thesis/:id" element={<ThesisDetail />} />
            <Route path="/admin" element={<ProtectedRoute role="admin"><Admin /></ProtectedRoute>} />
            <Route path="/coordinator" element={<ProtectedRoute role="coordinator"><Coordinator /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>

        {/* Aquí agregamos el Footer para que se vea abajo */}
        <Footer />
        
        <Toaster />
      </div>
    </Router>
  );
}

export default App;