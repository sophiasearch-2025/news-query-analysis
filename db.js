const { Client } = require("@elastic/elasticsearch");
require("dotenv").config();

const client = new Client({
  node: process.env.ELASTIC_NODE || "http://localhost:9200",
});

client
  .info()
  .then((response) => console.log(`¡Conectado a Elasticsearch: ${response.name}!`))
  .catch((error) => console.error("Error conectando a Elastic:", error));

module.exports = client;
