from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .routers import plants, users, admin, friends
from .services.scheduler_service import scheduler_service
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up TaskGarden API...")
    scheduler_service.start()
    yield
    logger.info("Shutting down TaskGarden API...")
    scheduler_service.shutdown()


app = FastAPI(title="Task Garden API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plants.router, prefix="/api/plants", tags=["plants"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(friends.router, prefix="/api/friends", tags=["friends"])


@app.get("/")
async def root():
    return {"message": "Task Garden API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Task Garden API"}
