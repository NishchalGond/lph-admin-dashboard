from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class LoginRequest(BaseModel):
    username: str
    password: str

class PasswordLoginRequest(BaseModel):
    password: str

class UserSchema(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# Pagination wrapper
class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[Any]

# Batch Schemas
class BatchSchema(BaseModel):
    id: int
    batch_number: int
    batch_name: str
    number_of_files: int
    number_of_records: int
    processing_time_seconds: float
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: str
    consolidated_file_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Source File Schemas
class SourceFileSchema(BaseModel):
    id: int
    record_id: str
    file_name: str
    original_directory: str
    extension: str
    file_size_bytes: int
    file_hash: str
    last_modified: datetime
    batch_id: int
    batch_number: int
    processing_status: str
    duplicate_status: str
    duplicate_of_id: Optional[int] = None
    created_time: datetime

    class Config:
        from_attributes = True

# Consolidated Record Schemas
class ConsolidatedRecordSchema(BaseModel):
    id: int
    source_file_id: int
    batch_id: int
    original_workbook: str
    sheet_name: str
    row_number: int
    
    # 23 Real Estate Property Headers
    name: Optional[str] = None
    community: Optional[str] = None
    sub_community: Optional[str] = None
    building_cluster: Optional[str] = None
    unit_number: Optional[str] = None
    size: Optional[str] = None
    plot_reg_no: Optional[str] = None
    plot_number: Optional[str] = None
    dmno: Optional[str] = None
    dmsubno: Optional[str] = None
    bedroom: Optional[str] = None
    buyer_seller_type: Optional[str] = None
    mobile_1: Optional[str] = None
    mobile_2: Optional[str] = None
    mobile_3: Optional[str] = None
    email_address: Optional[str] = None
    pi_number: Optional[str] = None
    nationality: Optional[str] = None
    property_type: Optional[str] = None
    date: Optional[datetime] = None
    procedure_value: Optional[float] = None
    developer: Optional[str] = None
    project: Optional[str] = None

    # Legacy fields
    transaction_id: Optional[str] = None
    customer_name: Optional[str] = None
    company: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[str] = None
    region: Optional[str] = None
    raw_data_json: Optional[str] = None
    created_at: datetime

    # AI Match attributes
    match_score: Optional[int] = None
    match_reasons: Optional[List[str]] = None

    class Config:
        from_attributes = True

# AI Semantic Search Schemas
class ParsedIntentSchema(BaseModel):
    raw_query: str
    normalized_query: Optional[str] = None
    property_type: Optional[str] = None
    community: Optional[str] = None
    building_cluster: Optional[str] = None
    tower: Optional[str] = None
    unit_number: Optional[str] = None
    plot_number: Optional[str] = None
    owner_name: Optional[str] = None
    nationality: Optional[str] = None
    developer: Optional[str] = None
    size_min: Optional[float] = None
    size_max: Optional[float] = None
    size_approx: Optional[float] = None
    target_field: Optional[str] = "all"
    tokens: Optional[List[str]] = []
    confidence_level: Optional[str] = "High"

class SemanticSearchResponseSchema(BaseModel):
    query: str
    intent: ParsedIntentSchema
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[ConsolidatedRecordSchema]
    suggestions: Optional[List[str]] = []


# Log Schema
class ProcessingLogSchema(BaseModel):
    id: int
    timestamp: datetime
    batch_id: Optional[int] = None
    batch_number: Optional[int] = None
    severity: str
    message: str
    source: str

    class Config:
        from_attributes = True

# Duplicate Record Schema
class DuplicateRecordSchema(BaseModel):
    id: int
    original_file_id: int
    duplicate_file_id: int
    duplicate_type: str
    similarity_score: float
    detection_method: str
    created_at: datetime
    original_file: Optional[SourceFileSchema] = None
    duplicate_file: Optional[SourceFileSchema] = None

    class Config:
        from_attributes = True

# Dashboard Home Summary Schema
class DashboardSummary(BaseModel):
    total_files: int
    total_records: int
    total_batches: int
    total_duplicates: int
    failed_files: int
    processing_success_rate: float
    last_run_time: Optional[datetime] = None
    storage_used_bytes: int
    recent_batches: List[BatchSchema]
    file_status_breakdown: Dict[str, int]
    category_breakdown: Dict[str, int]

# ============================
# Webhook & Workflow Schemas
# ============================

# Webhook payloads from n8n
class WebhookWorkflowStart(BaseModel):
    execution_id: Optional[str] = None
    workflow_name: Optional[str] = "LPH Master Consolidator"
    total_steps: int = 12
    step_names: Optional[List[str]] = None

class WebhookStepUpdate(BaseModel):
    execution_id: Optional[str] = None
    step_index: int
    step_name: str
    status: str = "RUNNING"  # RUNNING, COMPLETED, FAILED, SKIPPED
    items_processed: Optional[int] = 0
    items_total: Optional[int] = 0
    message: Optional[str] = None

class WebhookBatchData(BaseModel):
    execution_id: Optional[str] = None
    batch_name: Optional[str] = None
    records: List[Dict[str, Any]]

class WebhookWorkflowComplete(BaseModel):
    execution_id: Optional[str] = None
    status: str = "COMPLETED"  # COMPLETED, FAILED
    error_message: Optional[str] = None
    total_records_pushed: Optional[int] = 0
    total_batches_created: Optional[int] = 0

# Workflow live status response
class WorkflowStepSchema(BaseModel):
    id: int
    step_index: int
    step_name: str
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    items_processed: int = 0
    items_total: int = 0
    message: Optional[str] = None

    class Config:
        from_attributes = True

class WorkflowRunSchema(BaseModel):
    id: int
    execution_id: Optional[str] = None
    workflow_name: str
    status: str
    total_steps: int
    completed_steps: int
    current_step_name: Optional[str] = None
    progress_percentage: float
    eta_seconds: int
    total_records_pushed: int
    total_batches_created: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime
    steps: List[WorkflowStepSchema] = []

    class Config:
        from_attributes = True

