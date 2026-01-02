from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import shutil
import os
import uuid
from .. import schemas, database, models, auth, crud

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("/me", response_model=schemas.UserProfileResponse)
async def get_my_profile(
    current_user: dict = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Get current user's profile"""
    user = await crud.get_user_by_id(db, current_user["id"])
    if not user:
        raise HTTPException(404, "User not found")
    
    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name or user.email.split('@')[0],
        "about": user.about or "Hey there! I am using E-Chat",
        "profile_photo_url": user.profile_photo_url,
        "theme_preference": user.theme_preference or "light",
        "last_seen": user.last_seen,
        "created_at": user.created_at
    }

@router.put("/me", response_model=schemas.UserProfileResponse)
async def update_my_profile(
    payload: schemas.UserProfileUpdate,
    current_user: dict = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Update current user's profile"""
    user = await crud.update_user_profile(
        db, 
        current_user["id"],
        display_name=payload.display_name,
        about=payload.about,
        theme_preference=payload.theme_preference
    )
    
    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name or user.email.split('@')[0],
        "about": user.about or "Hey there! I am using E-Chat",
        "profile_photo_url": user.profile_photo_url,
        "theme_preference": user.theme_preference or "light",
        "last_seen": user.last_seen,
        "created_at": user.created_at
    }

@router.post("/photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: dict = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Upload profile photo"""
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")
    
    # Create uploads directory
    os.makedirs("backend/uploads/profiles", exist_ok=True)
    
    # Generate unique filename
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f"{current_user['id']}_{uuid.uuid4()}.{ext}"
    path = f"backend/uploads/profiles/{filename}"
    
    # Save file
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update user profile
    photo_url = f"/uploads/profiles/{filename}"
    user = await crud.update_profile_photo(db, current_user["id"], photo_url)
    
    return {
        "profile_photo_url": photo_url,
        "message": "Profile photo updated successfully"
    }

@router.delete("/photo")
async def delete_profile_photo(
    current_user: dict = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Delete profile photo"""
    user = await crud.update_profile_photo(db, current_user["id"], None)
    
    return {
        "message": "Profile photo deleted successfully"
    }
