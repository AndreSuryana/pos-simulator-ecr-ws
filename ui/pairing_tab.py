from PyQt5.QtWidgets import QWidget, QFormLayout, QLineEdit, QPushButton, QMessageBox
from PyQt5.QtCore import pyqtSignal


class PairingTab(QWidget):
    pairing_requested = pyqtSignal(str, str)

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
        
        self.pairing_requested.emit(edc_id, pair_code)
