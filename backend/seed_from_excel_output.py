import os
import glob
import json
import hashlib
import argparse
import re
import unicodedata
from datetime import datetime, timezone
    
import pandas as pd
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.db.models import (
    BatchInfo,
    SourceFile,
    ConsolidatedRecord,
    DuplicateRecord,
    ProcessingLog,
)


# =============================================================================
# CONFIGURATION
# =============================================================================

DEFAULT_INPUT_DIR = "/app/data/excel"
DEFAULT_CHUNK_SIZE = 5000

# Do not put Excel files into Git.
# This script only reads them from the configured input directory.


# =============================================================================
# GENERAL HELPERS
# =============================================================================

def clean_value(value, default=""):
    """
    Convert an Excel cell into a clean string.

    Handles:
    - NaN
    - None
    - empty strings
    - pandas timestamps
    - numeric values
    - strings containing whitespace
    """
    if value is None:
        return default

    try:
        if pd.isna(value):
            return default
    except Exception:
        pass

    if isinstance(value, pd.Timestamp):
        return value.isoformat()

    if isinstance(value, datetime):
        return value.isoformat()

    text = str(value).strip()

    if text.lower() in {
        "",
        "nan",
        "none",
        "null",
        "undefined",
        "nat",
    }:
        return default

    return text


def normalize_header(value):
    """
    Normalize Excel column headers so that variations such as:

        "Owner Name"
        "OWNER_NAME"
        "owner-name"
        "Owner/Name"
        " Owner Name "

    all become comparable.
    """
    if value is None:
        return ""

    text = str(value).strip()

    # Remove accents/diacritics.
    text = unicodedata.normalize("NFKD", text)
    text = "".join(
        char for char in text
        if not unicodedata.combining(char)
    )

    text = text.lower()

    # Normalize common symbols.
    text = text.replace("&", " and ")

    # Keep only letters and numbers.
    text = re.sub(r"[^a-z0-9]+", "", text)

    return text


def normalized_columns(row):
    """
    Return:

        {
            normalized_header: original_header
        }

    for the current pandas row.
    """
    result = {}

    for column in row.index:
        normalized = normalize_header(column)

        if normalized and normalized not in result:
            result[normalized] = column

    return result


def first_value(row, aliases, default=""):
    """
    Return the first non-empty value found among a list of aliases.

    Matching is based on normalized headers rather than exact spelling.
    """
    column_map = normalized_columns(row)

    for alias in aliases:
        normalized_alias = normalize_header(alias)

        if normalized_alias not in column_map:
            continue

        original_column = column_map[normalized_alias]

        value = clean_value(row[original_column], "")

        if value != "":
            return value

    return default


def numeric_value(row, aliases, default=0.0):
    """
    Extract a numeric value safely.

    Handles values such as:
        123456
        123,456
        AED 1,250,000
        1.25M
    """
    raw = first_value(row, aliases, default="")

    if raw == "":
        return default

    if isinstance(raw, (int, float)):
        try:
            return float(raw)
        except Exception:
            return default

    text = str(raw).strip()

    # Remove commas and currency symbols.
    text = text.replace(",", "")
    text = re.sub(r"[^\d.\-]", "", text)

    if text in {"", "-", ".", "-."}:
        return default

    try:
        return float(text)
    except Exception:
        return default


def make_json_safe(value):
    """
    Convert pandas/numpy values into JSON-compatible values.
    """
    if value is None:
        return None

    try:
        if pd.isna(value):
            return None
    except Exception:
        pass

    if isinstance(value, (pd.Timestamp, datetime)):
        return value.isoformat()

    if hasattr(value, "item"):
        try:
            return value.item()
        except Exception:
            pass

    if isinstance(value, (str, int, float, bool)):
        return value

    return str(value)


def row_to_raw_json(row):
    """
    Preserve the original Excel row so we don't lose fields that aren't
    represented by the current database schema.
    """
    data = {}

    for column in row.index:
        data[str(column)] = make_json_safe(row[column])

    return json.dumps(
        data,
        ensure_ascii=False,
        default=str,
    )


