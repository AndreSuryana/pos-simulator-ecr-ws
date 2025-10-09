from dataclasses import dataclass

@dataclass
class PairDevice:
    edc_id: str
    pair_code: str

    def validate(self):
        if not self.edc_id or not self.pair_code:
            raise ValueError("Both EDC and Pair Code are required")