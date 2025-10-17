from enum import Enum
from .transaction_type import TransactionType
from .common_transaction_type import CommonTransactionType


class BriTransactionType(TransactionType, Enum):
    """Transaction types specific to BRI."""
    
    QR_BRI              = ("qrisBri", "QRIS BRI")
    QR_CHECK_STATUS     = ("checkStatusQR", "Check QR Status")
    
    @classmethod
    def all(cls):
        """Return all common + BRI-specific transaction types."""
        return list(CommonTransactionType) + list(cls)