def calculate_file_hash(file_path):
    """
    Calculate SHA-256 for the entire file.

    The previous approach hashed only the first 64 KB, which can cause
    different Excel files to appear identical. This hashes the entire file.
    """
    sha256 = hashlib.sha256()

    with open(file_path, "rb") as file:
        while True:
            chunk = file.read(1024 * 1024)

            if not chunk:
                break

            sha256.update(chunk)

    return sha256.hexdigest()


# =============================================================================
# EXCEL COLUMN ALIASES
# =============================================================================

NAME_ALIASES = [
    "Name",
    "NameEn",
    "NAME",
    "Owner",
    "Owner Name",
    "OwnerName",
    "owner_name",
    "Customer Name",
    "CustomerName",
    "customer_name",
    "Property Owner",
    "Property Owner Name",
    "Client Name",
    "ClientName",
    "Buyer Name",
    "Seller Name",
    "Owner Full Name",
]

COMMUNITY_ALIASES = [
    "Community",
    "COMMUNITY",
    "community",
    "Area",
    "AREA",
    "area",
    "Master Location",
    "MasterLocation",
    "Master Community",
    "MasterCommunity",
    "Location",
    "Project Community",
]

SUB_COMMUNITY_ALIASES = [
    "Sub-Community",
    "Sub Community",
    "Subcommunity",
    "sub_community",
    "subcommunity",
    "Sub Community Name",
    "Subcommunity Name",
    "Sub Area",
    "SubArea",
    "District",
]

BUILDING_ALIASES = [
    "Building/Cluster",
    "Building / Cluster",
    "Building",
    "BuildingNameEn",
    "BUILDING NAME",
    "Building Name",
    "building",
    "BUILDING",
    "building_cluster",
    "Property Tower",
    "property_tower",
    "PropertyTower",
    "Tower",
    "tower",
    "Building Name",
    "BuildingName",
    "Tower Name",
    "TowerName",
    "Block",
    "Block Name",
    "Cluster",
    "Cluster Name",
    "Building 1",
    "Building1",
]

UNIT_ALIASES = [
    "Unit Number",
    "Unit No",
    "Unit No.",
    "Unit",
    "UnitNumber",
    "FLAT NUMBER",
    "Flat Number",
    "VILLA NO.",
    "VILLA NO",
    "unit_number",
    "Flat",
    "Flat No",
    "Flat No.",
    "Flat Number",
    "Apartment Number",
    "Apartment No",
    "Apartment No.",
    "Apartment Number",
    "Property Number",
    "Property No",
    "Property No.",
    "Unit Number 1",
]

SIZE_ALIASES = [
    "Size",
    "size",
    "ACTUAL AREA",
    "TOTAL AREA",
    "Area",
    "area",
    "Size Sq Ft",
    "Size Sq. Ft",
    "Area Sq Ft",
    "Area Sq. Ft",
    "BUA",
    "BUA Sq Ft",
    "Built Up Area",
    "Built-up Area",
    "Built Up Area Sq Ft",
    "Plot Size",
]

PLOT_REG_ALIASES = [
    "Plot Reg. No",
    "Plot Reg No",
    "Plot Pre Reg No",
    "REGISTRATION NUMBER",
    "Registration Number",
    "Plot Reg No.",
    "Plot Registration No",
    "Plot Registration Number",
    "plot_reg_no",
    "Plot Reg",
    "Registration No",
    "Registration Number",
]

PLOT_NUMBER_ALIASES = [
    "Plot Number",
    "PLOT NUMBER",
    "PLOT NO",
    "Plot No",
    "Plot No.",
    "plot_number",
    "plot_no",
    "Plot",
]

DMNO_ALIASES = [
    "DMNO",
    "dmno",
    "DM No",
    "DM No.",
    "dm_no",
    "DmNo",
    "DM NO",
    "MUNICIPALITY NUMBER",
    "DM Number",
    "DM Number No",
]

DMSUBNO_ALIASES = [
    "DMsubno",
    "dmsubno",
    "DM Sub No",
    "DM Sub No.",
    "dm_sub_no",
    "DM Sub Number",
    "DmSubNo",
    "DM SUB NO",
]

