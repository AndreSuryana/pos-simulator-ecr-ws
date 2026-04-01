import json
import os
from pathlib import Path
from threading import RLock


CONFIG_FILE = "pos-simulator-websocket.json"


class ConfigManager:
    """Thread-safe JSON configuration manager."""

    def __init__(self, filename: str = CONFIG_FILE):
        self._lock = RLock()
        self._path = Path(self._get_app_dir()) / filename
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._config = {}
    
        self.build = None
        self.app_version = "dev"

        # Load existing config or create a default one
        self.load()

    def _get_app_dir(self) -> str:
        """Return platform-safe writable directory for config."""
        if os.name == "nt":  # Windows
            return os.getenv("APPDATA", str(Path.home() / ".pos-simulator"))
        elif os.name == "posix":  # Linux / macOS
            return str(Path.home() / ".pos-simulator")
        else:
            return str(Path.cwd())

    def load(self) -> dict:
        """Load configuration from disk (safe JSON parse)."""
        with self._lock:
            if not self._path.exists():
                self._config = self.default_config()
                self.save()  # Create default file
            else:
                try:
                    with self._path.open("r", encoding="utf-8") as f:
                        self._config = json.load(f)
                except (json.JSONDecodeError, IOError):
                    print(f"[WARN] Corrupted config file, resetting: {self._path}")
                    self._config = self.default_config()
                    self.save()
        return self._config

    def save(self):
        """Safely write current config to disk (atomic write)."""
        with self._lock:
            tmp_path = self._path.with_suffix(".tmp")
            with tmp_path.open("w", encoding="utf-8") as f:
                json.dump(self._config, f, indent=4)
            tmp_path.replace(self._path)
            print(f"[INFO] Config saved successfully: {self._path}")

    def get(self, key: str, default=None):
        """Get a config value (supports dot notation like 'auth.api_key')."""
        parts = key.split(".")
        value = self._config
        try:
            for part in parts:
                value = value[part]
            return value
        except (KeyError, TypeError):
            return default
        
    def set(self, key: str, value):
        """Set a config value and save it (supports dot notation like 'auth.api_key')."""
        with self._lock:
            parts = key.split(".")
            cfg = self._config
            for part in parts[:-1]:
                if part not in cfg or not isinstance(cfg[part], dict):
                    cfg[part] = {}
                cfg = cfg[part]
            cfg[parts[-1]] = value
            self.save()

    def update(self, new_config: dict):
        """Merge and save new configuration."""
        with self._lock:
            self._config.update(new_config)
            self.save()

    @staticmethod
    def default_config() -> dict:
        """Provide default configuration structure."""
        return {
            "general": {
                "pos_id": "POS-SIMULATOR",
                "mid": "MID000000000017",
                "trx_id_len": 14
            },
            "auth": {
                "api_key": "",
                "private_key": ""
            },
            "ws": {
                "uri": "ws://localhost:3000/",
                "tls": "None",
                "ca_cert": "",
                "client_cert": "",
                "client_key": "",
            },
        }
