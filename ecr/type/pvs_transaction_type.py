from enum import Enum
from .transaction_type import TransactionType


class PvsTransactionType(TransactionType, Enum):
    """Transaction types specific to PVS."""
    
    SALE_REGULAR        = ("saleRegular", "Sale (Regular)")
    SALE_INSTALLMENT    = ("saleInstallment", "Sale (Installment)")
    SALE_PAYMENT        = ("edcPayment", "Sale (Select Payment Method)")

    VOID_REGULAR        = ("voidRegular", "Void (Regular)")
    SETTLEMENT          = ("settlement", "Settlement")
    
    # QR Generate (all)
    QR_ALL              = ("qrisAll", "QRIS (All)")
    
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
    
    # QR Check Status (all)
    QR_CHECK_STATUS     = ("edcCheckStatus", "Check Status QR (All)")
    
    # QR Check Status Bank
    QR_CHECK_BCA        = ("checkStatusBca", "Check Status QRIS BCA")
    QR_CHECK_BNI        = ("checkStatusBni", "Check Status QRIS BNI")
    QR_CHECK_BRI        = ("checkStatusBri", "Check Status QRIS BRI")
    QR_CHECK_BSI        = ("checkStatusBsi", "Check Status QRIS BSI")
    QR_CHECK_BTN        = ("checkStatusBtn", "Check Status QRIS BTN")
    QR_CHECK_CIMB       = ("checkStatusCimb", "Check Status QRIS CIMB")
    QR_CHECK_SMBC       = ("checkStatusSmbc", "Check Status QRIS SMBC")

    # QR Check Status Fintech
    QR_CHECK_ATOME      = ("checkStatusAtome", "Check Status QR Atome")
    QR_CHECK_DOKU       = ("checkStatusDoku", "Check Status QRIS Doku")
    QR_CHECK_GAJA       = ("checkStatusGaja", "Check Status QRIS Gaja")
    QR_CHECK_GOPAY      = ("checkStatusGopay", "Check Status QRIS Gopay")
    QR_CHECK_INDODANA   = ("checkStatusIndodana", "Check Status QR Indodana")
    QR_CHECK_KREDIVO    = ("checkStatusKredivo", "Check Status QR Kredivo")
    QR_CHECK_OVO        = ("checkStatusOvo", "Check Status QRIS OVO")
    QR_CHECK_PVS        = ("checkStatusPvs", "Check Status QRIS PVS")
    QR_CHECK_SHOPEEPAY  = ("checkStatusShopeePay", "Check Status QRIS ShopeePay")
    
    LAST_ECR_TRX        = ("getLastEcrTransaction", "Get Last ECR Transaction")
    ANY_ECR_TRX         = ("getAnyEcrTransaction", "Get Any ECR Transaction")

    ECHO_TEST           = ("echoTest", "Echo Test")
    CHECK_CONNECTION    = ("checkConnection", "Check Connection")
    CHECK_VERSION       = ("checkVersion", "Check Version")
