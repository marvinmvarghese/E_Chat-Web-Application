from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, and_, update
from datetime import datetime
from . import models, schemas, auth

async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(select(models.User).where(models.User.email == email))
    return result.scalars().first()

async def create_user(db: AsyncSession, email: str, password_hash: str):
    db_user = models.User(email=email, password_hash=password_hash)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def get_contacts(db: AsyncSession, user_id: int):
    # 1. Get explicitly added contacts
    result = await db.execute(select(models.Contact).where(models.Contact.owner_id == user_id))
    contacts = result.scalars().all()
    contact_ids = {c.contact_user_id for c in contacts}

    # 2. Get users who have messaged ME (conversations)
    stmt_msgs = select(models.Message.sender_id).where(models.Message.receiver_id == user_id).distinct()
    result_msgs = await db.execute(stmt_msgs)
    sender_ids = set(result_msgs.scalars().all())

    # Union all IDs
    all_visible_ids = contact_ids.union(sender_ids)
    
    if not all_visible_ids:
        return []
        
    res_users = await db.execute(select(models.User).where(models.User.id.in_(all_visible_ids)))
    return res_users.scalars().all()

async def add_contact(db: AsyncSession, user_id: int, contact_email: str):
    contact_user = await get_user_by_email(db, contact_email)
    if not contact_user:
        return None
    if contact_user.id == user_id:
        return None 
        
    existing = await db.execute(select(models.Contact).where(
        models.Contact.owner_id == user_id,
        models.Contact.contact_user_id == contact_user.id
    ))
    if existing.scalars().first():
        return contact_user

    new_contact = models.Contact(owner_id=user_id, contact_user_id=contact_user.id)
    db.add(new_contact)
    await db.commit()
    return contact_user

async def create_message(db: AsyncSession, sender_id: int, receiver_id: int, content: str):
    db_msg = models.Message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        content=content,
        status="sent"
    )
    db.add(db_msg)
    await db.commit()
    await db.refresh(db_msg)
    return db_msg

async def get_chat_history(db: AsyncSession, user_id: int, contact_id: int):
    stmt = select(models.Message).where(
        or_(
            and_(models.Message.sender_id == user_id, models.Message.receiver_id == contact_id),
            and_(models.Message.sender_id == contact_id, models.Message.receiver_id == user_id)
        )
    ).order_by(models.Message.created_at.asc())
    
    result = await db.execute(stmt)
    return result.scalars().all()

async def mark_messages_read(db: AsyncSession, sender_id: int, receiver_id: int):
    # Mark messages sent by sender_id to receiver_id as Read
    stmt = update(models.Message).where(
        models.Message.sender_id == sender_id,
        models.Message.receiver_id == receiver_id,
        models.Message.status != "read"
    ).values(status="read")
    
    await db.execute(stmt)
    await db.commit()
