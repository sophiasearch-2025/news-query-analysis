# 1. IMPORTA 'Depends'
from fastapi import APIRouter, HTTPException, status, Depends 
from sqlalchemy.orm import Session
from src.api.models import UserCreate, UserResponse
from src.services.user_service import UserService

# 2. IMPORTACIÓN LIMPIA 
from src.database import get_db 

router = APIRouter(
    prefix="/users",
    tags=["Sophia-Search Accounts"]
)

user_service = UserService()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
# 3. AÑADE LA INYECCIÓN DE DEPENDENCIA 'db' AQUÍ
async def create_sophia_account(
    user_data: UserCreate, 
    db: Session = Depends(get_db) 
):
    """
    API para crear una cuenta en Sophia-Search.
    Recibe: Nombre, Email, Password.
    Valida: Formato de email y longitud de contraseña.
    """
    try:
        # 4. PASA LA 'db' AL SERVICIO
        new_user = await user_service.create_user(db=db, user_in=user_data)
        
        return new_user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))