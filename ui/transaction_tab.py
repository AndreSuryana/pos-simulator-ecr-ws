from PyQt5.QtWidgets import QWidget, QVBoxLayout, QPushButton, QFormLayout, QComboBox


class TransactionTab(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout()
        form = QFormLayout()

        # Dropdowns
        self.mode_dropdown = QComboBox()
        self.mode_dropdown.addItems(["SALE", "REFUND", "VOID"])

        self.type_dropdown = QComboBox()
        self.type_dropdown.addItems(
            ["saleRegular", "saleInstallment", "refund", "balanceInquiry"]
        )

        form.addRow("Mode:", self.mode_dropdown)
        form.addRow("Type:", self.type_dropdown)

        layout.addLayout(form)

        # Transaction button
        self.trx_btn = QPushButton("Send Transaction")
        self.trx_btn.setEnabled(False) # TODO: Disabled until EDC paired
        self.trx_btn.clicked.connect(self.send_transaction)
        layout.addWidget(self.trx_btn)

        self.setLayout(layout)
    

    def send_transaction(self):
        # TODO: Not yet implemented
        pass