BEDROOM_ALIASES = [
    "Bedroom",
    "Bedrooms",
    "bedroom",
    "bedrooms",
    "Beds",
    "No of Bedrooms",
    "Number of Bedrooms",
    "Bedroom Count",
]

BUYER_SELLER_ALIASES = [
    "Type",
    "type",
    "Buyer/Seller Type",
    "Buyer Seller Type",
    "buyer_seller_type",
    "Transaction Type",
    "Buyer or Seller",
    "ProcedurePartyTypeNameEn",
    "Procedure Party Type",
    "ProcedurePartyType",
]

MOBILE_1_ALIASES = [
    "Mobile 1",
    "Mobile",
    "mobile_1",
    "Phone 1",
    "phone_1",
    "Phone",
    "PHONE",
    "Mobile",
    "MOBILE",
    "Telephone",
    "Telephone 1",
    "Contact",
    "Contact Number",
    "Contact No",
    "Contact No.",
    "Mobile Number",
    "Mobile No",
    "Mobile No.",
    "Phone Number",
    "Phone No",
    "Phone No.",
    "Primary Phone",
    "Primary Mobile",
]

MOBILE_2_ALIASES = [
    "Mobile 2",
    "mobile_2",
    "Phone 2",
    "phone_2",
    "Secondary Phone",
    "Secondary Mobile",
    "Mobile Number 2",
    "Phone Number 2",
]

MOBILE_3_ALIASES = [
    "Mobile 3",
    "mobile_3",
    "Phone 3",
    "phone_3",
    "Third Phone",
    "Third Mobile",
    "Mobile Number 3",
    "Phone Number 3",
]

EMAIL_ALIASES = [
    "Email Address",
    "Email",
    "EMAIL",
    "email_address",
    "email",
    "E-mail",
    "E Mail",
    "Email ID",
    "Email Id",
    "Primary Email",
]

PROCEDURE_VALUE_ALIASES = [
    "Procedure Value",
    "ProcedureValue",
    "procedure_value",
    "Price",
    "price",
    "PRICE",
    "Value",
    "value",
    "Amount",
    "amount",
    "Sale Price",
    "SalePrice",
    "Transaction Value",
    "TransactionValue",
    "Property Value",
]

PI_ALIASES = [
    "PI number",
    "PI Number",
    "pi_number",
    "P Number",
    "p_number",
    "PI No",
    "PI No.",
    "PI",
]

NATIONALITY_ALIASES = [
    "Nationality",
    "nationality",
    "CountryNameEn",
    "NATIONALITY",
    "Country",
    "Citizenship",
]

PROPERTY_TYPE_ALIASES = [
    "Property Type",
    "PropertySubTypeNameEn",
    "property_type",
    "Property type",
    "PROPERTY TYPE",
    "PropertyType",
    "Type of Property",
    "Property Category",
    "Unit Type",
    "Property",
]

DEVELOPER_ALIASES = [
    "Developer",
    "developer",
    "DEVELOPER",
    "Developer Name",
    "DeveloperName",
    "Master Developer",
]

PROJECT_ALIASES = [
    "Project",
    "project",
    "PROJECT",
    "Project Name",
    "ProjectName",
    "Master Project",
    "MasterProject",
    "Development",
    "Development Name",
]



# =============================================================================
# RECORD BUILDER
# =============================================================================

