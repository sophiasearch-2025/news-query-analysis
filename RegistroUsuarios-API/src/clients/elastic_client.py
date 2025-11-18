import os
from elasticsearch import AsyncElasticsearch

# 1. Configuración
# Intenta leer la variable de entorno definida,
# si no existe, usa localhost por defecto para desarrollo local.
ELASTICSEARCH_URL = os.getenv("ELASTICSEARCH_HOST", "http://localhost:9200")

# 2. Cliente Global
# Creamos una única instancia del cliente para reutilizar la conexión (pool de conexiones).
es_client = AsyncElasticsearch(hosts=[ELASTICSEARCH_URL])

# Alias para que coincida con las sugerencias de tipo
ElasticsearchClient = AsyncElasticsearch

# 3. Dependencia para FastAPI
async def get_elastic_client() -> AsyncElasticsearch:
    
    return es_client

# 4. Función para cerrar conexiones 
async def close_elastic_client():
    await es_client.close()