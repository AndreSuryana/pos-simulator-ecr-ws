from PyQt5.QtWidgets import QWidget, QHBoxLayout, QLabel, QLineEdit, QPushButton, QMessageBox
from PyQt5.QtCore import pyqtSignal

_BTN_CONNECT = "Connect"
_BTN_DISCONNECT = "Disconnect"

class BottomBar(QWidget):
    """
    Bottom bar widget.

    Signals
    -------
    connect_clicked(str)
        Emitted when the user clicks the "Connect" button.
        Carries the WebSocket URL entered by the user.
    disconnect_clicked()
        Emitted when the user clicks the "Disconnect" button.
    """

    connect_clicked = pyqtSignal(str)
    disconnect_clicked = pyqtSignal()

    def __init__(self, url: str = None):
        super().__init__()

        layout = QHBoxLayout()
        layout.setContentsMargins(0, 0, 0, 0)

        self.url_input = QLineEdit(url)
        self.url_input.setPlaceholderText("Enter WebSocket URL")
        self.url_input.setFixedWidth(300)

        self.connect_btn = QPushButton(_BTN_CONNECT)
        self.connect_btn.clicked.connect(self._on_connect_btn_clicked)

        self.status_label = QLabel()
        self.set_status_label("Disconnected", "red")

        layout.addWidget(QLabel("WebSocket URL:"))
        layout.addWidget(self.url_input)
        layout.addWidget(self.connect_btn)
        layout.addStretch()
        layout.addWidget(self.status_label)

        self.setLayout(layout)

    def _on_connect_btn_clicked(self):
        label = self.connect_btn.text()
        if label == _BTN_CONNECT:
            url = self.url_input.text().strip()
            if not url:
                QMessageBox.warning(self, "Connect Error", "Enter WebSocket URL first.")
                return
            
            self.connect_clicked.emit(url)
            self.connect_btn.setText(_BTN_DISCONNECT)

        else:
            self.disconnect_clicked.emit()
            self.connect_btn.setText(_BTN_CONNECT)

    def set_websocket_url(self, url: str):
        self.url_input.setText(url)

    def set_status_label(self, text: str, color: str = "black"):
        self.status_label.setText(f"Status: {text}")
        self.status_label.setStyleSheet(f"color: {color}; font-weight: bold")