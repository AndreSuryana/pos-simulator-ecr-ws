import asyncio
import json
from PyQt5.QtWidgets import QApplication, QMessageBox
from .pairing_controller import PairingController
from .setting_controller import SettingController
from services import WebSocketService
from utils.config import ConfigManager
from utils.payload import SignedPayload
from views import MainWindow

class MainController:

    def __init__(self, app: QApplication, view: MainWindow, config: ConfigManager):
        self.app = app
        self.view = view
        self.config = config
        self.payload: SignedPayload | None = None
        
        # Initialize services
        self.websocket_service = WebSocketService()
        
        # Initialize controllers
        self.pairing = PairingController(self.view.pairing_tab, self.websocket_service)
        self.setting = SettingController(self.view.setting_tab, self.config)
        
        # Connect signals
        self._connect_ui_events()
        self._connect_service_events()
        
        # Ensure configurations
        self._check_config()
        
    def _connect_ui_events(self):
        self.view.bottom_bar.connect_clicked.connect(self._connect_websocket)
        self.view.bottom_bar.disconnect_clicked.connect(self._disconnect_websocket)
    
    def _connect_websocket(self, url: str):
        self.config.set("ws.url", url)  # Save url to config file
        self.view.bottom_bar.set_status_label("Connecting...", "orange")
        
        async def connect_task():
            await self.websocket_service.connect(
                uri=url,
                tls=self.config.get("ws.mode") != "None",
                ca_cert_path=self.config.get("ws.ca_cert"),
                client_cert_path=self.config.get("ws.client_cert"),
                client_key_path=self.config.get("ws.client_key"),
            )
        
        asyncio.create_task(connect_task())
        
    def _disconnect_websocket(self):
        asyncio.run(self.websocket_service.close)
    
    def _connect_service_events(self):
        self.websocket_service.on_open = self._on_websocket_open
        self.websocket_service.on_send = self._on_websocket_send
        self.websocket_service.on_message = self._on_websocket_message
        self.websocket_service.on_close = self._on_websocket_close
        self.websocket_service.on_error = self._on_websocket_error
        
    def _on_websocket_open(self):
        print("[INFO] WebSocket opened")
        self._register()
    
    def _on_websocket_send(self, message: str):
        print(f"[INFO] WebSocket send: {message}")
    
    def _on_websocket_message(self, message: str):
        print(f"[INFO] WebSocket received: {message}")
        
        try:
            parsed = json.loads(message)
            type = parsed.get("type")
            
            if type == "REGISTER_POS_DONE":
                self.view.bottom_bar.set_status_label("Ready", "green")
                
            elif type == "PAIR_POS_DONE":
                data = parsed.get("data", {})
                edc_id = data.get("edc_id")

                if edc_id:
                    self.pairing.on_device_paired(edc_id)
                
        except json.JSONDecodeError as e:
            print(f"[ERROR] Invalid JSON received {e}")
    
    def _on_websocket_close(self):
        print("[INFO] WebSocket closed")
    
    def _on_websocket_error(self, e: Exception):
        print(f"[ERROR] WebSocket error: {e}")
    
    def _check_config(self):
        # WebSocket URL for bottom bar
        ws_url = self.config.get("ws.url")
        if ws_url:
            self.view.bottom_bar.set_websocket_url(ws_url)
        
        # Required API key and private key for signed payload
        api_key = self.config.get("auth.api_key")
        private_key = self.config.get("auth.private_key")
        
        # If config missing or invalid, open settings tab
        if not api_key or not private_key:
            print("[INFO] Missing API key/private key, opening Settings tab...")
            self.view.show_settings_tab()
            return
        
        try:
            self.payload = SignedPayload(api_key, private_key)
            
            # Update payload in other controllers
            self.pairing.set_payload(self.payload)
        except ValueError:
            print("[INFO] Invalid private key format, opening Settings tab...")
            self.view.show_settings_tab()
    
    def show_app(self):
        self.view.show()

    async def cleanup(self):
        pass
        if self.websocket_service:
            await self.websocket_service.close()

    def _register(self):
        async def register_task():
            pos_id = self.config.get("general.pos_id")
            mid = self.config.get("general.mid")
            
            if not pos_id or not mid:
                QMessageBox.warning(self, "Missing Information", "POS ID and MID are missing.")
                return
            
            data = self.payload.make("REGISTER_POS", { "pos_id": pos_id, "mid": mid })
            await self.websocket_service.send(data)
        
        asyncio.create_task(register_task())