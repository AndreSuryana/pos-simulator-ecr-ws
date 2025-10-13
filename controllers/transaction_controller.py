import asyncio
from common import TransactionType
from models import Transaction
from PyQt5.QtWidgets import QMessageBox
from services import WebSocketService
from utils.config import ConfigManager
from utils.payload import SignedPayload
from views.tabs import TransactionTab


class TransactionController:
    def __init__(self, view: TransactionTab, client: WebSocketService, pos_id: str, payload: SignedPayload | None = None):
        self.view = view
        self.client = client
        self.pos_id = pos_id
        self.payload = payload
        
        # Connect signals
        self.view.send_clicked.connect(self._send_transaction)
        self.view.refresh_clicked.connect(self.get_active_edc_devices)
        
    def set_payload(self, payload: SignedPayload):
        self.payload = payload
        
    def _send_transaction(self, type: TransactionType, edc_id: str, trx: Transaction):
        async def trx_task():
            if not edc_id:
                QMessageBox.warning(self.view, "Missing Information", "EDC ID is required.")
                return
            
            data_field: dict = {}
            
            if trx.amount:
                data_field["amount"] = trx.amount
            
            if trx.tip_amount:
                data_field["tipAmount"] = trx.tip_amount
                
            if trx.transaction_id:
                data_field["transactionId"] = trx.transaction_id
                
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
        
    def get_active_edc_devices(self):
        async def get_task():
            if self.client.ws and self.pos_id:
                data = self.payload.make("GET_LIST_EDC", { "pos_id": self.pos_id })
                await self.client.send(data)
        
        asyncio.create_task(get_task())
        
    def on_transaction_response(self, edc_id: str, resp: dict):
        # TODO: Show in the transaction logs (not yet created)

        response_code = resp.get("responseCode")
        response_message = resp.get("responseMessage")
        data_field = resp.get("dataField")

        print(f"[INFO] Transaction replied by: {edc_id}")
        
        QMessageBox.information(
            self.view,
            "Transaction Response",
            f"{response_code} - {response_message}"
        )
        
    def on_edc_devices_response(self, data_list):
        devices = []
        
        if not data_list and self.view.isVisible():
            QMessageBox.warning(
                self.view,
                "Missing Information",
                "No EDC devices paired to this POS."
            )
            return
        
        for item in data_list:
            devices.append(item.get("edc_id"))
        
        self.view.set_edc_devices(devices)