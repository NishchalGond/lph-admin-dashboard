import psycopg2
import sys

db_urls = [
    "postgresql://lph_admin:p09uhqnei5x9c9apugp7@76.13.185.191:5432/lph_data",
    "postgresql://lph_admin:p09uhqnei5x9c9apugp7@internal.luxurypropertieshub.com:5432/lph_data"
]

for url in db_urls:
    print(f"Testing connection to: {url.split('@')[1]}")
    try:
        conn = psycopg2.connect(url, connect_timeout=5)
        cur = conn.cursor()
        cur.execute("SELECT version();")
        ver = cur.fetchone()
        print(f" SUCCESS! Connected to Easypanel PostgreSQL database!")
        print(f"PostgreSQL Version: {ver[0]}")
        conn.close()
        sys.exit(0)
    except Exception as e:
        print(f" Failed: {e}")

sys.exit(1)
