import os
import glob
import hashlib
import argparse
from datetime import datetime, timezone

import pandas as pd
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.db.models import (
    BatchInfo,
    SourceFile,
    ConsolidatedRecord,
)


# Default production location.
# This directory should be mounted into the lph-backend container.
DEFAULT_EXCEL_DIR = os.getenv(
    "EXCEL_OUTPUT_DIR",
    "/app/data/excel",
)

CHUNK_SIZE = 5000


def clean_val(value, default=""):
    """Convert Excel values into clean strings."""
    if value is None:
        return default

    try:
        if pd.isna(value):
            return default
    except Exception:
        pass

    value = str(value).strip()

    if value.lower() in (
        "",
        "nan",
        "none",
        "null",
        "undefined",
    ):
        return default

    return value


def first_value(row, *column_names, default=""):
    """Return the first usable value from a list of possible Excel headers."""
    for column_name in column_names:
        if column_name in row.index:
            value = row[column_name]

            if value is None:
                continue

            try:
                if pd.isna(value):
                    continue
            except Exception:
                pass

            if str(value).strip() != "":
                return clean_val(value, default)

    return default


def numeric_value(row, *column_names, default=0.0):
    """Return a numeric Excel value safely."""
    for column_name in column_names:
        if column_name not in row.index:
            continue

        value = row[column_name]

        if value is None:
            continue

        try:
            if pd.isna(value):
                continue
        except Exception:
            pass

        text = str(value).strip()

        if not text:
            continue

        try:
            return float(text.replace(",", ""))
        except Exception:
            continue

    return default


def calculate_file_hash(file_path):
    """Calculate SHA-256 hash of the complete file."""
    sha256 = hashlib.sha256()

    with open(file_path, "rb") as file:
        while True:
            chunk = file.read(1024 * 1024)

            if not chunk:
                break

            sha256.update(chunk)

    return sha256.hexdigest()


def build_record(row, file_name, sheet_name, row_number, source_file_id, batch_id, now):
    """Convert one Excel row into a ConsolidatedRecord mapping."""

    owner_name = first_value(
        row,
        "Name",
        "name",
        "Owner",
        "owner_name",
        default="Property Owner",
    )

    community = first_value(
        row,
        "Community",
        "community",
        "Area",
        "area",
        default="Dubai",
    )

    sub_community = first_value(
        row,
        "Sub-Community",
        "sub_community",
        "Sub Community",
        "subcommunity",
    )

    building_cluster = first_value(
        row,
        "Building/Cluster",
        "building_cluster",
        "Building",
        "building",
        "Property Tower",
        "property_tower",
        "Tower",
        "tower",
    )

    unit_number = first_value(
        row,
        "Unit Number",
        "unit_number",
        "Unit",
        "unit",
        "Flat",
        "flat",
    )

    size = first_value(
        row,
        "Size",
        "size",
        "Area",
        "area",
    )

    plot_reg_no = first_value(
        row,
        "Plot Reg. No",
        "Plot Reg No",
        "plot_reg_no",
        "Plot Reg No.",
    )

    plot_number = first_value(
        row,
        "Plot Number",
        "plot_number",
        "Plot No",
        "plot_no",
    )

    dm_no = first_value(
        row,
        "DMNO",
        "dmno",
        "DM No",
        "dm_no",
    )

    dm_sub_no = first_value(
        row,
        "DMsubno",
        "dmsubno",
        "DM Sub No",
        "dm_sub_no",
    )

    bedroom = first_value(
        row,
        "Bedroom",
        "bedroom",
        "Bedrooms",
        "bedrooms",
    )

    buyer_seller_type = first_value(
        row,
        "Type",
        "type",
        "Buyer/Seller Type",
        "buyer_seller_type",
        default="Buyer",
    )

    mobile_1 = first_value(
        row,
        "Mobile 1",
        "mobile_1",
        "Phone 1",
        "phone_1",
    )

    mobile_2 = first_value(
        row,
        "Mobile 2",
        "mobile_2",
        "Phone 2",
        "phone_2",
    )

    mobile_3 = first_value(
        row,
        "Mobile 3",
        "mobile_3",
        "Phone 3",
        "phone_3",
    )

    email_address = first_value(
        row,
        "Email Address",
        "email_address",
        "Email",
        "email",
    )

    pi_number = first_value(
        row,
        "PI number",
        "PI Number",
        "pi_number",
        "P Number",
        "p_number",
    )

    nationality = first_value(
        row,
        "Nationality",
        "nationality",
    )

    property_type = first_value(
        row,
        "Property Type",
        "property_type",
        "Property type",
        default="Apartment",
    )

    developer = first_value(
        row,
        "Developer",
        "developer",
    )

    project = first_value(
        row,
        "Project",
        "project",
    )

    procedure_value = numeric_value(
        row,
        "Procedure Value",
        "procedure_value",
        "Price",
        "price",
        "Value",
        "value",
        default=0.0,
    )

    return {
        "source_file_id": source_file_id,
        "batch_id": batch_id,
        "original_workbook": file_name,
        "sheet_name": str(sheet_name),
        "row_number": row_number,
        "name": owner_name,
        "community": community,
        "sub_community": sub_community,
        "building_cluster": building_cluster,
        "unit_number": unit_number,
        "size": size,
        "plot_reg_no": plot_reg_no,
        "plot_number": plot_number,
        "dmno": dm_no,
        "dmsubno": dm_sub_no,
        "bedroom": bedroom,
        "buyer_seller_type": buyer_seller_type,
        "mobile_1": mobile_1,
        "mobile_2": mobile_2,
        "mobile_3": mobile_3,
        "email_address": email_address,
        "pi_number": pi_number,
        "nationality": nationality,
        "property_type": property_type,
        "date": now,
        "procedure_value": procedure_value,
        "developer": developer,
        "project": project,
        "created_time": now,
    }


