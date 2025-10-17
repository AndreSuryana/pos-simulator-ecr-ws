from dataclasses import dataclass
from datetime import datetime
import random


@dataclass
class Transaction:
    amount: str | None = None
    tip_amount: str | None = None
    trace: str | None = None
    id: str | None = None
    is_generate_id: bool = False
    
    def get_transaction_id(self, id_len: int) -> str | None:
        """
        Returns a valid transaction ID based on configuration:
        - If `is_generate_id` is True → generate formatted timestamp-based ID.
        - Else if `id` is provided → use the provided ID (padded or trimmed).
        - Else → None
        """
        if self.is_generate_id:
            # Example format: YYMMDDhhmmss + random digits to fit id_len
            base = datetime.now().strftime("%y%m%d%H%M%S")
            remaining = max(id_len - len(base), 0)
            suffix = ''.join(random.choices('0123456789', k=remaining))
            generated_id = (base + suffix)[:id_len]
            return generated_id

        if self.id:
            # Use provided ID but ensure it matches expected length
            trx_id = str(self.id)
            if len(trx_id) < id_len:
                # Zero-pad to the right if shorter
                trx_id = trx_id.ljust(id_len, '0')
            elif len(trx_id) > id_len:
                # Trim if too long
                trx_id = trx_id[:id_len]
            return trx_id

        return None