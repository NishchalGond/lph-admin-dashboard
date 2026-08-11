import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DEFAULT_EASYPANEL_DB = "postgresql://lph_admin:p09uhqnei5x9c9apugp7@76.13.185.191:5432/lph_data"

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_EASYPANEL_DB)

# Ensure postgresql:// driver compatibility
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Configure engine parameters depending on DB type
is_sqlite = "sqlite" in SQLALCHEMY_DATABASE_URL
engine_args = {"connect_args": {"check_same_thread": False}} if is_sqlite else {"pool_pre_ping": True, "pool_size": 10, "max_overflow": 20}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    **engine_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
