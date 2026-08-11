"""
db.py -- Postgres (Neon) schema + connection pool.

Credentials come from the DATABASE_URL environment variable ONLY.
Never hardcode a connection string here or anywhere in this repo --
if you ever commit one to git, rotate it immediately.

Usage:
    export DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
    python db.py     # creates schema (safe to re-run, uses IF NOT EXISTS)

Search design
-------------
SQLite's FTS5 doesn't exist in Postgres. Instead:
  - `search_vector` is a GENERATED ALWAYS ... STORED tsvector column, built
    from name/community/developer/project/etc, weighted (name ranks
    highest). Postgres keeps it in sync automatically on every
    insert/update -- there's no trigger to maintain, unlike SQLite FTS5.
  - A GIN index on `search_vector` makes `websearch_to_tsquery` matches
    fast at any row count.
  - pg_trgm + a GIN trigram index on mobile_1/unit_number handles partial,
    non-word-boundary matches (e.g. searching "876543" inside a phone
    number), which word-based full-text search can't do on its own.
"""

import os
from contextlib import contextmanager

import psycopg2
import psycopg2.extras
from psycopg2.pool import SimpleConnectionPool

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Export it before running, e.g.:\n"
        '  export DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"'
    )

# Neon's free/low tiers have a limited number of direct connections. If
# you're deploying the API (many short-lived requests), point DATABASE_URL
# at Neon's pooled endpoint instead (hostname gets a "-pooler" suffix in
# the Neon console) rather than raising this number a lot.
_pool = SimpleConnectionPool(minconn=1, maxconn=int(os.environ.get("PG_POOL_MAX", "10")),
                              dsn=DATABASE_URL)

SCHEMA = """
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS batches (
    id                      SERIAL PRIMARY KEY,
    batch_number            TEXT UNIQUE NOT NULL,
    records_count           INTEGER NOT NULL DEFAULT 0,
    source_file_count       INTEGER NOT NULL DEFAULT 0,
    status                  TEXT NOT NULL DEFAULT 'Completed',
    execution_time_seconds  DOUBLE PRECISION,
    created_at              TIMESTAMPTZ NOT NULL,
    error_message           TEXT
);

CREATE TABLE IF NOT EXISTS source_files (
    id                      SERIAL PRIMARY KEY,
    file_name               TEXT NOT NULL,
    original_directory      TEXT,
    file_size_bytes         BIGINT,
    extension               TEXT,
    file_hash               TEXT,
    processing_status       TEXT NOT NULL DEFAULT 'Success',
    records_extracted       INTEGER NOT NULL DEFAULT 0,
    batch_id                INTEGER REFERENCES batches(id),
    uploaded_at              TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_source_files_hash  ON source_files(file_hash);
CREATE INDEX IF NOT EXISTS idx_source_files_batch ON source_files(batch_id);

CREATE TABLE IF NOT EXISTS consolidated_records (
    id                      BIGSERIAL PRIMARY KEY,
    record_id               TEXT UNIQUE,
    name                    TEXT,
    unit_number             TEXT,
    community               TEXT,
    sub_community           TEXT,
    building_cluster        TEXT,
    project                 TEXT,
    developer               TEXT,
    property_type           TEXT,
    area_sqft               DOUBLE PRECISION,
    bedrooms                INTEGER,
    bathrooms               INTEGER,
    registration_date       TEXT,
    offplan_status          TEXT,
    transaction_value_aed   DOUBLE PRECISION,
    mobile_1                TEXT,
    mobile_2                TEXT,
    mobile_3                TEXT,
    email                   TEXT,
    nationality             TEXT,
    is_duplicate            BOOLEAN NOT NULL DEFAULT FALSE,
    duplicate_remark        TEXT,
    source_file_id          INTEGER REFERENCES source_files(id),
    source_file_name        TEXT,
    file_hash                TEXT,
    created_at                TIMESTAMPTZ NOT NULL,
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('simple',
            coalesce(community, '') || ' ' || coalesce(sub_community, '') || ' ' ||
            coalesce(building_cluster, '') || ' ' || coalesce(developer, '') || ' ' ||
            coalesce(project, '')), 'B') ||
        setweight(to_tsvector('simple',
            coalesce(unit_number, '') || ' ' || coalesce(email, '')), 'C')
    ) STORED
);
CREATE INDEX IF NOT EXISTS idx_records_search        ON consolidated_records USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_records_community      ON consolidated_records(community);
CREATE INDEX IF NOT EXISTS idx_records_property_type  ON consolidated_records(property_type);
CREATE INDEX IF NOT EXISTS idx_records_developer      ON consolidated_records(developer);
CREATE INDEX IF NOT EXISTS idx_records_source_file    ON consolidated_records(source_file_id);
-- Trigram indexes: fast partial/substring matches on phone numbers and unit
-- numbers, which word-based full-text search can't do (e.g. searching
-- "876543" inside "0559876543").
CREATE INDEX IF NOT EXISTS idx_records_mobile1_trgm ON consolidated_records USING GIN(mobile_1 gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_records_unit_trgm     ON consolidated_records USING GIN(unit_number gin_trgm_ops);

CREATE TABLE IF NOT EXISTS duplicates (
    id                      SERIAL PRIMARY KEY,
    original_file_id        INTEGER REFERENCES source_files(id),
    original_file_name      TEXT,
    duplicate_file_name     TEXT,
    file_hash                TEXT,
    duplicate_type           TEXT,
    match_confidence         DOUBLE PRECISION,
    status                   TEXT NOT NULL DEFAULT 'Isolated',
    detected_at               TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS processing_logs (
    id           SERIAL PRIMARY KEY,
    timestamp    TIMESTAMPTZ NOT NULL,
    severity     TEXT NOT NULL,
    source       TEXT NOT NULL,
    message      TEXT NOT NULL,
    execution_id TEXT,
    metadata     JSONB
);
CREATE INDEX IF NOT EXISTS idx_logs_severity  ON processing_logs(severity);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON processing_logs(timestamp);
"""


def init_db():
    conn = _pool.getconn()
    try:
        with conn.cursor() as cur:
            cur.execute(SCHEMA)
        conn.commit()
    finally:
        _pool.putconn(conn)


@contextmanager
def get_conn():
    """Context-managed connection from the pool, dict-like rows via
    RealDictCursor, used by both ingest.py and main.py."""
    conn = _pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        _pool.putconn(conn)


def dict_cursor(conn):
    return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)


if __name__ == "__main__":
    init_db()
    print("Schema created/verified on", DATABASE_URL.split("@")[-1])
