import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
import bcrypt
import hashlib
import logging
import secrets
from email.message import EmailMessage
import aiosmtplib
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Config
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "43200"))  # 30 days default
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# SMTP Config (Env vars or defaults for dev)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "your-email@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "your-app-password")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") # Removed due to incompatibility
logger = logging.getLogger(__name__)

def verify_password(plain_password, hashed_password):
    # Pre-hash with SHA256 (Double Hashing)
    password_bytes = plain_password.encode("utf-8")
    sha256 = hashlib.sha256(password_bytes).hexdigest()
    
    # Bcrypt verify
    # hashed_password from DB is string, bcrypt needs bytes
    return bcrypt.checkpw(sha256.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    # Pre-hash with SHA256 (Double Hashing)
    password_bytes = password.encode("utf-8")
    sha256 = hashlib.sha256(password_bytes).hexdigest()
    
    # Bcrypt hash (generates salt automatically)
    hashed = bcrypt.hashpw(sha256.encode('utf-8'), bcrypt.gensalt())
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def generate_otp() -> str:
    return "".join([str(secrets.randbelow(10)) for _ in range(6)])

async def send_otp_email(email: str, otp: str):
    message = EmailMessage()
    message["From"] = SMTP_FROM
    message["To"] = email
    message["Subject"] = "Your E_Chat Login OTP"
    message.set_content(f"Your OTP is: {otp}\n\nThis expires in 5 minutes.")

    # Log for dev reference (User can still see it if SMTP fails or isn't configured)
    logger.info(f"Preparing to send OTP to {email}: {otp}")
    print(f"\n[DEBUG OTP] {email} : {otp}\n")

    if not SMTP_USER or "your-email" in SMTP_USER:
        print("SMTP not configured using defaults. OTP skipped sending via email.")
        return False

    try:
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            start_tls=True,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
        )
        logger.info(f"Email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {email}: {e}")
        print(f"SMTP Error: {e}")
        return False

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_id: int = payload.get("id")
        if email is None or user_id is None:
            return None
        return {"email": email, "id": user_id}
    except JWTError:
        return None

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user = verify_token(token)
    if user is None:
        raise credentials_exception
    return user
