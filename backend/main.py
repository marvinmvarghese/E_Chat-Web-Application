import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .database import engine, Base
from .routers import auth, chat
from . import models, database

app = FastAPI(title="E_Chat MVP")

# Mount static files
app.mount("/static", StaticFiles(directory="backend/static"), name="static")

app.include_router(auth.router)
app.include_router(chat.router)

@app.on_event("startup")
async def startup():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
async def root():
    return FileResponse("backend/static/index.html")
