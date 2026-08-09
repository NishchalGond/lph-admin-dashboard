# ============================================================
#  LPH Webhook Simulation — Run this to see live progress
#  in the ProcessingMonitor page of the dashboard
# ============================================================

$BASE = "http://127.0.0.1:8000/api/v1"
$KEY  = "lph-webhook-secret-2026"
$HEADERS = @{ "Content-Type" = "application/json"; "X-Webhook-Key" = $KEY }

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  LPH Dashboard - n8n Webhook Simulator" -ForegroundColor Cyan
Write-Host "  Open ProcessingMonitor in browser NOW!" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Start the workflow run ─────────────────────────────
Write-Host "[1/4] Starting workflow run..." -ForegroundColor Green
$startBody = @{
    execution_id  = "sim-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    workflow_name = "LPH Google Drive Consolidator"
    total_steps   = 8
} | ConvertTo-Json

$r1 = Invoke-RestMethod -Uri "$BASE/webhook/workflow-start" -Method POST -Headers $HEADERS -Body $startBody
Write-Host "  OK Workflow Run ID: $($r1.workflow_run_id)" -ForegroundColor Green
Write-Host ""

# ── 2. Simulate 8 steps with delays ──────────────────────
$steps = @(
    @{ step_index=0; step_name="Trigger and Schedule";          status="RUNNING";   message="Workflow triggered" },
    @{ step_index=0; step_name="Trigger and Schedule";          status="COMPLETED"; message="Trigger confirmed" },
    @{ step_index=1; step_name="Load Google Sheet Config";      status="RUNNING";   message="Reading config sheet..." },
    @{ step_index=1; step_name="Load Google Sheet Config";      status="COMPLETED"; message="Config loaded: 3 folders" },
    @{ step_index=2; step_name="Discover Files in Drive";       status="RUNNING";   message="Scanning folder structure..." },
    @{ step_index=2; step_name="Discover Files in Drive";       status="COMPLETED"; message="Found 47 Excel files" },
    @{ step_index=3; step_name="Filter and Validate Files";     status="RUNNING";   message="Applying .xlsx filter..." },
    @{ step_index=3; step_name="Filter and Validate Files";     status="COMPLETED"; message="43 files passed validation" },
    @{ step_index=4; step_name="Download and Parse Excel Files"; status="RUNNING";  message="Downloading from Google Drive..."; items_processed=12; items_total=43 },
    @{ step_index=4; step_name="Download and Parse Excel Files"; status="COMPLETED"; message="All 43 files parsed"; items_processed=43; items_total=43 },
    @{ step_index=5; step_name="Duplicate Detection";           status="RUNNING";   message="Running SHA-256 hash comparison..." },
    @{ step_index=5; step_name="Duplicate Detection";           status="COMPLETED"; message="7 duplicates flagged" },
    @{ step_index=6; step_name="Smart Consolidation";           status="RUNNING";   message="Merging rows into master sheet..." },
    @{ step_index=6; step_name="Smart Consolidation";           status="COMPLETED"; message="12847 records consolidated" },
    @{ step_index=7; step_name="Upload to Dashboard";           status="RUNNING";   message="Pushing data to FastAPI..." }
)

