import asyncio
import json
from PyQt5.QtWidgets import QWidget, QVBoxLayout, QTabWidget, QMessageBox

from core.payload import Payload
from core.websocket_client import WebSocketClient
from core.config import ConfigManager
from core.signer import Signer
from ui.bottom_bar import BottomBar
from ui.pairing_tab import PairingTab
from ui.transaction_tab import TransactionTab
from ui.logs_tab import LogsTab
from ui.config_tab import ConfigTab


class MainWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("POS Simulator")
        self.resize(1000, 650)
        self.setMinimumSize(800, 500)

        self.config = ConfigManager()

        self.client: WebSocketClient | None = None
        self.payload: Payload | None = None
        self.edc_id: str | None = None

        # Pairing tabs
        self.pairing_tab = PairingTab()
        self.pairing_tab.pairing_requested.connect(self._pair_device)

        self.transaction_tab = TransactionTab()
        self.logs_tab = LogsTab()
        self.config_tab = ConfigTab(self.config)

        # Tabs
        self.tabs = QTabWidget()
        self.tabs.addTab(self.pairing_tab, "Pairing")
        self.tabs.addTab(self.transaction_tab, "Transaction")
        self.tabs.addTab(self.logs_tab, "Logs")
        self.tabs.addTab(self.config_tab, "Config")

        # Bottom bar
        self.bottom_bar = BottomBar(self.config)
        self.bottom_bar.connect_requested.connect(self._connect_and_register)
        self.bottom_bar.disconnect_requested.connect(self._disconnect_client)

        # Layout
        layout = QVBoxLayout()
        layout.addWidget(self.tabs)
        layout.addWidget(self.bottom_bar)
        self.setLayout(layout)

        # Check for configuration, ensure it exists
        if not self.config.get("api_key") or not self.config.get("private_key"):
            QMessageBox.warning(
                self,
                "Configuration Required",
                "API Key and Private Key are missing.\n"
                "Please configure them before using the simulator."
            )
            self.tabs.setCurrentWidget(self.config_tab)

    def _ensure_payload(self) -> bool:
        """Make sure Payload is created from current config."""
        api_key = self.config.get("api_key")
        private_key = self.config.get("private_key")

        if not api_key or not private_key:
            QMessageBox.warning(self, "Missing Config", "API Key or Private Key missing")
            self.tabs.setCurrentWidget(self.config_tab)
            return False

        self.payload = Payload(api_key=api_key, signer=Signer(private_key))
        return True

    def async_run(self, coro):
        asyncio.ensure_future(coro)

    def _connect_and_register(self, url: str):
        async def task():
            if not self._ensure_payload():
                return
            try:
                self.bottom_bar.update_status("Connecting...", "orange")
                self.logs_tab.add_log(f"Connecting to {url}...")

                # Create WebSocket client
                if self.config.get("tls", False):
                    self.client = WebSocketClient(
                        url,
                        ca_cert=self.config.get("ca_cert_path"),
                        client_cert=self.config.get("client_cert_path"),
                        client_key=self.config.get("client_key_path")
                    )
                else:
                    self.client = WebSocketClient(url)

                await self.client.connect()
                if self.client.ws is None:
                    raise Exception("WebSocket connection failed")

                self.logs_tab.add_log("WebSocket opened")
                self.bottom_bar.update_status("Connected", "green")

                # start listening in background
                asyncio.create_task(self.listen_messages())

                # send register payload
                registerPayload = self.payload.make_register(
                    pos_id=self.config.get("pos_id"),
                    mid=self.config.get("mid"),
                )
                await self.client.send(registerPayload)
                self.logs_tab.add_log(registerPayload)
                self.bottom_bar.update_status("Registering...", "orange")

            except Exception as e:
                self.logs_tab.add_log(f"WebSocket error: {e}", error=True)
                self.bottom_bar.update_status("Disconnected", "red")
                QMessageBox.warning(self, "Error", f"Connection failed: {e}")

        self.async_run(task())

    def _disconnect_client(self):
        async def task():
            if self.client and self.client.ws is not None:
                await self.client.ws.close()
                self.logs_tab.add_log("WebSocket closed", incoming=False, error=True)
                self.bottom_bar.update_status("Disconnected", "red")
                self.client.ws = None
        
        self.async_run(task())

    def _pair_device(self, edc_id: str, pair_code: str):
        async def task():
            pairingPayload = self.payload.make_pair(edc_id, pair_code)
            await self.client.send(pairingPayload)
            self.logs_tab.add_log(pairingPayload)
        
        self.async_run(task())

    async def listen_messages(self):
        try:
            while True:
                msg = await self.client.receive()
                msg = json.dumps(json.loads(msg), separators=(',', ':'))  # minify JSON
                self.logs_tab.add_log(msg, incoming=True)

                try:
                    parsed = json.loads(msg)
                    msg_type = parsed.get("type")

                    if msg_type == "REGISTER_POS_DONE":
                        self.bottom_bar.update_status("Ready", "green")

                    elif msg_type == "PAIR_POS_DONE":
                        edc_id = parsed.get("data", {}).get("edc_id")
                        QMessageBox.information(self, "Pairing", f"Paired with EDC {edc_id}")

                    elif msg_type == "ERROR":
                        code = parsed.get("data", {}).get("reason_code", -1)
                        reason = parsed.get("data", {}).get("reason", "Unknown error")
                        QMessageBox.warning(self, "Error", f"{code} - {reason}")

                except json.JSONDecodeError:
                    self.logs_tab.add_log("Invalid JSON received", incoming=True, error=True)

        except Exception as e:
            self.logs_tab.add_log(f"WebSocket error: {e}", incoming=False, error=True)
            self.bottom_bar.update_status(f"Disconnected ({e})", "red")
