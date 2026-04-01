import sys
import importlib


def get_build_variant(default: str = "default") -> str:
    """
    Parse CLI argument: --variant=<name>
    """
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