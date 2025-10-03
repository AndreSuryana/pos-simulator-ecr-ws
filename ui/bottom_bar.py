from PyQt5.QtWidgets import QWidget, QHBoxLayout, QLabel, QLineEdit, QPushButton
from PyQt5.QtCore import pyqtSignal
from core.config import ConfigManager


class BottomBar(QWidget):
    connect_requested = pyqtSignal(str)  # emits URL when connect button clicked
    disconnect_requested = pyqtSignal()  # emits when disconnect button clicked

    def __init__(self, config: ConfigManager):
        super().__init__()
        self.config = config
        self.connected = False  # track connection state

        layout = QHBoxLayout()
        layout.setContentsMargins(0, 0, 0, 0)

        self.url_input = QLineEdit(self.config.get("url", ""))
        self.url_input.setPlaceholderText("Enter WebSocket URL")
        self.url_input.setFixedWidth(300)

        self.connect_btn = QPushButton("Connect")
        self.connect_btn.clicked.connect(self._toggle_connection)

        self.status_label = QLabel("Disconnected")
        self.status_label.setStyleSheet("color: red; font-weight: bold;")

        layout.addWidget(QLabel("WebSocket URL:"))
        layout.addWidget(self.url_input)
        layout.addWidget(self.connect_btn)
        layout.addStretch()  # push status label to the right
        layout.addWidget(self.status_label)

        self.setLayout(layout)

    def _toggle_connection(self):
        if not self.connected:
            # Connect
            url = self.url_input.text().strip()
            if not url:
                self.update_status("Enter URL first", "red")
                return
            self.config.set("url", url)
            self.connect_requested.emit(url)
            self._set_connected(True)
        else:
            # Disconnect
            self.disconnect_requested.emit()
            self._set_connected(False)

    def _set_connected(self, state: bool):
        """Update UI for connection state."""
        self.connected = state
        if state:
            self.connect_btn.setText("Disconnect")
        else:
            self.connect_btn.setText("Connect")

    def update_status(self, text: str, color: str = "black"):
        """Update the status label with optional color."""
        self.status_label.setText(f"Status: {text}")
        self.status_label.setStyleSheet(f"color: {color}; font-weight: bold;")
