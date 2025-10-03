from PyQt5.QtWidgets import (
    QWidget, QFormLayout, QLineEdit, QTextEdit, QCheckBox,
    QPushButton, QMessageBox, QFileDialog, QHBoxLayout
)


class ConfigTab(QWidget):
    def __init__(self, config):
        super().__init__()
        self.config = config

        layout = QFormLayout()

        # Inputs
        self.pos_id_input = QLineEdit(self.config.get("pos_id", ""))
        self.mid_input = QLineEdit(self.config.get("mid", ""))
        self.api_key_input = QLineEdit(self.config.get("api_key", ""))
        self.api_key_input.setEchoMode(QLineEdit.Password)  # hide API key
        
        self.private_key_input = QTextEdit()
        self.private_key_input.setText(self.config.get("private_key", ""))

        layout.addRow("POS ID:", self.pos_id_input)
        layout.addRow("MID:", self.mid_input)
        layout.addRow("API Key:", self.api_key_input)
        layout.addRow("Private Key:", self.private_key_input)

        # TLS Enable checkbox
        self.tls_checkbox = QCheckBox("Enable TLS")
        self.tls_checkbox.setChecked(bool(
            self.config.get("ca_cert_path") or
            self.config.get("client_cert_path") or
            self.config.get("client_key_path")
        ))
        self.tls_checkbox.stateChanged.connect(self._toggle_tls_inputs)
        layout.addRow(self.tls_checkbox)

        # Certificate file pickers
        self.ca_cert_input = self._add_file_picker(layout, "CA Cert:", self.config.get("ca_cert_path", ""))
        self.client_cert_input = self._add_file_picker(layout, "Client Cert:", self.config.get("client_cert_path", ""))
        self.client_key_input = self._add_file_picker(layout, "Client Key:", self.config.get("client_key_path", ""))

        # Initially enable/disable based on checkbox
        self._toggle_tls_inputs(self.tls_checkbox.isChecked())

        # Save button
        save_btn = QPushButton("Save Config")
        save_btn.clicked.connect(self._save_config)
        layout.addRow(save_btn)

        self.setLayout(layout)

    def _toggle_tls_inputs(self, enabled: bool):
        self.ca_cert_input.setEnabled(enabled)
        self.client_cert_input.setEnabled(enabled)
        self.client_key_input.setEnabled(enabled)

    def _save_config(self):
        self.config.set("pos_id", self.pos_id_input.text().strip())
        self.config.set("mid", self.mid_input.text().strip())
        self.config.set("api_key", self.api_key_input.text().strip())
        self.config.set("private_key", self.private_key_input.toPlainText().strip())
        self.config.set("tls", self.tls_checkbox.isChecked())
        self.config.set("ca_cert_path", self.ca_cert_input.text().strip())
        self.config.set("client_cert_path", self.client_cert_input.text().strip())
        self.config.set("client_key_path", self.client_key_input.text().strip())
        QMessageBox.information(self, "Config", "Configuration saved")

    def _add_file_picker(self, layout: QFormLayout, label: str, default_value: str = "") -> QLineEdit:
        """Helper to add a file picker row (QLineEdit + Browse button)."""
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
