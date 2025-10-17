from PyQt5.QtCore import pyqtSignal, Qt
from PyQt5.QtGui import QIntValidator
from PyQt5.QtWidgets import (
    QWidget, QFormLayout, QVBoxLayout, QHBoxLayout, QLineEdit,
    QTextEdit, QGroupBox, QPushButton, QComboBox, QFileDialog
)

# TLS Options
_TLS_NONE = "None"
_TLS_ONE_WAY = "One-way TLS"
_TLS_MUTUAL = "Mutual TLS"

class SettingTab(QWidget):
    """
    Setting tab view.

    Signals
    -------
    save_clicked(config)
        Emitted when the "Save Configuration" button is clicked, carrying the
        collected configuration data as a dictionary.
    """

    save_clicked = pyqtSignal(dict)

    def __init__(self):
        super().__init__()
        main_layout = QVBoxLayout()

        # -------------------------------
        # General Configuration
        # -------------------------------
        general_group = QGroupBox("General Settings")
        general_layout = QFormLayout()

        self.pos_id_input = QLineEdit()
        self.mid_input = QLineEdit()
        self.trx_id_len_input = QLineEdit()
        self.trx_id_len_input.setValidator(QIntValidator())
        general_layout.addRow("POS ID:", self.pos_id_input)
        general_layout.addRow("MID:", self.mid_input)
        general_layout.addRow("Transaction ID Length:", self.trx_id_len_input)

        general_group.setLayout(general_layout)
        main_layout.addWidget(general_group)

        # -------------------------------
        # Authentication Configuration
        # -------------------------------
        auth_group = QGroupBox("Authentication")
        auth_layout = QFormLayout()

        self.api_key_input = QLineEdit()
        self.api_key_input.setEchoMode(QLineEdit.Password)

        self.private_key_input = QTextEdit()
        self.private_key_input.setPlaceholderText("-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----")
        self.private_key_input.setFixedHeight(80)

        auth_layout.addRow("API Key:", self.api_key_input)
        auth_layout.addRow("Private Key:", self.private_key_input)

        auth_group.setLayout(auth_layout)
        main_layout.addWidget(auth_group)

        # -------------------------------
        # TLS Configuration
        # -------------------------------
        tls_group = QGroupBox("TLS Configuration")
        tls_layout = QFormLayout()

        # TLS Mode: None / One-way / Mutual
        self.tls_mode_combo = QComboBox()
        self.tls_mode_combo.addItems([_TLS_NONE, _TLS_ONE_WAY, _TLS_MUTUAL])
        self.tls_mode_combo.currentIndexChanged.connect(self._on_tls_mode_change)

        # Use the reusable file picker helper for certificate paths
        self.ca_cert_input = self._add_file_picker(tls_layout, "CA Cert Path:")
        self.client_cert_input = self._add_file_picker(tls_layout, "Client Cert Path:")
        self.client_key_input = self._add_file_picker(tls_layout, "Client Key Path:")

        tls_layout.insertRow(0, "TLS Mode:", self.tls_mode_combo)
        tls_group.setLayout(tls_layout)
        main_layout.addWidget(tls_group)

        # -------------------------------
        # Save Button
        # -------------------------------
        self.save_btn = QPushButton("Save Configuration")
        self.save_btn.clicked.connect(self._on_save_clicked)
        main_layout.addWidget(self.save_btn, alignment=Qt.AlignRight)

        self.setLayout(main_layout)
        self._on_tls_mode_change(0)  # Initialize TLS field states

    # -------------------------------
    # Helpers
    # -------------------------------
    def _add_file_picker(self, layout: QFormLayout, label: str, default_value: str = "") -> QLineEdit:
        """Add a file picker row (QLineEdit + Browse button) to a form layout."""
        container = QWidget()
        hbox = QHBoxLayout(container)
        hbox.setContentsMargins(0, 0, 0, 0)

        line_edit = QLineEdit(default_value)
        browse_btn = QPushButton("Browse")

        def browse():
            path, _ = QFileDialog.getOpenFileName(self, f"Select {label}", "", "All Files (*)")
            if path:
                line_edit.setText(path)

        browse_btn.clicked.connect(browse)
        hbox.addWidget(line_edit)
        hbox.addWidget(browse_btn)
        layout.addRow(label, container)
        return line_edit

    def _on_tls_mode_change(self, index: int):
        """Enable or disable TLS input fields based on selected mode."""
        mode = self.tls_mode_combo.currentText()

        if mode == "None":
            self.ca_cert_input.setEnabled(False)
            self.client_cert_input.setEnabled(False)
            self.client_key_input.setEnabled(False)

        elif mode == "One-way TLS":
            self.ca_cert_input.setEnabled(True)
            self.client_cert_input.setEnabled(False)
            self.client_key_input.setEnabled(False)

        elif mode == "Mutual TLS":
            self.ca_cert_input.setEnabled(True)
            self.client_cert_input.setEnabled(True)
            self.client_key_input.setEnabled(True)

    def _on_save_clicked(self):
        """Collect configuration values and emit the save signal."""
        config = {
            "general": {
                "pos_id": self.pos_id_input.text().strip(),
                "mid": self.mid_input.text().strip(),
                "trx_id_len": self.trx_id_len_input.text().strip(),
            },
            "auth": {
                "api_key": self.api_key_input.text().strip(),
                "private_key": self.private_key_input.toPlainText().strip(),
            },
            "ws": {
                "tls": self.tls_mode_combo.currentText(),
                "ca_cert": self.ca_cert_input.text(),
                "client_cert": self.client_cert_input.text(),
                "client_key": self.client_key_input.text(),
            },
        }
        self.save_clicked.emit(config)

    def set_config(self, config: dict):
        """Populate inputs from an existing configuration dictionary."""
        general = config.get("general", {})
        auth = config.get("auth", {})
        ws = config.get("ws", {})

        # General
        self.pos_id_input.setText(general.get("pos_id", ""))
        self.mid_input.setText(general.get("mid", ""))
        self.trx_id_len_input.setText(str(general.get("trx_id_len", "")))
        
        # Auth
        self.api_key_input.setText(auth.get("api_key", ""))
        self.private_key_input.setText(auth.get("private_key", ""))

        # WebSocket
        self.tls_mode_combo.setCurrentText(ws.get("tls", _TLS_NONE))
        self.ca_cert_input.setText(ws.get("ca_cert", ""))
        self.client_cert_input.setText(ws.get("client_cert", ""))
        self.client_key_input.setText(ws.get("client_key", ""))
        self._on_tls_mode_change(self.tls_mode_combo.currentIndex())