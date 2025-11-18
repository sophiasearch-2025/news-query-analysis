import asyncio
import pandas as pd
from elasticsearch import AsyncElasticsearch, helpers
import os
from datetime import datetime

# --- Configuración ---
ES_HOST = "http://localhost:9200"
INDEX_NAME = "news-2025-11"
CSV_PATH = os.path.join("data", "dataset_prueba.csv")

async def load_csv_data():
    print(f"📂 Leyendo archivo desde: {CSV_PATH}...")
    try:
        df = pd.read_csv(CSV_PATH)
        print(f"📊 Noticias encontradas en el CSV: {len(df)}")
    except FileNotFoundError:
        print(f"❌ Error: No se encontró el archivo en 'data/dataset_prueba.csv'")
        return

    # --- LIMPIEZA ---
    # Convertir fechas. Si falla, pone NaT (Not a Time)
    df['date'] = pd.to_datetime(df['date'], format='mixed', errors='coerce')
    df = df.fillna("") # Rellenar vacíos

    client = AsyncElasticsearch(hosts=[ES_HOST])

    # --- DEFINICIÓN DEL ESQUEMA (MAPPING) ---
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
                "category": {"type": "keyword"},
                "country": {"type": "keyword"},
                "url": {"type": "keyword"}
            }
        }
    }

    async def generate_actions():
        for _, row in df.iterrows():
            # Asegurar formato ISO válido para la fecha
            if pd.notnull(row['date']):
                fecha_str = row['date'].isoformat()
            else:
                fecha_str = datetime.now().isoformat() # Fecha actual si viene vacía

            doc = {
                "title":    row.get("title", "Sin título"),
                "content":  row.get("text", ""),
                "source":   row.get("media_outlet", "Desconocido"),
                "date":     fecha_str,
                "category": "General",
                "country":  row.get("country", ""),
                "url":      row.get("url", "")
            }

            yield {
                "_index": INDEX_NAME,
                "_source": doc
            }

    print("🚀 Reiniciando índice con la configuración correcta...")
    try:
        # 1. Borrar índice viejo
        if await client.indices.exists(index=INDEX_NAME):
             await client.indices.delete(index=INDEX_NAME)
             print("🗑️  Índice anterior borrado.")
        
        # 2. Crear índice nuevo CON EL MAPA CORRECTO
        await client.indices.create(index=INDEX_NAME, body=mapping)
        print("🆕 Índice creado con soporte para fechas.")

        # 3. Insertar datos
        success, failed = await helpers.async_bulk(client, generate_actions())
        print(f"✨ ¡Carga completada! Insertados: {success}, Fallidos: {len(failed)}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(load_csv_data())