import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import socketio
from dotenv import load_dotenv
from .database import engine, Base
from .routers import auth, chat, profile
from . import models, database

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(title="E_Chat - Real-Time Secure Communication")

# CORS Configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [
    FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',  # Allow all origins
    logger=True,
    engineio_logger=True
)

# Wrap with ASGI app
socket_app = socketio.ASGIApp(sio, app)

# Mount static files (if needed)
try:
    app.mount("/static", StaticFiles(directory="backend/static"), name="static")
except:
    pass  # Static directory might not exist

# Mount uploads directory for profile photos and files
try:
    app.mount("/uploads", StaticFiles(directory="backend/uploads"), name="uploads")
except:
    os.makedirs("backend/uploads", exist_ok=True)
    app.mount("/uploads", StaticFiles(directory="backend/uploads"), name="uploads")

# Include routers
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(profile.router)

@app.on_event("startup")
async def startup():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
async def root():
    return {"message": "E_Chat API - Real-Time Secure Communication", "status": "online"}

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy", "service": "e_chat"}

# Socket.IO Event Handlers
from .chat_manager import setup_socketio_events
setup_socketio_events(sio)
