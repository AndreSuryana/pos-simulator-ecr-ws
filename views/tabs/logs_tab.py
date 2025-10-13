from PyQt5.QtCore import Qt
from PyQt5.QtWidgets import QWidget, QVBoxLayout, QTextEdit, QLabel, QAction
from PyQt5.QtGui import QTextCharFormat, QColor, QTextCursor, QFont
from datetime import datetime
from enum import Enum, auto


class LogType(Enum):
    INCOMING = auto()
    OUTGOING = auto()
    INFO = auto()
    WARNING = auto()
    ERROR = auto()


class LogsTab(QWidget):
    """
    Logs tab view.
    """
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout()

        self.log_view = QTextEdit()
        self.log_view.setReadOnly(True)

        self.log_view.setContextMenuPolicy(Qt.CustomContextMenu)
        self.log_view.customContextMenuRequested.connect(self._show_context_menu)

        layout.addWidget(self.log_view)
        self.setLayout(layout)

    def _show_context_menu(self, pos):
        menu = self.log_view.createStandardContextMenu()
        menu.addSeparator()

        # Add "Clear" action
        clear_action = QAction("Clear", self)
        clear_action.triggered.connect(self.clear_log)
        menu.addAction(clear_action)

        menu.exec_(self.log_view.mapToGlobal(pos))

    def add_log(self, log_type: LogType, message: str):
        ts = datetime.now().strftime("%H:%M:%S")

        # Direction / icon and color mapping
        icon_map = {
            LogType.INCOMING: "↙️",
            LogType.OUTGOING: "↗️",
            LogType.INFO: "ℹ️",
            LogType.WARNING: "⚠️",
            LogType.ERROR: "❌",
        }

        color_map = {
            LogType.INCOMING: QColor("green"),
            LogType.OUTGOING: QColor("blue"),
            LogType.INFO: QColor("gray"),
            LogType.WARNING: QColor("orange"),
            LogType.ERROR: QColor("red"),
        }

        icon = icon_map.get(log_type, "")
        color = color_map.get(log_type, QColor("black"))

        cursor = self.log_view.textCursor()
        cursor.movePosition(QTextCursor.End)

        fmt = QTextCharFormat()
        fmt.setForeground(color)

        font = QFont("Segoe UI Emoji")
        font.setPointSize(9)
        fmt.setFont(font)

        cursor.insertText(f"[{ts}] {icon} ", fmt)
        cursor.insertText(message + "\n")
        self.log_view.setTextCursor(cursor)
        self.log_view.ensureCursorVisible()

    def add_info(self, message: str):
        self.add_log(LogType.INFO, message)

    def add_warn(self, message: str):
        self.add_log(LogType.WARNING, message)

    def add_error(self, message: str):
        self.add_log(LogType.ERROR, message)

    def clear_log(self):
        self.log_view.clear