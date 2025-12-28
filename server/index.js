const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const pdf = require('pdf-parse');
const { init, getPool } = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_this';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.random().toString(36).slice(2, 9);
    const safe = file.originalname.replace(/[^a-z0-9.\-\_]/gi, '_');
    cb(null, `${unique}-${safe}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// --- MIDDLEWARES DE SEGURIDAD ---

function authenticateToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token provided' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid auth format' });
  const token = parts[1];
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = payload;
    next();
  });
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
// --- LOGIN CON DIAGNÓSTICO ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {}; 
  
  // LOGS PARA VER QUÉ RECIBE EL SERVIDOR
  console.log('------------------------------------------------');
  console.log('🔍 INTENTO DE LOGIN:');
  console.log('   Usuario recibido:', email); 
  console.log('   Contraseña recibida:', password); 

  if (!email || !password) {
    console.log('❌ Faltan datos.');
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }
  
  try {
    const pool = getPool();
    // Buscamos si es un correo (admin) O una matrícula (alumno)
    const [rows] = await pool.execute('SELECT id, email, student_id, password_hash, role FROM users WHERE email = ? OR student_id = ?', [email, email]);
    const user = rows && rows[0];
    
    if (!user) {
      console.log('❌ Usuario NO encontrado en la Base de Datos.');
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    console.log('✅ Usuario encontrado en BD. Rol:', user.role);
    
    // Verificamos la contraseña
    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) {
      console.log('❌ Contraseña INCORRECTA. El hash no coincide.');
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    
    console.log('✅ ¡Contraseña correcta! Generando token...');
    const token = jwt.sign({ id: user.id, email: user.email, student_id: user.student_id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, student_id: user.student_id } });
  } catch (err) {
    console.error('❌ Error de servidor:', err);
    res.status(500).json({ error: 'Login error' });
  }
});

// Crear usuarios (Solo Admin - para crear coordinadores)
app.post('/api/users', authenticateToken, requireRole('admin'), async (req, res) => {
  const { email, password, role } = req.body || {};
  console.log('[users:create] admin', req.user && req.user.email, 'creating', email, 'role', role);
  if (!email || !password || !role) return res.status(400).json({ error: 'email, password y role son requeridos' });
  
  if (role !== 'coordinator') return res.status(400).json({ error: 'Solo se permite crear usuarios con role "coordinator" desde esta ruta' });
  
  try {
    const hash = bcrypt.hashSync(password, 10);
    const createdAt = new Date();
    const pool = getPool();
    const [result] = await pool.execute('INSERT INTO users (email, password_hash, role, created_at) VALUES (?, ?, ?, ?)', [email, hash, role, createdAt]);
    console.log('[users:create] inserted id', result.insertId);
    res.json({ id: result.insertId, email, role });
  } catch (err) {
    console.error('[users:create] error', err);
    res.status(500).json({ error: err.message || 'Error creating user' });
  }
});

app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    const [r1] = await pool.execute('SELECT COUNT(*) as count FROM theses');
    const [r2] = await pool.execute("SELECT COUNT(*) as count FROM users WHERE role = 'coordinator'");
    res.json({ theses: (r1 && r1[0] && r1[0].count) || 0, coordinators: (r2 && r2[0] && r2[0].count) || 0 });
  } catch (err) {
    console.error('[stats] error', err);
    res.status(500).json({ error: 'Stats error' });
  }
});

// Listado de Tesis (Público)
app.get('/api/theses', (req, res) => {
  const qParam = req.query.q;
  let sql = 'SELECT id, title, author, abstract, career, year, thesis_date, keywords, status, downloads, pdf_filename, created_at, hidden FROM theses';
  const params = [];

  let showAll = false;
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(auth.split(' ')[1], JWT_SECRET);
      if (payload && (payload.role === 'admin' || payload.role === 'coordinator')) showAll = true;
    } catch (e) {
      // ignore
    }
  }

  const conditions = [];
  if (qParam) {
    const like = `%${qParam.toLowerCase()}%`;
    conditions.push('(lower(title) LIKE ? OR lower(author) LIKE ? OR lower(abstract) LIKE ? OR lower(`fulltext`) LIKE ?)');
    params.push(like, like, like, like);
  }

  if (!showAll) {
    // Solo mostrar aprobadas y no ocultas a visitantes
    conditions.push('status = ?');
    params.push('approved');
    conditions.push('hidden = ?');
    params.push(0);
  }

  if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY created_at DESC';

  (async () => {
    try {
      const pool = getPool();
      const [rows] = await pool.execute(sql, params);
      const parsed = rows.map(r => ({ ...r, keywords: r.keywords ? JSON.parse(r.keywords) : [] }));
      res.json(parsed);
    } catch (err) {
      console.error('[theses:list] error', err);
      res.status(500).json({ error: 'List error' });
    }
  })();
});

// Detalle de Tesis (Público, pero con restricciones si está oculta)
app.get('/api/theses/:id', (req, res) => {
  (async () => {
    try {
      const id = req.params.id;
      
      // Intentamos leer el usuario (si existe), pero NO bloqueamos si no hay token
      let payload = null;
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          payload = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        } catch (e) {
          // Si el token está mal, tratamos al usuario como visitante
        }
      }

      const pool = getPool();
      const [rows] = await pool.execute('SELECT *, thesis_date FROM theses WHERE id = ?', [id]);
      const row = rows && rows[0];
      
      if (!row) return res.status(404).json({ error: 'Not found' });

      // Lógica de permisos para ver detalles de tesis ocultas/no aprobadas
      const isRestricted = (row.hidden === 1 || row.status !== 'approved');
      const isAdminOrCoord = payload && (payload.role === 'admin' || payload.role === 'coordinator');
      // El autor también puede ver su propia tesis aunque esté oculta
      const isAuthor = payload && payload.role === 'student' && payload.student_id === row.student_id;

      if (isRestricted && !isAdminOrCoord && !isAuthor) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      row.keywords = row.keywords ? JSON.parse(row.keywords) : [];
      res.json(row);
    } catch (err) {
      console.error('[theses:get] error', err);
      res.status(500).json({ error: 'Error fetching thesis' });
    }
  })();
});

// Actualizar estatus (Coordinador/Admin)
app.post('/api/theses/:id/status', authenticateToken, requireRole('coordinator'), async (req, res) => {
  const id = req.params.id;
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ error: 'Status requerido' });
  try {
    const pool = getPool();
    const [result] = await pool.execute('UPDATE theses SET status = ? WHERE id = ?', [status, id]);
    res.json({ id, status });
  } catch (err) {
    console.error('[theses:status] error', err);
    res.status(500).json({ error: 'Error updating status' });
  }
});

// Borrar tesis (Admin)
app.delete('/api/theses/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const id = req.params.id;
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT pdf_filename, approval_filename FROM theses WHERE id = ?', [id]);
    const row = rows && rows[0];
    if (!row) return res.status(404).json({ error: 'Not found' });

    // Borrar archivos físicos
    try {
      if (row.pdf_filename) {
        const pdfPath = path.join(uploadsDir, row.pdf_filename);
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
      }
      if (row.approval_filename) {
        const apprPath = path.join(uploadsDir, row.approval_filename);
        if (fs.existsSync(apprPath)) fs.unlinkSync(apprPath);
      }
    } catch (e) {
      console.warn('[theses:delete] warning removing files', e);
    }

    const [result] = await pool.execute('DELETE FROM theses WHERE id = ?', [id]);
    res.json({ id });
  } catch (err) {
    console.error('[theses:delete] error', err);
    res.status(500).json({ error: 'Error deleting thesis' });
  }
});

// Descargar PDF (Requiere Login)
app.get('/api/theses/:id/pdf', authenticateToken, async (req, res) => {
  const id = req.params.id;
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT pdf_filename, hidden, status, student_id FROM theses WHERE id = ?', [id]);
    const row = rows && rows[0];
    if (!row || !row.pdf_filename) return res.status(404).json({ error: 'PDF not found' });

    // Reglas de acceso al archivo:
    // 1. Si está pública (approved y no hidden): Acceso permitido a cualquier usuario logueado (alumno, admin, coord).
    // 2. Si está restringida: Solo Admin, Coord o el Autor.
    const isRestricted = (row.hidden === 1 || row.status !== 'approved');
    const isAdminOrCoord = req.user.role === 'admin' || req.user.role === 'coordinator';
    const isAuthor = req.user.role === 'student' && req.user.student_id === row.student_id;

    if (isRestricted && !isAdminOrCoord && !isAuthor) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const file = path.join(uploadsDir, row.pdf_filename);
    if (!fs.existsSync(file)) return res.status(404).json({ error: 'File missing' });
    
    // Incrementar contador de descargas
    try { await pool.execute('UPDATE theses SET downloads = downloads + 1 WHERE id = ?', [id]); } catch (e) {}
    
    res.sendFile(file);
  } catch (err) {
    console.error('[theses:pdf] error', err);
    res.status(500).json({ error: 'Error retrieving PDF' });
  }
});

// Cambiar visibilidad (Coordinador)
app.post('/api/theses/:id/visibility', authenticateToken, requireRole('coordinator'), async (req, res) => {
  const id = req.params.id;
  const hidden = req.body && (req.body.hidden === 1 || req.body.hidden === '1' || req.body.hidden === true || req.body.hidden === 'true') ? 1 : 0;
  try {
    const pool = getPool();
    const [result] = await pool.execute('UPDATE theses SET hidden = ? WHERE id = ?', [hidden, id]);
    res.json({ id, hidden });
  } catch (err) {
    console.error('[theses:visibility] error', err);
    res.status(500).json({ error: 'Error updating visibility' });
  }
});

// --- SUBIDA DE TESIS (Sin crear usuario) ---
app.post('/api/upload', authenticateToken, requireRole('coordinator'), upload.fields([{ name: 'pdfFile' }, { name: 'approvalFile' }]), async (req, res) => {
  try {
    const body = req.body;
    const pdfFile = req.files['pdfFile']?.[0];
    const approvalFile = req.files['approvalFile']?.[0];

    if (!pdfFile) return res.status(400).json({ error: 'PDF requerido' });

    // Extraer texto para búsquedas (opcional)
    const dataBuffer = fs.readFileSync(pdfFile.path);
    const pdfData = await pdf(dataBuffer).catch(() => ({ text: '' }));
    const fulltext = (pdfData && pdfData.text) ? pdfData.text : '';

    const keywords = body.keywords ? JSON.stringify(body.keywords.split(',').map(k => k.trim())) : JSON.stringify([]);
    
    // Publicación automática
    const status = 'approved'; 
    const hidden = (body.hidden === '1' || body.hidden === 'true') ? 1 : 0;
    const createdAt = new Date();
    const pool = getPool();

    // Insertar la tesis vinculando la matrícula (student_id)
    // No tocamos la tabla de usuarios. Los usuarios se deben crear aparte (seed o panel admin).
    const [result] = await pool.execute('INSERT INTO theses (title, author, student_id, email, abstract, advisor, career, year, thesis_date, keywords, status, hidden, downloads, pdf_filename, approval_filename, `fulltext`, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
      body.title || '',
      body.studentName || '',
      body.studentId || '', // Matrícula del alumno
      body.email || '',
      body.abstract || '',
      body.advisor || '',
      body.career || '',
      parseInt(body.year) || new Date().getFullYear(),
      body.thesis_date && body.thesis_date.length ? body.thesis_date : null,
      keywords,
      status,
      hidden,
      0,
      pdfFile.filename,
      approvalFile ? approvalFile.filename : null,
      fulltext,
      createdAt
    ]);

    const id = result.insertId;
    console.log('[upload] inserted thesis id', id);
    
    const [rows] = await pool.execute('SELECT id, title, author, abstract, career, year, keywords, status, downloads, pdf_filename, created_at FROM theses WHERE id = ?', [id]);
    const row = rows && rows[0];
    if (row) row.keywords = row.keywords ? JSON.parse(row.keywords) : [];
    res.json(row);
  } catch (error) {
    console.error('[upload] error', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

init().then(() => {
  console.log('[server] DB initialized, starting HTTP server');
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}).catch(err => {
  console.error('[server] Failed to init DB, aborting start', err);
  process.exit(1);
});