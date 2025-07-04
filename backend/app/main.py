from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import tasks, plants, users

app = FastAPI(title="Task Garden API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(plants.router, prefix="/api/plants", tags=["plants"])
app.include_router(users.router, prefix="/api/users", tags=["users"])

@app.get("/")
async def root():
    return {"message": "Task Garden API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Task Garden API"}
