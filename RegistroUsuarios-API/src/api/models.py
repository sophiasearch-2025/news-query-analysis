from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import List, Optional

# -- MODELOS DE BÚSQUEDA

class NewsHit(BaseModel):
    id: str
    score: float
    source: str
    date: Optional[datetime] = None
    title: str
    content_snippet: Optional[str] = None

class SearchResponse(BaseModel):
    total_hits: int
    page: int
    page_size: int
    total_pages: int
    items: List[NewsHit]

# -- MODELOS DE USUARIO (Sophia-Search)

class UserCreate(BaseModel):
    nombre: str = Field(..., min_length=1, description="Nombre completo del usuario")
    email: EmailStr = Field(..., description="Correo electrónico válido")
    password: str = Field(..., min_length=6, max_length=16, description="Contraseña (entre 6 y 16 caracteres)")

class UserResponse(BaseModel):
    id: int
    nombre: str
    email: EmailStr
    activo: bool
    
    class Config:
        from_attributes = True