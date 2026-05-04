from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime

app = FastAPI()

# Разрешаем запросы с фронтенда (Vite обычно на 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- In-Memory DB (для простоты, без SQL) ---
users_db = {}
sessions_db = []
posts_db = []

# --- Models ---
class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str = "user"

class AuthResponse(BaseModel):
    token: str
    user: UserResponse

class SessionCreate(BaseModel):
    title: str
    subject: str
    date: str
    durationMinutes: int
    authorId: str

class ProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    goal: str = "Подготовиться к ВсОШ"
    stats: dict
    sessions: list

# --- Endpoints ---

@app.post("/api/auth/register", response_model=AuthResponse)
def register(data: UserRegister):
    # Проверка на существующий email
    for u in users_db.values():
        if u["email"] == data.email:
            raise HTTPException(status_code=409, detail="Email занят")
    
    user_id = str(uuid.uuid4())
    new_user = {
        "id": user_id,
        "name": data.name,
        "email": data.email,
        "password": data.password, # В продакшене хешировать!
        "role": "user",
        "goal": "Топ-5% ВсОШ"
    }
    users_db[user_id] = new_user
    
    return {
        "token": f"mock-token-{user_id}",
        "user": {"id": user_id, "name": data.name, "email": data.email, "role": "user"}
    }

@app.post("/api/auth/login", response_model=AuthResponse)
def login(data: UserLogin):
    for u in users_db.values():
        if u["email"] == data.email and u["password"] == data.password:
            return {
                "token": f"mock-token-{u['id']}",
                "user": {"id": u['id'], "name": u['name'], "email": u['email'], "role": u['role']}
            }
    raise HTTPException(status_code=401, detail="Неверный email или пароль")

@app.get("/api/profile/{user_id}", response_model=ProfileResponse)
def get_profile(user_id: str):
    user = users_db.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    user_sessions = [s for s in sessions_db if s["authorId"] == user_id]
    
    total_minutes = sum(s.get("durationMinutes", 0) for s in user_sessions)
    total_hours = total_minutes / 60
    
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "goal": user.get("goal", "Подготовиться к ВсОШ"),
        "stats": {
            "totalSessions": len(user_sessions),
            "totalHours": round(total_hours, 1),
            "streak": 0,
            "achievements": 0
        },
        "sessions": user_sessions
    }

@app.post("/api/sessions")
def create_session(session: SessionCreate):
    new_session = {
        "id": str(uuid.uuid4()),
        "authorId": session.authorId,  # <--- ИСПОЛЬЗУЙ ID ОТ ФРОНТА
        "title": session.title,
        "subject": session.subject,
        "date": session.date,
        "durationMinutes": session.durationMinutes,
        "createdAt": datetime.now().isoformat()
    }
    sessions_db.append(new_session)
    print(f"Session saved for user: {session.authorId}") # Для отладки
    return new_session

@app.get("/api/feed")
def get_feed(page: int = 1, limit: int = 10):
    # Смешиваем сессии и посты
    all_items = [
        {"type": "session", **s} for s in sessions_db
    ] + [
        {"type": "post", **p} for p in posts_db
    ]
    # Сортировка по дате (новые сверху)
    all_items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    
    start = (page - 1) * limit
    end = start + limit
    return {
        "data": all_items[start:end],
        "hasMore": end < len(all_items),
        "total": len(all_items)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)