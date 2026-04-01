import asyncio
from utils.config import ConfigManager
from controllers import MainController
from qasync import QEventLoop
from views import MainWindow
from PyQt5.QtWidgets import QApplication
from build.loader import get_build_variant, load_build_config


def main():
    # Load build config variant
    variant_name = get_build_variant()
    build = load_build_config(variant_name)

    print(f"[INFO] Running variant: {variant_name}")
    print(f"[INFO] App: {build.APP_TITLE}")
    
    # Load runtime configuration
    config = ConfigManager()
    config.build = build  # attach for downstream usage
    
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