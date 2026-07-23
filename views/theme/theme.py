from PySide6.QtGui import QColor, QPalette
from PySide6.QtWidgets import QApplication


class Theme:
    """
    Application color palette initialized once during startup.
    """

    # Text
    TEXT_PRIMARY: QColor
    TEXT_SECONDARY: QColor

    # Semantic colors
    SUCCESS: QColor
    INFO: QColor
    WARNING: QColor
    ERROR: QColor

    @classmethod
    def initialize(cls, app: QApplication) -> None:
        """Initialize theme colors based on the current application palette."""
        if cls.is_dark_theme(app):
            cls.TEXT_PRIMARY    = QColor("#E6EDF3")
            cls.TEXT_SECONDARY  = QColor("#8B949E")

            cls.SUCCESS         = QColor("#7EE787")
            cls.INFO            = QColor("#79C0FF")
            cls.WARNING         = QColor("#E3B341")
            cls.ERROR           = QColor("#FF7B72")
        else:
            cls.TEXT_PRIMARY    = QColor("#24292F")
            cls.TEXT_SECONDARY  = QColor("#57606A")

            cls.SUCCESS         = QColor("#2DA44E")
            cls.INFO            = QColor("#0969DA")
            cls.WARNING         = QColor("#BF8700")
            cls.ERROR           = QColor("#CF222E")

    @staticmethod
    def is_dark_theme(app: QApplication) -> bool:
        """Returns True if the application's palette is dark."""
        color = app.palette().color(QPalette.Window)

        brightness = (
            color.red() * 299 +
            color.green() * 587 +
            color.blue() * 114
        ) / 1000

        return brightness < 128