import asyncio
from services import WebSocketService
from utils.payload import SignedPayload
from PyQt5.QtWidgets import QMessageBox


class DeviceController:
    def __init__(self, client: WebSocketService):
        self.client = client
        self.payload: SignedPayload | None = None
        
    def set_payload(self, payload: SignedPayload):
        self.payload = payload
        
    def set_pos_id(self, pos_id: str):
        self.pos_id = pos_id
        
    def get_active_edc_devices(self):
        async def get_task():
            if not self.pos_id and not self.payload:
                print(f"[ERROR] Missing POS ID or payload not initialized.")
                return
            
            if not self.client.ws:
                QMessageBox.warning(self.view, "Connection Error", "WebSocket not connected")
                return    
                
            data = self.payload.make("GET_LIST_EDC", { "pos_id": self.pos_id })
            await self.client.send(data)
        
        asyncio.create_task(get_task())