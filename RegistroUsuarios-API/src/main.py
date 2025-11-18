import uvicorn
from fastapi import FastAPI
from src.api import parametros, users
from fastapi.middleware.cors import CORSMiddleware  

app = FastAPI(
    title="API Sophia-Search",
    description="H5 Equipo",
    version="1.0.0"
)

origins = [
    "http://localhost",
    "http://localhost:3000", 
    "http://localhost:3001",
    "http://localhost:5173", 
    "http://127.0.0.1:5500"   
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      
    allow_credentials=True,
    allow_methods=["*"],        
    allow_headers=["*"],         
)


app.include_router(parametros.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")

@app.get("/health", tags=["Monitoring"])
def health_check():
    return {"status": "ok", "system": "Sophia-Search API"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)