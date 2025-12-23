import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Clock, CheckCircle, XCircle, Eye, FileText, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
// RUTAS CORREGIDAS
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useToast } from '../ui/use-toast';
import { supabase } from '../lib/supabase';

const Admin = () => {
  const { toast } = useToast();
  const [theses, setTheses] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('pending');

  useEffect(() => {
    loadTheses();
  }, []);

  const loadTheses = async () => {
    try {
      const { data, error } = await supabase
        .from('theses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTheses(data || []);
    } catch (error) {
      console.error('Error loading theses:', error);
    }
  };

  const updateThesisStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('theses')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `La tesis ha sido ${status === 'approved' ? 'aprobada' : status === 'rejected' ? 'rechazada' : 'marcada para correcciones'}`,
      });

      loadTheses();
    } catch (error) {
      console.error('Error updating thesis:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la tesis",
        variant: "destructive"
      });
    }
  };

  const filterThesesByStatus = (status) => {
    return theses.filter(thesis => thesis.status === status);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendiente de Revisión' },
      corrections: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle, label: 'Correcciones Solicitadas' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Aprobado/Publicado' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rechazado' }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className="h-4 w-4" />
        {badge.label}
      </span>
    );
  };

  const ThesisCard = ({ thesis }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{thesis.title}</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Autor:</strong> {thesis.author}</p>
            <p><strong>Matrícula:</strong> {thesis.student_id}</p>
            <p><strong>Email:</strong> {thesis.email}</p>
            <p><strong>Carrera:</strong> {thesis.career}</p>
            <p><strong>Asesor:</strong> {thesis.advisor}</p>
            <p><strong>Año:</strong> {thesis.year}</p>
          </div>
        </div>
        <div>
          {getStatusBadge(thesis.status)}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-700 line-clamp-3">{thesis.abstract}</p>
      </div>

      {thesis.keywords && thesis.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {thesis.keywords.map((keyword, i) => (
            <span key={i} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
              {keyword}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          onClick={() => toast({
            title: "Vista previa",
            description: "🚧 Esta funcionalidad aún no está implementada, pero puedes solicitarla en tu siguiente prompt! 🚀"
          })}
        >
          <Eye className="h-4 w-4 mr-1" />
          Ver Detalle
        </Button>
        
        {thesis.status === 'pending' && (
          <>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => updateThesisStatus(thesis.id, 'approved')}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Aprobar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
              onClick={() => updateThesisStatus(thesis.id, 'corrections')}
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              Solicitar Correcciones
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
              onClick={() => updateThesisStatus(thesis.id, 'rejected')}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Rechazar
            </Button>
          </>
        )}

        {thesis.status === 'corrections' && (
          <>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => updateThesisStatus(thesis.id, 'approved')}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Aprobar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
              onClick={() => updateThesisStatus(thesis.id, 'rejected')}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Rechazar
            </Button>
          </>
        )}

        {thesis.status === 'approved' && (
          <Button
            size="sm"
            variant="outline"
            className="text-orange-600 border-orange-600 hover:bg-orange-50"
            onClick={() => updateThesisStatus(thesis.id, 'corrections')}
          >
            <AlertCircle className="h-4 w-4 mr-1" />
            Solicitar Correcciones
          </Button>
        )}
      </div>
    </motion.div>
  );

  return (
    <>
      <Helmet>
        <title>Panel de Administración - FASBIT</title>
        <meta name="description" content="Panel de administración para revisar y aprobar tesis del repositorio digital de FASBIT." />
      </Helmet>

      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">Panel de Administración</h1>
          <p className="text-blue-100">Gestiona y revisa las tesis enviadas al repositorio</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pendientes ({filterThesesByStatus('pending').length})
            </TabsTrigger>
            <TabsTrigger value="corrections" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Correcciones ({filterThesesByStatus('corrections').length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Aprobadas ({filterThesesByStatus('approved').length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Rechazadas ({filterThesesByStatus('rejected').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            {filterThesesByStatus('pending').length > 0 ? (
              filterThesesByStatus('pending').map(thesis => (
                <ThesisCard key={thesis.id} thesis={thesis} />
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No hay tesis pendientes de revisión</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="corrections" className="space-y-6">
            {filterThesesByStatus('corrections').length > 0 ? (
              filterThesesByStatus('corrections').map(thesis => (
                <ThesisCard key={thesis.id} thesis={thesis} />
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No hay tesis con correcciones solicitadas</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-6">
            {filterThesesByStatus('approved').length > 0 ? (
              filterThesesByStatus('approved').map(thesis => (
                <ThesisCard key={thesis.id} thesis={thesis} />
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No hay tesis aprobadas</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-6">
            {filterThesesByStatus('rejected').length > 0 ? (
              filterThesesByStatus('rejected').map(thesis => (
                <ThesisCard key={thesis.id} thesis={thesis} />
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No hay tesis rechazadas</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Admin;