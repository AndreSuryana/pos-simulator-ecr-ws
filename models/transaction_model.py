from dataclasses import dataclass

@dataclass
class Transaction:
    amount: str | None = None
    tip_amount: str | None = None
    transaction_id: str | None = None
    trace: str | None = None