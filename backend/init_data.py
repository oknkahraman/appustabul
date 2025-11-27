"""Initialize database with sample data"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone, timedelta
import uuid
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

async def init_data():
    mongo_url = "mongodb://localhost:27017"
    client = AsyncIOMotorClient(mongo_url)
    db = client["ustabul_db"]
    
    print("Veritabanı temizleniyor...")
    # Clear existing data
    await db.users.delete_many({})
    await db.worker_details.delete_many({})
    await db.employer_details.delete_many({})
    await db.skill_categories.delete_many({})
    await db.worker_skills.delete_many({})
    await db.jobs.delete_many({})
    await db.job_applications.delete_many({})
    await db.portfolio.delete_many({})
    await db.ratings.delete_many({})
    await db.notifications.delete_many({})
    
    print("Yetenek kategorileri oluşturuluyor...")
    # Skill Categories
    categories = []
    
    # METAL İŞLERİ
    metal_id = str(uuid.uuid4())
    categories.append({
        "id": metal_id,
        "parent_id": None,
        "category_name": "Metal İşleri",
        "category_level": "main",
        "display_order": 1
    })
    
    # Kaynakçılık
    kaynak_id = str(uuid.uuid4())
    categories.append({
        "id": kaynak_id,
        "parent_id": metal_id,
        "category_name": "Kaynakçılık",
        "category_level": "sub",
        "display_order": 1
    })
    
    kaynak_types = [
        "Gazaltı Kaynağı (MIG/MAG)",
        "Argon Kaynağı (TIG)",
        "Elektrot Kaynağı",
        "Oxy-Fuel Kaynağı",
        "Paslanmaz Kaynak",
        "Alüminyum Kaynak",
        "Döküm Kaynak"
    ]
    for i, name in enumerate(kaynak_types):
        categories.append({
            "id": str(uuid.uuid4()),
            "parent_id": kaynak_id,
            "category_name": name,
            "category_level": "detail",
            "display_order": i + 1
        })
    
    # CNC Torna
    cnc_torna_id = str(uuid.uuid4())
    categories.append({
        "id": cnc_torna_id,
        "parent_id": metal_id,
        "category_name": "CNC Torna",
        "category_level": "sub",
        "display_order": 2
    })
    
    cnc_torna_types = [
        "2 Eksen CNC Torna",
        "Çok Eksenli CNC Torna",
        "Swiss Type Torna",
        "CNC Otomat Torna"
    ]
    for i, name in enumerate(cnc_torna_types):
        categories.append({
            "id": str(uuid.uuid4()),
            "parent_id": cnc_torna_id,
            "category_name": name,
            "category_level": "detail",
            "display_order": i + 1
        })
    
    # CNC Dik İşlem Merkezi
    cnc_dik_id = str(uuid.uuid4())
    categories.append({
        "id": cnc_dik_id,
        "parent_id": metal_id,
        "category_name": "CNC Dik İşlem Merkezi",
        "category_level": "sub",
        "display_order": 3
    })
    
    cnc_dik_types = [
        "3 Eksen İşlem Merkezi",
        "4 Eksen İşlem Merkezi",
        "5 Eksen İşlem Merkezi",
        "Yüksek Hızlı İşlem (HSM)"
    ]
    for i, name in enumerate(cnc_dik_types):
        categories.append({
            "id": str(uuid.uuid4()),
            "parent_id": cnc_dik_id,
            "category_name": name,
            "category_level": "detail",
            "display_order": i + 1
        })
    
    # Üniversal Torna
    uni_torna_id = str(uuid.uuid4())
    categories.append({
        "id": uni_torna_id,
        "parent_id": metal_id,
        "category_name": "Üniversal Torna",
        "category_level": "sub",
        "display_order": 4
    })
    
    uni_torna_types = [
        "Konvansiyonel Torna",
        "Punta Torna",
        "Kafa Torna",
        "Rulman Torna"
    ]
    for i, name in enumerate(uni_torna_types):
        categories.append({
            "id": str(uuid.uuid4()),
            "parent_id": uni_torna_id,
            "category_name": name,
            "category_level": "detail",
            "display_order": i + 1
        })
    
    # Taşlama
    taslama_id = str(uuid.uuid4())
    categories.append({
        "id": taslama_id,
        "parent_id": metal_id,
        "category_name": "Taşlama",
        "category_level": "sub",
        "display_order": 5
    })
    
    taslama_types = [
        "Düzlem Taşlama",
        "Silindirik Taşlama",
        "Koordinat Taşlama",
        "İçlik/Dışlık Taşlama",
        "Profil Taşlama"
    ]
    for i, name in enumerate(taslama_types):
        categories.append({
            "id": str(uuid.uuid4()),
            "parent_id": taslama_id,
            "category_name": name,
            "category_level": "detail",
            "display_order": i + 1
        })
    
    # İMALAT & MONTAJ
    imalat_id = str(uuid.uuid4())
    categories.append({
        "id": imalat_id,
        "parent_id": None,
        "category_name": "İmalat & Montaj",
        "category_level": "main",
        "display_order": 2
    })
    
    imalat_types = [
        "Seri İmalat Ustası",
        "Prototip İmalat Ustası",
        "Özel Parça İmalat Ustası",
        "Kalıp İmalat Ustası",
        "Mekanik Montaj",
        "Pnömatik Montaj",
        "Hidrolik Montaj",
        "Elektro-Mekanik Montaj"
    ]
    for i, name in enumerate(imalat_types):
        categories.append({
            "id": str(uuid.uuid4()),
            "parent_id": imalat_id,
            "category_name": name,
            "category_level": "sub",
            "display_order": i + 1
        })
    
    # ELEKTRİK & ELEKTRONİK
    elektrik_id = str(uuid.uuid4())
    categories.append({
        "id": elektrik_id,
        "parent_id": None,
        "category_name": "Elektrik & Elektronik",
        "category_level": "main",
        "display_order": 3
    })
    
    elektrik_types = [
        "Endüstriyel Elektrikçi",
        "PLC Programcı",
        "Pano İmalatçısı",
        "Otomasyon Teknisyeni",
        "Ölçüm & Kalibrasyon"
    ]
    for i, name in enumerate(elektrik_types):
        categories.append({
            "id": str(uuid.uuid4()),
            "parent_id": elektrik_id,
            "category_name": name,
            "category_level": "sub",
            "display_order": i + 1
        })
    
    # BAKIM & ONARIM
    bakim_id = str(uuid.uuid4())
    categories.append({
        "id": bakim_id,
        "parent_id": None,
        "category_name": "Bakım & Onarım",
        "category_level": "main",
        "display_order": 4
    })
    
    bakim_types = [
        "Makine Bakım Ustası",
        "Yedek Parça Ustası",
        "Hidrolik Sistem Uzmanı",
        "Pnömatik Sistem Uzmanı",
        "Rulman & Aktarma Elemanları"
    ]
    for i, name in enumerate(bakim_types):
        categories.append({
            "id": str(uuid.uuid4()),
            "parent_id": bakim_id,
            "category_name": name,
            "category_level": "sub",
            "display_order": i + 1
        })
    
    await db.skill_categories.insert_many(categories)
    print(f"{len(categories)} yetenek kategorisi eklendi")
    
    # Sample Users
    print("\nÖrnek kullanıcılar oluşturuluyor...")
    
    # Worker 1
    worker1_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": worker1_id,
        "username": "mehmet_kaynakci",
        "password_hash": hash_password("123456"),
        "role": "worker",
        "account_status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login": None
    })
    
    await db.worker_details.insert_one({
        "user_id": worker1_id,
        "first_name": "Mehmet",
        "last_name": "Yılmaz",
        "birth_year": 1985,
        "city": "Kocaeli",
        "district": "Gebze",
        "is_anonymous": False,
        "certificate_status": "verified",
        "certificate_photo_url": None,
        "ghosting_count": 0,
        "rejected_job_count": 0,
        "total_jobs_completed": 47,
        "average_rating": 4.8
    })
    
    # Worker 2
    worker2_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": worker2_id,
        "username": "ahmet_cnc",
        "password_hash": hash_password("123456"),
        "role": "worker",
        "account_status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login": None
    })
    
    await db.worker_details.insert_one({
        "user_id": worker2_id,
        "first_name": "Ahmet",
        "last_name": "Demir",
        "birth_year": 1990,
        "city": "İstanbul",
        "district": "Tuzla",
        "is_anonymous": False,
        "certificate_status": "verified",
        "certificate_photo_url": None,
        "ghosting_count": 0,
        "rejected_job_count": 1,
        "total_jobs_completed": 32,
        "average_rating": 4.6
    })
    
    # Worker 3
    worker3_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": worker3_id,
        "username": "ali_elektrik",
        "password_hash": hash_password("123456"),
        "role": "worker",
        "account_status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login": None
    })
    
    await db.worker_details.insert_one({
        "user_id": worker3_id,
        "first_name": "Ali",
        "last_name": "Kaya",
        "birth_year": 1988,
        "city": "Bursa",
        "district": "Nilüfer",
        "is_anonymous": False,
        "certificate_status": "pending",
        "certificate_photo_url": None,
        "ghosting_count": 0,
        "rejected_job_count": 0,
        "total_jobs_completed": 15,
        "average_rating": 4.9
    })
    
    # Employer 1
    employer1_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": employer1_id,
        "username": "abc_makina",
        "password_hash": hash_password("123456"),
        "role": "employer",
        "account_status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login": None
    })
    
    await db.employer_details.insert_one({
        "user_id": employer1_id,
        "company_name": "ABC Makina San. Ltd.",
        "tax_number": "1234567890",
        "sector": "Otomotiv Yan Sanayi",
        "city": "Kocaeli",
        "district": "Gebze",
        "address": "Organize Sanayi Bölgesi 5. Cadde No:42",
        "payment_reliability_score": 4.7,
        "cancellation_count": 1,
        "total_jobs_posted": 34,
        "average_rating": 4.3
    })
    
    # Employer 2
    employer2_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": employer2_id,
        "username": "def_metal",
        "password_hash": hash_password("123456"),
        "role": "employer",
        "account_status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login": None
    })
    
    await db.employer_details.insert_one({
        "user_id": employer2_id,
        "company_name": "DEF Metal İşleme A.Ş.",
        "tax_number": "9876543210",
        "sector": "Metal İşleme",
        "city": "İstanbul",
        "district": "Tuzla",
        "address": "Aydınlı Mah. Sanayi Cad. No:15",
        "payment_reliability_score": 4.9,
        "cancellation_count": 0,
        "total_jobs_posted": 28,
        "average_rating": 4.6
    })
    
    print("5 örnek kullanıcı oluşturuldu (3 usta, 2 işveren)")
    
    # Sample Jobs
    print("\nÖrnek iş ilanları oluşturuluyor...")
    
    # Get some skill category IDs
    mig_kaynak = await db.skill_categories.find_one({"category_name": "Gazaltı Kaynağı (MIG/MAG)"})
    cnc_2eksen = await db.skill_categories.find_one({"category_name": "2 Eksen CNC Torna"})
    
    # Job 1
    job1_id = str(uuid.uuid4())
    await db.jobs.insert_one({
        "id": job1_id,
        "employer_id": employer1_id,
        "title": "Gazaltı Kaynakçısı Aranıyor",
        "description": "Paslanmaz çelik parçaların kaynağı için deneyimli gazaltı kaynakçısı aranmaktadır. Temiz ve güvenli çalışma ortamı.",
        "required_skills": [mig_kaynak["id"]] if mig_kaynak else [],
        "start_date": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
        "end_date": (datetime.now(timezone.utc) + timedelta(days=2, hours=8)).isoformat(),
        "budget_info": "2.800 TL/gün",
        "job_status": "open",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
        "view_count": 34
    })
    
    # Job 2
    job2_id = str(uuid.uuid4())
    await db.jobs.insert_one({
        "id": job2_id,
        "employer_id": employer2_id,
        "title": "CNC Torna Ustası - Acil",
        "description": "2 eksen CNC torna deneyimi olan usta aranıyor. Paslanmaz işleme deneyimi tercih sebebidir.",
        "required_skills": [cnc_2eksen["id"]] if cnc_2eksen else [],
        "start_date": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
        "end_date": (datetime.now(timezone.utc) + timedelta(days=1, hours=9)).isoformat(),
        "budget_info": "3.200 TL/gün",
        "job_status": "open",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
        "view_count": 52
    })
    
    # Job 3
    job3_id = str(uuid.uuid4())
    await db.jobs.insert_one({
        "id": job3_id,
        "employer_id": employer1_id,
        "title": "Makine Montaj Ustası",
        "description": "Hidrolik pres montajı için deneyimli montaj ustası aranmaktadır. 2 gün sürecek iş.",
        "required_skills": [],
        "start_date": (datetime.now(timezone.utc) + timedelta(days=5)).isoformat(),
        "end_date": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "budget_info": "3.000 TL/gün",
        "job_status": "open",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
        "view_count": 21
    })
    
    print("3 örnek iş ilanı oluşturuldu")
    
    # Sample Ratings
    print("\nÖrnek değerlendirmeler oluşturuluyor...")
    
    await db.ratings.insert_one({
        "id": str(uuid.uuid4()),
        "job_id": str(uuid.uuid4()),
        "from_user_id": employer1_id,
        "to_user_id": worker1_id,
        "overall_score": 5,
        "comment": "Hassas ölçü işlerinde mükemmel. Kesinlikle tekrar çalışmak isterim.",
        "technical_competence": 5,
        "on_time": True,
        "safety_compliance": 5,
        "professionalism": 5,
        "created_at": (datetime.now(timezone.utc) - timedelta(days=10)).isoformat()
    })
    
    await db.ratings.insert_one({
        "id": str(uuid.uuid4()),
        "job_id": str(uuid.uuid4()),
        "from_user_id": worker1_id,
        "to_user_id": employer1_id,
        "overall_score": 4,
        "comment": "Anlaşıldığı gibi ödeme aldım. Çalışma ortamı temiz ve güvenli.",
        "payment_made": True,
        "workplace_safety": 4,
        "communication_quality": 4,
        "created_at": (datetime.now(timezone.utc) - timedelta(days=9)).isoformat()
    })
    
    print("2 örnek değerlendirme oluşturuldu")
    
    print("\n✅ Veritabanı başlatma tamamlandı!")
    print("\nTest Kullanıcıları:")
    print("  Usta 1: mehmet_kaynakci / 123456")
    print("  Usta 2: ahmet_cnc / 123456")
    print("  Usta 3: ali_elektrik / 123456")
    print("  İşveren 1: abc_makina / 123456")
    print("  İşveren 2: def_metal / 123456")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(init_data())
