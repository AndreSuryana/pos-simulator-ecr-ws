import uuid
import json
from .signer import Signer

class Payload:
    def __init__(self, api_key: str, private_key: str):
        self.api_key = api_key
        self.signer = Signer(private_key)

    def _make(self, type: str, data: dict) -> dict:
        return json.dumps({
            "uid": str(uuid.uuid4()),
            "type": type,
            "api_key": self.api_key,
            "signature": self.signer.sign(data),
            "data": data,
        }, separators=(',', ':'))
    
    def make_register(self, pos_id: str, mid: str) -> dict:
        return self._make(type="REGISTER_POS", data={
            "pos_id": pos_id,
            "mid": mid
        })
    
    def make_pair(self, edc_id: str, pair_code: str) -> dict:
        return self._make(type="PAIR_POS", data={
            "edc_id": edc_id,
            "pair_code": pair_code
        })
    
    def make_transaction(self, edc_id: str, trx: dict) -> dict:
        return self._make(type="SEND_TO_EDC", data={
            "edc_id": edc_id,
            "data_transaction": trx
        })