import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import { Download, Share2, Copy, ArrowLeft, FileText, Calendar, User, GraduationCap, X, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUser, getToken } from '../lib/auth';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useToast } from '../ui/use-toast';

const ThesisDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [thesis, setThesis] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estado para el PDF y el Modal
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadThesis();
  }, [id]);

  const loadThesis = async () => {
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:4000/api/theses/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setThesis(data);
    } catch (error) {
      console.error('Error loading thesis:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPdf = async () => {
    if (!id) return;
    if (pdfUrl) {
      setShowModal(true);
      return;
    }
    const token = getToken();
    if (!token) {
      toast({ title: 'Acceso restringido', description: 'Debes iniciar sesión para ver el PDF', variant: 'destructive' });
      window.location.href = '/login';
      return;
    }
    try {
      setLoadingPdf(true);
      const res = await fetch(`http://localhost:4000/api/theses/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Error fetching PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setShowModal(true);
    } catch (e) {
      console.error('Error loading PDF', e);
      toast({ title: 'Error', description: 'No se pudo cargar el PDF', variant: 'destructive' });
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleDownload = async () => {
    const user = getUser();
    if (!user) {
      toast({ title: 'Acceso restringido', description: 'Debes iniciar sesión con tu matrícula y CURP para descargar esta tesis', variant: 'destructive' });
      window.location.href = '/login';
      return;
    }
    try {
      const url = `http://localhost:4000/api/theses/${id}/pdf`;
      toast({ title: 'Descarga iniciada', description: 'El archivo PDF se está descargando...' });
      window.open(url, '_blank');
      setThesis(prev => ({ ...prev, downloads: (prev.downloads || 0) + 1 }));
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const generateCitation = (format) => {
    if (!thesis) return '';
    if (format === 'APA') {
      return `${thesis.author} (${thesis.year}). ${thesis.title}. FASBIT, Universidad.`;
    } else if (format === 'IEEE') {
      return `${thesis.author}, "${thesis.title}," FASBIT, Universidad, ${thesis.year}.`;
    }
    return '';
  };

  const copyCitation = (format) => {
    const citation = generateCitation(format);
    navigator.clipboard.writeText(citation);
    toast({ title: "Citación copiada", description: `Formato ${format} copiado al portapapeles` });
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({ title: "Enlace copiado", description: "El enlace ha sido copiado al portapapeles" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tesis...</p>
        </div>
      </div>
    );
  }

  if (!thesis) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tesis no encontrada</h2>
          <p className="text-gray-600 mb-4">La tesis que buscas no existe o ha sido eliminada</p>
          <Link to="/catalog">
            <Button>Volver al Catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{thesis.title} - FASBIT</title>
        <meta name="description" content={thesis.abstract} />
      </Helmet>

      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/catalog" className="inline-flex items-center text-blue-100 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al catálogo
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-lg p-8"
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-6">{thesis.title}</h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-gray-700">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <div><div className="text-sm text-gray-500">Autor</div><div className="font-medium">{thesis.author}</div></div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div><div className="text-sm text-gray-500">Año</div><div className="font-medium">{thesis.year}</div></div>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                  <div><div className="text-sm text-gray-500">Carrera</div><div className="font-medium">{thesis.career}</div></div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <div><div className="text-sm text-gray-500">Asesor</div><div className="font-medium">{thesis.advisor}</div></div>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Resumen</h2>
                <p className="text-gray-700 leading-relaxed">{thesis.abstract}</p>
              </div>

              {thesis.keywords && thesis.keywords.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Palabras Clave</h2>
                  <div className="flex flex-wrap gap-2">
                    {thesis.keywords.map((keyword, i) => (
                      <span key={i} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">{keyword}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Documento Completo</h2>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center text-center">
                  <FileText className="h-12 w-12 text-blue-600 mb-3" />
                  <h3 className="font-medium text-gray-900 mb-2">Lectura de Tesis</h3>
                  <p className="text-sm text-gray-500 mb-4 max-w-md">
                    Puedes leer el documento completo en nuestro visor integrado o descargarlo para leerlo más tarde.
                  </p>
                  
                  {(() => {
                    const user = getUser();
                    if (!user) {
                      return (
                        <Button onClick={() => { window.location.href = '/login'; }} variant="default">
                          Iniciar sesión para leer
                        </Button>
                      );
                    }
                    return (
                      <Button onClick={loadPdf} disabled={loadingPdf} className="bg-blue-600 hover:bg-blue-700">
                        {loadingPdf ? 'Cargando documento...' : (
                          <>
                            <Eye className="w-4 h-4 mr-2" /> Leer Tesis Ahora
                          </>
                        )}
                      </Button>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-lg shadow-lg p-6 sticky top-20">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones</h2>
              <div className="space-y-3 mb-6">
                <Button onClick={handleDownload} className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" /> Descargar PDF
                </Button>
                <Button onClick={handleShare} variant="outline" className="w-full justify-start">
                  <Share2 className="h-4 w-4 mr-2" /> Compartir
                </Button>
              </div>
              <div className="border-t pt-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{thesis.downloads || 0}</div>
                  <div className="text-sm text-gray-600">Descargas totales</div>
                </div>
              </div>
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Citar esta tesis</h3>
                <Tabs defaultValue="APA" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="APA">APA</TabsTrigger>
                    <TabsTrigger value="IEEE">IEEE</TabsTrigger>
                  </TabsList>
                  <TabsContent value="APA" className="mt-4">
                    <div className="bg-gray-50 rounded-lg p-4 mb-3"><p className="text-sm text-gray-700">{generateCitation('APA')}</p></div>
                    <Button onClick={() => copyCitation('APA')} variant="outline" size="sm" className="w-full"><Copy className="h-4 w-4 mr-2" /> Copiar</Button>
                  </TabsContent>
                  <TabsContent value="IEEE" className="mt-4">
                    <div className="bg-gray-50 rounded-lg p-4 mb-3"><p className="text-sm text-gray-700">{generateCitation('IEEE')}</p></div>
                    <Button onClick={() => copyCitation('IEEE')} variant="outline" size="sm" className="w-full"><Copy className="h-4 w-4 mr-2" /> Copiar</Button>
                  </TabsContent>
                </Tabs>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* MODAL MÁXIMO TAMAÑO */}
      <AnimatePresence>
        {showModal && pdfUrl && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-0 sm:p-2"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-white rounded-lg shadow-2xl w-full h-full sm:w-[95vw] sm:h-[95vh] flex flex-col relative overflow-hidden"
            >
              {/* Encabezado compacto */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50 shrink-0">
                <div className="flex items-center gap-4 overflow-hidden">
                  <h3 className="font-semibold text-gray-900 truncate">{thesis.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" /> Descargar
                  </Button>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Contenido Full Iframe */}
              <div className="flex-1 bg-white p-0 overflow-hidden">
                <iframe src={pdfUrl} title="Visor PDF" className="w-full h-full border-none block" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ThesisDetail;