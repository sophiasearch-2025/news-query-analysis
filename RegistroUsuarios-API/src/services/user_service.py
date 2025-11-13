from passlib.context import CryptContext
from sqlalchemy.orm import Session 
from src.api.models import UserCreate

# 1. IMPORTACIÓN LIMPIA

from src.db_models.usuario import Usuario 

# Configuración para encriptar contraseñas (Hashing)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

class UserService:
    
    def get_password_hash(self, password: str) -> str:
        """Convierte texto plano a hash seguro."""
        print(f"DEBUG: Password recibido: '{password}' - Largo: {len(password)}")
        return pwd_context.hash(password)

    async def create_user(self, db: Session, user_in: UserCreate):
        
        # VALIDACIÓN T6 (UNICIDAD) 
        usuario_existente = db.query(Usuario).filter(Usuario.email == user_in.email).first()
        if usuario_existente:
            raise ValueError("El email ya está registrado")

        # Hashear la contraseña 
        hashed_password = self.get_password_hash(user_in.password)

        # CREAR EL OBJETO 'Usuario' DE LA BD (T2)
        # (¡Recuerda cambiar 'full_name' a 'nombre' en 'src/api/models.py'
        # para que esta línea sea 100% correcta!)
        db_user = Usuario(
            nombre=user_in.nombre,
            email=user_in.email,
            password_hash=hashed_password,
            rol="demo" 
        )

        # GUARDAR EN LA BASE DE DATOS 
        db.add(db_user)
        db.commit()
        db.refresh(db_user) # Para obtener el ID creado por la BD

        # Retornar el objeto de la BD
        # FastAPI lo convertirá a UserResponse gracias al 'response_model'
        return db_user