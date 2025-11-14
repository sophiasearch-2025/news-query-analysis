import uvicorn
from fastapi import FastAPI
from src.api import parametros  # Tus rutas de búsqueda de noticias
from src.api import users       # <--- TUS NUEVAS RUTAS DE USUARIOS
from src.database import create_tables

create_tables()

app = FastAPI(
    title="API Sophia-Search",
    description="Subsistema de Consultas y Gestión de Usuarios (Equipo 6)",
    version="1.0.0"
)

# --- 1. Rutas de Búsqueda (Lo que ya tenías) ---
app.include_router(
    parametros.router, 
    prefix="/api/v1"
)

# --- 2. Rutas de Usuarios (Lo NUEVO) ---
app.include_router(
    users.router, 
    prefix="/api/v1"
)

@app.get("/health", tags=["Monitoring"])
def health_check():
    """Verifica que la API esté viva."""
    return {"status": "ok", "system": "Sophia-Search API"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)