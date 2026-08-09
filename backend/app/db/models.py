import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum, Index
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    CEO = "ceo"
    MARKETING = "marketing"
    DEVELOPER = "developer"
    MANAGER = "manager"
    VIEWER = "viewer"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default=UserRole.VIEWER.value)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class BatchInfo(Base):
    __tablename__ = "batch_info"

    id = Column(Integer, primary_key=True, index=True)
    batch_number = Column(Integer, unique=True, index=True, nullable=False)
    batch_name = Column(String, index=True, nullable=False)
    number_of_files = Column(Integer, default=0)
    number_of_records = Column(Integer, default=0)
    processing_time_seconds = Column(Float, default=0.0)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    status = Column(String, index=True, default="Completed") # Completed, In Progress, Failed
    consolidated_file_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    files = relationship("SourceFile", back_populates="batch", cascade="all, delete-orphan")
    records = relationship("ConsolidatedRecord", back_populates="batch", cascade="all, delete-orphan")
    logs = relationship("ProcessingLog", back_populates="batch", cascade="all, delete-orphan")

class SourceFile(Base):
    __tablename__ = "source_files"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(String, unique=True, index=True, nullable=False) # e.g. FILE-2026-00001
    file_name = Column(String, index=True, nullable=False)
    original_directory = Column(String, index=True, nullable=False)
    extension = Column(String, index=True, nullable=False) # .xlsx, .xls, .csv
    file_size_bytes = Column(Integer, nullable=False)
    file_hash = Column(String, index=True, nullable=False)
    last_modified = Column(DateTime, nullable=False)
    batch_id = Column(Integer, ForeignKey("batch_info.id"), index=True, nullable=False)
    batch_number = Column(Integer, index=True, nullable=False)
    processing_status = Column(String, index=True, default="Success") # Success, Warning, Failed
    duplicate_status = Column(String, index=True, default="Unique") # Unique, Duplicate, Master
    duplicate_of_id = Column(Integer, ForeignKey("source_files.id"), nullable=True)
    created_time = Column(DateTime, default=datetime.datetime.utcnow)

    batch = relationship("BatchInfo", back_populates="files")
    records = relationship("ConsolidatedRecord", back_populates="source_file", cascade="all, delete-orphan")
    duplicate_of = relationship("SourceFile", remote_side=[id])

class ConsolidatedRecord(Base):
    __tablename__ = "consolidated_records"

    id = Column(Integer, primary_key=True, index=True)
    source_file_id = Column(Integer, ForeignKey("source_files.id"), index=True, nullable=False)
    batch_id = Column(Integer, ForeignKey("batch_info.id"), index=True, nullable=False)
    original_workbook = Column(String, index=True, nullable=False)
    sheet_name = Column(String, nullable=False)
    row_number = Column(Integer, nullable=False)
    
    # 23 Real Estate Property Headers matching Google Drive sheet
    name = Column(String, index=True, nullable=True)               # 1. Name
    community = Column(String, index=True, nullable=True)          # 2. Community
    sub_community = Column(String, index=True, nullable=True)      # 3. Sub-Community
    building_cluster = Column(String, index=True, nullable=True)   # 4. Building/Cluster
    unit_number = Column(String, index=True, nullable=True)        # 5. Unit Number
    size = Column(String, nullable=True)                           # 6. Size
    plot_reg_no = Column(String, index=True, nullable=True)        # 7. Plot Reg. No
    plot_number = Column(String, index=True, nullable=True)        # 8. Plot Number
    dmno = Column(String, index=True, nullable=True)               # 9. DMNO
    dmsubno = Column(String, index=True, nullable=True)            # 10. DMsubno
    bedroom = Column(String, index=True, nullable=True)            # 11. Bedroom
    buyer_seller_type = Column(String, index=True, nullable=True)  # 12. Type (Buyer/Seller)
    mobile_1 = Column(String, index=True, nullable=True)          # 13. Mobile 1
    mobile_2 = Column(String, index=True, nullable=True)          # 14. Mobile 2
    mobile_3 = Column(String, index=True, nullable=True)          # 15. Mobile 3
    email_address = Column(String, index=True, nullable=True)      # 16. Email Address
    pi_number = Column(String, index=True, nullable=True)          # 17. PI number
    nationality = Column(String, index=True, nullable=True)        # 18. Nationality
    property_type = Column(String, index=True, nullable=True)      # 19. Property Type
    date = Column(DateTime, nullable=True)                         # 20. Date
    procedure_value = Column(Float, nullable=True)                 # 21. Procedure Value
    developer = Column(String, index=True, nullable=True)          # 22. Developer
    project = Column(String, index=True, nullable=True)            # 23. Project

    # Backward compatibility aliases/fields
    transaction_id = Column(String, index=True, nullable=True)
    customer_name = Column(String, index=True, nullable=True)
    company = Column(String, index=True, nullable=True)
    category = Column(String, index=True, nullable=True)
    amount = Column(Float, nullable=True)
    status = Column(String, index=True, nullable=True)
    region = Column(String, index=True, nullable=True)
    
    # Store raw dynamic JSON string
    raw_data_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    source_file = relationship("SourceFile", back_populates="records")
    batch = relationship("BatchInfo", back_populates="records")

