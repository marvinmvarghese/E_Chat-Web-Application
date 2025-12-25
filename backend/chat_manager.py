from fastapi import WebSocket
from typing import Dict, List
import json

class ConnectionManager:
    def __init__(self):
        # Store active connections: user_id -> List[WebSocket] (allow multiple devices)
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        
        # Notify user they are connected (optional, or sync state)
        # await self.send_personal_message({"type": "status", "status": "online"}, user_id)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    # Handle dead connections
                    pass

    async def broadcast(self, message: str):
        for user_cons in self.active_connections.values():
            for connection in user_cons:
                await connection.send_text(message)

    def is_online(self, user_id: int) -> bool:
        return user_id in self.active_connections

manager = ConnectionManager()
