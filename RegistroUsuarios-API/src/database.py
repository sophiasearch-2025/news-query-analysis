from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .db_models import usuario

SQLALCHEMY_DATABASE_URL = "postgresql://sophia:sophia_password@localhost:5432/sophia_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
def create_tables():
    print("Creando tablas en la base de datos si no existen...")
    Base.metadata.create_all(bind=engine)
    print("Tablas creadas.")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()