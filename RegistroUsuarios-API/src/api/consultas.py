from src.clients.elastic_client import ElasticsearchClient, get_elastic_client
from src.api.models import SearchResponse, NewsHit
from fastapi import Depends
import math

# El índice a consultar. Usamos un wildcard como se decidió en PA-08 [cite: 97-101]
NEWS_INDEX = "news-*" 

class SearchService:
    def __init__(self, es_client: ElasticsearchClient):
        self.es_client = es_client

    async def search(self, q, media_list, date_from, date_to, page, page_size) -> SearchResponse:
        
        # 1. Calcular paginación
        from_offset = (page - 1) * page_size
        
        # 2. Construir la consulta de Elasticsearch
        query_body = {
            "from": from_offset,
            "size": page_size,
            "query": {
                "bool": {
                    "must": [], # Consultas que *deben* coincidir (afectan puntaje)
                    "filter": [] # Filtros exactos (no afectan puntaje, más rápidos)
                }
            },
            "highlight": { # Para generar el "content_snippet"
                "fields": {"content": {}},
                "pre_tags": ["<strong>"],
                "post_tags": ["</strong>"]
            }
        }

        # --- Lógica de Filtros ---

        # A. Filtro por Palabras Clave (q)
        if q:
            query_body["query"]["bool"]["must"].append(
                {
                    "multi_match": {
                        "query": q,
                        "fields": ["title", "content"], # Buscar en título y contenido
                        "fuzziness": "AUTO" # Permite pequeñas erratas
                    }
                }
            )
        else:
            # Si no hay 'q', mostrar todo, ordenado por fecha
            query_body["query"]["bool"]["must"].append({"match_all": {}})
            query_body["sort"] = [{"date": "desc"}] # Asumiendo un campo 'date'

        # B. Filtro por Fechas (date_from, date_to)
        date_range_filter = {"range": {"date": {}}}
        if date_from:
            date_range_filter["range"]["date"]["gte"] = date_from
        if date_to:
            date_range_filter["range"]["date"]["lte"] = date_to
        
        # Solo añadir el filtro si se especificó al menos una fecha
        if date_from or date_to:
            query_body["query"]["bool"]["filter"].append(date_range_filter)

        # C. Filtro por Medios (media_list)
        if media_list:
            # Usar 'source.keyword' para coincidencias exactas (Decisión PA-02) [cite: 49]
            query_body["query"]["bool"]["filter"].append(
                {
                    "terms": {
                        "source.keyword": media_list 
                    }
                }
            )

        # 3. Ejecutar la consulta
        response = await self.es_client.search(
            index=NEWS_INDEX,
            body=query_body
        )

        # 4. Formatear la respuesta
        hits = response.get("hits", {}).get("hits", [])
        total_hits = response.get("hits", {}).get("total", {}).get("value", 0)

        formatted_items = []
        for hit in hits:
            source = hit.get("_source", {})
            # Usar el 'highlight' si existe, sino un recorte del contenido
            snippet = "No snippet available."
            if "highlight" in hit and "content" in hit["highlight"]:
                snippet = " ... ".join(hit["highlight"]["content"])
            elif source.get("content"):
                snippet = source.get("content")[:200] + "..." # Recorte manual

            formatted_items.append(
                NewsHit(
                    id=hit.get("_id"),
                    score=hit.get("_score"),
                    source=source.get("source", "Unknown Source"),
                    date=source.get("date"),
                    title=source.get("title", "No Title"),
                    content_snippet=snippet
                )
            )

        return SearchResponse(
            total_hits=total_hits,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total_hits / page_size),
            items=formatted_items
        )

# --- Para inyección de dependencias ---
async def get_search_service(
    es_client: ElasticsearchClient = Depends(get_elastic_client)
) -> SearchService:
    return SearchService(es_client)