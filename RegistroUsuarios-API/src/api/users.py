from fastapi import APIRouter, HTTPException, status, Depends 
from sqlalchemy.orm import Session
from src.api.models import UserCreate, UserResponse
from src.services.user_service import UserService

from src.database import get_db 

router = APIRouter(
    prefix="/users",
    tags=["Sophia-Search Accounts"]
)

user_service = UserService()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)

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
        
        new_user = await user_service.create_user(db=db, user_in=user_data)
        
        return new_user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))