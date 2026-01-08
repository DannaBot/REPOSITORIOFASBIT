import React from 'react';
import { Helmet } from 'react-helmet';
import { logout, getUser, getToken } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Pencil, X, Save, Eye, EyeOff, FileText } from 'lucide-react';
import { useToast } from '../ui/use-toast';

const Coordinator = () => {
  const navigate = useNavigate();
  const user = getUser();

  return (
    <>
      <Helmet><title>Panel de Coordinador - FASBIT</title></Helmet>
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
  const { toast } = useToast();
  const [stats, setStats] = React.useState({ theses: 0, coordinators: 0 });
  const [theses, setTheses] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [editingThesis, setEditingThesis] = React.useState(null);
  const navigate = useNavigate();

  React.useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const token = getToken();
      // Cabeceras para prohibir el caché
      const noCacheHeaders = { 
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      };

      const resStats = await fetch('http://localhost:4000/api/stats', { headers: noCacheHeaders });
      if (resStats.ok) setStats(await resStats.json());

      // TRUCO: Agregamos ?t=hora_actual para que la petición sea siempre única
      const resTheses = await fetch(`http://localhost:4000/api/theses?t=${Date.now()}`, { headers: noCacheHeaders });
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
      if (!res.ok) throw new Error('Error');
      const updated = await res.json();
      setTheses(prev => prev.map(t => t.id === id ? { ...t, hidden: updated.hidden } : t));
      
      toast({
        description: currentHidden ? "Tesis ahora visible" : "Tesis ocultada",
        className: "bg-gray-800 text-white border-none",
      });
    } catch (e) { console.error(e); }
  };

  const handleUpdateThesis = async (e) => {
    e.preventDefault();
    if (!editingThesis) return;
  
    try {
      const formData = new FormData();
      // Datos básicos
      formData.append('title', editingThesis.title);
      formData.append('author', editingThesis.author);
      formData.append('student_id', editingThesis.student_id || '');
      formData.append('year', editingThesis.year);
      formData.append('career', editingThesis.career || '');
      formData.append('abstract', editingThesis.abstract || '');
      
      // NUEVOS CAMPOS AGREGADOS
      formData.append('email', editingThesis.email || '');
      formData.append('advisor', editingThesis.advisor || '');
      // Si hay fecha, la mandamos. A veces viene completa ISO (2024-01-01T00...), cortamos a 10 chars
      const dateVal = editingThesis.thesis_date ? new Date(editingThesis.thesis_date).toISOString().slice(0, 10) : '';
      formData.append('thesis_date', dateVal);

      // Keywords
      let keywordsToSend = editingThesis.keywords;
      if (typeof keywordsToSend === 'string') {
        keywordsToSend = JSON.stringify(keywordsToSend.split(',').map(k => k.trim()).filter(k => k !== ''));
      } else if (Array.isArray(keywordsToSend)) {
        keywordsToSend = JSON.stringify(keywordsToSend);
      }
      formData.append('keywords', keywordsToSend);
      
      // Archivos
      if (editingThesis.newPdfFile) {
        formData.append('pdfFile', editingThesis.newPdfFile);
      }
      if (editingThesis.newApprovalFile) {
        formData.append('approvalFile', editingThesis.newApprovalFile);
      }
  
      const res = await fetch(`http://localhost:4000/api/theses/${editingThesis.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData
      });
  
      if (!res.ok) throw new Error('Falló la actualización');
      
      await loadData(); 
      setEditingThesis(null);
      
      toast({
        title: "¡Actualización exitosa!",
        description: "Los datos se han guardado correctamente.",
        className: "bg-green-600 text-white border-none",
      });
    } catch (error) {
      console.error("Error al actualizar:", error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <p>Estadísticas rápidas:</p>
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
        {loading ? <div>Cargando...</div> : theses.length === 0 ? <div className="text-gray-500">No hay tesis</div> : (
          <div className="grid grid-cols-1 gap-4">
            {theses.map(t => (
              <div key={t.id} className="p-4 bg-white rounded border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="font-medium text-lg text-gray-800">{t.title}</div>
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">{t.author}</span> · {t.year} · {t.career}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    PDF: {t.pdf_filename} <br/>
                    Aprobación: {t.approval_filename || 'No subido'}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleHidden(t.id, !!t.hidden)} className={`p-2 rounded-full ${t.hidden ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-700'}`}>
                    {t.hidden ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <Button size="sm" variant="outline" onClick={() => setEditingThesis(t)} className="flex items-center gap-2">
                    <Pencil size={16} /> Editar
                  </Button>
                  <Button size="sm" onClick={() => window.location.href = `/thesis/${t.id}`}>Ver</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingThesis && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h3 className="text-xl font-bold">Editar Tesis</h3>
              <button onClick={() => setEditingThesis(null)}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleUpdateThesis} className="p-6 space-y-4">
              {/* TÍTULO */}
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input className="w-full p-2 border rounded" value={editingThesis.title} onChange={e => setEditingThesis({...editingThesis, title: e.target.value})} required />
              </div>

              {/* AUTOR Y EMAIL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Autor</label>
                  <input className="w-full p-2 border rounded" value={editingThesis.author} onChange={e => setEditingThesis({...editingThesis, author: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email del Alumno</label>
                  <input type="email" className="w-full p-2 border rounded" value={editingThesis.email || ''} onChange={e => setEditingThesis({...editingThesis, email: e.target.value})} />
                </div>
              </div>

              {/* MATRÍCULA Y CARRERA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Matrícula (ID)</label>
                  <input className="w-full p-2 border rounded bg-blue-50" value={editingThesis.student_id || ''} onChange={e => setEditingThesis({...editingThesis, student_id: e.target.value})} placeholder="Ej: 123456" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Carrera</label>
                  <select className="w-full p-2 border rounded bg-white" value={editingThesis.career || ''} onChange={e => setEditingThesis({...editingThesis, career: e.target.value})}>
                    <option value="">Selecciona...</option>
                    <option>Ingeniería en Innovación Tecnológica</option>
                    <option>Biología</option>
                    <option>Maestría en Ingeniería</option>
                  </select>
                </div>
              </div>

              {/* ASESOR, AÑO Y FECHA DE DEFENSA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Asesor/Director</label>
                  <input className="w-full p-2 border rounded" value={editingThesis.advisor || ''} onChange={e => setEditingThesis({...editingThesis, advisor: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Año</label>
                  <input type="number" className="w-full p-2 border rounded" value={editingThesis.year || ''} onChange={e => setEditingThesis({...editingThesis, year: parseInt(e.target.value)})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha de Defensa</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border rounded" 
                    // Convertimos la fecha de BD a formato YYYY-MM-DD para el input
                    value={editingThesis.thesis_date ? new Date(editingThesis.thesis_date).toISOString().slice(0, 10) : ''} 
                    onChange={e => setEditingThesis({...editingThesis, thesis_date: e.target.value})} 
                  />
                </div>
              </div>

              {/* PALABRAS CLAVE */}
              <div>
                <label className="block text-sm font-medium mb-1">Palabras Clave (Separadas por comas)</label>
                <input 
                  className="w-full p-2 border rounded" 
                  value={Array.isArray(editingThesis.keywords) ? editingThesis.keywords.join(', ') : (editingThesis.keywords || '')} 
                  onChange={e => setEditingThesis({...editingThesis, keywords: e.target.value})} 
                  placeholder="Ej: Biología, Software, IA"
                />
              </div>

              {/* ARCHIVOS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded border border-dashed">
                  <label className="block text-sm font-medium mb-2">Archivo PDF (Tesis)</label>
                  <input type="file" accept=".pdf" className="w-full text-sm" onChange={e => setEditingThesis({...editingThesis, newPdfFile: e.target.files[0]})} />
                  <p className="text-xs text-gray-500 mt-1 truncate">Actual: {editingThesis.pdf_filename || 'Ninguno'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded border border-dashed">
                  <label className="block text-sm font-medium mb-2">Aprobación</label>
                  <input type="file" accept=".pdf,.jpg,.png" className="w-full text-sm" onChange={e => setEditingThesis({...editingThesis, newApprovalFile: e.target.files[0]})} />
                  <p className="text-xs text-gray-500 mt-1 truncate">Actual: {editingThesis.approval_filename || 'Ninguno'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Resumen</label>
                <textarea rows={4} className="w-full p-2 border rounded" value={editingThesis.abstract || ''} onChange={e => setEditingThesis({...editingThesis, abstract: e.target.value})} />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t mt-6">
                <Button type="button" variant="ghost" onClick={() => setEditingThesis(null)}>Cancelar</Button>
                <Button type="submit" className="bg-indigo-600 text-white flex gap-2"><Save size={18} /> Guardar Cambios</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Coordinator;