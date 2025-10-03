from PyQt5.QtWidgets import QWidget, QFormLayout, QLineEdit, QPushButton, QMessageBox


class PairingTab(QWidget):
    def __init__(self):
        super().__init__()
        layout = QFormLayout()

        self.edc_input = QLineEdit()
        self.edc_input.setPlaceholderText("EDC ID")

        self.pair_input = QLineEdit()
        self.pair_input.setPlaceholderText("Pair Code")

        self.pair_btn = QPushButton("Pair Device")
        self.pair_btn.clicked.connect(self.pair_device)

        layout.addRow("EDC ID:", self.edc_input)
        layout.addRow("Pair Code:", self.pair_input)
        layout.addRow(self.pair_btn)

        self.setLayout(layout)

    def pair_device(self):
        edc_id = self.edc_input.text().strip()
        pair_code = self.pair_input.text().strip()
        if not edc_id or not pair_code:
            QMessageBox.warning(self, "Error", "EDC ID and Pair Code required")
            return
        # TODO: Later emit a signal or call injected handler
        QMessageBox.information(self, "Pairing", f"Paired with EDC {edc_id}")
