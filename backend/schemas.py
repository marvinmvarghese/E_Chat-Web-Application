from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
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
    display_name: Optional[str] = None
    profile_photo_url: Optional[str] = None
    about: Optional[str] = None

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
    is_forwarded: Optional[bool] = False
    edited: Optional[bool] = False
    reactions: Optional[Dict[str, Any]] = {}

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

# Call History schemas
class CallHistoryCreate(BaseModel):
    receiver_id: int
    call_type: str  # 'audio' or 'video'
    status: str     # 'completed', 'missed', 'rejected', 'failed'
    duration: Optional[int] = None  # seconds

class CallHistoryResponse(BaseModel):
    id: int
    caller_id: int
    receiver_id: int
    call_type: str
    status: str
    duration: Optional[int] = None
    started_at: datetime
    ended_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Forgot password
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str = Field(..., min_length=8)