def build_record(
    row,
    file_name,
    sheet_name,
    row_number,
    source_file_id,
    batch_id,
    now,
):
    """
    Convert one Excel row into a ConsolidatedRecord mapping.

    The important difference from the old importer is that the aliases above
    are normalized before matching, so column capitalization and punctuation
    don't break the import.
    """

    name = first_value(
        row,
        NAME_ALIASES,
        default="",
    )

    community = first_value(
        row,
        COMMUNITY_ALIASES,
        default="",
    )

    sub_community = first_value(
        row,
        SUB_COMMUNITY_ALIASES,
        default="",
    )

    building_cluster = first_value(
        row,
        BUILDING_ALIASES,
        default="",
    )

    unit_number = first_value(
        row,
        UNIT_ALIASES,
        default="",
    )

    size = first_value(
        row,
        SIZE_ALIASES,
        default="",
    )

    plot_reg_no = first_value(
        row,
        PLOT_REG_ALIASES,
        default="",
    )

    plot_number = first_value(
        row,
        PLOT_NUMBER_ALIASES,
        default="",
    )

    dm_no = first_value(
        row,
        DMNO_ALIASES,
        default="",
    )

    dm_sub_no = first_value(
        row,
        DMSUBNO_ALIASES,
        default="",
    )

    bedroom = first_value(
        row,
        BEDROOM_ALIASES,
        default="",
    )

    buyer_seller_type = first_value(
        row,
        BUYER_SELLER_ALIASES,
        default="",
    )

    mobile_1 = first_value(
        row,
        MOBILE_1_ALIASES,
        default="",
    )

    mobile_2 = first_value(
        row,
        MOBILE_2_ALIASES,
        default="",
    )

    mobile_3 = first_value(
        row,
        MOBILE_3_ALIASES,
        default="",
    )

    email_address = first_value(
        row,
        EMAIL_ALIASES,
        default="",
    )

    pi_number = first_value(
        row,
        PI_ALIASES,
        default="",
    )

    nationality = first_value(
        row,
        NATIONALITY_ALIASES,
        default="",
    )

    property_type = first_value(
        row,
        PROPERTY_TYPE_ALIASES,
        default="",
    )

    developer = first_value(
        row,
        DEVELOPER_ALIASES,
        default="",
    )

    project = first_value(
        row,
        PROJECT_ALIASES,
        default="",
    )

    procedure_value = numeric_value(
        row,
        PROCEDURE_VALUE_ALIASES,
        default=0.0,
    )

    raw_data = row_to_raw_json(row)

    return {
        "source_file_id": source_file_id,
        "batch_id": batch_id,
        "original_workbook": file_name,
        "sheet_name": str(sheet_name),
        "row_number": int(row_number),

        "name": name,
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

        # Preserve original unmapped Excel fields where supported by the model.
        "raw_data_json": raw_data,

        "created_at": now,
    }


# =============================================================================
# EXCEL DISCOVERY
# =============================================================================

def find_excel_files(target_dir):
    if not os.path.isdir(target_dir):
        return []

    files = []

    patterns = [
        "*.xlsx",
        "*.xls",
    ]

    for pattern in patterns:
        files.extend(
            glob.glob(
                os.path.join(target_dir, pattern)
            )
        )

    return sorted(
        set(files),
        key=lambda path: os.path.basename(path).lower(),
    )


# =============================================================================
# HEADER DIAGNOSTICS
# =============================================================================

def print_sheet_mapping(df, file_name, sheet_name):
    """
    Print the headers detected in each sheet.

    This makes it immediately obvious if a workbook uses an unexpected
    schema.
    """
    columns = [str(column) for column in df.columns]

    print(
        f"    Columns ({len(columns)}): "
        + ", ".join(columns[:40])
    )

    if len(columns) > 40:
        print(
            f"    ... and {len(columns) - 40} more columns"
        )

    if len(df) == 0:
        return

    sample = df.iloc[0]

    detected = {
        "name": first_value(sample, NAME_ALIASES, ""),
        "community": first_value(sample, COMMUNITY_ALIASES, ""),
        "sub_community": first_value(
            sample,
            SUB_COMMUNITY_ALIASES,
            "",
        ),
        "building": first_value(
            sample,
            BUILDING_ALIASES,
            "",
        ),
        "unit": first_value(
            sample,
            UNIT_ALIASES,
            "",
        ),
        "size": first_value(
            sample,
            SIZE_ALIASES,
            "",
        ),
        "mobile": first_value(
            sample,
            MOBILE_1_ALIASES,
            "",
        ),
        "email": first_value(
            sample,
            EMAIL_ALIASES,
            "",
        ),
        "property_type": first_value(
            sample,
            PROPERTY_TYPE_ALIASES,
            "",
        ),
        "developer": first_value(
            sample,
            DEVELOPER_ALIASES,
            "",
        ),
        "project": first_value(
            sample,
            PROJECT_ALIASES,
            "",
        ),
    }

    print("    Sample mapping:")

    for key, value in detected.items():
        display = value if value != "" else "[blank]"
        print(f"      {key}: {display}")


