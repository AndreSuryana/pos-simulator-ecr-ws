from PyQt5.QtCore import pyqtSignal
from PyQt5.QtWidgets import QWidget

class TransactionTab(QWidget):
    """
    Transaction tab view.

    Signals
    -------
    send_clicked(trx)
        Emitted when users clicks the "Send Transaction" button.
        Carries transaction data dictionary.
    """
    send_clicked = pyqtSignal(dict)

    def __init__(self):
        super().__init__()
        # TODO: Not yet implemented

    def _on_send_clicked(self):
        # TODO: Not yet implemented
        self.send_clicked.emit()