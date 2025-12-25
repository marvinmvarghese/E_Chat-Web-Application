import aiohttp
import asyncio
import json
import logging
from PySide6.QtCore import QObject, Signal, Slot

logger = logging.getLogger(__name__)

class NetworkManager(QObject):
    # Signals to update UI
    login_success = Signal(object)
    login_fail = Signal(str)
    otp_sent = Signal(str)
    otp_fail = Signal(str)
    message_received = Signal(dict)
    contact_list_updated = Signal(list)
    
    def __init__(self, state):
        super().__init__()
        self.state = state
        self.session = None
        self.ws = None
        self.is_connected = False

    async def initialize(self):
        self.session = aiohttp.ClientSession()

    async def close(self):
        if self.ws:
            await self.ws.close()
        if self.session:
            await self.session.close()

    async def request_otp(self, email):
        if not self.session: await self.initialize()
        try:
            async with self.session.post(f"{self.state.api_url}/auth/request-otp", json={"email": email}) as resp:
                if resp.status == 200:
                    self.otp_sent.emit("OTP sent successfully")
                else:
                    self.otp_fail.emit(f"Failed: {resp.status}")
        except Exception as e:
            self.otp_fail.emit(str(e))

    async def verify_otp(self, email, otp):
        if not self.session: await self.initialize()
        try:
            async with self.session.post(f"{self.state.api_url}/auth/verify-otp", json={"email": email, "otp": otp}) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    self.state.token = data["access_token"]
                    self.state.user_id = data["user_id"]
                    self.state.email = data["email"]
                    self.login_success.emit(data)
                    # Start WS
                    asyncio.create_task(self.connect_ws())
                else:
                    self.login_fail.emit("Invalid OTP")
        except Exception as e:
            self.login_fail.emit(str(e))

    async def connect_ws(self):
        url = f"{self.state.ws_url}/chat/ws?token={self.state.token}"
        try:
            async with self.session.ws_connect(url) as ws:
                self.ws = ws
                self.is_connected = True
                async for msg in ws:
                    if msg.type == aiohttp.WSMsgType.TEXT:
                        data = json.loads(msg.data)
                        self.message_received.emit(data)
                    elif msg.type == aiohttp.WSMsgType.ERROR:
                        print("WS Error")
        except Exception as e:
            print(f"WS Connect Error: {e}")
            self.is_connected = False

    async def fetch_contacts(self):
        headers = {"Authorization": f"Bearer {self.state.token}"}
        async with self.session.get(f"{self.state.api_url}/chat/contacts", headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                self.contact_list_updated.emit(data)
                return data
            return []

    async def add_contact(self, email):
        headers = {"Authorization": f"Bearer {self.state.token}"}
        async with self.session.post(f"{self.state.api_url}/chat/contacts", json={"email": email}, headers=headers) as resp:
            if resp.status == 200:
                await self.fetch_contacts()
                return True
            return False

    async def send_message(self, receiver_id, content=None, media_url=None, msg_type="text"):
        if self.ws:
            payload = {
                "type": msg_type,
                "content": content,
                "media_url": media_url,
                "receiver_id": receiver_id
            }
            await self.ws.send_json(payload)

    async def upload_voice(self, file_path):
        headers = {"Authorization": f"Bearer {self.state.token}"}
        data = aiohttp.FormData()
        data.add_field('file', open(file_path, 'rb'), filename='voice.wav')
        
        async with self.session.post(f"{self.state.api_url}/chat/upload-voice", data=data, headers=headers) as resp:
            if resp.status == 200:
                res = await resp.json()
                return res["media_url"]
            return None
