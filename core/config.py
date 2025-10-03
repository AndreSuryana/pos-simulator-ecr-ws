import json
import os

CONFIG_FILE = "config.json"


class ConfigManager:
    def __init__(self, path: str = CONFIG_FILE):
        self.path = path
        self.config = {
            "pos_id": "",
            "mid": "",
            "url": "",
            "api_key": "",
            "private_key": "",
            "tls": False,
            "ca_cert_path": "",
            "client_cert_path": "",
            "client_key_path": "",
        }
        self.load()
    
    def load(self):
        if os.path.exists(self.path):
            try:
                with open(self.path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    # Only update known keys, ignore unknown
                    for key in self.config.keys():
                        if key in data:
                            self.config[key] = data[key]
            except Exception as e:
                print(f"[ConfigManager] Failed to load config: {e}")

    def save(self):
        try:
            with open(self.path, "w", encoding="utf-8") as f:
                json.dump(self.config, f, indent=4)
        except Exception as e:
            print(f"[ConfigManager] Failed to save config: {e}")

    def get(self, key, default=None):
        return self.config.get(key, default)

    def set(self, key, value):
        self.config[key] = value
        self.save()
