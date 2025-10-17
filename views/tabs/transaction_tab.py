from PyQt5.QtCore import pyqtSignal
from PyQt5.QtWidgets import (
    QWidget, QFormLayout, QGroupBox, QVBoxLayout, QHBoxLayout,
    QLineEdit, QPushButton, QComboBox, QSizePolicy, QLabel, 
    QMessageBox, QCheckBox
)
from ecr.mode import EcrMode
from ecr.type import *
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

        # Mode
        self.mode_combo = QComboBox()
        for mode in EcrMode:
            self.mode_combo.addItem(mode.name, mode)
        self.mode_combo.currentIndexChanged.connect(self._on_mode_change)

        # Type Combo
        self.type_combo = QComboBox()
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
        
        feature_layout.addRow("Mode:", self.mode_combo)
        feature_layout.addRow("Type:", self.type_combo)
        feature_layout.addRow("EDC ID:", edc_row)

        feature_group.setLayout(feature_layout)

        # Transaction Data
        trx_group = QGroupBox("Transaction Data")
        trx_layout = QFormLayout()

        self.amount_input = QLineEdit("0")
        self.tip_amount_input = QLineEdit("0")
        self.trace_input = QLineEdit()
        
        # Transaction ID Row
        self.transaction_id_input = QLineEdit()
        self.transaction_id_input.setPlaceholderText("Enter or auto-generate")
        
        self.generate_id_checkbox = QCheckBox("Auto-generate")
        self.generate_id_checkbox.stateChanged.connect(self._on_generate_id_changed)
        
        trx_id_row = QWidget()
        trx_id_layout = QHBoxLayout(trx_id_row)
        trx_id_layout.setContentsMargins(0, 0, 0, 0)
        trx_id_layout.setSpacing(8)
        trx_id_layout.addWidget(self.transaction_id_input)
        trx_id_layout.addWidget(self.generate_id_checkbox)

        # Amount/Tip Row
        amount_tip_row = QWidget()
        amount_tip_layout = QHBoxLayout(amount_tip_row)
        amount_tip_layout.setContentsMargins(0, 0, 0, 0)
        amount_tip_layout.setSpacing(10)
        
        amount_tip_layout.addWidget(QLabel("Amount:"))
        amount_tip_layout.addWidget(self.amount_input)
        amount_tip_layout.addSpacing(20)
        amount_tip_layout.addWidget(QLabel("Tip:"))
        amount_tip_layout.addWidget(self.tip_amount_input)
        
        # Tenor + Plan row (for Installment)
        self.tenor_combo = QComboBox()
        for val in ["3", "6", "9", "12", "18", "24"]:
            self.tenor_combo.addItem(f"{val} Months", val)

        self.plan_combo = QComboBox()
        for val in ["None", "1", "2", "3"]:
            label = "None" if val == "None" else f"Plan {val}"
            self.plan_combo.addItem(label, val)
            
        installment_row = QWidget()
        installment_layout = QHBoxLayout(installment_row)
        installment_layout.setContentsMargins(0, 0, 0, 0)
        installment_layout.setSpacing(10)  # same as amount_tip_row for consistency

        installment_layout.addWidget(QLabel("Tenor:"))
        installment_layout.addWidget(self.tenor_combo)
        installment_layout.addSpacing(20)
        installment_layout.addWidget(QLabel("Plan:"))
        installment_layout.addWidget(self.plan_combo)

        trx_layout.addRow(amount_tip_row)
        trx_layout.addRow(installment_row)
        trx_layout.addRow("Trace:", self.trace_input)
        trx_layout.addRow("Transaction ID:", trx_id_row)

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
        self._on_mode_change(0)
        
    def _on_mode_change(self, index: int):
        """
        Fill the transaction type combo box based on the selected ECR mode.
        """
        self.type_combo.clear()
        mode: EcrMode = self.mode_combo.currentData()

        # Map ECR mode to transaction type enum
        mode_type_map = {
            EcrMode.BRI: BriTransactionType,
            EcrMode.PVS: PvsTransactionType,
        }

        transaction_enum = mode_type_map.get(mode)
        if not transaction_enum:
            return

        # Use the .all() method to include common + specific transaction types
        for trx_type in transaction_enum.all():
            self.type_combo.addItem(trx_type.label, trx_type)
        

    def _on_feature_change(self, index: int):
        """Enable/disable transaction data fields depending on selected feature type."""
        type: TransactionType = self.type_combo.currentData()

        # Guard clause: skip if no valid type is selected
        if type is None:
            return

        # Disable all input first and enable based on the selected type
        self._set_inputs()

        if type == CommonTransactionType.SALE_REGULAR:
            self._set_inputs(amount=True, tip_amount=True, transaction_id=True)
            
        elif type == CommonTransactionType.SALE_INSTALLMENT:
            self._set_inputs(amount=True, tenor=True, plan=True, transaction_id=True)

        elif type == CommonTransactionType.VOID_REGULAR:
            self._set_inputs(trace=True, transaction_id=True)

        elif type in (CommonTransactionType.LAST_ECR_TRX, CommonTransactionType.ANY_ECR_TRX):
            self._set_inputs(transaction_id=True)

        elif hasattr(type, "id") and type.id.startswith("qr"):
            self._set_inputs(amount=True, transaction_id=True)
        
    def _on_edc_change(self, index: int):
        self.edc_id = self.edc_combo.currentData()
        
    def _on_generate_id_changed(self, state: int):
        """Enable/disable manual Transaction ID input based on checkbox."""
        is_checked = self.generate_id_checkbox.isChecked()
        self.transaction_id_input.setEnabled(not is_checked)
        if is_checked:
            self.transaction_id_input.clear()
        
    def _set_inputs(self, amount = False, tip_amount = False, trace = False, transaction_id = False, tenor = False, plan = False):
        self.amount_input.setEnabled(amount)
        self.tip_amount_input.setEnabled(tip_amount)
        self.trace_input.setEnabled(trace)
        self.transaction_id_input.setEnabled(transaction_id)
        self.generate_id_checkbox.setEnabled(transaction_id)
        self.tenor_combo.setEnabled(tenor)
        self.plan_combo.setEnabled(plan)

    def _on_send_clicked(self):
        if not self.edc_id:
            QMessageBox.warning(self, "Missing Information", "Please select EDC ID first.")
            return
        
        type: TransactionType = self.type_combo.currentData()
        trx = Transaction()
        
        if self.amount_input.isEnabled():
            trx.amount = self.amount_input.text().strip()
            
        if self.tip_amount_input.isEnabled():
            trx.tip_amount = self.tip_amount_input.text().strip()
            
        if self.tenor_combo.isEnabled():
            trx.tenor = self.tenor_combo.currentData()

        if self.plan_combo.isEnabled():
            plan_val = self.plan_combo.currentData()
            trx.plan = None if plan_val == "None" else plan_val
            
        if self.trace_input.isEnabled():
            trx.trace = self.trace_input.text().strip()

        if self.generate_id_checkbox.isChecked():
            trx.is_generate_id = True
        elif self.transaction_id_input.isEnabled():
            trx.id = self.transaction_id_input.text().strip()

        self.send_clicked.emit(type, self.edc_id, trx)
        
    def set_edc_devices(self, edc_devices: list[str]):
        self.edc_combo.clear()
        for edc_id in edc_devices:
            self.edc_combo.addItem(edc_id, edc_id)