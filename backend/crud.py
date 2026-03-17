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

# --- Groups ---
async def create_group(db: AsyncSession, name: str, admin_id: int):
    db_group = models.Group(name=name, admin_id=admin_id)
    db.add(db_group)
    await db.commit()
    await db.refresh(db_group)
    
    # Auto-add admin as member
    member = models.GroupMember(group_id=db_group.id, user_id=admin_id)
    db.add(member)
    await db.commit()
    
    return db_group

async def add_group_member(db: AsyncSession, group_id: int, user_email: str):
    user = await get_user_by_email(db, user_email)
    if not user: return None
    
    # Check existing
    existing = await db.execute(select(models.GroupMember).where(
        models.GroupMember.group_id == group_id,
        models.GroupMember.user_id == user.id
    ))
    if existing.scalars().first(): return user
    
    member = models.GroupMember(group_id=group_id, user_id=user.id)
    db.add(member)
    await db.commit()
    return user

async def get_user_groups(db: AsyncSession, user_id: int):
    # Join groups on members
    stmt = select(models.Group).join(models.GroupMember, models.Group.id == models.GroupMember.group_id).where(models.GroupMember.user_id == user_id)
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_group_members_ids(db: AsyncSession, group_id: int):
    result = await db.execute(select(models.GroupMember.user_id).where(models.GroupMember.group_id == group_id))
    return result.scalars().all()

# --- Messages ---
async def create_message(
    db: AsyncSession, 
    sender_id: int, 
    receiver_id: int = None, 
    group_id: int = None,
    content: str = None,
    file_url: str = None,
    file_type: str = None,
    file_name: str = None,
    file_size: int = None
):
    db_msg = models.Message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        group_id=group_id,
        content=content,
        file_url=file_url,
        file_type=file_type,
        file_name=file_name,
        file_size=file_size,
        status="sent"
    )
    db.add(db_msg)
    await db.commit()
    await db.refresh(db_msg)
    return db_msg

async def get_chat_history(db: AsyncSession, user_id: int, contact_or_group_id: int, is_group: bool = False):
    if is_group:
        stmt = select(models.Message).where(models.Message.group_id == contact_or_group_id).order_by(models.Message.created_at.asc())
    else:
        stmt = select(models.Message).where(
            or_(
                and_(models.Message.sender_id == user_id, models.Message.receiver_id == contact_or_group_id),
                and_(models.Message.sender_id == contact_or_group_id, models.Message.receiver_id == user_id)
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

async def update_message_status(db: AsyncSession, message_id: int, status: str):
    """Update message status (sent, delivered, read)"""
    stmt = update(models.Message).where(
        models.Message.id == message_id
    ).values(status=status)
    
    await db.execute(stmt)
    await db.commit()

async def get_message_by_id(db: AsyncSession, message_id: int):
    """Get a message by its ID"""
    result = await db.execute(select(models.Message).where(models.Message.id == message_id))
    return result.scalars().first()

# Profile CRUD functions
async def get_user_by_id(db: AsyncSession, user_id: int):
    """Get user by ID"""
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    return result.scalars().first()

async def update_user_profile(
    db: AsyncSession, 
    user_id: int,
    display_name: str = None,
    about: str = None,
    theme_preference: str = None
):
    """Update user profile"""
    user = await get_user_by_id(db, user_id)
    if not user:
        return None
    
    if display_name is not None:
        user.display_name = display_name
    if about is not None:
        user.about = about
    if theme_preference is not None:
        user.theme_preference = theme_preference
    
    await db.commit()
    await db.refresh(user)
    return user

async def update_profile_photo(db: AsyncSession, user_id: int, photo_url: str = None):
    """Update user profile photo"""
    user = await get_user_by_id(db, user_id)
    if not user:
        return None
    
    user.profile_photo_url = photo_url
    await db.commit()
    await db.refresh(user)
    return user

async def update_last_seen(db: AsyncSession, user_id: int):
    """Update user's last seen timestamp"""
    stmt = update(models.User).where(
        models.User.id == user_id
    ).values(last_seen=datetime.now())
    
    await db.execute(stmt)
    await db.commit()

async def edit_message(db: AsyncSession, message_id: int, sender_id: int, new_content: str):
    """Edit a message — only the sender can edit"""
    message = await get_message_by_id(db, message_id)
    if not message or message.sender_id != sender_id:
        return None
    message.content = new_content
    message.edited = True
    await db.commit()
    await db.refresh(message)
    return message

async def delete_message(db: AsyncSession, message_id: int, sender_id: int):
    """Hard-delete a message — only the sender can delete"""
    from sqlalchemy import delete as sql_delete
    message = await get_message_by_id(db, message_id)
    if not message or message.sender_id != sender_id:
        return False
    await db.execute(sql_delete(models.Message).where(models.Message.id == message_id))
    await db.commit()
    return True

async def search_users(db: AsyncSession, query: str, current_user_id: int):
    """Search users by email or display name"""
    stmt = select(models.User).where(
        models.User.id != current_user_id,
        or_(
            models.User.email.ilike(f"%{query}%"),
            models.User.display_name.ilike(f"%{query}%")
        )
    ).limit(20)
    result = await db.execute(stmt)
    return result.scalars().all()

async def create_call_history(db: AsyncSession, caller_id: int, receiver_id: int,
                              call_type: str, status: str, duration: int = None):
    """Log a call in the call history"""
    from datetime import datetime as dt
    call = models.CallHistory(
        caller_id=caller_id,
        receiver_id=receiver_id,
        call_type=call_type,
        status=status,
        duration=duration,
        ended_at=dt.utcnow() if status != 'missed' else None,
    )
    db.add(call)
    await db.commit()
    await db.refresh(call)
    return call

async def get_call_history(db: AsyncSession, user_id: int):
    """Get all calls involving this user (as caller or receiver), newest first"""
    stmt = select(models.CallHistory).where(
        or_(models.CallHistory.caller_id == user_id,
            models.CallHistory.receiver_id == user_id)
    ).order_by(models.CallHistory.started_at.desc()).limit(100)
    result = await db.execute(stmt)
    return result.scalars().all()
