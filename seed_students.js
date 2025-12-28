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
// Agrega aquí a los alumnos manualmente cuando quieras registrarlos en la BD
const students = [
  { matricula: '11111', curp: 'CURP111', email: 'alumno1@fasbit.local' },
  { matricula: '22222', curp: 'CURP222', email: 'alumno2@fasbit.local' },
  { matricula: '183204', curp: 'VICOAX667900', email: 'victor@hotmail.com' },
];
// -----------------------------------

async function seed() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('Conectado a la base de datos.');

    for (const s of students) {
      // 1. Encriptamos la CURP para que sea la contraseña segura
      const hash = bcrypt.hashSync(s.curp, 10);
      
      // 2. Insertamos o actualizamos si ya existe
      // El rol se define automáticamente como 'student'
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
    if (connection) connection.end();
  }
}

seed();