def find_excel_files(target_dir):
    """Find Excel files in the import directory."""
    xlsx_files = glob.glob(os.path.join(target_dir, "*.xlsx"))
    xls_files = glob.glob(os.path.join(target_dir, "*.xls"))

    files = sorted(xlsx_files + xls_files)

    result = []

    for file_path in files:
        file_name = os.path.basename(file_path)

        # Ignore Excel temporary files and master/control files.
        if file_name.startswith("~$"):
            continue

        if file_name.startswith("_MASTER"):
            continue

        result.append(file_path)

    return result


def import_all_excel_output(target_dir=DEFAULT_EXCEL_DIR, limit=None):
    """Import Excel files into PostgreSQL."""

    target_dir = os.path.abspath(target_dir)

    print("=" * 80)
    print("LPH EXCEL IMPORTER")
    print("=" * 80)
    print(f"Input directory: {target_dir}")

    if not os.path.isdir(target_dir):
        print()
        print(f"[ERROR] Excel directory does not exist:")
        print(f"       {target_dir}")
        print()
        print("Create/mount the directory in Easypanel before running the importer.")
        return False

    excel_files = find_excel_files(target_dir)

    print(f"Excel files found: {len(excel_files)}")

    if limit is not None:
        excel_files = excel_files[:limit]
        print(f"Import limit: {limit}")
        print(f"Files selected: {len(excel_files)}")

    if not excel_files:
        print("[ERROR] No Excel files found.")
        return False

    print()

    db: Session = SessionLocal()

    imported_files = 0
    skipped_files = 0
    failed_files = 0
    total_records_imported = 0

    try:
        existing_hashes = {
            row[0]
            for row in db.query(SourceFile.file_hash).all()
            if row[0]
        }

        max_batch = (
            db.query(func.max(BatchInfo.batch_number)).scalar()
            or 0
        )

        current_batch_num = max_batch + 1

        print(f"Existing source files: {len(existing_hashes):,}")
        print(f"Next batch number: {current_batch_num}")
        print()

        for index, file_path in enumerate(excel_files, start=1):

            file_name = os.path.basename(file_path)

            print(
                f"[{index}/{len(excel_files)}] "
                f"Processing: {file_name}"
            )

            try:
                file_size = os.path.getsize(file_path)

                print(
                    f"    Size: "
                    f"{file_size / (1024 * 1024):.2f} MB"
                )

                file_hash = calculate_file_hash(file_path)

                if file_hash in existing_hashes:
                    print("    SKIP: File already imported.")
                    skipped_files += 1
                    continue

                now = datetime.now(timezone.utc)

                # ---------------------------------------------------------
                # Read Excel
                # ---------------------------------------------------------

                xls = pd.ExcelFile(file_path)

                print(
                    f"    Sheets: {', '.join(xls.sheet_names)}"
                )

                mappings = []

                for sheet_name in xls.sheet_names:

                    df = pd.read_excel(
                        xls,
                        sheet_name=sheet_name,
                    )

                    if df.empty:
                        print(
                            f"    Sheet '{sheet_name}': empty"
                        )
                        continue

                    print(
                        f"    Sheet '{sheet_name}': "
                        f"{len(df):,} rows"
                    )

                    for row_index, row in df.iterrows():

                        mapping = build_record(
                            row=row,
                            file_name=file_name,
                            sheet_name=sheet_name,
                            row_number=int(row_index + 1),
                            source_file_id=None,
                            batch_id=None,
                            now=now,
                        )

                        mappings.append(mapping)

                if not mappings:
                    print("    SKIP: No records found.")
                    skipped_files += 1
                    continue

                # ---------------------------------------------------------
                # Create Batch
                # ---------------------------------------------------------

                batch_obj = BatchInfo(
                    batch_number=current_batch_num,
                    batch_name=(
                        f"Batch_{current_batch_num:04d}_Consolidated"
                    ),
                    number_of_files=1,
                    number_of_records=len(mappings),
                    processing_time_seconds=0,
                    start_time=now,
                    end_time=now,
                    status="Processing",
                    consolidated_file_path=file_path,
                    created_at=now,
                )

                db.add(batch_obj)
                db.flush()

                # ---------------------------------------------------------
                # Create Source File
                # ---------------------------------------------------------

                source_file = SourceFile(
                    record_id=f"FILE-{current_batch_num:05d}",
                    file_name=file_name,
                    original_directory=os.path.dirname(file_path),
                    extension=os.path.splitext(file_name)[1].lower(),
                    file_size_bytes=file_size,
                    file_hash=file_hash,
                    last_modified=now,
                    batch_id=batch_obj.id,
                    batch_number=current_batch_num,
                    processing_status="Processing",
                    duplicate_status="Unique",
                )

                db.add(source_file)
                db.flush()

                # ---------------------------------------------------------
                # Attach foreign keys now that IDs exist.
                # ---------------------------------------------------------

                for mapping in mappings:
                    mapping["source_file_id"] = source_file.id
                    mapping["batch_id"] = batch_obj.id

                # ---------------------------------------------------------
                # Bulk insert records.
                # ---------------------------------------------------------

                inserted = 0

                for start in range(
                    0,
                    len(mappings),
                    CHUNK_SIZE,
                ):
                    chunk = mappings[
                        start:start + CHUNK_SIZE
                    ]

                    db.bulk_insert_mappings(
                        ConsolidatedRecord,
                        chunk,
                    )

                    db.commit()

                    inserted += len(chunk)

                    print(
                        f"    Inserted: "
                        f"{inserted:,}/{len(mappings):,}"
                    )

                # ---------------------------------------------------------
                # Complete metadata.
                # ---------------------------------------------------------

                batch_obj.status = "Completed"
                batch_obj.end_time = datetime.now(timezone.utc)

                source_file.processing_status = "Success"

                elapsed = (
                    batch_obj.end_time - now
                ).total_seconds()

                batch_obj.processing_time_seconds = round(
                    elapsed,
                    2,
                )

                db.commit()

                existing_hashes.add(file_hash)

                imported_files += 1
                total_records_imported += len(mappings)

                print(
                    f"    SUCCESS: "
                    f"{len(mappings):,} records imported."
                )
                print(
                    f"    Batch: {current_batch_num}"
                )
                print()

                current_batch_num += 1

            except Exception as exc:
                db.rollback()

                failed_files += 1

                print(
                    f"    ERROR: {type(exc).__name__}: {exc}"
                )
                print(
                    "    File was rolled back and will not "
                    "be marked as imported."
                )
                print()

        print("=" * 80)
        print("IMPORT SUMMARY")
        print("=" * 80)
        print(f"Files selected:       {len(excel_files):,}")
        print(f"Files imported:       {imported_files:,}")
        print(f"Files skipped:        {skipped_files:,}")
        print(f"Files failed:         {failed_files:,}")
        print(f"Records imported:     {total_records_imported:,}")
        print("=" * 80)

        return failed_files == 0

    except Exception as exc:
        db.rollback()

        print()
        print("=" * 80)
        print("IMPORT FAILED")
        print("=" * 80)
        print(f"{type(exc).__name__}: {exc}")
        print("=" * 80)

        return False

    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(
        description="Import LPH consolidated Excel files into PostgreSQL."
    )

    parser.add_argument(
        "--input-dir",
        default=DEFAULT_EXCEL_DIR,
        help=(
            "Directory containing Excel files. "
            f"Default: {DEFAULT_EXCEL_DIR}"
        ),
    )

    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Import only the first N Excel files.",
    )

    args = parser.parse_args()

    success = import_all_excel_output(
        target_dir=args.input_dir,
        limit=args.limit,
    )

    raise SystemExit(0 if success else 1)


if __name__ == "__main__":
    main()