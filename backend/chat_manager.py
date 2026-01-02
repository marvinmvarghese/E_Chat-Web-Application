import socketio
import logging
from typing import Dict, Set
from . import auth, crud, database
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

# Store active connections: user_id -> set of session IDs
active_connections: Dict[int, Set[str]] = {}

# Store session to user mapping
session_to_user: Dict[str, int] = {}

async def get_db():
    """Get database session"""
    async with database.SessionLocal() as session:
        yield session

def setup_socketio_events(sio: socketio.AsyncServer):
    """Setup all Socket.IO event handlers"""
    
    @sio.event
    async def connect(sid, environ, auth_data):
        """Handle client connection"""
        try:
            # Extract token from auth data
            if not auth_data or 'token' not in auth_data:
                logger.warning(f"Connection rejected for {sid}: No token provided")
                return False
            
            token = auth_data['token']
            user = auth.verify_token(token)
            
            if not user:
                logger.warning(f"Connection rejected for {sid}: Invalid token")
                return False
            
            user_id = user['id']
            
            # Store connection
            if user_id not in active_connections:
                active_connections[user_id] = set()
            active_connections[user_id].add(sid)
            session_to_user[sid] = user_id
            
            logger.info(f"User {user_id} connected with session {sid}")
            
            # Send connection confirmation
            await sio.emit('connected', {'user_id': user_id}, room=sid)
            
            # Broadcast online status to contacts
            await broadcast_user_status(sio, user_id, 'online')
            
            return True
            
        except Exception as e:
            logger.error(f"Connection error: {e}", exc_info=True)
            return False
    
    @sio.event
    async def disconnect(sid):
        """Handle client disconnection"""
        try:
            if sid in session_to_user:
                user_id = session_to_user[sid]
                
                # Remove session
                if user_id in active_connections:
                    active_connections[user_id].discard(sid)
                    
                    # If no more sessions, user is offline
                    if not active_connections[user_id]:
                        del active_connections[user_id]
                        await broadcast_user_status(sio, user_id, 'offline')
                
                del session_to_user[sid]
                logger.info(f"User {user_id} disconnected session {sid}")
                
        except Exception as e:
            logger.error(f"Disconnect error: {e}", exc_info=True)
    
    @sio.event
    async def send_message(sid, data):
        """Handle sending a message"""
        try:
            if sid not in session_to_user:
                return
            
            user_id = session_to_user[sid]
            content = data.get('content')
            receiver_id = data.get('receiver_id')
            group_id = data.get('group_id')
            
            # Save message to database
            async with database.SessionLocal() as db:
                message = await crud.create_message(
                    db,
                    sender_id=user_id,
                    receiver_id=receiver_id,
                    group_id=group_id,
                    content=content
                )
                
                message_payload = {
                    'id': message.id,
                    'content': message.content,
                    'sender_id': message.sender_id,
                    'receiver_id': message.receiver_id,
                    'group_id': message.group_id,
                    'created_at': message.created_at.isoformat(),
                    'status': message.status
                }
                
                # Send to receiver(s)
                if group_id:
                    # Group message
                    members = await crud.get_group_members_ids(db, group_id)
                    for member_id in members:
                        if member_id != user_id:  # Don't send to sender
                            await send_to_user(sio, member_id, 'new_message', message_payload)
                elif receiver_id:
                    # Direct message
                    await send_to_user(sio, receiver_id, 'new_message', message_payload)
                
                # Confirm to sender
                await sio.emit('message_sent', message_payload, room=sid)
                
        except Exception as e:
            logger.error(f"Error sending message: {e}", exc_info=True)
    
    @sio.event
    async def typing_start(sid, data):
        """Handle typing start"""
        try:
            if sid not in session_to_user:
                return
            
            user_id = session_to_user[sid]
            receiver_id = data.get('receiver_id')
            
            if receiver_id:
                await send_to_user(sio, receiver_id, 'typing_start', {
                    'user_id': user_id
                })
                
        except Exception as e:
            logger.error(f"Error in typing_start: {e}")
    
    @sio.event
    async def typing_stop(sid, data):
        """Handle typing stop"""
        try:
            if sid not in session_to_user:
                return
            
            user_id = session_to_user[sid]
            receiver_id = data.get('receiver_id')
            
            if receiver_id:
                await send_to_user(sio, receiver_id, 'typing_stop', {
                    'user_id': user_id
                })
                
        except Exception as e:
            logger.error(f"Error in typing_stop: {e}")
    
    @sio.event
    async def message_read(sid, data):
        """Handle message read receipt"""
        try:
            if sid not in session_to_user:
                return
            
            user_id = session_to_user[sid]
            message_id = data.get('message_id')
            
            # Update message status in database
            async with database.SessionLocal() as db:
                await crud.update_message_status(db, message_id, 'read')
            
            # Notify sender
            read_payload = {
                'type': 'message_read',
                'message_id': message_id,
                'read_by': user_id
            }
            
            # Get message sender and notify them
            async with database.SessionLocal() as db:
                message = await crud.get_message_by_id(db, message_id)
                if message:
                    await send_to_user(sio, message.sender_id, 'message_read', read_payload)
                    
        except Exception as e:
            logger.error(f"Error in message_read: {e}")
    
    @sio.event
    async def profile_updated(sid, data):
        """Handle profile update - broadcast to all user's contacts"""
        try:
            if sid not in session_to_user:
                return
            
            user_id = session_to_user[sid]
            
            # Get user's contacts
            async with database.SessionLocal() as db:
                contacts = await crud.get_contacts(db, user_id)
                
                # Broadcast profile update to all contacts
                for contact in contacts:
                    await send_to_user(sio, contact.id, 'contact_profile_updated', {
                        'user_id': user_id,
                        'display_name': data.get('display_name'),
                        'about': data.get('about'),
                        'profile_photo_url': data.get('profile_photo_url')
                    })
                    
            logger.info(f"Profile updated broadcast for user {user_id}")
            
        except Exception as e:
            logger.error(f"Error in profile_updated: {e}")

async def send_to_user(sio: socketio.AsyncServer, user_id: int, event: str, data: dict):
    """Send event to all sessions of a user"""
    if user_id in active_connections:
        for sid in active_connections[user_id]:
            await sio.emit(event, data, room=sid)

async def broadcast_user_status(sio: socketio.AsyncServer, user_id: int, status: str):
    """Broadcast user online/offline status to their contacts"""
    try:
        async with database.SessionLocal() as db:
            contacts = await crud.get_contacts(db, user_id)
            
            status_payload = {
                'type': 'user_status',
                'user_id': user_id,
                'status': status
            }
            
            # Notify each contact
            for contact in contacts:
                await send_to_user(sio, contact.id, 'user_status', status_payload)
                
    except Exception as e:
        logger.error(f"Broadcast status error: {e}", exc_info=True)

def is_user_online(user_id: int) -> bool:
    """Check if user is online"""
    return user_id in active_connections
