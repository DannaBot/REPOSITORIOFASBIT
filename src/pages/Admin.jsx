import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
// CORRECCIÓN AQUÍ: Agregué Clock, AlertCircle y CheckCircle a la importación
import { XCircle, Eye, FileText, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useToast } from '../ui/use-toast';
import { getToken } from '../lib/auth';

const Admin = () => {
  const { toast } = useToast();
  const [theses, setTheses] = useState([]);

  useEffect(() => {
    loadTheses();
  }, []);

  const [stats, setStats] = React.useState({ theses: 0, coordinators: 0 });

  React.useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/stats', {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!res.ok) return;
        const s = await res.json();
        setStats(s);
      } catch (e) {
        // ignore
      }
    };
    loadStats();
  }, []);

  const loadTheses = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/theses', {
        headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {}
      });
      if (!res.ok) throw new Error('Error cargando tesis');
      const data = await res.json();
      setTheses(data || []);
    } catch (error) {
      console.error('Error loading theses:', error);
    }
  };

  // Admin does not change publication status; only delete and create coordinators

  const deleteThesis = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta tesis? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`http://localhost:4000/api/theses/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });
      if (!res.ok) throw new Error('No se pudo eliminar la tesis');
      toast({ title: 'Tesis eliminada' });
      loadTheses();
    } catch (err) {
      console.error('Error deleting thesis:', err);
      toast({ title: 'Error', description: err.message || 'No se pudo borrar la tesis', variant: 'destructive' });
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
          onClick={() => window.location.href = `/thesis/${thesis.id}`}
        >
          <Eye className="h-4 w-4 mr-1" />
          Ver Detalle
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="ml-2"
          onClick={() => deleteThesis(thesis.id)}
        >
          Eliminar
        </Button>
      </div>
    </motion.div>
  );

  // --- Crear coordinador ---
  const [newCoordinatorEmail, setNewCoordinatorEmail] = React.useState('');
  const [newCoordinatorPass, setNewCoordinatorPass] = React.useState('');

  const createCoordinator = async () => {
    if (!newCoordinatorEmail || !newCoordinatorPass) return;
    try {
      const res = await fetch('http://localhost:4000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ email: newCoordinatorEmail, password: newCoordinatorPass, role: 'coordinator' })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error creando coordinador');
      }
      const created = await res.json();
      setNewCoordinatorEmail('');
      setNewCoordinatorPass('');
      toast({ title: 'Coordinador creado', description: created.email });
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'No se pudo crear coordinador', variant: 'destructive' });
    }
  };

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-sm text-gray-500">Tesis totales</h3>
            <div className="text-2xl font-bold mt-2">{stats.theses}</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-sm text-gray-500">Coordinadores</h3>
            <div className="text-2xl font-bold mt-2">{stats.coordinators}</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-sm text-gray-500">Acciones</h3>
            <div className="mt-2">
              <Button onClick={() => { loadTheses(); }} className="mr-2">Refrescar</Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow mb-6">
          <h2 className="text-lg font-semibold mb-3">Crear cuenta de Coordinador</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <input className="p-2 border rounded" placeholder="Email" value={newCoordinatorEmail} onChange={(e) => setNewCoordinatorEmail(e.target.value)} />
            <input className="p-2 border rounded" placeholder="Contraseña" type="password" value={newCoordinatorPass} onChange={(e) => setNewCoordinatorPass(e.target.value)} />
            <Button onClick={createCoordinator}>Crear Coordinador</Button>
          </div>
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