Write-Host "[2/4] Simulating 8 workflow steps..." -ForegroundColor Yellow
foreach ($step in $steps) {
    $body = $step | ConvertTo-Json
    try {
        $r = Invoke-RestMethod -Uri "$BASE/webhook/step-update" -Method POST -Headers $HEADERS -Body $body
        $pct = $r.progress_percentage
        $filled = [math]::Floor($pct / 5)
        $bar = ("=" * $filled).PadRight(20)
        $color = if ($step.status -eq "COMPLETED") { "Green" } else { "Yellow" }
        Write-Host ("  [{0}] {1,5}%  Step {2}: {3} -> {4}" -f $bar, $pct, ($step.step_index + 1), $step.step_name, $step.status) -ForegroundColor $color
    } catch {
        Write-Host "  ERROR on step $($step.step_name): $_" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 800
}
Write-Host ""

# ── 3. Push sample records ────────────────────────────────
Write-Host "[3/4] Pushing 5 sample property records..." -ForegroundColor Yellow
$records = @(
    @{
        "Name"="Ahmed Al Mansouri"; "Community"="Downtown Dubai"; "Sub-Community"="Burj Area"
        "Building/Cluster"="Burj Vista"; "Unit Number"="A-2301"; "Size"="1250 sqft"
        "Property Type"="Apartment"; "Developer"="Emaar"; "Project"="Burj Vista"
        "Mobile 1"="+971501234567"; "Email Address"="ahmed@email.com"
        "Nationality"="Emirati"; "Bedroom"="2BR"; "Procedure Value"=2500000
        "Type (Buyer/Seller)"="Buyer"; "Date"="2026-01-15"
        "Plot Reg. No"=""; "Plot Number"=""; "DMNO"=""; "DMsubno"=""
        "Mobile 2"=""; "Mobile 3"=""; "PI number"="PI-001"
    },
    @{
        "Name"="Sarah Johnson"; "Community"="Palm Jumeirah"; "Sub-Community"="Frond C"
        "Building/Cluster"="Garden Homes"; "Unit Number"="GH-C-12"; "Size"="4500 sqft"
        "Property Type"="Villa"; "Developer"="Nakheel"; "Project"="Garden Homes"
        "Mobile 1"="+971507654321"; "Email Address"="sarah@email.com"
        "Nationality"="British"; "Bedroom"="4BR"; "Procedure Value"=8500000
        "Type (Buyer/Seller)"="Buyer"; "Date"="2026-02-10"
        "Plot Reg. No"=""; "Plot Number"=""; "DMNO"=""; "DMsubno"=""
        "Mobile 2"=""; "Mobile 3"=""; "PI number"="PI-002"
    },
    @{
        "Name"="Mohammed Al Rashid"; "Community"="Business Bay"; "Sub-Community"="Canal Walk"
        "Building/Cluster"="Aykon City"; "Unit Number"="T2-4501"; "Size"="890 sqft"
        "Property Type"="Apartment"; "Developer"="DAMAC"; "Project"="Aykon City"
        "Mobile 1"="+971509876543"; "Email Address"="mo@email.com"
        "Nationality"="Emirati"; "Bedroom"="1BR"; "Procedure Value"=1200000
        "Type (Buyer/Seller)"="Seller"; "Date"="2026-03-05"
        "Plot Reg. No"=""; "Plot Number"=""; "DMNO"=""; "DMsubno"=""
        "Mobile 2"=""; "Mobile 3"=""; "PI number"="PI-003"
    },
    @{
        "Name"="Elena Petrova"; "Community"="Dubai Marina"; "Sub-Community"="Marina Walk"
        "Building/Cluster"="Cayan Tower"; "Unit Number"="CT-3302"; "Size"="1100 sqft"
        "Property Type"="Apartment"; "Developer"="Cayan"; "Project"="Cayan Tower"
        "Mobile 1"="+971506543210"; "Email Address"="elena@email.com"
        "Nationality"="Russian"; "Bedroom"="2BR"; "Procedure Value"=1800000
        "Type (Buyer/Seller)"="Buyer"; "Date"="2026-03-20"
        "Plot Reg. No"=""; "Plot Number"=""; "DMNO"=""; "DMsubno"=""
        "Mobile 2"=""; "Mobile 3"=""; "PI number"="PI-004"
    },
    @{
        "Name"="James Chen"; "Community"="JBR"; "Sub-Community"="The Walk"
        "Building/Cluster"="Sadaf"; "Unit Number"="S7-1204"; "Size"="750 sqft"
        "Property Type"="Apartment"; "Developer"="Dubai Properties"; "Project"="Sadaf"
        "Mobile 1"="+971504321098"; "Email Address"="james@email.com"
        "Nationality"="Chinese"; "Bedroom"="Studio"; "Procedure Value"=950000
        "Type (Buyer/Seller)"="Buyer"; "Date"="2026-04-01"
        "Plot Reg. No"=""; "Plot Number"=""; "DMNO"=""; "DMsubno"=""
        "Mobile 2"=""; "Mobile 3"=""; "PI number"="PI-005"
    }
)

$batchBody = @{
    batch_name = "GDrive_Batch_$(Get-Date -Format 'yyyyMMdd_HHmm')"
    records    = $records
} | ConvertTo-Json -Depth 5

try {
    $r3 = Invoke-RestMethod -Uri "$BASE/webhook/batch-data" -Method POST -Headers $HEADERS -Body $batchBody
    Write-Host "  OK Batch #$($r3.batch_number) created - $($r3.records_created) records saved" -ForegroundColor Green
} catch {
    Write-Host "  ERROR pushing records: $_" -ForegroundColor Red
    $r3 = @{ records_created=5; batch_number=99 }
}
Write-Host ""

# ── Final step update ─────────────────────────────────────
$finalStep = @{
    step_index=7; step_name="Upload to Dashboard"; status="COMPLETED"
    message="$($r3.records_created) records saved to database"
    items_processed=$r3.records_created; items_total=$r3.records_created
} | ConvertTo-Json
Invoke-RestMethod -Uri "$BASE/webhook/step-update" -Method POST -Headers $HEADERS -Body $finalStep | Out-Null

# ── 4. Complete the workflow ───────────────────────────────
Write-Host "[4/4] Completing workflow..." -ForegroundColor Yellow
$completeBody = @{
    status                = "COMPLETED"
    total_records_pushed  = $r3.records_created
    total_batches_created = 1
} | ConvertTo-Json

try {
    $r4 = Invoke-RestMethod -Uri "$BASE/webhook/workflow-complete" -Method POST -Headers $HEADERS -Body $completeBody
    Write-Host "  OK Workflow COMPLETED - Final status: $($r4.final_status)" -ForegroundColor Green
} catch {
    Write-Host "  ERROR completing workflow: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  DONE! Check the dashboard now:" -ForegroundColor Green
Write-Host "  * ProcessingMonitor -> should show 100%" -ForegroundColor White
Write-Host "  * Dashboard -> new batch should appear" -ForegroundColor White
Write-Host "  * Property Ledger -> 5 new records" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
