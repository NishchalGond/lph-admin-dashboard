import random
import datetime
import json
import hashlib
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.db.models import User, BatchInfo, SourceFile, ConsolidatedRecord, ProcessingLog, DuplicateRecord, UserRole, WorkflowRun, WorkflowStep

def get_password_hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def seed_data():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()

    print("Creating unique accounts for Admin, CEO, Marketing, and Developer...")
    admin_user = User(
        username="admin",
        email="admin@enterprise.com",
        hashed_password=get_password_hash("admin123"),
        full_name="System Administrator",
        role=UserRole.ADMIN.value
    )
    ceo_user = User(
        username="ceo",
        email="ceo@enterprise.com",
        hashed_password=get_password_hash("ceo123"),
        full_name="Chief Executive Officer",
        role=UserRole.CEO.value
    )
    marketing_user = User(
        username="marketing",
        email="marketing@enterprise.com",
        hashed_password=get_password_hash("marketing123"),
        full_name="Marketing Lead",
        role=UserRole.MARKETING.value
    )
    dev_user = User(
        username="developer",
        email="dev@enterprise.com",
        hashed_password=get_password_hash("dev123"),
        full_name="Lead Developer",
        role=UserRole.DEVELOPER.value
    )

    db.add_all([admin_user, ceo_user, marketing_user, dev_user])
    db.commit()

    print("Seeding Dubai Real Estate Property Batches, Source Files & Consolidated Records...")

    directories = [
        "/My Drive/Consolidation/Consolidated",
        "/My Drive/Consolidation/Source_Files/DubaiLand",
        "/My Drive/Consolidation/Source_Files/DamacHills",
        "/My Drive/Consolidation/Source_Files/Mudon",
        "/My Drive/Consolidation/Source_Files/Emaar"
    ]

    developers = ["DAMAC Properties", "Dubai Properties", "Emaar Properties", "Nakheel", "Sobha Realty"]
    projects = ["Damac Hills", "Mudon", "Arabella 2", "Town Square", "Dubai Land Residences", "Akoya Oxygen"]
    communities = ["MUDON", "DAMAC HILLS", "ARABELLA 2", "DUBAI LAND RESIDENCES", "TOWN SQUARE"]
    sub_communities = ["QUEENS MEADOES", "TOWN HOUSES", "THE FLORA", "AKOYA-L1", "TRUMP ESTATES"]
    building_clusters = [
        "ARABELLA 2 - TOWN HOUSES",
        "DAMAC HILLS - QUEENS MEADOWS",
        "DAMAC HILLS - THE FLORA",
        "DUBAI LAND RESIDENCES (L.L.C.)",
        "MUDON - PHASE 2"
    ]

    property_types = ["Residential", "Villa", "Townhouse", "Apartment", "Commercial"]
    nationalities = ["Emirati", "Indian", "Pakistani", "British", "Canadian", "Chinese", "Egyptian", "French", "Saudi"]
    buyer_seller_types = ["Buyer", "Seller"]

    sample_names = [
        "DUBAI LAND RESIDENCES (L.L.C.)", "OMAR EL HAJ", "AGHAYAR MUHAMMADRASOOL RAHPAIMA",
        "AHMAD ABDUL KAREEM AHMAD HIJAZI", "SAMER JAWDAT ABDULHADI ABULGHANI KHANFAR",
        "AHMED YOUSRY MOSTAFA KHATTAB", "ZMNAKO YASEEN QADER", "AIAZA MIR",
        "SHAMIL ABBAS ALWAN AL NAISANI", "AISHA AHMED KHAIRI YACOUB ABDELAAL",
        "AKBAR ALI MAZHAR HUSSAIN SHAH", "DAMAC CRESCENT PROPERTIES LLC",
        "AMIT KUMAR AGARWAL", "HUWAYDA ABDELAZIZ MOHAMED ALI", "AMIAD A M NAIM",
        "WEIDONG YU", "AMMAR KAMAL MOHAMMAD BALYYEH", "ANTOYANE MASSAD",
        "FAROUK MOHD AHMED SHAIKHON", "AHMED OMAR ABDULLAH BASHEER", "ANURAG SACHDEVA",
        "JAYESH KANT BHATIA", "ANWAR LATIF DAGHER", "ASHOK KUMAR MOTWANI"
    ]

    total_batches = 13
    total_files_counter = 1
    total_records_counter = 1

    file_hashes_pool = []
    created_source_files = []

    start_base_date = datetime.datetime.now() - datetime.timedelta(days=45)

    for b in range(1, total_batches + 1):
        num_files_in_batch = random.randint(20, 35)
        batch_start = start_base_date + datetime.timedelta(hours=b * 8)
        batch_duration = random.uniform(12.0, 38.0)
        batch_end = batch_start + datetime.timedelta(seconds=batch_duration)
        
        batch_status = "Completed" if b < total_batches else "In Progress"

        batch_obj = BatchInfo(
            batch_number=b,
            batch_name=f"Consolidated_Batch_{b:03d}",
            number_of_files=num_files_in_batch,
            number_of_records=0,
            processing_time_seconds=round(batch_duration, 2),
            start_time=batch_start,
            end_time=batch_end,
            status=batch_status,
            consolidated_file_path=f"/My Drive/Consolidation/Consolidated/Consolidated_Batch_{b:03d}.xlsx",
            created_at=batch_start
        )
        db.add(batch_obj)
        db.flush()

        batch_records_count = 0

        db.add(ProcessingLog(
            timestamp=batch_start,
            batch_id=batch_obj.id,
            batch_number=b,
            severity="INFO",
            message=f"Importing Dubai Land Real Estate batch #{b:03d} containing {num_files_in_batch} Excel workbooks.",
            source="RealEstateIngestor"
        ))

        for f in range(num_files_in_batch):
            ext = random.choice([".xlsx", ".xlsx", ".csv"])
            folder = random.choice(directories)
            base_fname = f"Consolidated_Batch_{b:03d}_File_{f+1:03d}"
            filename = f"{base_fname}{ext}"
            file_size = random.randint(45000, 680000)

            unique_str = f"{folder}/{filename}_{total_files_counter}"
            
            is_dup = False
            dup_of_id = None
            dup_type = "Unique"

            if len(file_hashes_pool) > 5 and random.random() < 0.10:
                target_dup_file = random.choice(file_hashes_pool)
                file_hash = target_dup_file["hash"]
                is_dup = True
                dup_of_id = target_dup_file["id"]
                dup_type = random.choice(["Duplicate Hash", "Duplicate Unit Number", "Identical Plot Registration"])
            else:
                file_hash = hashlib.sha256(unique_str.encode()).hexdigest()

            proc_status = "Success"
            if random.random() < 0.03:
                proc_status = "Failed"
            elif random.random() < 0.06:
                proc_status = "Warning"

            file_obj = SourceFile(
                record_id=f"FILE-2026-{total_files_counter:05d}",
                file_name=filename,
                original_directory=folder,
                extension=ext,
                file_size_bytes=file_size,
                file_hash=file_hash,
                last_modified=batch_start - datetime.timedelta(days=random.randint(1, 10)),
                batch_id=batch_obj.id,
                batch_number=b,
                processing_status=proc_status,
                duplicate_status=dup_type if is_dup else "Unique",
                duplicate_of_id=dup_of_id,
                created_time=batch_start
            )
            db.add(file_obj)
            db.flush()

            file_hashes_pool.append({"id": file_obj.id, "hash": file_hash, "name": filename})
            created_source_files.append(file_obj)

            if is_dup and dup_of_id:
                db.add(DuplicateRecord(
                    original_file_id=dup_of_id,
                    duplicate_file_id=file_obj.id,
                    duplicate_type=dup_type,
                    similarity_score=round(random.uniform(0.90, 1.0), 2),
                    detection_method="Plot Number & Unit Match"
                ))

            if proc_status != "Failed":
                num_records_in_file = random.randint(12, 30)
                for r in range(num_records_in_file):
                    name_val = random.choice(sample_names)
                    comm_val = random.choice(communities)
                    sub_comm_val = random.choice(sub_communities)
                    cluster_val = random.choice(building_clusters)
                    unit_num = str(1000 + random.randint(0, 150))
                    size_val = f"{random.choice([1250, 1500, 1850, 2200, 3100, 4500])} sq.ft"
                    plot_reg = f"MU.{random.choice(['A07', 'J02', 'L12', 'B05'])}.{random.randint(1000, 9999)}"
                    plot_num = f"AKOYA-L1 {unit_num}"
                    dmno_val = f"DM-{random.randint(10000, 99999)}"
                    dmsubno_val = f"SUB-{random.randint(1, 15):02d}"
                    bedroom_val = str(random.choice([1, 2, 3, 4, 5, "Studio"]))
                    buyer_seller = random.choice(buyer_seller_types)
                    m1 = f"97150{random.randint(1000000, 9999999)}"
                    m2 = f"97155{random.randint(1000000, 9999999)}" if random.random() > 0.3 else "0"
                    m3 = f"97104{random.randint(1000000, 9999999)}" if random.random() > 0.5 else "0"
                    
                    clean_email_name = name_val.split()[0].lower()
                    email_val = f"{clean_email_name}.{random.randint(10, 99)}@gmail.com"
                    pi_num = str(random.randint(2000000, 9999999))
                    nat_val = random.choice(nationalities)
                    prop_type = random.choice(property_types)
                    proc_val = float(random.choice([850000, 1250000, 1850000, 2400000, 3800000, 5200000]))
                    dev_val = random.choice(developers)
                    proj_val = random.choice(projects)
                    record_date = batch_start - datetime.timedelta(days=random.randint(0, 30))

                    raw_dict = {
                        "Name": name_val,
                        "Community": comm_val,
                        "Sub-Community": sub_comm_val,
                        "Building/Cluster": cluster_val,
                        "Unit Number": unit_num,
                        "Size": size_val,
                        "Plot Reg. No": plot_reg,
                        "Plot Number": plot_num,
                        "DMNO": dmno_val,
                        "DMsubno": dmsubno_val,
                        "Bedroom": bedroom_val,
                        "Type (Buyer/Seller)": buyer_seller,
                        "Mobile 1": m1,
                        "Mobile 2": m2,
                        "Mobile 3": m3,
                        "Email Address": email_val,
                        "PI number": pi_num,
                        "Nationality": nat_val,
                        "Property Type": prop_type,
                        "Date": record_date.strftime("%Y-%m-%d"),
                        "Procedure Value": proc_val,
                        "Developer": dev_val,
                        "Project": proj_val,
                        "SourceWorkbook": filename,
                        "SourceRow": r + 2
                    }

                    rec_obj = ConsolidatedRecord(
                        source_file_id=file_obj.id,
                        batch_id=batch_obj.id,
                        original_workbook=filename,
                        sheet_name="Sheet1",
                        row_number=r + 2,
                        
                        name=name_val,
                        community=comm_val,
                        sub_community=sub_comm_val,
                        building_cluster=cluster_val,
                        unit_number=unit_num,
                        size=size_val,
                        plot_reg_no=plot_reg,
                        plot_number=plot_num,
                        dmno=dmno_val,
                        dmsubno=dmsubno_val,
                        bedroom=bedroom_val,
                        buyer_seller_type=buyer_seller,
                        mobile_1=m1,
                        mobile_2=m2,
                        mobile_3=m3,
                        email_address=email_val,
                        pi_number=pi_num,
                        nationality=nat_val,
                        property_type=prop_type,
                        date=record_date,
                        procedure_value=proc_val,
                        developer=dev_val,
                        project=proj_val,

                        # Aliases for backward compatibility
                        customer_name=name_val,
                        company=cluster_val,
                        category=prop_type,
                        amount=proc_val,
                        status="Registered",
                        region=comm_val,
                        transaction_id=f"PI-{pi_num}",

                        raw_data_json=json.dumps(raw_dict),
                        created_at=batch_start
                    )
                    db.add(rec_obj)
                    batch_records_count += 1
                    total_records_counter += 1

            total_files_counter += 1

        batch_obj.number_of_records = batch_records_count
        
        db.add(ProcessingLog(
            timestamp=batch_end,
            batch_id=batch_obj.id,
            batch_number=b,
            severity="INFO",
            message=f"Batch #{b:03d} completed successfully. Consolidated {batch_records_count} property records into SQLite DB.",
            source="RealEstateIngestor"
        ))

        print(f"Batch {b}/{total_batches} seeded - {num_files_in_batch} files, {batch_records_count} property records.")

    # ====================================
    # Seed Demo n8n Workflow Runs
    # ====================================
    print("Seeding demo n8n workflow runs...")

    n8n_step_names = [
        "Trigger & Schedule",
        "Load Google Sheet Config",
        "Discover Processing Folder",
        "Download File Lists",
        "Filter & Validate Files",
        "Aggregate Batch Files",
        "Compare Batch Numbers",
        "Smart Consolidation",
        "Duplicate Detection",
        "Build Batch File Row",
        "Create Batch Sheet In Drive",
        "Build Partition Data",
        "Stream Partition Data",
        "Insert Partition Data to Sheets",
        "Upload To Google Sheets",
        "Generate Manifest XLSX",
    ]

    # Run 1: A completed past run
    run1_start = datetime.datetime.now() - datetime.timedelta(hours=6)
    run1 = WorkflowRun(
        execution_id="exec-n8n-4821",
        workflow_name="LPH Master Consolidator",
        status="COMPLETED",
        total_steps=len(n8n_step_names),
        completed_steps=len(n8n_step_names),
        current_step_name="Completed",
        progress_percentage=100.0,
        eta_seconds=0,
        total_records_pushed=1247,
        total_batches_created=3,
        started_at=run1_start,
        completed_at=run1_start + datetime.timedelta(minutes=14, seconds=32),
        created_at=run1_start
    )
    db.add(run1)
    db.flush()

    for idx, sname in enumerate(n8n_step_names):
        step_start = run1_start + datetime.timedelta(seconds=idx * 52)
        db.add(WorkflowStep(
            workflow_run_id=run1.id,
            step_index=idx,
            step_name=sname,
            status="COMPLETED",
            started_at=step_start,
            completed_at=step_start + datetime.timedelta(seconds=random.randint(8, 50)),
            items_processed=random.randint(30, 200),
            items_total=random.randint(30, 200),
            message=f"Processed successfully"
        ))

    # Run 2: Currently "running" (simulated mid-progress) for live demo
    run2_start = datetime.datetime.now() - datetime.timedelta(minutes=8)
    completed_steps_count = 10  # 10 of 16 done
    run2 = WorkflowRun(
        execution_id="exec-n8n-4822",
        workflow_name="LPH Master Consolidator",
        status="RUNNING",
        total_steps=len(n8n_step_names),
        completed_steps=completed_steps_count,
        current_step_name=n8n_step_names[completed_steps_count],
        progress_percentage=round((completed_steps_count / len(n8n_step_names)) * 100, 1),
        eta_seconds=210,
        total_records_pushed=834,
        total_batches_created=2,
        started_at=run2_start,
        created_at=run2_start
    )
    db.add(run2)
    db.flush()

    for idx, sname in enumerate(n8n_step_names):
        step_start = run2_start + datetime.timedelta(seconds=idx * 45)
        if idx < completed_steps_count:
            st = "COMPLETED"
            step_end = step_start + datetime.timedelta(seconds=random.randint(10, 40))
            items_p = random.randint(50, 180)
            items_t = items_p
            msg = "Processed successfully"
        elif idx == completed_steps_count:
            st = "RUNNING"
            step_end = None
            items_p = random.randint(20, 80)
            items_t = random.randint(100, 200)
            msg = f"Processing batch data... ({items_p}/{items_t} items)"
        else:
            st = "PENDING"
            step_start = None
            step_end = None
            items_p = 0
            items_t = 0
            msg = None

        db.add(WorkflowStep(
            workflow_run_id=run2.id,
            step_index=idx,
            step_name=sname,
            status=st,
            started_at=step_start,
            completed_at=step_end,
            items_processed=items_p,
            items_total=items_t,
            message=msg
        ))

    # Add n8n-specific log entries
    db.add(ProcessingLog(
        timestamp=run2_start,
        severity="INFO",
        message="n8n workflow 'LPH Master Consolidator' started (execution: exec-n8n-4822)",
        source="n8nWebhook"
    ))
    for idx in range(completed_steps_count):
        db.add(ProcessingLog(
            timestamp=run2_start + datetime.timedelta(seconds=idx * 45 + 40),
            severity="INFO",
            message=f"[Step {idx + 1}/{len(n8n_step_names)}] {n8n_step_names[idx]}: COMPLETED",
            source="n8nWebhook"
        ))
    db.add(ProcessingLog(
        timestamp=run2_start + datetime.timedelta(seconds=completed_steps_count * 45),
        severity="INFO",
        message=f"[Step {completed_steps_count + 1}/{len(n8n_step_names)}] {n8n_step_names[completed_steps_count]}: RUNNING — Processing batch data...",
        source="n8nWebhook"
    ))

    print(f"Seeded 2 workflow runs ({len(n8n_step_names)} steps each).")

    db.commit()
    db.close()
    print("Database seeding with 23 Real Estate headers + n8n workflow runs completed successfully!")

if __name__ == "__main__":
    seed_data()


