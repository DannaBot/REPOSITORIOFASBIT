import React from 'react';
import { Helmet } from 'react-helmet';
import { logout, getUser, getToken } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Pencil, X, Save, Eye, EyeOff } from 'lucide-react'; // Iconos nuevos

const Coordinator = () => {
  const navigate = useNavigate();
  const user = getUser();

  return (
    <>
      <Helmet>
        <title>Panel de Coordinador - FASBIT</title>
      </Helmet>

      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Panel de Coordinador</h1>
          <p className="text-indigo-100">Bienvenido{user?.email ? `, ${user.email}` : ''}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <CoordinatorBody />
      </div>
    </>
  );
};

function CoordinatorBody() {
  const [stats, setStats] = React.useState({ theses: 0, coordinators: 0 });
  const [theses, setTheses] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  
  // ESTADO NUEVO: Para controlar la tesis que se está editando
  const [editingThesis, setEditingThesis] = React.useState(null);
  
  const navigate = useNavigate();

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = getToken();
      // Cargar estadísticas
      const resStats = await fetch('http://localhost:4000/api/stats', { headers: { Authorization: `Bearer ${token}` } });
      if (resStats.ok) setStats(await resStats.json());

      // Cargar tesis
      const resTheses = await fetch('http://localhost:4000/api/theses', { headers: { Authorization: `Bearer ${token}` } });
      if (resTheses.ok) setTheses(await resTheses.json());
      
    } catch (e) {
      console.error('Error loading data', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleHidden = async (id, currentHidden) => {
    try {
      const res = await fetch(`http://localhost:4000/api/theses/${id}/visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ hidden: currentHidden ? 0 : 1 })
      });
      if (!res.ok) throw new Error('Error updating visibility');
      const updated = await res.json();
      setTheses(prev => prev.map(t => t.id === id ? { ...t, hidden: updated.hidden } : t));
    } catch (e) {
      console.error('toggleHidden error', e);
    }
  };

  // NUEVA FUNCIÓN: Guardar los cambios editados
  const handleUpdateThesis = async (e) => {
    e.preventDefault();
    if (!editingThesis) return;

    try {
      const res = await fetch(`http://localhost:4000/api/theses/${editingThesis.id}`, {
        method: 'PUT', // Usamos PUT para actualizar
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${getToken()}` 
        },
        body: JSON.stringify(editingThesis)
      });

      if (!res.ok) throw new Error('Falló la actualización');

      // Actualizar la lista local
      setTheses(prev => prev.map(t => t.id === editingThesis.id ? editingThesis : t));
      setEditingThesis(null); // Cerrar modal
      alert("Tesis actualizada correctamente");
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert("Error al guardar los cambios");
    }
  };

  return (
    <>
      <p>Interfaz de coordinación. Estadísticas rápidas:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="bg-white rounded p-4 shadow">
          <div className="text-sm text-gray-500">Tesis totales</div>
          <div className="text-2xl font-bold">{stats.theses}</div>
        </div>
        <div className="bg-white rounded p-4 shadow">
          <div className="text-sm text-gray-500">Coordinadores</div>
          <div className="text-2xl font-bold">{stats.coordinators}</div>
        </div>
      </div>

      <div className="mt-6">
        <Button onClick={() => { logout(); navigate('/login'); }} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
          Cerrar sesión
        </Button>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Gestión de Tesis</h2>
        {loading ? (
          <div>Cargando...</div>
        ) : theses.length === 0 ? (
          <div className="text-gray-500">No hay tesis disponibles</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {theses.map(t => (
              <div key={t.id} className="p-4 bg-white rounded border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="font-medium text-lg text-gray-800">{t.title}</div>
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">{t.author}</span> · {t.year} · {t.career}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Botón de Visibilidad */}
                  <button 
                    onClick={() => toggleHidden(t.id, !!t.hidden)}
                    className={`p-2 rounded-full transition-colors ${t.hidden ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-700'}`}
                    title={t.hidden ? "Tesis Oculta" : "Tesis Visible"}
                  >
                    {t.hidden ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>

                  {/* NUEVO: Botón de Editar */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setEditingThesis(t)} 
                    className="flex items-center gap-2"
                  >
                    <Pencil size={16} /> Editar
                  </Button>

                  {/* Botón Ver PDF */}
                  <Button size="sm" onClick={() => window.location.href = `/thesis/${t.id}`}>
                    Ver PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE EDICIÓN */}
      {editingThesis && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-800">Editar Tesis</h3>
              <button onClick={() => setEditingThesis(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateThesis} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={editingThesis.title}
                  onChange={e => setEditingThesis({...editingThesis, title: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Autor</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={editingThesis.author}
                    onChange={e => setEditingThesis({...editingThesis, author: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                  <input 
                    type="number" 
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={editingThesis.year || ''}
                    onChange={e => setEditingThesis({...editingThesis, year: parseInt(e.target.value)})}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carrera</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={editingThesis.career || ''}
                  onChange={e => setEditingThesis({...editingThesis, career: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resumen (Abstract)</label>
                <textarea 
                  rows={5}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={editingThesis.abstract || ''}
                  onChange={e => setEditingThesis({...editingThesis, abstract: e.target.value})}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t mt-6">
                <Button type="button" variant="ghost" onClick={() => setEditingThesis(null)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white flex gap-2">
                  <Save size={18} /> Guardar Cambios
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Coordinator;