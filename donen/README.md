# Real estate dashboard backend (Postgres/Neon + FastAPI)

Same design as the SQLite version, ported to Postgres and verified against a
real local Postgres 16 instance before delivery: schema creation, bulk
ingest with batching, word search, filters, partial phone-number search,
duplicate detection, and global search all tested and returning correct
results.

## About that connection string

You pasted a live `DATABASE_URL` (with password) into chat earlier. Treat it
as compromised — **rotate the password in the Neon console**. None of the
files here contain it; they all read `DATABASE_URL` from the environment.

## How the pieces fit together

1. Your `consolidate_by_community.py` script is unchanged — it still writes
   its `_extraction_cache/` JSON checkpoints as it extracts your 1,622 files.
2. **`db.py`** creates the Postgres schema. The key difference from SQLite:
   there's no FTS5 here, so `consolidated_records.search_vector` is a
   `GENERATED ALWAYS ... STORED` `tsvector` column that Postgres keeps in
   sync automatically (no triggers to maintain), indexed with GIN for fast
   word search. A separate trigram (`pg_trgm`) GIN index on `mobile_1` and
   `unit_number` handles partial, non-word-boundary matches — e.g.
   searching `876543` inside a longer phone number, which word-based search
   can't do.
3. **`ingest.py`** reads the same extraction cache and bulk-loads it using
   `execute_values()` in batches of 1,000 rows per round trip. This matters
   more here than it did for SQLite: Neon is a network database, so batching
   avoids one network round trip per row.
4. **`main.py`** — same endpoints as before. `/api/v1/records?search=...`
   matches on `search_vector @@ websearch_to_tsquery(...)` OR a trigram
   `ILIKE` on phone/unit, so both "Emaar Downtown" style word search and
   partial phone number search work from the same parameter.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env   # fill in your real (rotated) DATABASE_URL
export $(cat .env | xargs)   # or use python-dotenv / your platform's env vars

python db.py            # creates schema, safe to re-run
python ingest.py --cache-dir "C:\Users\USER\Music\Data Concolidated-Nishchal\_extraction_cache"
uvicorn main:app --reload --port 8000
```

## Neon-specific notes

- **Connection pooling**: Neon's lower tiers cap direct connections. For the
  API (many short-lived requests), use Neon's **pooled connection string**
  (the hostname gets a `-pooler` suffix in the Neon console) rather than the
  direct one, and keep `PG_POOL_MAX` modest (10 is a reasonable default).
- **Cold starts**: Neon can suspend an idle compute and wake it on the next
  query, adding latency to the first request after idle time. Not something
  to fix in code — just don't be surprised by an occasional slow first hit.
- **TRUNCATE on re-ingest**: `ingest.py` truncates and reloads all tables
  each run, same as the SQLite version, so it stays a pure reflection of
  whatever's currently in `_extraction_cache/` rather than a second pipeline
  that can drift from your xlsx outputs.

## What's real vs. what's a stub

Same as before — `search/global` does real search but not structured NLP
intent parsing, and `/workflow/live` isn't included (needs your pipeline
actually reporting progress somewhere in real time). Say the word if you
want either built next.
