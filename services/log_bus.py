from PySide6.QtCore import QObject, Signal
from common.logging import LogType


class LogBus(QObject):
    log_emitted = Signal(LogType, str)

    def emit(self, log_type: LogType, message: str):
        self.log_emitted.emit(log_type, message)
