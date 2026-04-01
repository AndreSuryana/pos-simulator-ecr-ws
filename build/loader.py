import sys
import importlib


def get_build_variant(default: str = "default") -> str:
    """
    Priority: build_info > CLI > default
    """
    try:
        from build.build_info import APP_VARIANT
        return APP_VARIANT.lower()
    except Exception:
        pass

    for arg in sys.argv:
        if arg.startswith("--variant="):
            return arg.split("=", 1)[1].strip().lower()

    return default


def load_build_config(variant: str):
    """
    Load variant module as a namespace of constants.
    Example usage:
        cfg = load_build_config("bri")
        print(cfg.APP_TITLE)
    """
    module_name = f"build.{variant}"

    try:
        return importlib.import_module(module_name)
    except ModuleNotFoundError:
        print(f"[WARN] Unknown variant '{variant}', fallback to 'default'")
        return importlib.import_module("build.default")