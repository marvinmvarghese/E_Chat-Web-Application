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
            is_forwarded = data.get('is_forwarded', False)

            # Extract file fields (for file/voice messages)
            file_url  = data.get('file_url')
            file_type = data.get('file_type')
            file_name = data.get('file_name')
            file_size = data.get('file_size')
            
            # Save message to database (including file fields)
            async with database.SessionLocal() as db:
                message = await crud.create_message(
                    db,
                    sender_id=user_id,
                    receiver_id=receiver_id,
                    group_id=group_id,
                    content=content,
                    file_url=file_url,
                    file_type=file_type,
                    file_name=file_name,
                    file_size=file_size,
                )
                message_payload = {
                    'id': message.id,
                    'content': message.content,
                    'sender_id': message.sender_id,
                    'receiver_id': message.receiver_id,
                    'group_id': message.group_id,
                    'created_at': message.created_at.isoformat(),
                    'status': message.status,
                    'is_forwarded': bool(is_forwarded),
                    'edited': False,
                    # Echo file fields so frontend can display attachment correctly
                    'file_url':  message.file_url,
                    'file_type': message.file_type,
                    'file_name': message.file_name,
                }
                
                # Add tempId for optimistic update reconciliation
                if '_tempId' in data:
                    message_payload['_tempId'] = data['_tempId']
                
                # Send to receiver(s)
                if group_id:
                    members = await crud.get_group_members_ids(db, group_id)
                    for member_id in members:
                        if member_id != user_id:
                            await send_to_user(sio, member_id, 'new_message', message_payload)
                elif receiver_id:
                    await send_to_user(sio, receiver_id, 'new_message', message_payload)
                
                # Confirm to sender — frontend uses this to replace the optimistic bubble
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

    @sio.event
    async def edit_message(sid, data):
        """Handle message edit — update in DB and broadcast to both parties"""
        try:
            if sid not in session_to_user:
                return
            user_id = session_to_user[sid]
            message_id = data.get('message_id')
            new_content = data.get('content', '').strip()
            if not message_id or not new_content:
                return
            async with database.SessionLocal() as db:
                message = await crud.edit_message(db, message_id, user_id, new_content)
                if not message:
                    return
                payload = {
                    'message_id': message.id,
                    'content': message.content,
                    'edited': True,
                    'sender_id': message.sender_id,
                    'receiver_id': message.receiver_id,
                    'group_id': message.group_id,
                }
                # Notify both sender and receiver
                await sio.emit('message_edited', payload, room=sid)
                if message.receiver_id:
                    await send_to_user(sio, message.receiver_id, 'message_edited', payload)
        except Exception as e:
            logger.error(f"Error in edit_message: {e}")

    @sio.event
    async def delete_message(sid, data):
        """Handle message delete — remove from DB and broadcast"""
        try:
            if sid not in session_to_user:
                return
            user_id = session_to_user[sid]
            message_id = data.get('message_id')
            if not message_id:
                return
            async with database.SessionLocal() as db:
                # Get message info before deleting so we can notify receiver
                message = await crud.get_message_by_id(db, message_id)
                if not message or message.sender_id != user_id:
                    return
                receiver_id = message.receiver_id
                group_id = message.group_id
                deleted = await crud.delete_message(db, message_id, user_id)
                if not deleted:
                    return
                payload = {'message_id': message_id}
                await sio.emit('message_deleted', payload, room=sid)
                if receiver_id:
                    await send_to_user(sio, receiver_id, 'message_deleted', payload)
                if group_id:
                    members = await crud.get_group_members_ids(db, group_id)
                    for member_id in members:
                        if member_id != user_id:
                            await send_to_user(sio, member_id, 'message_deleted', payload)
        except Exception as e:
            logger.error(f"Error in delete_message: {e}")

    # ── WebRTC Call Signaling ────────────────────────────────────────────────

    @sio.event
    async def call_offer(sid, data):
        """Relay WebRTC offer from caller to callee"""
        try:
            if sid not in session_to_user: return
            caller_id = session_to_user[sid]
            callee_id = data.get('receiver_id')
            if not callee_id: return
            await send_to_user(sio, callee_id, 'call_offer', {
                'caller_id': caller_id,
                'call_type': data.get('call_type', 'audio'),
                'offer': data.get('offer'),
                'caller_name': data.get('caller_name', ''),
                'caller_avatar': data.get('caller_avatar', ''),
            })
        except Exception as e:
            logger.error(f"Error in call_offer: {e}")

    @sio.event
    async def call_answer(sid, data):
        """Relay WebRTC answer from callee to caller"""
        try:
            if sid not in session_to_user: return
            callee_id = session_to_user[sid]
            caller_id = data.get('caller_id')
            if not caller_id: return
            await send_to_user(sio, caller_id, 'call_answer', {
                'callee_id': callee_id,
                'answer': data.get('answer'),
            })
        except Exception as e:
            logger.error(f"Error in call_answer: {e}")

    @sio.event
    async def call_ice_candidate(sid, data):
        """Relay ICE candidate between peers"""
        try:
            if sid not in session_to_user: return
            sender_id = session_to_user[sid]
            peer_id = data.get('peer_id')
            if not peer_id: return
            await send_to_user(sio, peer_id, 'call_ice_candidate', {
                'sender_id': sender_id,
                'candidate': data.get('candidate'),
            })
        except Exception as e:
            logger.error(f"Error in call_ice_candidate: {e}")

    @sio.event
    async def call_end(sid, data):
        """Relay call end signal"""
        try:
            if sid not in session_to_user: return
            sender_id = session_to_user[sid]
            peer_id = data.get('peer_id')
            if not peer_id: return
            await send_to_user(sio, peer_id, 'call_end', {'sender_id': sender_id})
        except Exception as e:
            logger.error(f"Error in call_end: {e}")

    @sio.event
    async def call_reject(sid, data):
        """Relay call reject signal"""
        try:
            if sid not in session_to_user: return
            callee_id = session_to_user[sid]
            caller_id = data.get('caller_id')
            if not caller_id: return
            await send_to_user(sio, caller_id, 'call_reject', {'callee_id': callee_id})
        except Exception as e:
            logger.error(f"Error in call_reject: {e}")


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
