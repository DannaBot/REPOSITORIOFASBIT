import React from 'react';
import { Helmet } from 'react-helmet';
import { logout, getUser } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { getToken } from '../lib/auth';

const Coordinator = () => {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
  const navigate = useNavigate();

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/stats', { headers: { Authorization: `Bearer ${getToken()}` } });
        if (res.ok) {
          const s = await res.json();
          setStats(s);
        }
      } catch (e) {}

      try {
        const res2 = await fetch('http://localhost:4000/api/theses', { headers: { Authorization: `Bearer ${getToken()}` } });
        if (res2.ok) {
          const list = await res2.json();
          setTheses(list || []);
        }
      } catch (e) {
        console.error('Error loading theses for coordinator', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
        <Button onClick={() => { logout(); navigate('/login'); }}>Cerrar sesión</Button>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Tesis en el sistema</h2>
        {loading ? (
          <div>Loading...</div>
        ) : theses.length === 0 ? (
          <div className="text-gray-500">No hay tesis disponibles</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {theses.map(t => (
              <div key={t.id} className="p-4 bg-white rounded shadow flex items-center justify-between">
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-sm text-gray-600">{t.author} · {t.year}</div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!t.hidden} onChange={() => toggleHidden(t.id, !!t.hidden)} />
                    <span>Oculto</span>
                  </label>
                  <Button size="sm" onClick={() => window.location.href = `/thesis/${t.id}`}>Ver</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Coordinator;
