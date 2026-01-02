from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    email: str

class UserBase(BaseModel):
    email: EmailStr

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ContactCreate(BaseModel):
    email: EmailStr

class ContactResponse(UserBase):
    id: int
    display_name: Optional[str] = None
    about: Optional[str] = None
    profile_photo_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class GroupCreate(BaseModel):
    name: str

class GroupMemberAdd(BaseModel):
    email: EmailStr

class GroupResponse(BaseModel):
    id: int
    name: str
    admin_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class MessageBase(BaseModel):
    content: Optional[str] = None
    media_url: Optional[str] = None # Deprecated, use file_url but keep for compat if needed? No, removing.
    # New File Fields
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None

class MessageCreate(MessageBase):
    receiver_id: Optional[int] = None
    group_id: Optional[int] = None

class MessageResponse(MessageBase):
    id: int
    sender_id: int
    receiver_id: Optional[int] = None
    group_id: Optional[int] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# User Profile Schemas
class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    about: Optional[str] = None
    theme_preference: Optional[str] = None  # 'light', 'dark', 'system'

class UserProfileResponse(BaseModel):
    id: int
    email: str
    display_name: Optional[str] = None
    about: Optional[str] = None
    profile_photo_url: Optional[str] = None
    theme_preference: Optional[str] = None
    last_seen: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

