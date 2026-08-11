import psycopg2
from app.core.database import engine, Base, SessionLocal
from sqlalchemy import text

print("Connecting to Easypanel PostgreSQL database...")

db = SessionLocal()
try:
    print("Wiping all existing tables, n8n batches, and records from Easypanel PostgreSQL...")
    db.execute(text("TRUNCATE TABLE consolidated_records, batch_info, source_files, processing_logs, duplicate_records, workflow_runs, workflow_steps RESTART IDENTITY CASCADE;"))
    db.commit()
    print("[SUCCESS] All old data, old n8n Google Sheet records, and old batches have been PERMANENTLY WIPED from Easypanel PostgreSQL!")
except Exception as e:
    db.rollback()
    print(f"[NOTE] Truncate note (recreating tables): {e}")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("[SUCCESS] Tables recreated clean!")
finally:
    db.close()
