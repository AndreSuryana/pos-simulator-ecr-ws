from PyQt5.QtCore import QObject, pyqtSignal
from PyQt5.QtWidgets import QMessageBox
from utils.config import ConfigManager
from views.tabs import SettingTab

class SettingController(QObject):
    """
    Setting controller.
    
    Signals
    -------
    config_updated()
        Emitted when there's configuration updates.
    """
    config_updated = pyqtSignal()
    
    def __init__(self, view: SettingTab, config: ConfigManager):
        super().__init__()
        self.view = view
        self.config = config
        
        existing_config = self.config.load()
        if existing_config:
            self.view.set_config(existing_config)
        
        # Connect signals
        self.view.save_clicked.connect(self._on_save_config)
        
    def _on_save_config(self, config: dict):
        if not config:
            self._on_error("Configuration data is empty.")
            return
        
        general = config.get("general", {})
        auth = config.get("auth", {})
        ws = config.get("ws", {})
        
        # Validate general section
        if not general.get("pos_id"):
            self._on_error("POS ID is required.")
            return
        if not general.get("mid"):
            self._on_error("MID is required.")
            return
        if not general.get("trx_id_len"):
            self._on_error("Transaction ID Length required.")
            return
        
        # Validate auth section
        if not auth.get("api_key"):
            self._on_error("API key is required.")
            return
        if not auth.get("private_key"):
            self._on_error("Private key is required.")
            return
        
        # TLS validation
        if ws.get("mode") == "One-way TLS" and not ws.get("ca_cert"):
            self._on_error("CA certificate path is required for One-way TLS.")
            return
        if ws.get("tls") == "Mutual TLS":
            if not ws.get("ca_cert"):
                self._on_error("CA certificate path is required for Mutual ws.")
                return
            if not ws.get("client_cert"):
                self._on_error("Client certificate path is required for Mutual ws.")
                return
            if not ws.get("client_key"):
                self._on_error("Client key path is required for Mutual TLS.")
                return
        
        # If all good, save config
        self.config.update(config)
        QMessageBox.information(self.view, "Configuration Saved", "Settings have been saved successfully.")
        
        # Notify all
        self.config_updated.emit()
            
    def _on_error(self, text: str):
        QMessageBox.warning(self.view, "Configuration Error", text)