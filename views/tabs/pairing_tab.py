from PyQt5.QtWidgets import QWidget, QFormLayout, QLineEdit, QPushButton
from PyQt5.QtCore import pyqtSignal


class PairingTab(QWidget):
    """
    Pairing tab view.

    Signals
    -------
    pair_clicked(str, str)
        Emitted when the user clicks the "Pair Device" button.
        Carries both the EDC ID and the Pair Code entered by the user.
    """

    pair_clicked = pyqtSignal(str, str)

    def __init__(self):
        super().__init__()

        layout = QFormLayout()

        self.edc_input = QLineEdit()
        self.edc_input.setPlaceholderText("Enter EDC ID")

        self.pair_input = QLineEdit()
        self.pair_input.setPlaceholderText("Enter Pair Code")

        self.pair_btn = QPushButton("Pair Device")
        self.pair_btn.clicked.connect(self._on_pair_clicked)

        layout.addRow("EDC ID:", self.edc_input)
        layout.addRow("Pair Code:", self.pair_input)
        layout.addRow(self.pair_btn)

        self.setLayout(layout)

    def _on_pair_clicked(self):
        edc_id = self.edc_input.text().strip()
        pair_code = self.pair_input.text().strip()
        self.pair_clicked.emit(edc_id, pair_code)

    def clear_inputs(self):
        self.edc_input.clear()
        self.pair_input.clear()