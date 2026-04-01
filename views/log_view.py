from PySide6.QtCore import Qt
from PySide6.QtWidgets import QTextEdit
from PySide6.QtGui import QTextCharFormat, QColor, QTextCursor, QFont, QAction
from common.logging import LogType
from datetime import datetime


class LogView(QTextEdit):
    """
    Reusable log viewer widget.
    """

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setReadOnly(True)
        self.setContextMenuPolicy(Qt.CustomContextMenu)
        self.customContextMenuRequested.connect(self._show_context_menu)

    def _show_context_menu(self, pos):
        menu = self.createStandardContextMenu()
        menu.addSeparator()

        clear_action = QAction("Clear", self)
        clear_action.triggered.connect(self.clear)
        menu.addAction(clear_action)

        menu.exec_(self.mapToGlobal(pos))

    def add_log(self, log_type: LogType, message: str):
        ts = datetime.now().strftime("%H:%M:%S")

        icon_map = {
            LogType.RECEIVED: "↙️",
            LogType.SENT: "↗️",
            LogType.INFO: "ℹ️",
            LogType.WARNING: "⚠️",
            LogType.ERROR: "❌",
        }

        color_map = {
            LogType.RECEIVED: QColor("green"),
            LogType.SENT: QColor("blue"),
            LogType.INFO: QColor("gray"),
            LogType.WARNING: QColor("orange"),
            LogType.ERROR: QColor("red"),
        }

        icon = icon_map.get(log_type, "")
        color = color_map.get(log_type, QColor("black"))

        cursor = self.textCursor()
        cursor.movePosition(QTextCursor.End)

        fmt = QTextCharFormat()
        fmt.setForeground(color)

        font = QFont("Segoe UI Emoji")
        font.setPointSize(9)
        fmt.setFont(font)

        cursor.insertText(f"[{ts}] {icon} ", fmt)
        cursor.insertText(message + "\n")
        self.setTextCursor(cursor)
        self.ensureCursorVisible()
