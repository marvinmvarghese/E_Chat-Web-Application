from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File
import shutil
import os
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from .. import schemas, database, models, auth, chat_manager, crud
import json 
import logging

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)

@router.get("/contacts", response_model=List[schemas.ContactResponse])
async def get_contacts(
    current_user: dict = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    return await crud.get_contacts(db, current_user["id"])

@router.post("/contacts", response_model=schemas.ContactResponse)
async def add_contact(
    payload: schemas.ContactCreate,
    current_user: dict = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    contact = await crud.add_contact(db, current_user["id"], payload.email)
    if not contact:
        raise HTTPException(400, "User not found or invalid")
    return contact

@router.post("/groups", response_model=schemas.GroupResponse)
async def create_group(
    payload: schemas.GroupCreate,
    current_user: dict = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    return await crud.create_group(db, payload.name, current_user["id"])

@router.get("/groups", response_model=List[schemas.GroupResponse])
async def get_groups(
    current_user: dict = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    return await crud.get_user_groups(db, current_user["id"])

@router.post("/groups/{group_id}/members", response_model=schemas.UserResponse)
async def add_group_member(
    group_id: int,
    payload: schemas.GroupMemberAdd,
    current_user: dict = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    # TODO: Verify current_user is admin? MVP: Skip check
    member = await crud.add_group_member(db, group_id, payload.email)
    if not member:
        raise HTTPException(400, "User not found or already in group")
    return member

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(auth.get_current_user)
):
    # Validate Size (e.g. 10MB limit)
    # file.file.seek(0, 2)
    # size = file.file.tell()
    # file.file.seek(0)
    # if size > 10 * 1024 * 1024: raise HTTPException(400, "File too large")
    
    os.makedirs("backend/uploads", exist_ok=True)
    ext = file.filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    path = f"backend/uploads/{filename}"
    
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {
        "url": f"uploads/{filename}",
        "filename": file.filename,
        "type": file.content_type,
        "size": 0 # TODO measure real size
    }

@router.get("/history/{contact_or_group_id}", response_model=List[schemas.MessageResponse])
async def get_history(
    contact_or_group_id: int,
    is_group: bool = False,
    current_user: dict = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    return await crud.get_chat_history(db, current_user["id"], contact_or_group_id, is_group)

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str,
    db: AsyncSession = Depends(database.get_db)
):
    user = auth.verify_token(token)
    if not user:
        await websocket.close(code=4001)
        return

    user_id = user["id"]
    await chat_manager.manager.connect(websocket, user_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            msg_data = json.loads(data)
            msg_type = msg_data.get("type", "text")
            receiver_id = msg_data.get("receiver_id")
            
            msg_type = msg_data.get("type", "text") # text, file, typing_...
            
            if msg_type in ["text", "file"]:
                content = msg_data.get("content")
                # receiver_id OR group_id
                receiver_id = msg_data.get("receiver_id")
                group_id = msg_data.get("group_id")
                
                # File Metadata
                file_url = msg_data.get("file_url")
                file_type = msg_data.get("file_type")
                file_name = msg_data.get("file_name")
                file_size = msg_data.get("file_size")

                # Create Message
                db_msg = await crud.create_message(
                    db, 
                    sender_id=user_id, 
                    receiver_id=receiver_id,
                    group_id=group_id,
                    content=content,
                    file_url=file_url,
                    file_type=file_type,
                    file_name=file_name,
                    file_size=file_size
                )
                
                # Payload to send
                out_msg = {
                    "type": "new_message",
                    "id": db_msg.id,
                    "content": db_msg.content,
                    "sender_id": user_id,
                    "receiver_id": receiver_id,
                    "group_id": group_id,
                    # File Data
                    "file_url": db_msg.file_url,
                    "file_type": db_msg.file_type,
                    "file_name": db_msg.file_name,
                    "file_size": db_msg.file_size,
                    "created_at": str(db_msg.created_at),
                    "status": "sent"
                }

                if group_id:
                    # Broadcast to Group API
                    # Get members
                    member_ids = await crud.get_group_members_ids(db, group_id)
                    for member_id in member_ids:
                        if member_id != user_id: # Don't echo twice if frontend optimistic
                             await chat_manager.manager.send_personal_message(out_msg, member_id)
                    # Echo to sender
                    await chat_manager.manager.send_personal_message(out_msg, user_id)

                elif receiver_id:
                    # 1-to-1
                    await chat_manager.manager.send_personal_message(out_msg, receiver_id)
                    await chat_manager.manager.send_personal_message(out_msg, user_id)

            elif msg_type == "typing_start" or msg_type == "typing_stop":
                 # Helper to route typing events
                 pass # TODO: Implement typing for groups later
            
            elif msg_type == "message_read":
                 pass

    except WebSocketDisconnect:
        chat_manager.manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"WebSocket Error: {e}")
        await websocket.close()
