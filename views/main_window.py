from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QTabWidget
)
from views.tabs import *
from views import BottomBar


class MainWindow(QWidget):
    """
    Main application window.
    """
    def __init__(self, title):
        super().__init__()

        self.setWindowTitle(title)
        self.resize(1000, 650)
        self.setMinimumSize(800, 500)

        self.pairing_tab = PairingTab()
        self.transaction_tab = TransactionTab()
        self.logs_tab = LogsTab()
        self.setting_tab = SettingTab()
        
        self.tabs = QTabWidget()
        self.tabs.addTab(self.pairing_tab, "Pairing")
        self.tabs.addTab(self.transaction_tab, "Transaction")
        self.tabs.addTab(self.logs_tab, "Logs")
        self.tabs.addTab(self.setting_tab, "Settings")

        self.bottom_bar = BottomBar()

        layout = QVBoxLayout()
        layout.addWidget(self.tabs)
        layout.addWidget(self.bottom_bar)
        self.setLayout(layout)
        
    def show_pairing_tab(self):
        self.tabs.setCurrentWidget(self.pairing_tab)
        
    def show_settings_tab(self):
        self.tabs.setCurrentWidget(self.setting_tab)