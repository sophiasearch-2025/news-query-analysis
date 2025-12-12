// backend/db.js
const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

// Inicialización del cliente de Elasticsearch
const client = new Client({
  node: process.env.ELASTIC_NODE || 'http://localhost:9200',
  // Configuración de autenticación (ejemplo de X-Pack security)
  /*
  auth: {
    username: process.env.ELASTIC_USERNAME,
    password: process.env.ELASTIC_PASSWORD
  }
  */
});

// Verificación asíncrona de la conexión e impresión de estado en consola
client.info()
  .then(response => console.log(`✅ Conectado a Elasticsearch: ${response.name}`))
  .catch(error => console.error('❌ Error conectando a Elasticsearch:', error));

// Exporta la instancia del cliente para ser usada por el servidor Express
module.exports = client;