from PySide6.QtCore import Signal
from PySide6.QtWidgets import (
    QWidget, QFormLayout, QGroupBox, QVBoxLayout, QHBoxLayout,
    QLineEdit, QPushButton, QComboBox, QSizePolicy, QLabel, 
    QMessageBox, QCheckBox, QSplitter
)
from PySide6.QtCore import Qt
from common.logging import LogType
from ecr.mode import EcrMode
from ecr.type import *
from models import Transaction
from views.log_view import LogView


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
    send_clicked = Signal(TransactionType, str, Transaction)
    refresh_clicked = Signal()
    
    def __init__(self):
        super().__init__()
        self.edc_id = None
        
        # LEFT: existing transaction UI
        left_widget = QWidget()
        left_layout = QVBoxLayout(left_widget)
        left_layout.addWidget(self._build_feature_group())
        left_layout.addWidget(self._build_trx_group())
        left_layout.addLayout(self._build_btn_layout())
        left_layout.addStretch()

        # RIGHT: logs
        self.log_view = LogView()
        self.log_view.setMinimumWidth(350)

        # SPLITTER
        splitter = QSplitter(Qt.Horizontal)
        splitter.addWidget(left_widget)
        splitter.addWidget(self.log_view)
        splitter.setStretchFactor(0, 2)
        splitter.setStretchFactor(1, 1)

        # ROOT
        root_layout = QHBoxLayout()
        root_layout.addWidget(splitter)
        self.setLayout(root_layout)
        
        # Initialize default state
        self._on_mode_change(0)
        
    def _build_feature_group(self):
        group = QGroupBox("Feature")
        group.setSizePolicy(QSizePolicy.Policy.Preferred, QSizePolicy.Policy.Fixed)

        layout = QFormLayout()

        # Mode
        self.mode_combo = QComboBox()
        for mode in EcrMode:
            self.mode_combo.addItem(mode.name, mode)
        self.mode_combo.currentIndexChanged.connect(self._on_mode_change)

        # Type
        self.type_combo = QComboBox()
        self.type_combo.currentIndexChanged.connect(self._on_feature_change)

        # EDC ID + Refresh
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

        layout.addRow("Mode:", self.mode_combo)
        layout.addRow("Type:", self.type_combo)
        layout.addRow("EDC ID:", edc_row)

        group.setLayout(layout)
        return group
    
    def _build_trx_group(self):
        group = QGroupBox("Transaction Data")
        layout = QFormLayout()

        self.amount_input = QLineEdit("0")
        self.tip_amount_input = QLineEdit("0")
        self.invoice_input = QLineEdit()
        self.trace_input = QLineEdit()

        # Transaction ID
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

        # Amount / Tip
        amount_tip_row = QWidget()
        amount_tip_layout = QHBoxLayout(amount_tip_row)
        amount_tip_layout.setContentsMargins(0, 0, 0, 0)
        amount_tip_layout.setSpacing(10)
        amount_tip_layout.addWidget(QLabel("Amount:"))
        amount_tip_layout.addWidget(self.amount_input)
        amount_tip_layout.addSpacing(20)
        amount_tip_layout.addWidget(QLabel("Tip:"))
        amount_tip_layout.addWidget(self.tip_amount_input)

        # Installment
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
        installment_layout.setSpacing(10)
        installment_layout.addWidget(QLabel("Tenor:"))
        installment_layout.addWidget(self.tenor_combo)
        installment_layout.addSpacing(20)
        installment_layout.addWidget(QLabel("Plan:"))
        installment_layout.addWidget(self.plan_combo)

        layout.addRow(amount_tip_row)
        layout.addRow(installment_row)
        layout.addRow("Trace:", self.trace_input)
        layout.addRow("Invoice:", self.invoice_input)
        layout.addRow("Transaction ID:", trx_id_row)

        group.setLayout(layout)
        return group
    
    def _build_btn_layout(self):
        layout = QHBoxLayout()
        self.send_btn = QPushButton("Send Transaction")
        self.send_btn.clicked.connect(self._on_send_clicked)
        layout.addWidget(self.send_btn)
        return layout
        
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
        for trx_type in transaction_enum:
            self.type_combo.addItem(trx_type.label, trx_type)
        

    def _on_feature_change(self, index: int):
        """Enable/disable transaction data fields depending on selected feature type."""
        type: TransactionType = self.type_combo.currentData()

        # Guard clause: skip if no valid type is selected
        if type is None:
            return

        # Disable all input first and enable based on the selected type
        self._set_inputs()

        if (
            type in (
                PvsTransactionType.SALE_REGULAR,
                BriTransactionType.SALE_REGULAR,
                PvsTransactionType.SALE_PAYMENT,
            )
        ):
            self._set_inputs(amount=True, tip_amount=True, transaction_id=True)
            
        elif type in (PvsTransactionType.SALE_INSTALLMENT, BriTransactionType.SALE_INSTALLMENT):
            self._set_inputs(amount=True, tenor=True, plan=True, transaction_id=True)

        elif type in (PvsTransactionType.VOID_REGULAR, BriTransactionType.VOID_REGULAR):
            self._set_inputs(trace=True, transaction_id=True)

        elif (
            type in (
                PvsTransactionType.LAST_ECR_TRX,
                PvsTransactionType.ANY_ECR_TRX,
                BriTransactionType.LAST_ECR_TRX,
                BriTransactionType.ANY_ECR_TRX,
            )
        ):
            self._set_inputs(transaction_id=True)
            
        elif type in (BriTransactionType.QR_CHECK_STATUS, BriTransactionType.QR_REFUND):
            self._set_inputs(invoice=True, transaction_id=True)

        elif hasattr(type, "id") and type.id.startswith("qr"):
            self._set_inputs(amount=True, tip_amount=True, transaction_id=True)
        
        elif type is PvsTransactionType.QR_CHECK_STATUS or (hasattr(type, "id") and type.id.startswith("checkStatus")):
            self._set_inputs(amount=True, transaction_id=True)
            self.amount_input.setText("") # amount is optional for QR check status
        
    def _on_edc_change(self, index: int):
        self.edc_id = self.edc_combo.currentData()
        
    def _on_generate_id_changed(self, state: int):
        """Enable/disable manual Transaction ID input based on checkbox."""
        is_checked = self.generate_id_checkbox.isChecked()
        self.transaction_id_input.setEnabled(not is_checked)
        if is_checked:
            self.transaction_id_input.clear()
        
    def _set_inputs(self, amount = False, tip_amount = False, trace = False, transaction_id = False, tenor = False, plan = False, invoice = False):
        self.amount_input.setEnabled(amount)
        self.tip_amount_input.setEnabled(tip_amount)
        self.trace_input.setEnabled(trace)
        self.transaction_id_input.setEnabled(transaction_id)
        self.generate_id_checkbox.setEnabled(transaction_id)
        self.tenor_combo.setEnabled(tenor)
        self.plan_combo.setEnabled(plan)
        self.invoice_input.setEnabled(invoice)

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
            
        if self.invoice_input.isEnabled():
            trx.invoice = self.invoice_input.text().strip()

        self.send_clicked.emit(type, self.edc_id, trx)
        
    def set_edc_devices(self, edc_devices: list[str]):
        self.edc_combo.clear()
        for edc_id in edc_devices:
            self.edc_combo.addItem(edc_id, edc_id)
            
    def add_log(self, log_type: LogType, message: str):
        self.log_view.add_log(log_type, message)
        
    def set_mode_visible(self, visible: bool):
        """Show/hide Mode field (label + combo)."""
        form_layout: QFormLayout = self.findChild(QFormLayout)

        # Row 0 = Mode (based on your layout order)
        label_item = form_layout.itemAt(0, QFormLayout.ItemRole.LabelRole)
        field_item = form_layout.itemAt(0, QFormLayout.ItemRole.FieldRole)

        if label_item:
            label_item.widget().setVisible(visible)
        if field_item:
            field_item.widget().setVisible(visible)

    def set_mode_enabled(self, enabled: bool):
        """Enable/disable mode selection."""
        self.mode_combo.setEnabled(enabled)

    def set_mode(self, mode: EcrMode):
        """Force select a mode programmatically."""
        index = self.mode_combo.findData(mode)
        if index >= 0:
            self.mode_combo.setCurrentIndex(index)