from enum import Enum
from .transaction_type import TransactionType
from .common_transaction_type import CommonTransactionType


class PvsTransactionType(TransactionType, Enum):
    """Transaction types specific to PVS."""
    
    # QR Bank
    QR_BNI              = ("qrisBni", "QRIS BNI")
    QR_BRI              = ("qrisBri", "QRIS BRI")
    QR_BSI              = ("qrisBsi", "QRIS BSI")
    QR_BTN              = ("qrisBtn", "QRIS BTN")
    QR_CIMB             = ("qrisCimb", "QRIS CIMB")
    QR_PMT              = ("qrisPermata", "QRIS PERMATA")
    
    # QR Fintech
    QR_ATOME            = ("qrAtome", "Atome")
    QR_KREDIVO          = ("qrKredivo", "Kredivo")
    QR_INDODANA         = ("qrisIndodana", "Indodana")
    QR_GAJA             = ("qrisGaja", "QRIS GAJA")
    QR_GOPAY            = ("qrisGopay", "QRIS GOPAY")
    QR_PVS              = ("qrisPvs", "QRIS PVS")
    QR_OVO              = ("qrisOvo", "QRIS OVO")
    QR_SHOPEEPAY        = ("qrisShopeePay", "QRIS ShopeePay")
    
    @classmethod
    def all(cls):
        """Return all common + PVS-specific transaction types."""
        return list(CommonTransactionType) + list(cls)