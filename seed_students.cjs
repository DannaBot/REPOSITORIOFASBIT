const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Configuración de tu BD
const config = {
  host: 'localhost',
  user: 'root',
  password: '', // Tu contraseña de MySQL
  database: 'fasbit'
};

// --- LISTA DE ALUMNOS A INSERTAR ---
const students = [
  { matricula: '11111', curp: 'CURP111', email: 'alumno1@fasbit.local' },
  { matricula: '22222', curp: 'CURP222', email: 'alumno2@fasbit.local' },
  { matricula: '183204', curp: 'HECTOR123', email: 'hector@fasbit.local' },
];
// -----------------------------------

async function seed() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('Conectado a la base de datos.');

    // --- PASO DE SEGURIDAD: Crear la columna si no existe ---
    try {
      await connection.execute(`ALTER TABLE users ADD COLUMN student_id VARCHAR(255) UNIQUE`);
      console.log('✅ Columna "student_id" creada correctamente.');
    } catch (e) {
      // Si el error es 1060 (Duplicate column name), significa que ya existe, así que ignoramos.
      if (e.errno !== 1060) {
        console.log('Nota sobre la columna:', e.message);
      }
    }
    // --------------------------------------------------------

    for (const s of students) {
      const hash = bcrypt.hashSync(s.curp, 10);
      
      const sql = `
        INSERT INTO users (email, student_id, password_hash, role, created_at)
        VALUES (?, ?, ?, 'student', NOW())
        ON DUPLICATE KEY UPDATE password_hash = ?
      `;
      
      await connection.execute(sql, [s.email, s.matricula, hash, hash]);
      console.log(`Usuario procesado: ${s.matricula} (Pass: ${s.curp})`);
    }

    console.log('¡Carga de alumnos completada!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) await connection.end();
  }
}

seed();