from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
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

@router.get("/history/{contact_id}", response_model=List[schemas.MessageResponse])
async def get_history(
    contact_id: int,
    current_user: dict = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    return await crud.get_chat_history(db, current_user["id"], contact_id)

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
            
            if msg_type == "text":
                content = msg_data.get("content")
                if not content: continue 

                # Create Message
                db_msg = await crud.create_message(
                    db, 
                    sender_id=user_id, 
                    receiver_id=receiver_id,
                    content=content
                )
                
                # Payload to send
                out_msg = {
                    "type": "new_message",
                    "id": db_msg.id,
                    "content": db_msg.content,
                    "sender_id": user_id,
                    "receiver_id": receiver_id,
                    "created_at": str(db_msg.created_at),
                    "status": "sent"
                }

                # Send to Recipient
                await chat_manager.manager.send_personal_message(out_msg, receiver_id)
                # Echo back to Sender
                await chat_manager.manager.send_personal_message(out_msg, user_id)

            elif msg_type == "typing_start":
                await chat_manager.manager.send_personal_message({
                    "type": "typing_start",
                    "sender_id": user_id
                }, receiver_id)

            elif msg_type == "typing_stop":
                await chat_manager.manager.send_personal_message({
                    "type": "typing_stop",
                    "sender_id": user_id
                }, receiver_id)

            elif msg_type == "message_read":
                # await crud.mark_messages_read(db, sender_id=receiver_id, receiver_id=user_id) 
                await chat_manager.manager.send_personal_message({
                    "type": "message_read",
                    "reader_id": user_id,
                    "contact_id": receiver_id 
                }, receiver_id)

    except WebSocketDisconnect:
        chat_manager.manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"WebSocket Error: {e}")
        await websocket.close()
