from PySide6.QtWidgets import (
    QWidget, QFormLayout, QVBoxLayout, QLineEdit, QPushButton,
    QGroupBox, QComboBox, QSizePolicy, QHBoxLayout, QSplitter
)
from PySide6.QtCore import Qt, Signal
from common.logging import LogType
from views.log_view import LogView


class PairingTab(QWidget):
    """
    Pairing tab view.

    Signals
    -------
    pair_clicked(edc_id, pair_code)
        Emitted when the user clicks the "Pair Device" button.
        Carries both the EDC ID and the Pair Code entered by the user.
    
    unpair_clicked(edc_id)
        Emitted when the user clicks the "Unpair Device" button.
        Carries the EDC ID selected by the user.
        
    refresh_clicked()
        Emitted when the "Refresh" button clicked to refresh list of EDC ID.
    """

    pair_clicked = Signal(str, str)
    unpair_clicked = Signal(str)
    refresh_clicked = Signal()

    def __init__(self):
        super().__init__()

        # LEFT: pairing and unpairing
        left_widget = QWidget()
        left_layout = QVBoxLayout(left_widget)
        left_layout.addWidget(self._build_pairing_group())
        left_layout.addWidget(self._build_unpairing_group())
        left_layout.addStretch()

        # RIGHT: logs
        self.log_view = LogView()
        self.log_view.setMinimumWidth(300)

        # SPLITTER
        splitter = QSplitter(Qt.Horizontal)
        splitter.addWidget(left_widget)
        splitter.addWidget(self.log_view)
        splitter.setStretchFactor(0, 1)
        splitter.setStretchFactor(1, 1)

        # ROOT LAYOUT
        root_layout = QHBoxLayout()
        root_layout.addWidget(splitter)
        self.setLayout(root_layout)
        
    def _build_pairing_group(self):
        group = QGroupBox("Pairing")
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
        group.setLayout(layout)
        
        return group

    def _build_unpairing_group(self):
        group = QGroupBox("Unpairing")
        layout = QFormLayout()
        
        # EDC ID Combo + Refresh button
        self.edc_combo = QComboBox()
        self.refresh_btn = QPushButton("Refresh")
        self.refresh_btn.setSizePolicy(QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Fixed)
        self.refresh_btn.clicked.connect(self.refresh_clicked.emit)
        
        edc_row = QWidget()
        edc_layout = QHBoxLayout(edc_row)
        edc_layout.setContentsMargins(0, 0, 0, 0)
        edc_layout.setSpacing(6)
        edc_layout.addWidget(self.edc_combo)
        edc_layout.addWidget(self.refresh_btn)

        self.unpair_btn = QPushButton("Unpair Device")
        self.unpair_btn.clicked.connect(self._on_unpair_clicked)

        layout.addRow("EDC ID:", edc_row)
        layout.addRow(self.unpair_btn)
        group.setLayout(layout)
        
        return group

    def _on_pair_clicked(self):
        edc_id = self.edc_input.text().strip()
        pair_code = self.pair_input.text().strip()
        self.pair_clicked.emit(edc_id, pair_code)
        
    def _on_unpair_clicked(self):
        edc_id = self.edc_combo.currentData()
        self.unpair_clicked.emit(edc_id)
    
    def clear_inputs(self):
        self.edc_input.clear()
        self.pair_input.clear()
        
    def set_edc_devices(self, edc_devices: list[str]):
        self.edc_combo.clear()
        for edc_id in edc_devices:
            self.edc_combo.addItem(edc_id, edc_id)
            
    def add_log(self, log_type: LogType, message: str):
        self.log_view.add_log(log_type, message)