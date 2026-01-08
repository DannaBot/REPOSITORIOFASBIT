import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { XCircle, Eye, FileText, Clock, AlertCircle, CheckCircle, Trash2, Key, UserCog, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useToast } from '../ui/use-toast';
import { getToken } from '../lib/auth';

const Admin = () => {
  const { toast } = useToast();
  const [theses, setTheses] = useState([]);
  const [coordinators, setCoordinators] = useState([]); // Lista de coordinadores
  const [stats, setStats] = useState({ theses: 0, coordinators: 0 });
  
  // Estado para crear coordinador
  const [newCoordinatorEmail, setNewCoordinatorEmail] = useState('');
  const [newCoordinatorPass, setNewCoordinatorPass] = useState('');

  // Estado para MODAL de cambio de contraseña
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedCoord, setSelectedCoord] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  useEffect(() => {
    loadTheses();
    loadStats();
    loadCoordinators();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/stats', {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) return;
      const s = await res.json();
      setStats(s);
    } catch (e) {}
  };

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

  // --- NUEVO: CARGAR COORDINADORES ---
  const loadCoordinators = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/users/coordinators', {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        setCoordinators(await res.json());
      }
    } catch (error) {
      console.error('Error cargando coordinadores', error);
    }
  };

  const deleteThesis = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta tesis? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`http://localhost:4000/api/theses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error('No se pudo eliminar la tesis');
      toast({ title: 'Tesis eliminada' });
      loadTheses();
      loadStats();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // --- NUEVO: BORRAR COORDINADOR ---
  const deleteCoordinator = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar a este coordinador? Perderá el acceso.')) return;
    try {
      const res = await fetch(`http://localhost:4000/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error('Error al eliminar');
      
      toast({ title: 'Coordinador eliminado' });
      loadCoordinators(); // Refrescar lista
      loadStats();
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo eliminar al usuario', variant: 'destructive' });
    }
  };

  // --- NUEVO: CAMBIAR CONTRASEÑA ---
  const openPasswordModal = (coord) => {
    setSelectedCoord(coord);
    setNewPasswordInput('');
    setPasswordModalOpen(true);
  };

  const handlePasswordUpdate = async () => {
    if (!newPasswordInput || newPasswordInput.length < 6) {
      toast({ title: 'Error', description: 'Mínimo 6 caracteres', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch(`http://localhost:4000/api/users/${selectedCoord.id}/password`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}` 
        },
        body: JSON.stringify({ newPassword: newPasswordInput })
      });
      if (!res.ok) throw new Error('Falló la actualización');
      
      toast({ title: 'Contraseña actualizada correctamente' });
      setPasswordModalOpen(false);
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo cambiar la contraseña', variant: 'destructive' });
    }
  };

  // --- Crear coordinador ---
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
      loadCoordinators(); // Refrescar lista
      loadStats();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendiente' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Aprobado' },
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className="h-4 w-4" /> {badge.label}
      </span>
    );
  };

  const filterThesesByStatus = (status) => {
    return theses.filter(thesis => thesis.status === status);
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
          </div>
        </div>
        <div>{getStatusBadge(thesis.status)}</div>
      </div>
      <div className="flex gap-2 flex-wrap mt-4">
        <Button size="sm" variant="outline" onClick={() => window.location.href = `/thesis/${thesis.id}`}>
          <Eye className="h-4 w-4 mr-1" /> Ver
        </Button>
        <Button size="sm" variant="destructive" className="ml-2" onClick={() => deleteThesis(thesis.id)}>
          <Trash2 className="h-4 w-4 mr-1" /> Eliminar
        </Button>
      </div>
    </motion.div>
  );

  return (
    <>
      <Helmet>
        <title>Panel de Administración - FASBIT</title>
      </Helmet>

      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">Panel de Administración</h1>
          <p className="text-blue-100">Control total del sistema</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-sm text-gray-500">Tesis totales</h3>
            <div className="text-2xl font-bold mt-2">{stats.theses}</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-sm text-gray-500">Coordinadores</h3>
            <div className="text-2xl font-bold mt-2">{stats.coordinators}</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow flex items-center">
            <Button onClick={() => { loadTheses(); loadCoordinators(); }} className="w-full">
              Refrescar Datos
            </Button>
          </div>
        </div>

        <Tabs defaultValue="coordinators" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="coordinators" className="flex items-center gap-2">
              <UserCog className="h-4 w-4" /> Gestión de Coordinadores
            </TabsTrigger>
            <TabsTrigger value="theses" className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Gestión de Tesis
            </TabsTrigger>
          </TabsList>

          {/* PESTAÑA 1: GESTIÓN DE COORDINADORES */}
          <TabsContent value="coordinators" className="space-y-6">
            
            {/* Formulario de Crear */}
            <div className="bg-white rounded-lg p-6 shadow mb-6 border-l-4 border-blue-500">
              <h2 className="text-lg font-bold mb-3 text-gray-800">Registrar Nuevo Coordinador</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Correo Electrónico</label>
                  <input className="w-full p-2 border rounded" placeholder="ejemplo@fasbit.com" value={newCoordinatorEmail} onChange={(e) => setNewCoordinatorEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Contraseña Inicial</label>
                  <input className="w-full p-2 border rounded" placeholder="******" type="password" value={newCoordinatorPass} onChange={(e) => setNewCoordinatorPass(e.target.value)} />
                </div>
                <Button onClick={createCoordinator} className="bg-blue-600 hover:bg-blue-700">Crear Cuenta</Button>
              </div>
            </div>

            {/* Lista de Coordinadores */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-700">Coordinadores Registrados</h3>
              </div>
              
              {coordinators.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No hay coordinadores registrados.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm uppercase">
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Fecha Registro</th>
                      <th className="px-6 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {coordinators.map((coord) => (
                      <tr key={coord.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-500">#{coord.id}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{coord.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(coord.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => openPasswordModal(coord)}
                          >
                            <Key className="h-4 w-4 mr-1" /> Clave
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => deleteCoordinator(coord.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          {/* PESTAÑA 2: GESTIÓN DE TESIS */}
          <TabsContent value="theses" className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow mb-4">
              <h2 className="font-semibold text-gray-700">Tesis Aprobadas y Publicadas</h2>
            </div>
            {filterThesesByStatus('approved').length > 0 ? (
              filterThesesByStatus('approved').map(thesis => (
                <ThesisCard key={thesis.id} thesis={thesis} />
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 bg-white rounded shadow">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No hay tesis aprobadas en el sistema.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* MODAL DE CAMBIO DE CONTRASEÑA */}
      {passwordModalOpen && selectedCoord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Cambiar Contraseña</h3>
              <button onClick={() => setPasswordModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Estás cambiando la contraseña para: <strong>{selectedCoord.email}</strong>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Nueva Contraseña</label>
              <input 
                type="password" 
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPasswordModalOpen(false)}>Cancelar</Button>
              <Button onClick={handlePasswordUpdate}>Guardar Nueva Contraseña</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Admin;