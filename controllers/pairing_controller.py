import asyncio
from .device_controller import DeviceController
from services import WebSocketService
from utils.payload import SignedPayload
from views.tabs import PairingTab
from PySide6.QtWidgets import QMessageBox


class PairingController(DeviceController):
    def __init__(self, view: PairingTab, client: WebSocketService, payload: SignedPayload | None = None):
        super().__init__(client)
        self.view = view

        # Connect signals
        self.view.pair_clicked.connect(self._pair_device)
        self.view.unpair_clicked.connect(self._unpair_device)
        self.view.refresh_clicked.connect(self.get_active_edc_devices)
        
    def _pair_device(self, edc_id: str, pair_code: str):
        async def pair_task():
            if not edc_id or not pair_code:
                QMessageBox.warning(self.view, "Missing Information", "Both EDC ID and Pair Code are required.")
                return
            
            if not self.client.ws:
                QMessageBox.warning(self.view, "Connection Error", "WebSocket not connected")
                return
            
            data = self.payload.make("PAIR_POS", { "edc_id": edc_id, "pair_code": pair_code })
            await self.client.send(data)

        asyncio.create_task(pair_task())

    def on_device_paired(self, edc_id: str):
        QMessageBox.information(self.view, "Pairing", f"Paired with EDC {edc_id}")

        # Refresh the list
        self.get_active_edc_devices()

        self.view.clear_inputs()
        
    def _unpair_device(self, edc_id: str):
        async def unpair_task():
            if not edc_id:
                QMessageBox.warning(self.view, "Missing Information", "Please select EDC ID first.")
                return
            
            if not self.client.ws:
                QMessageBox.warning(self.view, "Connection Error", "WebSocket not connected")
                return
            
            data = self.payload.make("UNPAIR_EDC", { "edc_id": edc_id })
            await self.client.send(data)
            
        asyncio.create_task(unpair_task())
        
    def on_device_unpaired(self, edc_id: str):
        QMessageBox.information(
            self.view,
            "Device Unpaired",
            f"Successfully unpaired from EDC {edc_id}!"
        )
        
        # Refresh the list
        self.get_active_edc_devices()