from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import router as api_router
from app.api.webhook import router as webhook_router

import hashlib
from app.core.database import engine, Base, SessionLocal
from app.db.models import User, UserRole

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            def hash_pw(pw: str) -> str:
                return hashlib.sha256(pw.encode()).hexdigest()
            db.add_all([
                User(username="admin", email="admin@enterprise.com", hashed_password=hash_pw("admin123"), full_name="System Administrator", role=UserRole.ADMIN.value),
                User(username="ceo", email="ceo@enterprise.com", hashed_password=hash_pw("ceo123"), full_name="Chief Executive Officer", role=UserRole.CEO.value),
                User(username="marketing", email="marketing@enterprise.com", hashed_password=hash_pw("marketing123"), full_name="Marketing Lead", role=UserRole.MARKETING.value),
                User(username="developer", email="dev@enterprise.com", hashed_password=hash_pw("dev123"), full_name="Lead Developer", role=UserRole.DEVELOPER.value),
            ])
            db.commit()
    finally:
        db.close()

app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(webhook_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Welcome to Excel Processing Workflow Dashboard API",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
