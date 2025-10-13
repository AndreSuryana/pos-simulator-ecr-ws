from PyQt5.QtCore import pyqtSignal
from PyQt5.QtWidgets import (
    QWidget, QFormLayout, QGroupBox, QVBoxLayout, QHBoxLayout,
    QLineEdit, QPushButton, QComboBox, QSizePolicy, QLabel, QMessageBox
)
from common import TransactionType
from models import Transaction


class TransactionTab(QWidget):
    """
    Transaction tab view.

    Signals
    -------
    send_clicked(type, edc_id, trx)
        Emitted when users clicks the "Send Transaction" button.
        Carries transaction type, target EDC ID, and transaction data.
        
    refresh_clicked()
        Emitted when the "Refresh" button clicked to refresh list of EDC ID.
    """
    send_clicked = pyqtSignal(TransactionType, str, Transaction)
    refresh_clicked = pyqtSignal()

    def __init__(self):
        super().__init__()
        self.edc_id = None

        # Feature Type
        feature_group = QGroupBox("Feature")
        feature_group.setSizePolicy(QSizePolicy.Policy.Preferred, QSizePolicy.Policy.Fixed)
        feature_layout = QFormLayout()

        # Type Combo
        self.type_combo = QComboBox()
        for type in TransactionType:
            self.type_combo.addItem(type.label, type)
        self.type_combo.currentIndexChanged.connect(self._on_feature_change)

        # EDC ID Combo + Refresh button
        self.edc_combo = QComboBox()
        self.edc_combo.currentIndexChanged.connect(self._on_edc_change)
        self.refresh_btn = QPushButton("Refresh")
        self.refresh_btn.setSizePolicy(QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Fixed)
        self.refresh_btn.clicked.connect(self.refresh_clicked.emit)
        
        edc_row = QWidget()
        edc_layout = QHBoxLayout(edc_row)
        edc_layout.setContentsMargins(0, 0, 0, 0)
        edc_layout.setSpacing(6)
        edc_layout.addWidget(self.edc_combo)
        edc_layout.addWidget(self.refresh_btn)
        
        feature_layout.addRow("Type:", self.type_combo)
        feature_layout.addRow("EDC ID:", edc_row)

        feature_group.setLayout(feature_layout)

        # Transaction Data
        trx_group = QGroupBox("Transaction Data")
        trx_layout = QFormLayout()

        self.amount_input = QLineEdit("0")
        self.tip_amount_input = QLineEdit("0")
        self.trace_input = QLineEdit()
        self.transaction_id_input = QLineEdit()

        amount_tip_row = QWidget()
        amount_tip_layout = QHBoxLayout(amount_tip_row)
        amount_tip_layout.setContentsMargins(0, 0, 0, 0)
        amount_tip_layout.setSpacing(10)
        
        amount_tip_layout.addWidget(QLabel("Amount:"))
        amount_tip_layout.addWidget(self.amount_input)
        amount_tip_layout.addSpacing(20)
        amount_tip_layout.addWidget(QLabel("Tip:"))
        amount_tip_layout.addWidget(self.tip_amount_input)

        trx_layout.addRow(amount_tip_row)
        trx_layout.addRow("Trace:", self.trace_input)
        trx_layout.addRow("Transaction ID:", self.transaction_id_input)

        trx_group.setLayout(trx_layout)

        # Action Button
        btn_layout = QHBoxLayout()
        self.send_btn = QPushButton("Send Transaction")
        self.send_btn.clicked.connect(self._on_send_clicked)
        btn_layout.addWidget(self.send_btn)

        main_layout = QVBoxLayout()
        main_layout.addWidget(feature_group)
        main_layout.addWidget(trx_group)
        main_layout.addLayout(btn_layout)
        self.setLayout(main_layout)

        # Initialize default state
        self._on_feature_change(0)

    def _on_feature_change(self, index: int):
        """Enable/disable transaction data fields depending on selected feature type."""
        type: TransactionType = self.type_combo.currentData()
        
        # Disable all input first and enabled based on the selected type
        self._set_buttons()

        if type == TransactionType.SALE_REGULAR:
            # Amount, Tip Amount, Transaction ID (optional)
            self._set_buttons(amount=True, tip_amount=True, transaction_id=True)

        elif type == TransactionType.VOID_REGULAR:
            # Trace
            self._set_buttons(trace=True)

        elif type == TransactionType.LAST_ECR_TRX or type == TransactionType.ANY_ECR_TRX:
            # Transaction ID
            self._set_buttons(transaction_id=True)

        elif type == TransactionType.SETTLEMENT: 
            # No input needed
            pass

        elif type.id.startswith("qris"):
            # Amount
            self._set_buttons(amount=True, transaction_id=True)
        
    def _on_edc_change(self, index: int):
        self.edc_id = self.edc_combo.currentData()
        
    def _set_buttons(self, amount = False, tip_amount = False, trace = False, transaction_id = False):
        self.amount_input.setEnabled(amount)
        self.tip_amount_input.setEnabled(tip_amount)
        self.trace_input.setEnabled(trace)
        self.transaction_id_input.setEnabled(transaction_id)

    def _on_send_clicked(self):
        if not self.edc_id:
            QMessageBox.warning(
                self,
                "Missing Information",
                "Please select EDC ID first."
            )
            return
        
        type: TransactionType = self.type_combo.currentData()

        # Initialize with empty values
        trx = Transaction()
        
        if self.amount_input.isEnabled():
            trx.amount = self.amount_input.text().strip()
            
        if self.tip_amount_input.isEnabled():
            trx.tip_amount = self.tip_amount_input.text().strip()
            
        if self.transaction_id_input.isEnabled():
            trx.transaction_id = self.transaction_id_input.text().strip()
            
        if self.trace_input.isEnabled():
            trx.trace = self.trace_input.text().strip()

        self.send_clicked.emit(type, self.edc_id, trx)
        
    def set_edc_devices(self, edc_devices: list[str]):
        for edc_id in edc_devices:
            self.edc_combo.addItem(edc_id, edc_id)