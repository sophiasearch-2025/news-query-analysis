from ..clients.elastic_client import ElasticsearchClient, get_elastic_client
from ..api.models import SearchResponse, NewsHit
from fastapi import Depends
import math
from typing import List, Optional

NEWS_INDEX = "news-*"

class SearchService:
    def __init__(self, es_client: ElasticsearchClient):
        self.es_client = es_client

    async def search(self, q: Optional[str], media_list: Optional[List[str]], date_from: Optional[str], date_to: Optional[str], page: int, page_size: int) -> SearchResponse:
        from_offset = (page - 1) * page_size
        query_body = {
            "from": from_offset,
            "size": page_size,
            "query": {
                "bool": {
                    "must": [],
                    "filter": []
                }
            },
            "highlight": {
                "fields": {"content": {}},
                "pre_tags": ["<strong>"],
                "post_tags": ["</strong>"]
            }
        }

        if q:
            query_body["query"]["bool"]["must"].append(
                {
                    "multi_match": {
                        "query": q,
                        "fields": ["title", "content"],
                        "fuzziness": "AUTO"
                    }
                }
            )
        else:
            query_body["query"]["bool"]["must"].append({"match_all": {}})
            query_body["sort"] = [{"date": "desc"}]

        date_range_filter = {"range": {"date": {}}}
        if date_from:
            date_range_filter["range"]["date"]["gte"] = date_from
        if date_to:
            date_range_filter["range"]["date"]["lte"] = date_to
        if date_from or date_to:
            query_body["query"]["bool"]["filter"].append(date_range_filter)

        if media_list:
            query_body["query"]["bool"]["filter"].append(
                {
                    "terms": {
                        "source.keyword": media_list
                    }
                }
            )

        response = await self.es_client.search(
            index=NEWS_INDEX,
            body=query_body
        )

        hits = response.get("hits", {}).get("hits", [])
        total_hits = response.get("hits", {}).get("total", {}).get("value", 0)

        formatted_items = []
        for hit in hits:
            source = hit.get("_source", {})
            snippet = "No snippet available."
            if "highlight" in hit and "content" in hit["highlight"]:
                snippet = " ... ".join(hit["highlight"]["content"])
            elif source.get("content"):
                snippet = source.get("content")[:200] + "..."

            formatted_items.append(
                NewsHit(
                    id=hit.get("_id"),
                    score=hit.get("_score") or 0.0,
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

async def get_search_service(
    es_client: ElasticsearchClient = Depends(get_elastic_client)
) -> SearchService:
    return SearchService(es_client)