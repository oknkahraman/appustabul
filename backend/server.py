from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Depends, status
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Optional, Dict, Any
from enum import Enum
import uuid
from datetime import datetime, timezone, timedelta
import hashlib
import shutil
from passlib.context import CryptContext
import jwt
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'ustabul-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Upload directory
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Create the main app without a prefix
app = FastAPI(title="UstaBul API")

# Mount uploads directory
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    WORKER = "worker"
    EMPLOYER = "employer"
    ADMIN = "admin"

class AccountStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    BANNED = "banned"

class CertificateStatus(str, Enum):
    NONE = "none"
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"

class JobStatus(str, Enum):
    OPEN = "open"
    MATCHED = "matched"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"

class ApplicationStatus(str, Enum):
    APPLIED = "applied"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"

class EmployerResponse(str, Enum):
    APPROVED = "approved"
    REJECTED = "rejected"
    AUTO_APPROVED = "auto_approved"

class DisputeStatus(str, Enum):
    NONE = "none"
    WORKER_DISPUTED = "worker_disputed"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"

# Models
class UserCreate(BaseModel):
    username: str
    password: str
    role: UserRole

class UserLogin(BaseModel):
    username: str
    password: str

class User(BaseModel):
    id: str
    username: str
    role: UserRole
    account_status: AccountStatus = AccountStatus.ACTIVE
    created_at: datetime
    last_login: Optional[datetime] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class WorkerDetailsCreate(BaseModel):
    first_name: str
    last_name: str
    birth_year: int
    city: str
    district: str
    is_anonymous: bool = False

class WorkerDetails(BaseModel):
    user_id: str
    first_name: str
    last_name: str
    birth_year: int
    city: str
    district: str
    is_anonymous: bool = False
    certificate_status: CertificateStatus = CertificateStatus.NONE
    certificate_photo_url: Optional[str] = None
    ghosting_count: int = 0
    rejected_job_count: int = 0
    total_jobs_completed: int = 0
    average_rating: float = 0.0

class EmployerDetailsCreate(BaseModel):
    company_name: str
    tax_number: Optional[str] = None
    sector: str
    city: str
    district: str
    address: str

class EmployerDetails(BaseModel):
    user_id: str
    company_name: str
    tax_number: Optional[str] = None
    sector: str
    city: str
    district: str
    address: str
    payment_reliability_score: float = 5.0
    cancellation_count: int = 0
    total_jobs_posted: int = 0
    average_rating: float = 0.0

class SkillCategory(BaseModel):
    id: str
    parent_id: Optional[str] = None
    category_name: str
    category_level: str  # main, sub, detail
    display_order: int

class WorkerSkillCreate(BaseModel):
    skill_category_id: str
    years_of_experience: int
    is_primary: bool = False

class WorkerSkill(BaseModel):
    worker_id: str
    skill_category_id: str
    years_of_experience: int
    is_primary: bool
    added_at: datetime

class PortfolioCreate(BaseModel):
    description: str
    material_tag: str
    technique_tag: str

class Portfolio(BaseModel):
    id: str
    worker_id: str
    photo_url: str
    thumbnail_url: str
    description: str
    material_tag: str
    technique_tag: str
    verification_source: str  # gallery or camera
    is_verified_shot: bool
    has_exif_data: bool
    upload_date: datetime
    view_count: int = 0
    like_count: int = 0

class JobCreate(BaseModel):
    title: str
    description: str
    required_skills: List[str]
    start_date: datetime
    end_date: datetime
    budget_info: Optional[str] = None

class Job(BaseModel):
    id: str
    employer_id: str
    title: str
    description: str
    required_skills: List[str]
    start_date: datetime
    end_date: datetime
    budget_info: Optional[str] = None
    job_status: JobStatus = JobStatus.OPEN
    created_at: datetime
    expires_at: datetime
    view_count: int = 0

class JobApplicationCreate(BaseModel):
    job_id: str

class JobApplication(BaseModel):
    id: str
    job_id: str
    worker_id: str
    status: ApplicationStatus
    applied_at: datetime
    responded_at: Optional[datetime] = None
    withdrawal_reason: Optional[str] = None

class RatingCreate(BaseModel):
    job_id: str
    to_user_id: str
    overall_score: int
    comment: Optional[str] = None
    # Worker -> Employer specific
    payment_made: Optional[bool] = None
    workplace_safety: Optional[int] = None
    communication_quality: Optional[int] = None
    # Employer -> Worker specific
    technical_competence: Optional[int] = None
    on_time: Optional[bool] = None
    safety_compliance: Optional[int] = None
    professionalism: Optional[int] = None

