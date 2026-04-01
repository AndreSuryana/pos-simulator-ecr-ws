from PySide6.QtWidgets import QWidget, QVBoxLayout
from common.logging import LogType
from views.log_view import LogView


class LogsTab(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout()
        self.log_view = LogView()
        layout.addWidget(self.log_view)
        self.setLayout(layout)

    def add_log(self, log_type: LogType, message: str):
        self.log_view.add_log(log_type, message)

    def add_info(self, message: str):
        self.add_log(LogType.INFO, message)

    def add_warn(self, message: str):
        self.add_log(LogType.WARNING, message)

    def add_error(self, message: str):
        self.add_log(LogType.ERROR, message)
