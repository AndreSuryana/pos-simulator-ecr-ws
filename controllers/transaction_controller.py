import asyncio
from .device_controller import DeviceController
from common import TransactionType
from models import Transaction
from PyQt5.QtWidgets import QMessageBox
from services import WebSocketService
from utils.config import ConfigManager
from utils.payload import SignedPayload
from views.tabs import TransactionTab


class TransactionController(DeviceController):
    def __init__(self, view: TransactionTab, client: WebSocketService, payload: SignedPayload | None = None):
        self.view = view
        self.client = client
        self.payload = payload
        
        # Connect signals
        self.view.send_clicked.connect(self._send_transaction)
        self.view.refresh_clicked.connect(self.get_active_edc_devices)
        
    def _send_transaction(self, type: TransactionType, edc_id: str, trx: Transaction):
        async def trx_task():
            if not edc_id:
                QMessageBox.warning(self.view, "Missing Information", "EDC ID is required.")
                return
            
            if not self.client.ws:
                QMessageBox.warning(self.view, "Connection Error", "WebSocket not connected")
                return
            
            data_field: dict = {}
            
            if trx.amount:
                data_field["amount"] = trx.amount
            
            if trx.tip_amount:
                data_field["tipAmount"] = trx.tip_amount
                
            trx_id = trx.get_transaction_id()
            if trx_id:
                data_field["transactionId"] = trx_id
                
            if trx.trace:
                data_field["traceNumber"] = trx.trace
            
            data = self.payload.make("SEND_TO_EDC", {
                "edc_id": edc_id,
                "data_transaction": {
                    "transactionType": type.id,
                    "dataField": data_field,
                }
            })
            await self.client.send(data)
            
        asyncio.create_task(trx_task())
        
    def on_transaction_response(self, edc_id: str, resp: dict):
        response_code = resp.get("responseCode")
        response_message = resp.get("responseMessage")
        data_field = resp.get("dataField")

        print(f"[INFO] Transaction replied by: {edc_id}")
        
        QMessageBox.information(
            self.view,
            "Transaction Response",
            f"{response_code} - {response_message}"
        )