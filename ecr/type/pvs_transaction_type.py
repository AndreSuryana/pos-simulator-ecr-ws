from enum import Enum
from .transaction_type import TransactionType


class PvsTransactionType(TransactionType, Enum):
    """Transaction types specific to PVS."""
    
    SALE_REGULAR        = ("saleRegular", "Sale (Regular)")
    SALE_INSTALLMENT    = ("saleInstallment", "Sale (Installment)")
    SALE_PAYMENT        = ("edcPayment", "Sale (Select Payment Method)")

    VOID_REGULAR        = ("voidRegular", "Void (Regular)")
    SETTLEMENT          = ("settlement", "Settlement")
    
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
    
    QR_CHECK_STATUS     = ("edcCheckStatus", "QR Check Status")
    
    LAST_ECR_TRX        = ("getLastEcrTransaction", "Get Last ECR Transaction")
    ANY_ECR_TRX         = ("getAnyEcrTransaction", "Get Any ECR Transaction")

    ECHO_TEST           = ("echoTest", "Echo Test")
    CHECK_CONNECTION    = ("checkConnection", "Check Connection")
    CHECK_VERSION       = ("checkVersion", "Check Version")
