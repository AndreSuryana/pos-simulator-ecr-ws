import json
import uuid
from utils.sign import ECDSASigner


class SignedPayload:
    def __init__(self, api_key: str, private_key: str):
        self._api_key = api_key
        self._signer = ECDSASigner(private_key)
        
    def make(self, type: str, data: dict) -> str:
        return json.dumps({
            "uid": str(uuid.uuid4()),
            "type": type,
            "api_key": self._api_key,
            "signature": self._signer.sign(data),
            "data": data
        }, separators=(',', ':'))