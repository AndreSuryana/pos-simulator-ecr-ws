import os
import asyncio
from utils.config import ConfigManager
from controllers import MainController
from qasync import QEventLoop
from views import MainWindow
from PyQt5.QtWidgets import QApplication
from build.loader import get_build_variant, load_build_config


def get_app_version():
    return os.getenv("APP_VERSION", "dev")


def main():
    # Load build config variant
    variant_name = get_build_variant()
    build = load_build_config(variant_name)

    # Version
    app_version = get_app_version()
    
        
    print(f"[INFO] Running variant: {variant_name}")
    print(f"[INFO] App: {build.APP_NAME} v{app_version}")

    # Load runtime configuration
    config = ConfigManager()
    config.build = build
    config.app_version = app_version
    
    # Create Qt app
    app = QApplication([])
    loop = QEventLoop(app)
    asyncio.set_event_loop(loop)
    
    # Initialize view and controller
    main_window = MainWindow(build.APP_TITLE)
    controller = MainController(app, main_window, config)

    # Show window
    controller.show_app()    

    # Clean up after close
    app.aboutToQuit.connect(lambda: asyncio.create_task(controller.cleanup()))

    with loop:
        loop.run_forever()


if __name__ == "__main__":
    main()