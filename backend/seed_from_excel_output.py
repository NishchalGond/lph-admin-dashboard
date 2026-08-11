import os
import glob
import pandas as pd
import json
import hashlib
from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.db.models import BatchInfo, SourceFile, ConsolidatedRecord, DuplicateRecord, ProcessingLog

EXCEL_OUTPUT_DIR = r"C:\Users\USER\Downloads\Consolidated"

def clean_val(val, default=""):
    if pd.isna(val) or val is None:
        return default
    s = str(val).strip()
    if s.lower() in ("nan", "none", "null", "undefined"):
        return default
    return s

def import_all_excel_output(target_dir=EXCEL_OUTPUT_DIR):
    if not os.path.exists(target_dir):
        print(f"[ERROR] Directory not found: {target_dir}")
        return

    print(f"Scanning Excel output directory: {target_dir}")
    excel_files = sorted(glob.glob(os.path.join(target_dir, "*.xlsx")) + glob.glob(os.path.join(target_dir, "*.xls")))

    print(f"Found {len(excel_files)} Excel files to ingest into Easypanel PostgreSQL.")

    db: Session = SessionLocal()
    try:
        existing_hashes = set(r[0] for r in db.query(SourceFile.file_hash).all())
        max_batch = db.query(func.max(BatchInfo.batch_number)).scalar() or 0
        current_batch_num = max_batch + 1

        print(f"Existing imported files: {len(existing_hashes)}. Next batch number: {current_batch_num}")

        batch_count = 0
        total_records_imported = 0

        for i, file_path in enumerate(excel_files, 1):
            file_name = os.path.basename(file_path)
            if file_name.startswith("~$") or file_name.startswith("_MASTER"):
                continue

            file_size = os.path.getsize(file_path)
            
            with open(file_path, "rb") as f:
                file_hash = hashlib.sha256(f.read(65536)).hexdigest()

            if file_hash in existing_hashes:
                print(f"[{i}/{len(excel_files)}] Skipping {file_name} (Already imported)")
                continue

            now = datetime.utcnow()

            # Create Batch Record
            batch_obj = BatchInfo(
                batch_number=current_batch_num,
                batch_name=f"Batch_{current_batch_num:04d}_Consolidated",
                number_of_files=1,
                number_of_records=0,
                processing_time_seconds=round(file_size / 500000.0, 2),
                start_time=now,
                end_time=now,
                status="Completed",
                consolidated_file_path=file_path,
                created_at=now
            )
            db.add(batch_obj)
            db.flush()

            # Create SourceFile Record
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
                processing_status="Success",
                duplicate_status="Unique"
            )
            db.add(source_file)
            db.flush()

            # Read Excel sheet into pandas DataFrame & convert to dict mappings for fast bulk insertion
            try:
                xls = pd.ExcelFile(file_path)
                mappings = []
                
                for sheet_name in xls.sheet_names:
                    df = pd.read_excel(xls, sheet_name=sheet_name).fillna("")
                    
                    for row_idx, row in df.iterrows():
                        owner_name = clean_val(row.get("Name") or row.get("name") or row.get("Owner"), "Property Owner")
                        comm = clean_val(row.get("Community") or row.get("community"), "Dubai")
                        sub_comm = clean_val(row.get("Sub-Community") or row.get("sub_community"))
                        bldg = clean_val(row.get("Building/Cluster") or row.get("building_cluster") or row.get("Building"))
                        unit = clean_val(row.get("Unit Number") or row.get("unit_number"))
                        sz = clean_val(row.get("Size") or row.get("size") or row.get("Area"))
                        plot_reg = clean_val(row.get("Plot Reg. No") or row.get("plot_reg_no"))
                        plot_num = clean_val(row.get("Plot Number") or row.get("plot_number"))
                        dm = clean_val(row.get("DMNO") or row.get("dmno"))
                        dmsub = clean_val(row.get("DMsubno") or row.get("dmsubno"))
                        bed = clean_val(row.get("Bedroom") or row.get("bedroom"))
                        bs_type = clean_val(row.get("Type") or row.get("buyer_seller_type"), "Buyer")
                        m1 = clean_val(row.get("Mobile 1") or row.get("mobile_1"))
                        m2 = clean_val(row.get("Mobile 2") or row.get("mobile_2"))
                        m3 = clean_val(row.get("Mobile 3") or row.get("mobile_3"))
                        email = clean_val(row.get("Email Address") or row.get("email_address"))
                        pi = clean_val(row.get("PI number") or row.get("pi_number"))
                        nat = clean_val(row.get("Nationality") or row.get("nationality"))
                        prop_type = clean_val(row.get("Property Type") or row.get("property_type"), "Apartment")
                        dev = clean_val(row.get("Developer") or row.get("developer"))
                        proj = clean_val(row.get("Project") or row.get("project"))

                        raw_val = row.get("Procedure Value") or row.get("procedure_value")
                        try:
                            val_num = float(raw_val) if (raw_val and str(raw_val).strip() != "") else 0.0
                        except Exception:
                            val_num = 0.0

                        mappings.append({
                            "source_file_id": source_file.id,
                            "batch_id": batch_obj.id,
                            "original_workbook": file_name,
                            "sheet_name": str(sheet_name),
                            "row_number": int(row_idx + 1),
                            "name": owner_name,
                            "community": comm,
                            "sub_community": sub_comm,
                            "building_cluster": bldg,
                            "unit_number": unit,
                            "size": sz,
                            "plot_reg_no": plot_reg,
                            "plot_number": plot_num,
                            "dmno": dm,
                            "dmsubno": dmsub,
                            "bedroom": bed,
                            "buyer_seller_type": bs_type,
                            "mobile_1": m1,
                            "mobile_2": m2,
                            "mobile_3": m3,
                            "email_address": email,
                            "pi_number": pi,
                            "nationality": nat,
                            "property_type": prop_type,
                            "date": now,
                            "procedure_value": val_num,
                            "developer": dev,
                            "project": proj,
                            "created_time": now
                        })

                if mappings:
                    # Chunk insert in batches of 5000 for maximum PostgreSQL speed
                    CHUNK_SIZE = 5000
                    for c in range(0, len(mappings), CHUNK_SIZE):
                        chunk = mappings[c:c + CHUNK_SIZE]
                        db.bulk_insert_mappings(ConsolidatedRecord, chunk)
                        db.commit()

                    batch_obj.number_of_records = len(mappings)
                    total_records_imported += len(mappings)
                    batch_count += 1
                    current_batch_num += 1
                    existing_hashes.add(file_hash)
                    db.commit()
                    print(f"[{i}/{len(excel_files)}] Imported {file_name}: {len(mappings):,} records.")

            except Exception as e:
                db.rollback()
                print(f"[WARNING] Skipping {file_name}: {e}")

        print(f"\n[SUMMARY] Ingested {batch_count} new batches ({total_records_imported:,} new records) into Easypanel PostgreSQL!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Import failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import_all_excel_output()
