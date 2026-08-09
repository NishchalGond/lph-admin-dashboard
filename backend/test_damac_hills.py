from app.core.database import SessionLocal
from app.db.models import ConsolidatedRecord
from sqlalchemy import or_

db = SessionLocal()

# 1. Searching ONLY community column
q1 = db.query(ConsolidatedRecord).filter(ConsolidatedRecord.community.ilike("%DAMAC HILLS%"))
c1 = q1.count()
print(f"Filter ONLY ConsolidatedRecord.community ILIKE '%DAMAC HILLS%': {c1} records")

# 2. Searching building_cluster column
q2 = db.query(ConsolidatedRecord).filter(ConsolidatedRecord.building_cluster.ilike("%DAMAC HILLS%"))
c2 = q2.count()
print(f"Filter ConsolidatedRecord.building_cluster ILIKE '%DAMAC HILLS%': {c2} records")

# 3. Comprehensive location search (community OR sub_community OR building_cluster OR project)
q3 = db.query(ConsolidatedRecord).filter(or_(
    ConsolidatedRecord.community.ilike("%DAMAC HILLS%"),
    ConsolidatedRecord.sub_community.ilike("%DAMAC HILLS%"),
    ConsolidatedRecord.building_cluster.ilike("%DAMAC HILLS%"),
    ConsolidatedRecord.project.ilike("%DAMAC HILLS%"),
    ConsolidatedRecord.original_workbook.ilike("%DAMAC HILLS%")
))
c3 = q3.count()
print(f"Comprehensive Location Filter (community OR building_cluster OR sub_community OR project): {c3} records")

db.close()