# =============================================================================
# IMPORT ONE FILE
# =============================================================================

def import_one_file(
    db: Session,
    file_path,
    batch_number,
    chunk_size,
):
    file_name = os.path.basename(file_path)
    file_size = os.path.getsize(file_path)

    print()
    print("=" * 80)
    print(f"Processing: {file_name}")
    print(
        f"Size: {file_size / (1024 * 1024):.2f} MB"
    )
    print("=" * 80)

    # -------------------------------------------------------------------------
    # HASH
    # -------------------------------------------------------------------------

    file_hash = calculate_file_hash(file_path)

    existing_source = (
        db.query(SourceFile)
        .filter(SourceFile.file_hash == file_hash)
        .first()
    )

    if existing_source:
        print(
            "SKIPPED: File already imported "
            f"as SourceFile ID {existing_source.id}"
        )

        return {
            "status": "skipped",
            "records": 0,
        }

    now = datetime.now(timezone.utc)

    # -------------------------------------------------------------------------
    # READ EXCEL
    # -------------------------------------------------------------------------

    xls = pd.ExcelFile(file_path)

    print(
        "Sheets: "
        + ", ".join(str(name) for name in xls.sheet_names)
    )

    # -------------------------------------------------------------------------
    # CREATE BATCH
    # -------------------------------------------------------------------------

    batch_obj = BatchInfo(
        batch_number=batch_number,
        batch_name=f"Batch_{batch_number:04d}_{os.path.splitext(file_name)[0]}",
        number_of_files=1,
        number_of_records=0,
        processing_time_seconds=0,
        start_time=now,
        end_time=now,
        status="Processing",
        consolidated_file_path=file_path,
        created_at=now,
    )

    db.add(batch_obj)
    db.flush()

    # -------------------------------------------------------------------------
    # CREATE SOURCE FILE
    # -------------------------------------------------------------------------

    source_file = SourceFile(
        record_id=f"FILE-{batch_number:05d}",
        file_name=file_name,
        original_directory=os.path.dirname(file_path),
        extension=os.path.splitext(file_name)[1].lower(),
        file_size_bytes=file_size,
        file_hash=file_hash,
        last_modified=now,
        batch_id=batch_obj.id,
        batch_number=batch_number,
        processing_status="Processing",
        duplicate_status="Unique",
    )

    db.add(source_file)
    db.flush()

    total_records = 0
    mappings = []

    try:
        # ---------------------------------------------------------------------
        # READ EACH SHEET
        # ---------------------------------------------------------------------

        for sheet_name in xls.sheet_names:
            print()
            print(f"Sheet: {sheet_name}")

            # Read without assuming row 1 is the header. Some workbooks
            # contain a blank/title row before the real column headers.
            df_raw = pd.read_excel(
                xls,
                sheet_name=sheet_name,
                header=None,
            )

            # Detect the real header row by looking for known field names.
            # This handles sheets with a blank/title row before the actual headers
            # and prevents pivot/report sheets from being imported as "Unnamed:*".
            header_keywords = {
                "name",
                "nameen",
                "community",
                "area",
                "building",
                "building/cluster",
                "buildingnameen",
                "building name",
                "unit",
                "unit number",
                "unitnumber",
                "flat number",
                "property type",
                "propertysubtypenameen",
                "mobile",
                "mobile1",
                "mobile 1",
                "project",
                "procedurevalue",
                "procedure value",
                "procedurepartytypenameen",
                "actual area",
                "plot number",
                "plot pre reg no",
                "registration number",
                "municipality number",
            }

            header_row = None

            for candidate_index in range(min(15, len(df_raw))):
                candidate_values = {
                    normalize_header(value)
                    for value in df_raw.iloc[candidate_index].tolist()
                    if pd.notna(value)
                }

                matches = sum(
                    1
                    for keyword in header_keywords
                    if normalize_header(keyword) in candidate_values
                )

                if matches >= 2:
                    header_row = candidate_index
                    break

            if header_row is None:
                print("    No recognizable property header - skipped")
                continue

            # Re-read using the detected header row.
            df = pd.read_excel(
                xls,
                sheet_name=sheet_name,
                header=header_row,
            )

            # Remove completely empty rows/columns.
            df = df.dropna(
                axis=1,
                how="all",
            )
            df = df.dropna(
                how="all"
            ).reset_index(drop=True)

            print(
                f"    Detected header row: {header_row + 1}"
            )

            print(
                f"Rows: {len(df):,}"
            )

            if df.empty:
                print("    Empty sheet - skipped")
                continue

            print_sheet_mapping(
                df,
                file_name,
                sheet_name,
            )

            # -------------------------------------------------------------
            # BUILD RECORDS
            # -------------------------------------------------------------

            for row_idx, row in df.iterrows():
                record = build_record(
                    row=row,
                    file_name=file_name,
                    sheet_name=sheet_name,
                    row_number=row_idx + 1,
                    source_file_id=source_file.id,
                    batch_id=batch_obj.id,
                    now=now,
                )

                mappings.append(record)

                # Insert in chunks to prevent excessive memory usage.
                if len(mappings) >= chunk_size:
                    db.bulk_insert_mappings(
                        ConsolidatedRecord,
                        mappings,
                    )

                    db.commit()

                    total_records += len(mappings)

                    print(
                        f"    Inserted: {total_records:,}"
                    )

                    mappings = []

        # ---------------------------------------------------------------------
        # FINAL CHUNK
        # ---------------------------------------------------------------------

        if mappings:
            db.bulk_insert_mappings(
                ConsolidatedRecord,
                mappings,
            )

            db.commit()

            total_records += len(mappings)

            mappings = []

        # ---------------------------------------------------------------------
        # FINALIZE BATCH
        # ---------------------------------------------------------------------

        end_time = datetime.now(timezone.utc)

        batch_obj.number_of_records = total_records
        batch_obj.end_time = end_time
        batch_obj.status = "Completed"

        # Approximate processing time.
        try:
            batch_obj.processing_time_seconds = round(
                (
                    end_time - now
                ).total_seconds(),
                2,
            )
        except Exception:
            batch_obj.processing_time_seconds = 0

        source_file.processing_status = "Success"
        source_file.duplicate_status = "Unique"

        db.commit()

        print()
        print(
            f"SUCCESS: {total_records:,} records imported."
        )
        print(
            f"Batch: {batch_number}"
        )

        return {
            "status": "imported",
            "records": total_records,
        }

    except Exception:
        db.rollback()

        print()
        print(
            f"ERROR while importing {file_name}"
        )

        raise


