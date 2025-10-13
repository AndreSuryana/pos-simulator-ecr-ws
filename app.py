import asyncio
from utils.config import ConfigManager
from controllers import MainController
from qasync import QEventLoop
from views import MainWindow
from PyQt5.QtWidgets import QApplication


def main():
    # Load configuration
    config = ConfigManager()
    
    # Create Qt app
    app = QApplication([])
    loop = QEventLoop(app)
    asyncio.set_event_loop(loop)
    
    # Initialize view and controller
    main_window = MainWindow()
    controller = MainController(app, main_window, config)

    # Show window
    controller.show_app()    

    # Clean up after close
    app.aboutToQuit.connect(lambda: asyncio.create_task(controller.cleanup()))

    with loop:
        loop.run_forever()


if __name__ == "__main__":
    main()