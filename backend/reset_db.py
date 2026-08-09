import hashlib
from sqlalchemy import text
from app.core.database import SessionLocal, engine, Base
from app.db.models import User, BatchInfo, SourceFile, ConsolidatedRecord, ProcessingLog, DuplicateRecord, WorkflowRun, WorkflowStep, UserRole

def get_password_hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def reset_db():
    print("Clearing all data tables (batches, files, records, logs, workflow runs, FTS indexes)...")
    db = SessionLocal()
    
    try:
        # Drop FTS triggers to prevent delete errors
        db.execute(text("DROP TRIGGER IF EXISTS consolidated_records_ai;"))
        db.execute(text("DROP TRIGGER IF EXISTS consolidated_records_ad;"))
        db.execute(text("DROP TRIGGER IF EXISTS consolidated_records_au;"))
        db.execute(text("DROP TABLE IF EXISTS consolidated_records_fts;"))
        db.commit()

        # Delete data in order of foreign key constraints
        db.query(DuplicateRecord).delete()
        db.query(ConsolidatedRecord).delete()
        db.query(ProcessingLog).delete()
        db.query(SourceFile).delete()
        db.query(BatchInfo).delete()
        db.query(WorkflowStep).delete()
        db.query(WorkflowRun).delete()
        db.commit()
        print("[OK] All data tables cleared successfully!")

        # Recreate FTS5 virtual table & triggers for empty database
        db.execute(text("""
            CREATE VIRTUAL TABLE IF NOT EXISTS consolidated_records_fts USING fts5(
                id UNINDEXED,
                community,
                sub_community,
                building_cluster,
                project,
                developer,
                name,
                customer_name,
                unit_number,
                property_type,
                tokenize='unicode61'
            );
        """))
        db.execute(text("""
            CREATE TRIGGER IF NOT EXISTS consolidated_records_ai AFTER INSERT ON consolidated_records BEGIN
                INSERT INTO consolidated_records_fts(
                    rowid, id, community, sub_community, building_cluster, project, developer, name, customer_name, unit_number, property_type
                ) VALUES (
                    new.id, new.id, new.community, new.sub_community, new.building_cluster, new.project, new.developer, new.name, new.customer_name, new.unit_number, new.property_type
                );
            END;
        """))
        db.execute(text("""
            CREATE TRIGGER IF NOT EXISTS consolidated_records_ad AFTER DELETE ON consolidated_records BEGIN
                INSERT INTO consolidated_records_fts(consolidated_records_fts, rowid, id, community, sub_community, building_cluster, project, developer, name, customer_name, unit_number, property_type)
                VALUES('delete', old.id, old.id, old.community, old.sub_community, old.building_cluster, old.project, old.developer, old.name, old.customer_name, old.unit_number, old.property_type);
            END;
        """))
        db.execute(text("""
            CREATE TRIGGER IF NOT EXISTS consolidated_records_au AFTER UPDATE ON consolidated_records BEGIN
                INSERT INTO consolidated_records_fts(consolidated_records_fts, rowid, id, community, sub_community, building_cluster, project, developer, name, customer_name, unit_number, property_type)
                VALUES('delete', old.id, old.id, old.community, old.sub_community, old.building_cluster, old.project, old.developer, old.name, old.customer_name, old.unit_number, old.property_type);
                INSERT INTO consolidated_records_fts(rowid, id, community, sub_community, building_cluster, project, developer, name, customer_name, unit_number, property_type)
                VALUES (new.id, new.id, new.community, new.sub_community, new.building_cluster, new.project, new.developer, new.name, new.customer_name, new.unit_number, new.property_type);
            END;
        """))
        db.commit()

        # Ensure essential user accounts exist
        user_count = db.query(User).count()
        if user_count == 0:
            print("Re-creating standard user accounts...")
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
            print("[OK] Standard user accounts created.")
        else:
            print(f"[OK] Preserved {user_count} existing user account(s).")
            
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error during database reset: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_db()
