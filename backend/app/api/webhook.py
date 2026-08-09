"""
Webhook endpoints for n8n workflow integration.
n8n calls these endpoints at key stages to push progress updates and data.
All endpoints are secured with an X-Webhook-Key header.
"""
import datetime
import json
import hashlib
import random
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional

from app.core.database import get_db
from app.db.models import (
    WorkflowRun, WorkflowStep, BatchInfo, SourceFile,
    ConsolidatedRecord, ProcessingLog, WEBHOOK_API_KEY
)
from app.schemas.schemas import (
    WebhookWorkflowStart, WebhookStepUpdate,
    WebhookBatchData, WebhookWorkflowComplete,
    WorkflowRunSchema, WorkflowStepSchema
)

router = APIRouter()


def verify_webhook_key(x_webhook_key: str = Header(default=None)):
    """Verify the webhook API key from n8n."""
    if not x_webhook_key or x_webhook_key != WEBHOOK_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing webhook key"
        )


# ------------------------------------------
# 1. Workflow Start — called when n8n begins
# ------------------------------------------
@router.post("/webhook/workflow-start")
def workflow_start(
    payload: WebhookWorkflowStart,
    db: Session = Depends(get_db),
    _: None = Depends(verify_webhook_key)
):
    # Create a new workflow run
    run = WorkflowRun(
        execution_id=payload.execution_id,
        workflow_name=payload.workflow_name or "LPH Master Consolidator",
        status="RUNNING",
        total_steps=payload.total_steps,
        completed_steps=0,
        current_step_name="Initializing",
        progress_percentage=0.0,
        started_at=datetime.datetime.utcnow(),
    )
    db.add(run)
    db.flush()

    # Pre-create step placeholders if step_names provided
    default_steps = payload.step_names or [
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

    for idx, step_name in enumerate(default_steps):
        step = WorkflowStep(
            workflow_run_id=run.id,
            step_index=idx,
            step_name=step_name,
            status="PENDING"
        )
        db.add(step)

    run.total_steps = len(default_steps)

    # Log it
    db.add(ProcessingLog(
        timestamp=datetime.datetime.utcnow(),
        severity="INFO",
        message=f"n8n workflow '{run.workflow_name}' started (execution: {payload.execution_id or 'manual'})",
        source="n8nWebhook"
    ))

    db.commit()
    db.refresh(run)

    return {
        "status": "ok",
        "workflow_run_id": run.id,
        "message": f"Workflow run #{run.id} created with {run.total_steps} steps"
    }


# ------------------------------------------
# 2. Step Update — called after each major n8n node
# ------------------------------------------
@router.post("/webhook/step-update")
def step_update(
    payload: WebhookStepUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(verify_webhook_key)
):
    # Find the latest running workflow
    run = db.query(WorkflowRun).filter(
        WorkflowRun.status == "RUNNING"
    ).order_by(desc(WorkflowRun.id)).first()

    if not run:
        raise HTTPException(status_code=404, detail="No active workflow run found")

    # Find or create the step
    step = db.query(WorkflowStep).filter(
        WorkflowStep.workflow_run_id == run.id,
        WorkflowStep.step_index == payload.step_index
    ).first()

    now = datetime.datetime.utcnow()

    if step:
        step.step_name = payload.step_name
        step.status = payload.status
        step.items_processed = payload.items_processed or 0
        step.items_total = payload.items_total or 0
        step.message = payload.message
        if payload.status == "RUNNING" and not step.started_at:
            step.started_at = now
        if payload.status in ("COMPLETED", "FAILED", "SKIPPED"):
            step.completed_at = now
    else:
        step = WorkflowStep(
            workflow_run_id=run.id,
            step_index=payload.step_index,
            step_name=payload.step_name,
            status=payload.status,
            started_at=now if payload.status == "RUNNING" else None,
            completed_at=now if payload.status in ("COMPLETED", "FAILED", "SKIPPED") else None,
            items_processed=payload.items_processed or 0,
            items_total=payload.items_total or 0,
            message=payload.message,
        )
        db.add(step)

    # Mark all previous steps as completed if they're still pending/running
    if payload.status == "RUNNING":
        prev_steps = db.query(WorkflowStep).filter(
            WorkflowStep.workflow_run_id == run.id,
            WorkflowStep.step_index < payload.step_index,
            WorkflowStep.status.in_(["PENDING", "RUNNING"])
        ).all()
        for ps in prev_steps:
            ps.status = "COMPLETED"
            ps.completed_at = ps.completed_at or now

    # Update run progress
    completed_count = db.query(WorkflowStep).filter(
        WorkflowStep.workflow_run_id == run.id,
        WorkflowStep.status.in_(["COMPLETED", "SKIPPED"])
    ).count()

    run.completed_steps = completed_count
    run.current_step_name = payload.step_name
    run.progress_percentage = round((completed_count / run.total_steps * 100), 1) if run.total_steps > 0 else 0

    # Estimate ETA based on elapsed time
    if run.started_at and completed_count > 0:
        elapsed = (now - run.started_at).total_seconds()
        rate = elapsed / completed_count
        remaining = run.total_steps - completed_count
        run.eta_seconds = int(rate * remaining)

    # Add log entry
    db.add(ProcessingLog(
        timestamp=now,
        severity="INFO" if payload.status != "FAILED" else "ERROR",
        message=f"[Step {payload.step_index + 1}/{run.total_steps}] {payload.step_name}: {payload.status}" +
                (f" — {payload.message}" if payload.message else ""),
        source="n8nWebhook"
    ))

    db.commit()

    return {
        "status": "ok",
        "progress_percentage": run.progress_percentage,
        "completed_steps": run.completed_steps
    }


# ------------------------------------------
# 3. Batch Data — pushes consolidated records
# ------------------------------------------
@router.post("/webhook/batch-data")
def batch_data(
    payload: WebhookBatchData,
    db: Session = Depends(get_db),
    _: None = Depends(verify_webhook_key)
):
    now = datetime.datetime.utcnow()

    # Find latest running workflow
    run = db.query(WorkflowRun).filter(
        WorkflowRun.status == "RUNNING"
    ).order_by(desc(WorkflowRun.id)).first()

    # Determine the next batch number
    max_batch = db.query(BatchInfo).order_by(desc(BatchInfo.batch_number)).first()
    next_batch_num = (max_batch.batch_number + 1) if max_batch else 1

    batch_name = payload.batch_name or f"n8n_Batch_{next_batch_num:03d}"

    # Create batch
    batch = BatchInfo(
        batch_number=next_batch_num,
        batch_name=batch_name,
        number_of_files=1,
        number_of_records=len(payload.records),
        processing_time_seconds=0,
        start_time=now,
        end_time=now,
        status="Completed",
        consolidated_file_path=f"/n8n/batches/{batch_name}.xlsx",
    )
    db.add(batch)
    db.flush()

    # Create a virtual source file for this n8n batch
    file_hash = hashlib.sha256(f"n8n_{batch_name}_{now.isoformat()}".encode()).hexdigest()
    source_file = SourceFile(
        record_id=f"N8N-{now.strftime('%Y')}-{next_batch_num:05d}",
        file_name=f"{batch_name}_consolidated.xlsx",
        original_directory="/n8n/google_sheets",
        extension=".xlsx",
        file_size_bytes=len(payload.records) * 512,
        file_hash=file_hash,
        last_modified=now,
        batch_id=batch.id,
        batch_number=next_batch_num,
        processing_status="Success",
        duplicate_status="Unique",
    )
    db.add(source_file)
    db.flush()

    # Map header names to model field names
    header_map = {
        "Name": "name",
        "Community": "community",
        "Sub-Community": "sub_community",
        "Building/Cluster": "building_cluster",
        "Unit Number": "unit_number",
        "Size": "size",
        "Plot Reg. No": "plot_reg_no",
        "Plot Number": "plot_number",
        "DMNO": "dmno",
        "DMsubno": "dmsubno",
        "Bedroom": "bedroom",
        "Type (Buyer/Seller)": "buyer_seller_type",
        "Mobile 1": "mobile_1",
        "Mobile 2": "mobile_2",
        "Mobile 3": "mobile_3",
        "Email Address": "email_address",
        "PI number": "pi_number",
        "Nationality": "nationality",
        "Property Type": "property_type",
        "Date": "date",
        "Procedure Value": "procedure_value",
        "Developer": "developer",
        "Project": "project",
    }

    records_created = 0
    for idx, raw_record in enumerate(payload.records):
        kwargs = {
            "source_file_id": source_file.id,
            "batch_id": batch.id,
            "original_workbook": f"{batch_name}_consolidated.xlsx",
            "sheet_name": "ConsolidatedData",
            "row_number": idx + 2,
            "raw_data_json": json.dumps(raw_record),
        }

        for sheet_header, model_field in header_map.items():
            val = raw_record.get(sheet_header)
            if val is not None:
                if model_field == "date":
                    try:
                        kwargs[model_field] = datetime.datetime.strptime(str(val), "%Y-%m-%d")
                    except (ValueError, TypeError):
                        kwargs[model_field] = None
                elif model_field == "procedure_value":
                    try:
                        kwargs[model_field] = float(val)
                    except (ValueError, TypeError):
                        kwargs[model_field] = None
                else:
                    kwargs[model_field] = str(val)

        # Set backward compatibility fields
        kwargs["customer_name"] = kwargs.get("name")
        kwargs["company"] = kwargs.get("building_cluster")
        kwargs["category"] = kwargs.get("property_type")
        kwargs["amount"] = kwargs.get("procedure_value")
        kwargs["status"] = "Registered"
        kwargs["region"] = kwargs.get("community")
        kwargs["transaction_id"] = f"PI-{kwargs.get('pi_number', 'N/A')}"

        record = ConsolidatedRecord(**kwargs)
        db.add(record)
        records_created += 1

    # Update workflow run if active
    if run:
        run.total_records_pushed = (run.total_records_pushed or 0) + records_created
        run.total_batches_created = (run.total_batches_created or 0) + 1

    db.add(ProcessingLog(
        timestamp=now,
        batch_id=batch.id,
        batch_number=next_batch_num,
        severity="INFO",
        message=f"n8n pushed {records_created} records into batch '{batch_name}' (Batch #{next_batch_num})",
        source="n8nWebhook"
    ))

    db.commit()

    return {
        "status": "ok",
        "batch_id": batch.id,
        "batch_number": next_batch_num,
        "records_created": records_created
    }


# ------------------------------------------
# 4. Workflow Complete — called at the end
# ------------------------------------------
@router.post("/webhook/workflow-complete")
def workflow_complete(
    payload: WebhookWorkflowComplete,
    db: Session = Depends(get_db),
    _: None = Depends(verify_webhook_key)
):
    now = datetime.datetime.utcnow()

    run = db.query(WorkflowRun).filter(
        WorkflowRun.status == "RUNNING"
    ).order_by(desc(WorkflowRun.id)).first()

    if not run:
        raise HTTPException(status_code=404, detail="No active workflow run found")

    # Mark all remaining PENDING/RUNNING steps as completed (or failed)
    remaining_steps = db.query(WorkflowStep).filter(
        WorkflowStep.workflow_run_id == run.id,
        WorkflowStep.status.in_(["PENDING", "RUNNING"])
    ).all()

    final_step_status = "COMPLETED" if payload.status == "COMPLETED" else "FAILED"
    for step in remaining_steps:
        step.status = final_step_status
        step.completed_at = now

    run.status = payload.status
    run.completed_at = now
    run.completed_steps = run.total_steps
    run.progress_percentage = 100.0 if payload.status == "COMPLETED" else run.progress_percentage
    run.eta_seconds = 0
    run.current_step_name = "Completed" if payload.status == "COMPLETED" else "Failed"
    run.error_message = payload.error_message

    if payload.total_records_pushed:
        run.total_records_pushed = payload.total_records_pushed
    if payload.total_batches_created:
        run.total_batches_created = payload.total_batches_created

    db.add(ProcessingLog(
        timestamp=now,
        severity="INFO" if payload.status == "COMPLETED" else "ERROR",
        message=f"n8n workflow '{run.workflow_name}' {payload.status.lower()}. "
                f"Records: {run.total_records_pushed}, Batches: {run.total_batches_created}"
                + (f" | Error: {payload.error_message}" if payload.error_message else ""),
        source="n8nWebhook"
    ))

    db.commit()

    return {
        "status": "ok",
        "workflow_run_id": run.id,
        "final_status": payload.status
    }


# ------------------------------------------
# 5. Live Workflow Status (frontend polls this)
# ------------------------------------------
@router.get("/workflow/live")
def workflow_live(db: Session = Depends(get_db)):
    """Returns the latest workflow run with all its steps for the frontend progress bar."""

    # Get the latest run (running first, then most recent)
    run = db.query(WorkflowRun).filter(
        WorkflowRun.status == "RUNNING"
    ).order_by(desc(WorkflowRun.id)).first()

    if not run:
        run = db.query(WorkflowRun).order_by(desc(WorkflowRun.id)).first()

    if not run:
        return {
            "has_active_run": False,
            "run": None,
            "recent_runs": []
        }

    # Get recent completed runs for history
    recent_runs = db.query(WorkflowRun).filter(
        WorkflowRun.id != run.id
    ).order_by(desc(WorkflowRun.id)).limit(5).all()

    return {
        "has_active_run": run.status == "RUNNING",
        "run": WorkflowRunSchema.model_validate(run),
        "recent_runs": [WorkflowRunSchema.model_validate(r) for r in recent_runs]
    }
