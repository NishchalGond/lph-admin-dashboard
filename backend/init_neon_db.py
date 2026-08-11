import hashlib
from sqlalchemy import text
from app.core.database import SessionLocal, engine, Base
from app.db.models import User, BatchInfo, SourceFile, ConsolidatedRecord, ProcessingLog, DuplicateRecord, WorkflowRun, WorkflowStep, UserRole

def get_password_hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def init_neon_database():
    print("Connecting to Neon PostgreSQL database...")
    print(f"Engine URL: {engine.url.render_as_string(hide_password=True)}")
    
    # 1. Recreate all tables defined in SQLAlchemy models
    print("Recreating tables on Easypanel PostgreSQL...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("[OK] All tables created successfully!")

    # Enable pg_trgm for fast text search
    db = SessionLocal()
    try:
        print("Enabling pg_trgm extension and creating GIN index for fast search...")
        db.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm;"))
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_consolidated_trgm 
            ON consolidated_records 
            USING gin (
                (COALESCE(name, '') || ' ' || COALESCE(community, '') || ' ' || COALESCE(building_cluster, '') || ' ' || COALESCE(developer, '') || ' ' || COALESCE(unit_number, '')) gin_trgm_ops
            );
        """))
        db.commit()
        print("[OK] GIN trigram index created successfully!")
    except Exception as ex:
        db.rollback()
        print(f"[NOTE] Trigram index note: {ex}")
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            print("Seeding standard user accounts...")
            admin_user = User(
                username="admin",
                email="admin@enterprise.com",
                hashed_password=get_password_hash("admin123"),
                full_name="System Administrator",
                role=UserRole.ADMIN.value
            )
            ceo_user = User(
                username="ceo",
                email="ceo@enterprise.com",
                hashed_password=get_password_hash("ceo123"),
                full_name="Chief Executive Officer",
                role=UserRole.CEO.value
            )
            marketing_user = User(
                username="marketing",
                email="marketing@enterprise.com",
                hashed_password=get_password_hash("marketing123"),
                full_name="Marketing Lead",
                role=UserRole.MARKETING.value
            )
            dev_user = User(
                username="developer",
                email="dev@enterprise.com",
                hashed_password=get_password_hash("dev123"),
                full_name="Lead Developer",
                role=UserRole.DEVELOPER.value
            )
            db.add_all([admin_user, ceo_user, marketing_user, dev_user])
            db.commit()
            print("[OK] Standard user accounts created on Neon PostgreSQL!")
        else:
            print(f"[OK] Found {user_count} existing user account(s) in Neon database.")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error during user seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_neon_database()