class ProcessingLog(Base):
    __tablename__ = "processing_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    batch_id = Column(Integer, ForeignKey("batch_info.id"), index=True, nullable=True)
    batch_number = Column(Integer, index=True, nullable=True)
    severity = Column(String, index=True, nullable=False) # INFO, WARNING, ERROR
    message = Column(Text, nullable=False)
    source = Column(String, nullable=False, default="ExcelProcessor")

    batch = relationship("BatchInfo", back_populates="logs")

class DuplicateRecord(Base):
    __tablename__ = "duplicate_records"

    id = Column(Integer, primary_key=True, index=True)
    original_file_id = Column(Integer, ForeignKey("source_files.id"), index=True, nullable=False)
    duplicate_file_id = Column(Integer, ForeignKey("source_files.id"), index=True, nullable=False)
    duplicate_type = Column(String, index=True, nullable=False) # Hash Match, Filename Match, Size & Content Match
    similarity_score = Column(Float, default=1.0) # 0.0 to 1.0
    detection_method = Column(String, nullable=False) # SHA256, Exact Match, Fuzzy Score
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    original_file = relationship("SourceFile", foreign_keys=[original_file_id])
    duplicate_file = relationship("SourceFile", foreign_keys=[duplicate_file_id])

class WorkflowRun(Base):
    __tablename__ = "workflow_runs"

    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(String, unique=True, index=True, nullable=True)  # n8n execution ID
    workflow_name = Column(String, nullable=False, default="LPH Master Consolidator")
    status = Column(String, index=True, nullable=False, default="PENDING")  # PENDING, RUNNING, COMPLETED, FAILED
    total_steps = Column(Integer, default=0)
    completed_steps = Column(Integer, default=0)
    current_step_name = Column(String, nullable=True)
    progress_percentage = Column(Float, default=0.0)
    eta_seconds = Column(Integer, default=0)
    total_records_pushed = Column(Integer, default=0)
    total_batches_created = Column(Integer, default=0)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    steps = relationship("WorkflowStep", back_populates="workflow_run", cascade="all, delete-orphan",
                         order_by="WorkflowStep.step_index")

class WorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id = Column(Integer, primary_key=True, index=True)
    workflow_run_id = Column(Integer, ForeignKey("workflow_runs.id"), index=True, nullable=False)
    step_index = Column(Integer, nullable=False)
    step_name = Column(String, nullable=False)
    status = Column(String, index=True, nullable=False, default="PENDING")  # PENDING, RUNNING, COMPLETED, FAILED, SKIPPED
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    items_processed = Column(Integer, default=0)
    items_total = Column(Integer, default=0)
    message = Column(Text, nullable=True)

    workflow_run = relationship("WorkflowRun", back_populates="steps")

# Indexes for fast search & filtering
Index("idx_records_property_search", ConsolidatedRecord.name, ConsolidatedRecord.community, ConsolidatedRecord.building_cluster, ConsolidatedRecord.unit_number)
Index("idx_records_contact_search", ConsolidatedRecord.mobile_1, ConsolidatedRecord.email_address, ConsolidatedRecord.pi_number)
Index("idx_records_dev_search", ConsolidatedRecord.developer, ConsolidatedRecord.project, ConsolidatedRecord.plot_reg_no)
Index("idx_files_search", SourceFile.file_name, SourceFile.original_directory)
Index("idx_workflow_run_status", WorkflowRun.status, WorkflowRun.created_at)

# Webhook API Key for n8n integration
WEBHOOK_API_KEY = "lph-webhook-secret-2026"

