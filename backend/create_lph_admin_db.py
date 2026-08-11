import psycopg2

db_url = "postgresql://lph_admin:p09uhqnei5x9c9apugp7@76.13.185.191:5432/lph_data"

try:
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()
    
    # Check existing databases
    cur.execute("SELECT datname FROM pg_database;")
    dbs = [r[0] for r in cur.fetchall()]
    print(f"Current databases on Easypanel: {dbs}")
    
    if "lph_admin" not in dbs:
        print("Creating database 'lph_admin' on Easypanel PostgreSQL...")
        cur.execute("CREATE DATABASE lph_admin;")
        print("[SUCCESS] Database 'lph_admin' created successfully!")
    else:
        print("[OK] Database 'lph_admin' already exists!")
        
    conn.close()
except Exception as e:
    print(f"[NOTE] Database creation note: {e}")
