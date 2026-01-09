from PyQt5.QtCore import QObject, pyqtSignal
from common.logging import LogType


class LogBus(QObject):
    log_emitted = pyqtSignal(LogType, str)

    def emit(self, log_type: LogType, message: str):
        self.log_emitted.emit(log_type, message)
