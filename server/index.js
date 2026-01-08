const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const { init, getPool } = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_this';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Carpeta de archivos
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Configuración Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Nombre temporal seguro
    const unique = Date.now() + '-' + Math.random().toString(36).slice(2, 9);
    const safe = file.originalname.replace(/[^a-z0-9.\-\_]/gi, '_');
    cb(null, `${unique}-${safe}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// --- MIDDLEWARES ---
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

// --- RUTAS DE USUARIOS ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {}; 
  if (!email || !password) return res.status(400).json({ error: 'Datos requeridos' });
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT id, email, student_id, password_hash, role FROM users WHERE email = ? OR student_id = ?', [email, email]);
    const user = rows && rows[0];
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, student_id: user.student_id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, student_id: user.student_id } });
  } catch (err) {
    res.status(500).json({ error: 'Login error' });
  }
});

app.post('/api/users', authenticateToken, requireRole('admin'), async (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password || role !== 'coordinator') return res.status(400).json({ error: 'Datos inválidos' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const pool = getPool();
    const [result] = await pool.execute('INSERT INTO users (email, password_hash, role, created_at) VALUES (?, ?, ?, ?)', [email, hash, role, new Date()]);
    res.json({ id: result.insertId, email, role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/coordinators', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute("SELECT id, email, created_at FROM users WHERE role = 'coordinator' ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

app.delete('/api/users/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const id = req.params.id;
  try {
    const pool = getPool();
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

app.put('/api/users/:id/password', authenticateToken, requireRole('admin'), async (req, res) => {
  const id = req.params.id;
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Min 6 chars' });
  try {
    const hash = bcrypt.hashSync(newPassword, 10);
    const pool = getPool();
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, id]);
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    const [r1] = await pool.execute('SELECT COUNT(*) as count FROM theses');
    const [r2] = await pool.execute("SELECT COUNT(*) as count FROM users WHERE role = 'coordinator'");
    res.json({ theses: r1[0].count, coordinators: r2[0].count });
  } catch (err) {
    res.status(500).json({ error: 'Stats error' });
  }
});

// --- RUTAS DE TESIS ---

// 1. LISTAR
app.get('/api/theses', (req, res) => {
  const qParam = req.query.q;
  let sql = 'SELECT id, title, author, abstract, career, year, thesis_date, keywords, status, downloads, pdf_filename, approval_filename, student_id, created_at, hidden, email, advisor FROM theses';
  const params = [];
  let showAll = false;
  
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(auth.split(' ')[1], JWT_SECRET);
      if (payload && (payload.role === 'admin' || payload.role === 'coordinator')) showAll = true;
    } catch (e) {}
  }

  const conditions = [];
  if (qParam) {
    const like = `%${qParam.toLowerCase()}%`;
    conditions.push('(lower(title) LIKE ? OR lower(author) LIKE ?)');
    params.push(like, like);
  }

  if (!showAll) {
    conditions.push('status = ?', 'hidden = ?');
    params.push('approved', 0);
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
      res.status(500).json({ error: 'List error' });
    }
  })();
});

// 2. DETALLE
app.get('/api/theses/:id', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM theses WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    const row = rows[0];
    row.keywords = row.keywords ? JSON.parse(row.keywords) : [];
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching thesis' });
  }
});

// 3. EDITAR TESIS (VERSIÓN CON LOGS Y LIMPIEZA DE DATOS)
app.put('/api/theses/:id', authenticateToken, requireRole('coordinator'), upload.fields([{ name: 'pdfFile' }, { name: 'approvalFile' }]), async (req, res) => {
  const id = req.params.id;
  let { title, author, student_id, year, career, abstract, keywords, email, advisor, thesis_date } = req.body || {};
  
  // LIMPIEZA DE DATOS (Trim) para evitar errores por espacios
  if (student_id) student_id = student_id.trim();
  if (email) email = email.trim();

  // --- LOGS PARA DETECTIVES (Mira esto en tu terminal negra) ---
  console.log(`\n--- INTENTO DE EDICIÓN DE TESIS ID: ${id} ---`);
  console.log(`Matrícula recibida: "${student_id}"`);

  const newPdf = req.files && req.files['pdfFile'] ? req.files['pdfFile'][0] : null;
  const newApproval = req.files && req.files['approvalFile'] ? req.files['approvalFile'][0] : null;

  try {
    const pool = getPool();

    // --- VALIDACIÓN DE MATRÍCULA DUPLICADA ---
    if (student_id) {
      // Buscamos si existe la matrícula EN OTRA tesis (id != id actual)
      const [duplicate] = await pool.execute('SELECT id, title FROM theses WHERE student_id = ? AND id != ?', [student_id, id]);
      
      console.log(`Buscando duplicados... Encontrados: ${duplicate.length}`);
      
      if (duplicate.length > 0) {
        console.log(`❌ ALERTA: Matrícula duplicada con la tesis ID: ${duplicate[0].id}`);
        
        // Borrar archivos temporales si se subieron
        if (newPdf && fs.existsSync(newPdf.path)) fs.unlinkSync(newPdf.path);
        if (newApproval && fs.existsSync(newApproval.path)) fs.unlinkSync(newApproval.path);
        
        return res.status(400).json({ error: `La matrícula ${student_id} ya pertenece a otra tesis registrada.` });
      }
    } else {
      console.log("⚠️ OJO: No llegó matrícula en la petición (student_id está vacío).");
    }
    // ---------------------------------------------

    const [rows] = await pool.execute('SELECT * FROM theses WHERE id = ?', [id]);
    const currentThesis = rows && rows[0];
    if (!currentThesis) return res.status(404).json({ error: 'Tesis no encontrada' });

    // --- LÓGICA DE RENOMBRADO ---
    const matriculaFinal = student_id || currentThesis.student_id || 'SIN_MATRICULA';
    const autorFinal = author || currentThesis.author || 'SIN_AUTOR';
    
    const safeMatricula = matriculaFinal.replace(/[^a-z0-9]/gi, '');
    const safeAutor = autorFinal.replace(/[^a-z0-9]/gi, '_');

    const basePdfName = `tesis${safeMatricula}${safeAutor}`;
    const baseAppName = `aprobacion${safeMatricula}${safeAutor}`;

    let finalPdfFilename = currentThesis.pdf_filename;
    let finalAppFilename = currentThesis.approval_filename;

    // A) MANEJO DEL PDF
    if (newPdf) {
      if (currentThesis.pdf_filename) {
        const oldPath = path.join(uploadsDir, currentThesis.pdf_filename);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      const ext = path.extname(newPdf.originalname) || '.pdf';
      const newName = basePdfName + ext;
      fs.renameSync(newPdf.path, path.join(uploadsDir, newName));
      finalPdfFilename = newName;
    } else if (finalPdfFilename) {
      const ext = path.extname(finalPdfFilename);
      const newName = basePdfName + ext;
      if (finalPdfFilename !== newName) {
        const oldPath = path.join(uploadsDir, finalPdfFilename);
        const newPath = path.join(uploadsDir, newName);
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
          finalPdfFilename = newName;
        }
      }
    }

    // B) MANEJO DE APROBACIÓN
    if (newApproval) {
      if (currentThesis.approval_filename) {
        const oldPath = path.join(uploadsDir, currentThesis.approval_filename);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      const ext = path.extname(newApproval.originalname);
      const newName = baseAppName + ext;
      fs.renameSync(newApproval.path, path.join(uploadsDir, newName));
      finalAppFilename = newName;
    } else if (finalAppFilename) {
      const ext = path.extname(finalAppFilename);
      const newName = baseAppName + ext;
      if (finalAppFilename !== newName) {
        const oldPath = path.join(uploadsDir, finalAppFilename);
        const newPath = path.join(uploadsDir, newName);
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
          finalAppFilename = newName;
        }
      }
    }

    let keywordsString = keywords;
    if (Array.isArray(keywords)) keywordsString = JSON.stringify(keywords);

    const query = `
      UPDATE theses 
      SET title = ?, author = ?, student_id = ?, year = ?, career = ?, abstract = ?, keywords = ?, pdf_filename = ?, approval_filename = ?,
          email = ?, advisor = ?, thesis_date = ?
      WHERE id = ?
    `;

    const dateToSave = thesis_date || currentThesis.thesis_date;

    await pool.execute(query, [
      title || currentThesis.title, 
      author || currentThesis.author, 
      student_id || currentThesis.student_id,
      year || currentThesis.year, 
      career || currentThesis.career, 
      abstract || currentThesis.abstract, 
      keywordsString || currentThesis.keywords, 
      finalPdfFilename,
      finalAppFilename,
      email || currentThesis.email,
      advisor || currentThesis.advisor,
      dateToSave,
      id
    ]);

    console.log("✅ Edición exitosa.");
    res.json({ message: 'Actualización exitosa', id });

  } catch (err) {
    console.error('[update] error', err);
    res.status(500).json({ error: 'Error al actualizar' });
  }
});

// 4. SUBIR TESIS (Con Validación de Matrícula y Renombrado)
app.post('/api/upload', authenticateToken, requireRole('coordinator'), upload.fields([{ name: 'pdfFile' }, { name: 'approvalFile' }]), async (req, res) => {
  const body = req.body;
  const pdfFile = req.files['pdfFile']?.[0];
  const approvalFile = req.files['approvalFile']?.[0];

  try {
    if (!pdfFile) return res.status(400).json({ error: 'PDF requerido' });

    // --- VALIDACIÓN DE MATRÍCULA ÚNICA ---
    if (body.studentId) {
      const pool = getPool();
      const [existing] = await pool.execute('SELECT id FROM theses WHERE student_id = ?', [body.studentId]);
      
      if (existing.length > 0) {
        // Limpiar archivos subidos para no dejar basura
        if (fs.existsSync(pdfFile.path)) fs.unlinkSync(pdfFile.path);
        if (approvalFile && fs.existsSync(approvalFile.path)) fs.unlinkSync(approvalFile.path);
        
        return res.status(400).json({ error: `La matrícula ${body.studentId} ya tiene una tesis registrada.` });
      }
    }
    // ---------------------------------------

    const safeMatricula = (body.studentId || 'SIN_MATRICULA').replace(/[^a-z0-9]/gi, '');
    const safeAutor = (body.studentName || 'SIN_AUTOR').replace(/[^a-z0-9]/gi, '_');
    
    const pdfName = `tesis${safeMatricula}${safeAutor}.pdf`;
    fs.renameSync(pdfFile.path, path.join(uploadsDir, pdfName));

    let approvalName = null;
    if (approvalFile) {
      const ext = path.extname(approvalFile.originalname);
      approvalName = `aprobacion${safeMatricula}${safeAutor}${ext}`;
      fs.renameSync(approvalFile.path, path.join(uploadsDir, approvalName));
    }

    const keywords = body.keywords ? JSON.stringify(body.keywords.split(',').map(k => k.trim())) : '[]';
    const pool = getPool();

    const [result] = await pool.execute(
      'INSERT INTO theses (title, author, student_id, email, abstract, advisor, career, year, thesis_date, keywords, status, hidden, downloads, pdf_filename, approval_filename, `fulltext`, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
      [
        body.title || '', body.studentName || '', body.studentId || '', body.email || '',
        body.abstract || '', body.advisor || '', body.career || '',
        parseInt(body.year) || new Date().getFullYear(),
        body.thesis_date || null, keywords, 'approved', 0, 0,
        pdfName, approvalName, '', new Date()
      ]
    );

    res.json({ id: result.insertId });
  } catch (error) {
    // Si falla algo más (ej: BD caída), limpiar también
    if (pdfFile && fs.existsSync(pdfFile.path)) fs.unlinkSync(pdfFile.path);
    if (approvalFile && fs.existsSync(approvalFile.path)) fs.unlinkSync(approvalFile.path);

    console.error('[upload] error', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// 5. Visibilidad
app.post('/api/theses/:id/visibility', authenticateToken, requireRole('coordinator'), async (req, res) => {
  const id = req.params.id;
  const hidden = req.body.hidden ? 1 : 0;
  try {
    const pool = getPool();
    await pool.execute('UPDATE theses SET hidden = ? WHERE id = ?', [hidden, id]);
    res.json({ id, hidden });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// 6. Descargar PDF
app.get('/api/theses/:id/pdf', authenticateToken, async (req, res) => {
  const id = req.params.id;
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT pdf_filename FROM theses WHERE id = ?', [id]);
    if (!rows[0] || !rows[0].pdf_filename) return res.status(404).json({ error: 'Not found' });
    const file = path.join(uploadsDir, rows[0].pdf_filename);
    if (!fs.existsSync(file)) return res.status(404).json({ error: 'Missing' });
    await pool.execute('UPDATE theses SET downloads = downloads + 1 WHERE id = ?', [id]);
    res.sendFile(file);
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// 7. Borrar Tesis
app.delete('/api/theses/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const id = req.params.id;
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT pdf_filename, approval_filename FROM theses WHERE id = ?', [id]);
    const row = rows[0];
    if (row) {
      if (row.pdf_filename) {
        const p = path.join(uploadsDir, row.pdf_filename);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
      if (row.approval_filename) {
        const p = path.join(uploadsDir, row.approval_filename);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
    }
    await pool.execute('DELETE FROM theses WHERE id = ?', [id]);
    res.json({ id });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting' });
  }
});

init().then(() => {
  console.log('[server] DB initialized');
  app.listen(PORT, () => console.log(`Server on port ${PORT}`));
}).catch(err => {
  console.error('[server] DB Fail', err);
  process.exit(1);
});