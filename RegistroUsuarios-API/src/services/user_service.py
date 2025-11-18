from passlib.context import CryptContext
from sqlalchemy.orm import Session 
from src.api.models import UserCreate


from src.db_models.usuario import Usuario 

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

class UserService:
    
    def get_password_hash(self, password: str) -> str:
        """Convierte texto plano a hash seguro."""
        print(f"DEBUG: Password recibido: '{password}' - Largo: {len(password)}")
        return pwd_context.hash(password)

    async def create_user(self, db: Session, user_in: UserCreate):
        
        usuario_existente = db.query(Usuario).filter(Usuario.email == user_in.email).first()
        if usuario_existente:
            raise ValueError("El email ya está registrado")

        hashed_password = self.get_password_hash(user_in.password)

        db_user = Usuario(
            nombre=user_in.nombre,
            email=user_in.email,
            password_hash=hashed_password,
            rol="demo" 
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        print(f"Usuario guardado: {db_user.nombre}")

        return db_user