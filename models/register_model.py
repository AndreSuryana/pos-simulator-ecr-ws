from dataclasses import dataclass

@dataclass
class RegisterDevice:
    pos_id: str
    mid: str

    def validate(self):
        if not self.pos_id:
            raise ValueError("Missing required POS ID")
        if not self.mid:
            raise ValueError("Missing required MID")