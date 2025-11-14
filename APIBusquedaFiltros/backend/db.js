// backend/db.js
const { Pool } = require('pg');
require('dotenv').config();

// Configuración de la conexión usando env
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Mensaje de éxito al conectar
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error al conectar con PostgreSQL:', err.stack);
  }
  console.log('Conexión a PostgreSQL establecida exitosamente.');
  client.release();
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};