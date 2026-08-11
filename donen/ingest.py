"""
ingest.py -- loads consolidate_by_community.py's extraction cache into
Postgres/Neon, same source data as the SQLite version but using batched
execute_values() for throughput on a network round-trip database
(Neon isn't local disk -- every statement has latency, so batching
matters far more here than it did for SQLite).

Usage:
    export DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
    python ingest.py --cache-dir "C:\\...\\_extraction_cache" --batch-size 50
"""

import os
import re
import json
import glob
import argparse
import hashlib
from datetime import datetime, timezone

import psycopg2.extras

from db import init_db, get_conn

DUP_REMARK_RE = re.compile(r"^Dup \((\w+)\): (.*) — (.*)$")
INSERT_CHUNK = 1000  # rows per execute_values() round trip


def _to_float(v):
    try:
        return float(v) if v not in (None, "") else None
    except (TypeError, ValueError):
        return None


def _to_int(v):
    try:
        return int(float(v)) if v not in (None, "") else None
    except (TypeError, ValueError):
        return None


def _record_id(source_file, source_sheet, idx):
    raw = f"{source_file}|{source_sheet}|{idx}"
    return "REC-" + hashlib.md5(raw.encode("utf-8")).hexdigest()[:12].upper()


def load_cache(cache_dir):
    cache_files = sorted(glob.glob(os.path.join(cache_dir, "*.json")))
    for cf in cache_files:
        with open(cf, "r") as f:
            cached = json.load(f)
        rows = cached.get("rows", [])
        sheet_log = cached.get("sheet_log", [])
        fname = sheet_log[0]["File"] if sheet_log else (rows[0]["Source File"] if rows else None)
        if fname is None:
            continue
        yield fname, rows, sheet_log


def file_status_from_log(sheet_log_entries):
    statuses = {e["Status"] for e in sheet_log_entries}
    if "Could not open" in statuses:
        return "Failed"
    if "Unclassified" in statuses:
        return "Warning"
    return "Success"


def persist_from_cache(cache_dir, batch_size=50, source_dir_hint=""):
    init_db()
    now = datetime.now(timezone.utc)

    entries = list(load_cache(cache_dir))
    if not entries:
        print(f"No cache files found in {cache_dir}")
        return

    with get_conn() as conn:
        cur = conn.cursor()
        # Fresh load each run. TRUNCATE ... CASCADE is fast even at 1M+ rows
        # (unlike DELETE, it doesn't scan/log each row) and resets identity
        # counters so record ids stay predictable across re-runs.
        cur.execute("TRUNCATE consolidated_records, duplicates, source_files, batches RESTART IDENTITY CASCADE")

        batch_number = 0
        for chunk_start in range(0, len(entries), batch_size):
            chunk = entries[chunk_start: chunk_start + batch_size]
            batch_number += 1
            batch_no_str = f"B{batch_number:06d}"

            total_records_in_batch = sum(len(rows) for _, rows, _ in chunk)
            cur.execute(
                "INSERT INTO batches (batch_number, records_count, source_file_count, "
                "status, created_at) VALUES (%s, %s, %s, 'Completed', %s) RETURNING id",
                (batch_no_str, total_records_in_batch, len(chunk), now),
            )
            batch_id = cur.fetchone()[0]

            pending_records = []
            pending_dupes = []

            for fname, rows, sheet_log in chunk:
                status = file_status_from_log(sheet_log)
                records_extracted = sum(e.get("Rows Extracted", 0) for e in sheet_log)
                cur.execute(
                    "INSERT INTO source_files (file_name, original_directory, "
                    "extension, processing_status, records_extracted, batch_id, uploaded_at) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
                    (fname, source_dir_hint, os.path.splitext(fname)[1].lower(),
                     status, records_extracted, batch_id, now),
                )
                source_file_id = cur.fetchone()[0]

                for idx, row in enumerate(rows):
                    dup_remark = row.get("Duplicate Remark")
                    pending_records.append((
                        _record_id(fname, row.get("Source Sheet"), idx),
                        row.get("Name"), row.get("Unit Number"), row.get("Community"),
                        row.get("Sub-Community"), row.get("Building/Cluster"),
                        row.get("Project"), row.get("Developer"), row.get("Property Type"),
                        _to_float(row.get("Size")), _to_int(row.get("Bedroom")),
                        row.get("Date"), _to_float(row.get("Procedure Value")),
                        row.get("Mobile 1"), row.get("Mobile 2"), row.get("Mobile 3"),
                        row.get("Email Address"), row.get("Nationality"),
                        bool(dup_remark), dup_remark,
                        source_file_id, fname, now,
                    ))
                    if dup_remark:
                        m = DUP_REMARK_RE.match(dup_remark)
                        pending_dupes.append((
                            m.group(3) if m else None,
                            fname,
                            f"{m.group(1)} match" if m else "match",
                            1.0, "Isolated", now,
                        ))

            for i in range(0, len(pending_records), INSERT_CHUNK):
                psycopg2.extras.execute_values(
                    cur,
                    "INSERT INTO consolidated_records ("
                    "record_id, name, unit_number, community, sub_community, "
                    "building_cluster, project, developer, property_type, area_sqft, "
                    "bedrooms, registration_date, transaction_value_aed, "
                    "mobile_1, mobile_2, mobile_3, email, nationality, "
                    "is_duplicate, duplicate_remark, source_file_id, source_file_name, "
                    "created_at) VALUES %s ON CONFLICT (record_id) DO NOTHING",
                    pending_records[i:i + INSERT_CHUNK],
                )
            for i in range(0, len(pending_dupes), INSERT_CHUNK):
                psycopg2.extras.execute_values(
                    cur,
                    "INSERT INTO duplicates (original_file_name, duplicate_file_name, "
                    "duplicate_type, match_confidence, status, detected_at) VALUES %s",
                    pending_dupes[i:i + INSERT_CHUNK],
                )

            print(f"  batch {batch_no_str}: {len(chunk)} files, "
                  f"{total_records_in_batch} records loaded", flush=True)

        cur.execute(
            "INSERT INTO processing_logs (timestamp, severity, source, message, execution_id, metadata) "
            "VALUES (%s, 'INFO', 'pg_fts', %s, %s, %s)",
            (now, f"Ingest run loaded {len(entries)} source files into Postgres + tsvector index",
             "#ingest-manual", json.dumps({"files": len(entries), "batches": batch_number})),
        )

    print(f"\nDone. Loaded {len(entries)} files across {batch_number} batches into Postgres")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache-dir", required=True)
    parser.add_argument("--batch-size", type=int, default=50)
    parser.add_argument("--source-dir-hint", default="")
    args = parser.parse_args()

    persist_from_cache(args.cache_dir, batch_size=args.batch_size,
                        source_dir_hint=args.source_dir_hint)
