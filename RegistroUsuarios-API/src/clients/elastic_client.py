import os
from elasticsearch import AsyncElasticsearch

# 1. Configuración
# Intenta leer la variable de entorno definida en tu plan,
# si no existe, usa localhost por defecto para desarrollo local.
ELASTICSEARCH_URL = os.getenv("ELASTICSEARCH_HOST", "http://localhost:9200")

# 2. Cliente Global
# Creamos una única instancia del cliente para reutilizar la conexión (pool de conexiones).
es_client = AsyncElasticsearch(hosts=[ELASTICSEARCH_URL])

# Alias para que coincida con las sugerencias de tipo si las usas
ElasticsearchClient = AsyncElasticsearch

# 3. Dependencia para FastAPI
async def get_elastic_client() -> AsyncElasticsearch:
    """
    Función generadora que FastAPI usará para inyectar el cliente
    en tus rutas o servicios.
    """
    # En un escenario más complejo, aquí podrías verificar si la conexión está activa
    return es_client

# 4. Función para cerrar conexiones (opcional pero recomendada para el shutdown)
async def close_elastic_client():
    await es_client.close()