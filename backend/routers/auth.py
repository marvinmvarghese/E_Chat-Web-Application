from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timedelta, timezone
from .. import schemas, database, crud, auth, models
import random, string, logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=schemas.Token)
async def signup(payload: schemas.UserCreate, db: AsyncSession = Depends(database.get_db)):
    user = await crud.get_user_by_email(db, payload.email)
    if user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    hashed_pw = auth.get_password_hash(payload.password)
    new_user = await crud.create_user(db, payload.email, hashed_pw)
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": new_user.email, "id": new_user.id}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": new_user.id,
        "email": new_user.email,
        "display_name": new_user.display_name,
        "profile_photo_url": new_user.profile_photo_url,
        "about": new_user.about,
    }

@router.post("/login", response_model=schemas.Token)
async def login(payload: schemas.UserLogin, db: AsyncSession = Depends(database.get_db)):
    user = await crud.get_user_by_email(db, payload.email)
    if not user or not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password",
                            headers={"WWW-Authenticate": "Bearer"})
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "id": user.id}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "display_name": user.display_name,
        "profile_photo_url": user.profile_photo_url,
        "about": user.about,
    }

# ── Forgot Password ──────────────────────────────────────────────────────────

@router.post("/forgot-password")
async def forgot_password(payload: schemas.ForgotPasswordRequest, db: AsyncSession = Depends(database.get_db)):
    """Send a 6-digit OTP to the user's email."""
    user = await crud.get_user_by_email(db, payload.email)
    # Always return 200 so we don't leak whether an email exists
    if not user:
        return {"message": "If this email is registered you will receive an OTP shortly."}

    try:
        # Invalidate old OTPs for this email
        await db.execute(
            models.OTP.__table__.update()
            .where(models.OTP.email == payload.email)
            .values(is_used=True)
        )

        code = ''.join(random.choices(string.digits, k=6))
        # Use timezone-naive UTC datetime to match DateTime column (no timezone=True)
        otp = models.OTP(
            email=payload.email,
            code=code,
            expires_at=datetime.utcnow() + timedelta(minutes=10),
            is_used=False,
        )
        db.add(otp)
        await db.commit()

        # Also send via SMTP if configured
        await auth.send_otp_email(payload.email, code)

        return {"message": "OTP sent to your email.", "otp": code}
    except Exception as e:
        logger.error(f"OTP creation failed for {payload.email}: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create OTP: {str(e)}")

@router.post("/verify-otp")
async def verify_otp(payload: schemas.VerifyOTPRequest, db: AsyncSession = Depends(database.get_db)):
    """Verify the 6-digit OTP. Returns a short-lived reset token on success."""
    result = await db.execute(
        select(models.OTP).where(
            models.OTP.email == payload.email,
            models.OTP.code == payload.otp,
            models.OTP.is_used == False,  # noqa
        ).order_by(models.OTP.id.desc())
    )
    otp_row = result.scalars().first()
    now = datetime.now(timezone.utc)
    if not otp_row or otp_row.expires_at.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    # Mark as used
    otp_row.is_used = True
    await db.commit()
    # Issue a short-lived "password reset" JWT (5 min)
    reset_token = auth.create_access_token(
        data={"sub": payload.email, "purpose": "reset"},
        expires_delta=timedelta(minutes=5)
    )
    return {"reset_token": reset_token}

@router.post("/reset-password")
async def reset_password(payload: schemas.ResetPasswordRequest, db: AsyncSession = Depends(database.get_db)):
    """Reset the password using the reset token from verify-otp."""
    claims = auth.verify_token(payload.reset_token)
    if not claims or claims.get("purpose") != "reset":
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    user = await crud.get_user_by_email(db, claims["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    user.password_hash = auth.get_password_hash(payload.new_password)
    await db.commit()
    return {"message": "Password reset successfully"}

