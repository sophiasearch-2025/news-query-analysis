import asyncio
from elasticsearch import AsyncElasticsearch, BadRequestError
from datetime import datetime

# --- Configuración ---
ES_HOST = "http://localhost:9200"
INDEX_NAME = "news-2025-11"

# --- Datos de Prueba ---
DUMMY_NEWS = [
    {
        "title": "Gobierno anuncia nuevas medidas económicas para 2026",
        "content": "El ministro de hacienda presentó hoy un paquete de medidas orientadas a reactivar la inversión y controlar la inflación. Se espera un crecimiento del 3% para el próximo año.",
        "source": "El Mercurio",
        "date": "2025-11-05T10:30:00",
        "category": "Economía"
    },
    {
        "title": "Colo Colo gana el superclásico en el último minuto",
        "content": "Con un gol agónico en los descuentos, los albos se impusieron a la Universidad de Chile en un estadio Monumental repleto. El partido estuvo marcado por la intensidad.",
        "source": "BioBio",
        "date": "2025-11-02T18:45:00",
        "category": "Deportes"
    },
    {
        "title": "Ola de calor afectará a la zona central este fin de semana",
        "content": "Meteorología advierte sobre temperaturas que podrían superar los 34 grados en los valles interiores. Se recomienda evitar exposición al sol en horas punta.",
        "source": "CNN Chile",
        "date": "2025-11-08T09:00:00",
        "category": "Nacional"
    },
    {
        "title": "Avance tecnológico: Chile inaugurará su primera planta de hidrógeno verde",
        "content": "La planta ubicada en Magallanes promete ser pionera en la región. Autoridades destacan el potencial exportador de esta nueva energía limpia.",
        "source": "El Mercurio",
        "date": "2025-10-28T14:20:00",
        "category": "Tecnología"
    },
    {
        "title": "Protestas en el centro de Santiago por reforma de pensiones",
        "content": "Diversas agrupaciones sociales se manifestaron en la Alameda exigiendo cambios al sistema actual. El tránsito se vio interrumpido por varias horas.",
        "source": "BioBio",
        "date": "2025-11-07T11:15:00",
        "category": "Nacional"
    }
]

async def load_data():
    # Usamos 'async with' para manejar la conexión automáticamente
    async with AsyncElasticsearch(hosts=[ES_HOST]) as client:
        print(f"📡 Conectando a {ES_HOST}...")

        # 1. Intentar eliminar el índice si existe (ignorando si no existe)
        try:
            await client.indices.delete(index=INDEX_NAME, ignore_unavailable=True)
            print(f"🗑️ Índice '{INDEX_NAME}' listo para ser creado.")
        except Exception as e:
            print(f"⚠️ Advertencia al intentar limpiar índice: {e}")

        # 2. Definir el MAPPING
        mapping = {
            "mappings": {
                "properties": {
                    "date": {"type": "date"},
                    "source": {
                        "type": "text",
                        "fields": {"keyword": {"type": "keyword"}}
                    },
                    "title": {"type": "text", "analyzer": "standard"},
                    "content": {"type": "text", "analyzer": "standard"},
                    "category": {"type": "keyword"}
                }
            }
        }

        # 3. Crear el índice
        try:
            await client.indices.create(index=INDEX_NAME, body=mapping)
            print(f"🆕 Índice '{INDEX_NAME}' creado correctamente.")
        except BadRequestError as e:
             print(f"❌ Error creando índice: {e.message}")
             print("   (Verifica que Elasticsearch esté vacío o corriendo correctamente)")
             return

        # 4. Insertar los documentos
        print("🚀 Insertando noticias...")
        for news in DUMMY_NEWS:
            await client.index(index=INDEX_NAME, document=news)
            print(f"   ✅ Noticia insertada: {news['title'][:30]}...")

        # 5. Forzar actualización
        await client.indices.refresh(index=INDEX_NAME)
        print("\n✨ ¡Carga de datos completada! ✨")

if __name__ == "__main__":
    # Desactivar verificaciones SSL/TLS si dan problemas en local
    # (Solo si es estrictamente necesario, por ahora probamos sin esto)
    asyncio.run(load_data())