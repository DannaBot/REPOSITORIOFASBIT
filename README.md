FASBIT — Instrucciones para terminar e instalar

Resumen
- Frontend: Vite + React (carpeta `src/`)
- Backend: Node/Express (carpeta `server/`) usando MySQL

Cambios aplicados por el asistente
- Frontend `auth` y `Upload` ahora usan `VITE_API_URL` (si no está definido, usa `http://localhost:4000`).
- Agregado `server/.env.example` con variables MySQL/JWT.
- Agregado script `start:server` en `package.json` para ejecutar el servidor Node.

Pasos que yo (asistente) hice localmente en el repo
1. Actualicé `src/lib/auth.js` para leer `VITE_API_URL`.
2. Actualicé `src/pages/Upload.jsx` para usar `VITE_API_URL`.
3. Añadí `server/.env.example`.
4. Añadí `start:server` en `package.json`.

Requisitos locales que debes completar en tu entorno (XAMPP + Apache + MySQL)
1. Instalar Node.js (requerido para ejecutar el servidor Node y el dev server de Vite).
2. Crear la base de datos MySQL. Por ejemplo desde phpMyAdmin o linea de comandos:

   CREATE DATABASE fasbit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

3. Opcionalmente crear un usuario MySQL y otorgar permisos, o usar `root`:

   CREATE USER 'fasbit_user'@'localhost' IDENTIFIED BY 'tu_password';
   GRANT ALL PRIVILEGES ON fasbit.* TO 'fasbit_user'@'localhost';
   FLUSH PRIVILEGES;

4. Copiar `server/.env.example` a `server/.env` y ajustar `MYSQL_USER`, `MYSQL_PASSWORD` y `JWT_SECRET`.
5. Desde un terminal en la raíz del proyecto ejecutar:

   npm install
   cd server
   npm install

6. Iniciar el servidor Node (que se conecta a la base MySQL de XAMPP):

   # en la raíz del repo
   npm run start:server

   # en otro terminal iniciar el frontend dev
   npm run dev

7. Alternativa: despliegue del frontend en Apache (XAMPP)
- Ejecuta `npm run build` para generar los archivos estáticos.
- Copia la carpeta `dist/` resultante a tu `htdocs/` (por ejemplo `C:/xampp/htdocs/fasbit`) y configura Apache o accesos según necesites. Asegúrate que `VITE_API_URL` apunte al servidor Node (por ejemplo `http://localhost:4000`).

Tareas que NO puedo hacer desde aquí (tú debes realizar)
- Instalar Node.js en tu máquina.
- Configurar XAMPP/Apache para servir la carpeta `dist/` si quieres usar Apache para el frontend.
- Crear la base de datos MySQL en tu XAMPP y proporcionar credenciales seguras.
- Colocar el archivo `server/.env` con tus credenciales privadas y `JWT_SECRET`.
- Ejecutar los comandos `npm install` y `npm run start:server` en tu entorno local (aunque te puedo guiar paso a paso).

Verificaciones y pruebas recomendadas
1. Con la DB creada y `server/.env` configurado, inicia el servidor: `npm run start:server`.
2. Verifica en la consola que se seeded el admin: `admin@fasbit.local / admin123` (puedes cambiar la contraseña luego).
3. Inicia el frontend `npm run dev` y abre `http://localhost:3000` (o la URL que indique Vite).
4. Prueba el flujo de subida (Upload) y descarga de PDFs.

Si quieres, puedo:
- Añadir más validaciones y mensajes en el servidor.
- Convertir el backend para correr bajo PHP/Apache en lugar de Node (esto requiere reescribir endpoints y es trabajo mayor).
- Crear scripts automatizados para crear la base de datos y usuarios MySQL.

¿Qué deseas que haga ahora? (p. ej. generar `server/.env` con valores de ejemplo, agregar scripts de migración SQL, o adaptar el backend a PHP/Apache).