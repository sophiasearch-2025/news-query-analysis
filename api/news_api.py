from fastapi import FastAPI, HTTPException, Query
from elasticsearch import Elasticsearch

app = FastAPI(title="Sophia Search API")

# Conexión a ElasticSearch
es = Elasticsearch(hosts=["http://localhost:9200"])

INDEX_NAME = "noticias"  # índice donde están los documentos

@app.get("/search")
def search_news(q: str = Query(..., min_length=1), size: int = 10):
    """
    Buscar noticias en ElasticSearch por texto completo.
    Parámetros:
    - q: texto a buscar
    - size: número máximo de resultados (default 10)
    """
    if not es.ping():
        raise HTTPException(status_code=500, detail="ElasticSearch no disponible")

    try:
        query = {
            "query": {
                "multi_match": {
                    "query": q,
                    "fields": ["title", "text", "media_outlet"]
                }
            },
            "size": size
        }
        res = es.search(index=INDEX_NAME, body=query)
        hits = [hit["_source"] for hit in res["hits"]["hits"]]
        return {"results": hits, "total": res["hits"]["total"]["value"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
