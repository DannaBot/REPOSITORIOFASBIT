import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import { Download, Share2, Copy, ArrowLeft, FileText, Calendar, User, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
// RUTAS CORREGIDAS
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useToast } from '../ui/use-toast';
import { supabase } from '../lib/supabase';

const ThesisDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [thesis, setThesis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThesis();
  }, [id]);

  const loadThesis = async () => {
    try {
      const { data, error } = await supabase
        .from('theses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setThesis(data);
      
      await supabase
        .from('theses')
        .update({ downloads: (data.downloads || 0) })
        .eq('id', id);
        
    } catch (error) {
      console.error('Error loading thesis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const { error } = await supabase
        .from('theses')
        .update({ downloads: (thesis.downloads || 0) + 1 })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Descarga iniciada",
        description: "El archivo PDF se está descargando...",
      });

      setThesis(prev => ({ ...prev, downloads: (prev.downloads || 0) + 1 }));
    } catch (error) {
      console.error('Error incrementing downloads:', error);
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
    toast({
      title: "Citación copiada",
      description: `Formato ${format} copiado al portapapeles`,
    });
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: "Enlace copiado",
      description: "El enlace ha sido copiado al portapapeles",
    });
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  <div>
                    <div className="text-sm text-gray-500">Autor</div>
                    <div className="font-medium">{thesis.author}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-sm text-gray-500">Año</div>
                    <div className="font-medium">{thesis.year}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-sm text-gray-500">Carrera</div>
                    <div className="font-medium">{thesis.career}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-sm text-gray-500">Asesor</div>
                    <div className="font-medium">{thesis.advisor}</div>
                  </div>
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
                      <span key={i} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Visor de PDF</h2>
                <div className="bg-gray-100 rounded-lg p-12 text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">El visor de PDF se mostrará aquí</p>
                  <Button
                    variant="outline"
                    onClick={() => toast({
                      title: "Visor de PDF",
                      description: "🚧 Esta funcionalidad aún no está implementada, pero puedes solicitarla en tu siguiente prompt! 🚀"
                    })}
                  >
                    Abrir Visor
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg shadow-lg p-6 sticky top-20"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones</h2>
              
              <div className="space-y-3 mb-6">
                <Button onClick={handleDownload} className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
                
                <Button onClick={handleShare} variant="outline" className="w-full justify-start">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartir
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
                    <div className="bg-gray-50 rounded-lg p-4 mb-3">
                      <p className="text-sm text-gray-700">{generateCitation('APA')}</p>
                    </div>
                    <Button
                      onClick={() => copyCitation('APA')}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar citación APA
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="IEEE" className="mt-4">
                    <div className="bg-gray-50 rounded-lg p-4 mb-3">
                      <p className="text-sm text-gray-700">{generateCitation('IEEE')}</p>
                    </div>
                    <Button
                      onClick={() => copyCitation('IEEE')}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar citación IEEE
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ThesisDetail;