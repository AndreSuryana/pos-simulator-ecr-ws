import asyncio
from utils.config import ConfigManager
from controllers import MainController
from qasync import QEventLoop
from views import MainWindow
from PySide6.QtWidgets import QApplication
from build.loader import get_build_variant, load_build_config
from views.theme import Theme


def get_app_version():
    try:
        from build.build_info import APP_VERSION
        return APP_VERSION
    except Exception:
        return "dev"


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
    Theme.initialize(app)
    
    loop = QEventLoop(app)
    asyncio.set_event_loop(loop)
    
    # Initialize view and controller
    app_title = f"{build.APP_NAME} v{app_version}"
    main_window = MainWindow(app_title)
    controller = MainController(app, main_window, config)

    # Show window
    controller.show_app()    

    # Clean up after close
    async def on_exit():
        await controller.cleanup()
        
    app.aboutToQuit.connect(lambda: asyncio.ensure_future(on_exit()))

    with loop:
        loop.run_forever()


if __name__ == "__main__":
    main()