"""
main.py -- FastAPI backend for the real estate dashboard, running on
Postgres/Neon instead of SQLite.

Run:
    export DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
    pip install -r requirements.txt
    python db.py
    python ingest.py --cache-dir "..."
    uvicorn main:app --reload --port 8000
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from db import get_conn, dict_cursor

app = FastAPI(title="Real Estate Dashboard API (Postgres/Neon)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your frontend's real origin in production
    allow_methods=["*"],
    allow_headers=["*"],
)


def paginate(page: int, page_size: int, total: int):
    total_pages = (total + page_size - 1) // page_size if page_size else 0
    return {"total": total, "page": page, "page_size": page_size, "total_pages": total_pages}


# Explicit column list for consolidated_records reads -- "SELECT *" would
# also pull back the internal search_vector tsvector column, which is
# implementation detail, not something the frontend should ever see.
RECORD_COLUMNS = """
    id, record_id, name, unit_number, community, sub_community, building_cluster,
    project, developer, property_type, area_sqft, bedrooms, bathrooms,
    registration_date, offplan_status, transaction_value_aed, mobile_1, mobile_2,
    mobile_3, email, nationality, is_duplicate, duplicate_remark, source_file_id,
    source_file_name, file_hash, created_at
"""


# --------------------------------------------------------------------------
# 1. Overview Dashboard
# --------------------------------------------------------------------------
@app.get("/api/v1/dashboard/summary")
def dashboard_summary():
    with get_conn() as conn:
        cur = dict_cursor(conn)

        cur.execute("SELECT COUNT(*) c FROM source_files"); total_files = cur.fetchone()["c"]
        cur.execute("SELECT COUNT(*) c FROM consolidated_records"); total_records = cur.fetchone()["c"]
        cur.execute("SELECT COUNT(*) c FROM batches"); total_batches = cur.fetchone()["c"]
        cur.execute("SELECT COUNT(*) c FROM duplicates"); total_duplicates = cur.fetchone()["c"]
        cur.execute("SELECT COUNT(*) c FROM source_files WHERE processing_status = 'Failed'")
        failed_files = cur.fetchone()["c"]

        success_rate = 100.0
        if total_files:
            success_rate = round(100.0 * (total_files - failed_files) / total_files, 2)

        cur.execute("SELECT MAX(created_at) c FROM batches")
        last_run = cur.fetchone()["c"]

        cur.execute(
            "SELECT id, batch_number, records_count, status, created_at, source_file_count "
            "FROM batches ORDER BY id DESC LIMIT 10"
        )
        recent_batches = cur.fetchall()

        cur.execute("SELECT processing_status, COUNT(*) c FROM source_files GROUP BY processing_status")
        file_status_breakdown = {r["processing_status"]: r["c"] for r in cur.fetchall()}

        cur.execute(
            "SELECT COALESCE(property_type, 'Unknown') property_type, COUNT(*) c "
            "FROM consolidated_records WHERE is_duplicate = FALSE GROUP BY property_type"
        )
        category_breakdown = {r["property_type"]: r["c"] for r in cur.fetchall()}

        cur.execute("SELECT COALESCE(SUM(file_size_bytes), 0) c FROM source_files")
        storage_used = cur.fetchone()["c"]

        return {
            "total_files": total_files,
            "total_records": total_records,
            "total_batches": total_batches,
            "total_duplicates": total_duplicates,
            "failed_files": failed_files,
            "processing_success_rate": success_rate,
            "last_run_time": last_run,
            "storage_used_bytes": storage_used,
            "recent_batches": recent_batches,
            "file_status_breakdown": file_status_breakdown,
            "category_breakdown": category_breakdown,
        }


# --------------------------------------------------------------------------
# 2. Property Ledger Workspace
# --------------------------------------------------------------------------
@app.get("/api/v1/records")
def list_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    search: Optional[str] = None,
    community: Optional[str] = None,
    property_type: Optional[str] = None,
    developer: Optional[str] = None,
):
    offset = (page - 1) * page_size
    where = ["is_duplicate = FALSE"]
    params = []

    if search:
        # tsvector match for words (name, community, developer, project...)
        # OR trigram ILIKE for partial phone/unit matches that word-based
        # search can't do (searching "876543" inside a longer phone number).
        where.append(
            "(search_vector @@ websearch_to_tsquery('simple', %s) "
            "OR mobile_1 ILIKE %s OR unit_number ILIKE %s)"
        )
        like = f"%{search}%"
        params.extend([search, like, like])

    if community:
        where.append("community = %s")
        params.append(community)
    if property_type:
        where.append("property_type = %s")
        params.append(property_type)
    if developer:
        where.append("developer = %s")
        params.append(developer)

    where_sql = " AND ".join(where)

    with get_conn() as conn:
        cur = dict_cursor(conn)
        cur.execute(f"SELECT COUNT(*) c FROM consolidated_records WHERE {where_sql}", params)
        total = cur.fetchone()["c"]

        cur.execute(
            f"SELECT {RECORD_COLUMNS} FROM consolidated_records WHERE {where_sql} "
            f"ORDER BY id LIMIT %s OFFSET %s",
            params + [page_size, offset],
        )
        items = cur.fetchall()
        return {"items": items, **paginate(page, page_size, total)}


# --------------------------------------------------------------------------
# 3. Global Search
# --------------------------------------------------------------------------
@app.get("/api/v1/search/global")
def global_search(q: str, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100)):
    offset = (page - 1) * page_size
    with get_conn() as conn:
        cur = dict_cursor(conn)

        cur.execute(
            "SELECT COUNT(*) c FROM consolidated_records "
            "WHERE search_vector @@ websearch_to_tsquery('simple', %s)", (q,)
        )
        rec_total = cur.fetchone()["c"]
        cur.execute(
            f"SELECT {RECORD_COLUMNS} FROM consolidated_records "
            "WHERE search_vector @@ websearch_to_tsquery('simple', %s) "
            "ORDER BY ts_rank(search_vector, websearch_to_tsquery('simple', %s)) DESC "
            "LIMIT %s OFFSET %s",
            (q, q, page_size, offset),
        )
        rec_items = cur.fetchall()

        cur.execute("SELECT * FROM source_files WHERE file_name ILIKE %s LIMIT %s",
                    (f"%{q}%", page_size))
        file_items = cur.fetchall()

        cur.execute("SELECT * FROM batches WHERE batch_number ILIKE %s LIMIT %s",
                    (f"%{q}%", page_size))
        batch_items = cur.fetchall()

        return {
            # Plain FTS search, not the structured NLP intent parser
            # ("Emaar 2 bed in Downtown" -> {developer, bedrooms, community})
            # implied by the original spec's parsed_intent block -- that's a
            # separate entity-extraction layer, say the word if you want it.
            "parsed_intent": {"raw_query": q},
            "records": {"total": rec_total, "items": rec_items},
            "files": {"total": len(file_items), "items": file_items},
            "batches": {"total": len(batch_items), "items": batch_items},
        }


# --------------------------------------------------------------------------
# 4. Batch Explorer
# --------------------------------------------------------------------------
@app.get("/api/v1/batches")
def list_batches(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=200)):
    offset = (page - 1) * page_size
    with get_conn() as conn:
        cur = dict_cursor(conn)
        cur.execute("SELECT COUNT(*) c FROM batches"); total = cur.fetchone()["c"]
        cur.execute("SELECT * FROM batches ORDER BY id DESC LIMIT %s OFFSET %s", (page_size, offset))
        return {"items": cur.fetchall(), **paginate(page, page_size, total)}


# --------------------------------------------------------------------------
# 5. File Explorer
# --------------------------------------------------------------------------
@app.get("/api/v1/files")
def list_files(page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=500)):
    offset = (page - 1) * page_size
    with get_conn() as conn:
        cur = dict_cursor(conn)
        cur.execute("SELECT COUNT(*) c FROM source_files"); total = cur.fetchone()["c"]
        cur.execute("SELECT * FROM source_files ORDER BY id DESC LIMIT %s OFFSET %s", (page_size, offset))
        return {"items": cur.fetchall(), **paginate(page, page_size, total)}


# --------------------------------------------------------------------------
# 6. Duplicates
# --------------------------------------------------------------------------
@app.get("/api/v1/duplicates")
def list_duplicates(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=200)):
    offset = (page - 1) * page_size
    with get_conn() as conn:
        cur = dict_cursor(conn)
        cur.execute("SELECT COUNT(*) c FROM duplicates"); total = cur.fetchone()["c"]
        cur.execute("SELECT * FROM duplicates ORDER BY id DESC LIMIT %s OFFSET %s", (page_size, offset))
        return {"items": cur.fetchall(), **paginate(page, page_size, total)}


# --------------------------------------------------------------------------
# 9. Analytics
# --------------------------------------------------------------------------
@app.get("/api/v1/analytics")
def analytics():
    with get_conn() as conn:
        cur = dict_cursor(conn)

        cur.execute(
            "SELECT batch_number AS batch, records_count AS records, "
            "source_file_count AS files, execution_time_seconds AS time_sec "
            "FROM batches ORDER BY id"
        )
        batch_throughput = cur.fetchall()

        cur.execute(
            "SELECT COALESCE(NULLIF(original_directory, ''), 'Unknown') AS directory, COUNT(*) AS files "
            "FROM source_files GROUP BY directory ORDER BY files DESC"
        )
        directory_stats = cur.fetchall()

        cur.execute("SELECT extension, COUNT(*) AS count FROM source_files GROUP BY extension")
        extension_stats = cur.fetchall()

        cur.execute("SELECT COUNT(DISTINCT file_hash) c FROM source_files WHERE file_hash IS NOT NULL")
        unique_files = cur.fetchone()["c"]
        cur.execute("SELECT COUNT(*) c FROM source_files")
        total_files = cur.fetchone()["c"]
        dup_files = max(total_files - unique_files, 0)

        return {
            "batch_throughput": batch_throughput,
            "directory_stats": directory_stats,
            "extension_stats": extension_stats,
            "duplicate_ratio": [
                {"name": "Unique Files", "value": unique_files},
                {"name": "Duplicate Files", "value": dup_files},
            ],
        }


# --------------------------------------------------------------------------
# 8. System Logs
# --------------------------------------------------------------------------
@app.get("/api/v1/logs/stats")
def logs_stats():
    with get_conn() as conn:
        cur = dict_cursor(conn)
        cur.execute("SELECT severity, COUNT(*) c FROM processing_logs GROUP BY severity")
        counts = {r["severity"]: r["c"] for r in cur.fetchall()}
        total = sum(counts.values())
        return {
            "total_logs": total,
            "info_count": counts.get("INFO", 0),
            "warning_count": counts.get("WARNING", 0),
            "error_count": counts.get("ERROR", 0),
            "critical_count": counts.get("CRITICAL", 0),
        }


@app.get("/api/v1/logs")
def list_logs(page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=500),
              severity: Optional[str] = None, source: Optional[str] = None):
    offset = (page - 1) * page_size
    where, params = ["1=1"], []
    if severity:
        where.append("severity = %s"); params.append(severity)
    if source:
        where.append("source = %s"); params.append(source)
    where_sql = " AND ".join(where)

    with get_conn() as conn:
        cur = dict_cursor(conn)
        cur.execute(f"SELECT COUNT(*) c FROM processing_logs WHERE {where_sql}", params)
        total = cur.fetchone()["c"]
        cur.execute(
            f"SELECT * FROM processing_logs WHERE {where_sql} ORDER BY id DESC LIMIT %s OFFSET %s",
            params + [page_size, offset],
        )
        return {"items": cur.fetchall(), "total": total, "page": page, "page_size": page_size}


@app.get("/health")
def health():
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}