# =============================================================================
# MAIN IMPORTER
# =============================================================================

def import_excel_files(
    input_dir,
    limit=None,
    chunk_size=DEFAULT_CHUNK_SIZE,
):
    print()
    print("=" * 80)
    print("LPH EXCEL IMPORTER")
    print("=" * 80)
    print()
    print(f"Input directory: {input_dir}")

    if not os.path.isdir(input_dir):
        print()
        print(
            f"[ERROR] Excel directory does not exist:\n"
            f"{input_dir}"
        )
        print()
        print(
            "Create/mount the directory in Easypanel "
            "before running the importer."
        )
        return 1

    excel_files = find_excel_files(input_dir)

    # Never import temporary Excel lock files.
    excel_files = [
        path
        for path in excel_files
        if not os.path.basename(path).startswith("~$")
        and not os.path.basename(path).startswith("_MASTER")
    ]

    if limit is not None:
        excel_files = excel_files[:limit]

    print(
        f"Excel files found: {len(excel_files)}"
    )

    if not excel_files:
        print()
        print("[ERROR] No Excel files found.")
        return 1

    db: Session = SessionLocal()

    try:
        # ---------------------------------------------------------------------
        # EXISTING HASHES
        # ---------------------------------------------------------------------

        existing_hashes = {
            row[0]
            for row in (
                db.query(SourceFile.file_hash)
                .filter(SourceFile.file_hash.isnot(None))
                .all()
            )
        }

        max_batch = (
            db.query(
                func.max(
                    BatchInfo.batch_number
                )
            )
            .scalar()
            or 0
        )

        next_batch = max_batch + 1

        print()
        print(
            f"Existing source files: "
            f"{len(existing_hashes)}"
        )

        print(
            f"Next batch number: "
            f"{next_batch}"
        )

        imported_files = 0
        skipped_files = 0
        failed_files = 0
        total_records = 0

        # ---------------------------------------------------------------------
        # PROCESS FILES
        # ---------------------------------------------------------------------

        for index, file_path in enumerate(
            excel_files,
            start=1,
        ):
            file_name = os.path.basename(file_path)

            print()
            print(
                f"[{index}/{len(excel_files)}] "
                f"Processing: {file_name}"
            )

            try:
                file_hash = calculate_file_hash(
                    file_path
                )

                if file_hash in existing_hashes:
                    print(
                        "    SKIPPED: Already imported"
                    )

                    skipped_files += 1
                    continue

                result = import_one_file(
                    db=db,
                    file_path=file_path,
                    batch_number=next_batch,
                    chunk_size=chunk_size,
                )

                if result["status"] == "imported":
                    imported_files += 1
                    total_records += result["records"]

                    existing_hashes.add(
                        file_hash
                    )

                    next_batch += 1

                elif result["status"] == "skipped":
                    skipped_files += 1

            except Exception as exc:
                failed_files += 1

                print()
                print(
                    f"ERROR: "
                    f"{type(exc).__name__}: {exc}"
                )

                # Make absolutely sure a failed file does not leave
                # half-created SQLAlchemy objects pending.
                db.rollback()

                print(
                    "File was rolled back and will not "
                    "be marked as imported."
                )

        # ---------------------------------------------------------------------
        # SUMMARY
        # ---------------------------------------------------------------------

        print()
        print("=" * 80)
        print("IMPORT SUMMARY")
        print("=" * 80)
        print(
            f"Files selected:       {len(excel_files)}"
        )
        print(
            f"Files imported:       {imported_files}"
        )
        print(
            f"Files skipped:        {skipped_files}"
        )
        print(
            f"Files failed:         {failed_files}"
        )
        print(
            f"Records imported:     {total_records:,}"
        )
        print("=" * 80)

        return 0 if failed_files == 0 else 1

    except Exception as exc:
        db.rollback()

        print()
        print(
            f"[FATAL ERROR] "
            f"{type(exc).__name__}: {exc}"
        )

        return 1

    finally:
        db.close()


# =============================================================================
# CLI
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description=(
            "Import Excel workbooks into the LPH "
            "ConsolidatedRecord PostgreSQL database."
        )
    )

    parser.add_argument(
        "--input-dir",
        default=DEFAULT_INPUT_DIR,
        help=(
            "Directory containing Excel files. "
            f"Default: {DEFAULT_INPUT_DIR}"
        ),
    )

    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help=(
            "Only process the first N Excel files. "
            "Useful for testing."
        ),
    )

    parser.add_argument(
        "--chunk-size",
        type=int,
        default=DEFAULT_CHUNK_SIZE,
        help=(
            "Number of records inserted per database chunk. "
            f"Default: {DEFAULT_CHUNK_SIZE}"
        ),
    )

    args = parser.parse_args()

    if args.limit is not None and args.limit < 1:
        parser.error(
            "--limit must be greater than 0"
        )

    if args.chunk_size < 1:
        parser.error(
            "--chunk-size must be greater than 0"
        )

    raise SystemExit(
        import_excel_files(
            input_dir=args.input_dir,
            limit=args.limit,
            chunk_size=args.chunk_size,
        )
    )


if __name__ == "__main__":
    main()