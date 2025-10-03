from PyQt5.QtCore import Qt
from PyQt5.QtWidgets import QWidget, QVBoxLayout, QTextEdit, QLabel, QAction
from PyQt5.QtGui import QTextCharFormat, QColor, QTextCursor, QFont
from datetime import datetime


class LogsTab(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout()

        self.log_view = QTextEdit()
        self.log_view.setReadOnly(True)

        # Enable custom context menu
        self.log_view.setContextMenuPolicy(Qt.CustomContextMenu)
        self.log_view.customContextMenuRequested.connect(self.show_context_menu)

        layout.addWidget(QLabel("Incoming & Outgoing messages with timestamp"))
        layout.addWidget(self.log_view)
        self.setLayout(layout)

    def add_log(self, message: str, incoming=False, error=False):
        ts = datetime.now().strftime("%H:%M:%S")
        direction = "↙️" if incoming else "↗️"
        
        # Text color
        if error:
            color = QColor("red")
        else:
            color = QColor("green") if incoming else QColor("blue")

        # Format text
        cursor = self.log_view.textCursor()
        cursor.movePosition(QTextCursor.End)
        fmt = QTextCharFormat()
        fmt.setForeground(color)

        # Set font
        font = QFont("Segoe UI Emoji")
        font.setPointSize(9)
        fmt.setFont(font)

        cursor.insertText(f"[{ts}] {direction}: ", fmt)
        cursor.insertText(message + "\n")
        self.log_view.setTextCursor(cursor)
        self.log_view.ensureCursorVisible()

    def show_context_menu(self, pos):
        menu = self.log_view.createStandardContextMenu()
        menu.addSeparator()

        # Add "Clear" action
        clear_action = QAction("Clear", self)
        clear_action.triggered.connect(self.log_view.clear)
        menu.addAction(clear_action)

        menu.exec_(self.log_view.mapToGlobal(pos))
