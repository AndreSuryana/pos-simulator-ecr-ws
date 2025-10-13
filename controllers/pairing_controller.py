import asyncio
from services import WebSocketService
from utils.payload import SignedPayload
from views.tabs import PairingTab
from PyQt5.QtWidgets import QMessageBox


class PairingController:
    def __init__(self, view: PairingTab, client: WebSocketService, payload: SignedPayload | None = None):
        self.view = view
        self.client = client
        self.payload = payload

        # Connect signals
        self.view.pair_clicked.connect(self._pair_device)

    def set_payload(self, payload: SignedPayload):
        self.payload = payload
        
    def _pair_device(self, edc_id: str, pair_code: str):
        async def pair_task():
            if not edc_id or not pair_code:
                QMessageBox.warning(self.view, "Missing Information", "Both EDC ID and Pair Code are required.")
                return
            
            data = self.payload.make("PAIR_POS", { "edc_id": edc_id, "pair_code": pair_code })
            await self.client.send(data)

        asyncio.create_task(pair_task())
    
    def on_device_paired(self, edc_id: str):
        print(f"Paired with: {edc_id}")
        QMessageBox.information(self.view, "Pairing", f"Paired with EDC {edc_id}")
        self.view.clear_inputs()