class Rating(BaseModel):
    id: str
    job_id: str
    from_user_id: str
    to_user_id: str
    overall_score: int
    comment: Optional[str] = None
    payment_made: Optional[bool] = None
    workplace_safety: Optional[int] = None
    communication_quality: Optional[int] = None
    technical_competence: Optional[int] = None
    on_time: Optional[bool] = None
    safety_compliance: Optional[int] = None
    professionalism: Optional[int] = None
    created_at: datetime

class Notification(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    related_job_id: Optional[str] = None
    is_read: bool = False
    created_at: datetime

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": user_id, "role": payload.get("role")}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def calculate_image_hash(file_path: Path) -> str:
    """Calculate SHA256 hash of image file"""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

# Routes
@api_router.get("/")
async def root():
    return {"message": "UstaBul API v1.0", "status": "running"}

# Auth routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_create: UserCreate):
    # Check if username exists
    existing_user = await db.users.find_one({"username": user_create.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Kullanıcı adı zaten kullanılıyor")
    
    user_id = str(uuid.uuid4())
    user_dict = {
        "id": user_id,
        "username": user_create.username,
        "password_hash": hash_password(user_create.password),
        "role": user_create.role.value,
        "account_status": AccountStatus.ACTIVE.value,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login": None
    }
    
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token({"sub": user_id, "role": user_create.role.value})
    
    user = User(
        id=user_id,
        username=user_create.username,
        role=user_create.role,
        account_status=AccountStatus.ACTIVE,
        created_at=datetime.now(timezone.utc)
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(user_login: UserLogin):
    user_doc = await db.users.find_one({"username": user_login.username})
    if not user_doc or not verify_password(user_login.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Kullanıcı adı veya şifre hatalı")
    
    # Update last login
    await db.users.update_one(
        {"id": user_doc["id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    access_token = create_access_token({"sub": user_doc["id"], "role": user_doc["role"]})
    
    user = User(
        id=user_doc["id"],
        username=user_doc["username"],
        role=UserRole(user_doc["role"]),
        account_status=AccountStatus(user_doc["account_status"]),
        created_at=datetime.fromisoformat(user_doc["created_at"]),
        last_login=datetime.fromisoformat(user_doc["last_login"]) if user_doc.get("last_login") else None
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user)

# Worker routes
@api_router.post("/workers/details")
async def create_worker_details(details: WorkerDetailsCreate, user_id: str):
    details_dict = details.model_dump()
    details_dict["user_id"] = user_id
    details_dict["certificate_status"] = CertificateStatus.NONE.value
    details_dict["ghosting_count"] = 0
    details_dict["rejected_job_count"] = 0
    details_dict["total_jobs_completed"] = 0
    details_dict["average_rating"] = 0.0
    
    await db.worker_details.insert_one(details_dict)
    return {"message": "Usta profili oluşturuldu", "user_id": user_id}

@api_router.get("/workers/{worker_id}", response_model=WorkerDetails)
async def get_worker_details(worker_id: str):
    worker = await db.worker_details.find_one({"user_id": worker_id}, {"_id": 0})
    if not worker:
        raise HTTPException(status_code=404, detail="Usta bulunamadı")
    return WorkerDetails(**worker)

@api_router.get("/workers")
async def get_all_workers(skip: int = 0, limit: int = 50):
    workers = await db.worker_details.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return workers

# Employer routes
@api_router.post("/employers/details")
async def create_employer_details(details: EmployerDetailsCreate, user_id: str):
    details_dict = details.model_dump()
    details_dict["user_id"] = user_id
    details_dict["payment_reliability_score"] = 5.0
    details_dict["cancellation_count"] = 0
    details_dict["total_jobs_posted"] = 0
    details_dict["average_rating"] = 0.0
    
    await db.employer_details.insert_one(details_dict)
    return {"message": "İşveren profili oluşturuldu", "user_id": user_id}

@api_router.get("/employers/{employer_id}", response_model=EmployerDetails)
async def get_employer_details(employer_id: str):
    employer = await db.employer_details.find_one({"user_id": employer_id}, {"_id": 0})
    if not employer:
        raise HTTPException(status_code=404, detail="İşveren bulunamadı")
    return EmployerDetails(**employer)

@api_router.get("/employers")
async def get_all_employers(skip: int = 0, limit: int = 50):
    employers = await db.employer_details.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return employers

# Skill categories routes
@api_router.get("/skills/categories")
async def get_skill_categories():
    categories = await db.skill_categories.find({}, {"_id": 0}).to_list(1000)
    return categories

@api_router.get("/skills/categories/tree")
async def get_skill_categories_tree():
    """Get hierarchical skill categories"""
    categories = await db.skill_categories.find({}, {"_id": 0}).sort("display_order", 1).to_list(1000)
    
    # Build tree structure
    tree = []
    category_map = {cat["id"]: {**cat, "children": []} for cat in categories}
    
    for cat in categories:
        if cat["parent_id"] is None:
            tree.append(category_map[cat["id"]])
        else:
            if cat["parent_id"] in category_map:
                category_map[cat["parent_id"]]["children"].append(category_map[cat["id"]])
    
    return tree

# Worker skills routes
@api_router.post("/workers/{worker_id}/skills")
async def add_worker_skill(worker_id: str, skill: WorkerSkillCreate):
    skill_dict = skill.model_dump()
    skill_dict["worker_id"] = worker_id
    skill_dict["added_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.worker_skills.insert_one(skill_dict)
    return {"message": "Yetenek eklendi"}

@api_router.get("/workers/{worker_id}/skills")
async def get_worker_skills(worker_id: str):
    skills = await db.worker_skills.find({"worker_id": worker_id}, {"_id": 0}).to_list(100)
    return skills

# Portfolio routes
@api_router.post("/portfolio/upload")
async def upload_portfolio(
    worker_id: str = Form(...),
    description: str = Form(...),
    material_tag: str = Form(...),
    technique_tag: str = Form(...),
    verification_source: str = Form("gallery"),
    file: UploadFile = File(...)
):
    # Validate file
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Sadece resim dosyaları yüklenebilir")
    
    # Create unique filename
    file_ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    portfolio_id = str(uuid.uuid4())
    filename = f"{portfolio_id}.{file_ext}"
    file_path = UPLOAD_DIR / filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Calculate hash
    image_hash = calculate_image_hash(file_path)
    
    # Check for duplicate
    existing = await db.portfolio.find_one({"image_hash": image_hash})
    if existing and existing["worker_id"] != worker_id:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="Bu fotoğraf başka bir kullanıcı tarafından kullanılıyor")
    
    portfolio_dict = {
        "id": portfolio_id,
        "worker_id": worker_id,
        "photo_url": f"/uploads/{filename}",
        "thumbnail_url": f"/uploads/{filename}",
        "description": description,
        "material_tag": material_tag,
        "technique_tag": technique_tag,
        "verification_source": verification_source,
        "is_verified_shot": verification_source == "camera",
        "has_exif_data": True,
        "image_hash": image_hash,
        "upload_date": datetime.now(timezone.utc).isoformat(),
        "view_count": 0,
        "like_count": 0
    }
    
    await db.portfolio.insert_one(portfolio_dict)
    return {"message": "Portfolyo fotoğrafı yüklendi", "portfolio_id": portfolio_id}

@api_router.get("/portfolio/{worker_id}")
async def get_worker_portfolio(worker_id: str):
    portfolio = await db.portfolio.find({"worker_id": worker_id}, {"_id": 0}).to_list(100)
    return portfolio

# Job routes
@api_router.post("/jobs")
async def create_job(job: JobCreate, employer_id: str):
    job_id = str(uuid.uuid4())
    job_dict = job.model_dump()
    job_dict["id"] = job_id
    job_dict["employer_id"] = employer_id
    job_dict["job_status"] = JobStatus.OPEN.value
    job_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    job_dict["expires_at"] = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    job_dict["view_count"] = 0
    job_dict["start_date"] = job.start_date.isoformat()
    job_dict["end_date"] = job.end_date.isoformat()
    
    await db.jobs.insert_one(job_dict)
    
    # Update employer stats
    await db.employer_details.update_one(
        {"user_id": employer_id},
        {"$inc": {"total_jobs_posted": 1}}
    )
    
    return {"message": "İş ilanı oluşturuldu", "job_id": job_id}

@api_router.get("/jobs")
async def get_all_jobs(skip: int = 0, limit: int = 50, status: Optional[str] = None):
    query = {}
    if status:
        query["job_status"] = status
    
    jobs = await db.jobs.find(query, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    return jobs

@api_router.get("/jobs/{job_id}")
async def get_job(job_id: str):
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="İş ilanı bulunamadı")
    
    # Increment view count
    await db.jobs.update_one({"id": job_id}, {"$inc": {"view_count": 1}})
    
    return job

# Job application routes
@api_router.post("/jobs/apply")
async def apply_to_job(application: JobApplicationCreate, worker_id: str):
    # Check if already applied
    existing = await db.job_applications.find_one({
        "job_id": application.job_id,
        "worker_id": worker_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Bu ilana zaten başvurdunuz")
    
    app_id = str(uuid.uuid4())
    app_dict = {
        "id": app_id,
        "job_id": application.job_id,
        "worker_id": worker_id,
        "status": ApplicationStatus.APPLIED.value,
        "applied_at": datetime.now(timezone.utc).isoformat(),
        "responded_at": None,
        "withdrawal_reason": None
    }
    
    await db.job_applications.insert_one(app_dict)
    
    # Create notification for employer
    job = await db.jobs.find_one({"id": application.job_id})
    if job:
        notif_dict = {
            "id": str(uuid.uuid4()),
            "user_id": job["employer_id"],
            "type": "new_application",
            "title": "Yeni Başvuru",
            "message": f"{job['title']} ilanınıza yeni bir başvuru yapıldı",
            "related_job_id": application.job_id,
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notif_dict)
    
    return {"message": "Başvurunuz alındı", "application_id": app_id}

@api_router.get("/jobs/{job_id}/applications")
async def get_job_applications(job_id: str):
    applications = await db.job_applications.find({"job_id": job_id}, {"_id": 0}).to_list(100)
    return applications

@api_router.put("/applications/{application_id}/accept")
async def accept_application(application_id: str, employer_id: str):
    app = await db.job_applications.find_one({"id": application_id})
    if not app:
        raise HTTPException(status_code=404, detail="Başvuru bulunamadı")
    
    # Update application status
    await db.job_applications.update_one(
        {"id": application_id},
        {"$set": {
            "status": ApplicationStatus.ACCEPTED.value,
            "responded_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update job status
    await db.jobs.update_one(
        {"id": app["job_id"]},
        {"$set": {"job_status": JobStatus.MATCHED.value}}
    )
    
    # Create notification for worker
    notif_dict = {
        "id": str(uuid.uuid4()),
        "user_id": app["worker_id"],
        "type": "application_accepted",
        "title": "Başvurunuz Kabul Edildi",
        "message": "İşveren başvurunuzu kabul etti. İletişim bilgilerine ulaşabilirsiniz.",
        "related_job_id": app["job_id"],
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notif_dict)
    
    return {"message": "Başvuru kabul edildi"}

# Rating routes
@api_router.post("/ratings")
async def create_rating(rating: RatingCreate, from_user_id: str):
    rating_id = str(uuid.uuid4())
    rating_dict = rating.model_dump()
    rating_dict["id"] = rating_id
    rating_dict["from_user_id"] = from_user_id
    rating_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.ratings.insert_one(rating_dict)
    
    # Update average rating
    user_ratings = await db.ratings.find({"to_user_id": rating.to_user_id}, {"_id": 0}).to_list(1000)
    avg_rating = sum(r["overall_score"] for r in user_ratings) / len(user_ratings) if user_ratings else 0
    
    # Update user details
    user = await db.users.find_one({"id": rating.to_user_id})
    if user:
        if user["role"] == "worker":
            await db.worker_details.update_one(
                {"user_id": rating.to_user_id},
                {"$set": {"average_rating": avg_rating}}
            )
        elif user["role"] == "employer":
            await db.employer_details.update_one(
                {"user_id": rating.to_user_id},
                {"$set": {"average_rating": avg_rating}}
            )
    
    return {"message": "Değerlendirme kaydedildi", "rating_id": rating_id}

@api_router.get("/ratings/user/{user_id}")
async def get_user_ratings(user_id: str):
    ratings = await db.ratings.find({"to_user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return ratings

# Notification routes
@api_router.get("/notifications/{user_id}")
async def get_notifications(user_id: str):
    notifications = await db.notifications.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return notifications

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    await db.notifications.update_one(
        {"id": notification_id},
        {"$set": {"is_read": True}}
    )
    return {"message": "Bildirim okundu olarak işaretlendi"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
