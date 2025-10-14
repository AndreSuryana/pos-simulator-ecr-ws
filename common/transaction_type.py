from enum import Enum

class TransactionType(Enum):
    """Enum representing available transaction feature types."""
    
    # Bank
    SALE_REGULAR        = ("saleRegular", "Sale (Regular)")
    VOID_REGULAR        = ("voidRegular", "Void (Regular)")
    ECHO_TEST           = ("echoTest", "Echo Test")

    # Common
    SETTLEMENT          = ("settlement", "Settlement")
    LAST_ECR_TRX        = ("getLastEcrTransaction", "Get Last ECR Transaction")
    CHECK_CONNECTION    = ("checkConnection", "Check Connection")
    CHECK_VERSION       = ("checkVersion", "Check Version")
    
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

    
    @property
    def id(self):
        return self.value[0]
    
    @property
    def label(self):
        return self.value[1]