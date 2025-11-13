from fastapi import APIRouter, Query, Depends
from typing import List, Optional
from src.api.models import SearchResponse
from ..services.search_service import SearchService, get_search_service

router = APIRouter()

@router.get("/search/", response_model=SearchResponse)
async def search_news(
    q: Optional[str] = Query(None, description="Palabras clave de búsqueda"),
    media: Optional[List[str]] = Query(None, description="Filtrar por lista de medios"),
    date_from: Optional[str] = Query(None, description="Fecha de inicio (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Fecha de fin (YYYY-MM-DD)"),
    page: int = Query(1, gt=0, description="Número de página"),
    page_size: int = Query(20, gt=0, le=100, description="Resultados por página"),
    # Inyectar el servicio que tiene la lógica
    service: SearchService = Depends(get_search_service)
):
    """
    Endpoint principal para búsqueda de noticias con filtros.
    """
    return await service.search(
        q=q,
        media_list=media,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size
    )