from enum import Enum

class TransactionType(Enum):
    """Enum representing available transaction feature types."""
    SALE_REGULAR    = ("saleRegular", "Sale (Regular)")
    VOID_REGULAR    = ("voidRegular", "Void (Regular)")
    SETTLEMENT      = ("settlement", "Settlement")
    LAST_ECR_TRX    = ("getLastEcrTransaction", "Get Last ECR Transaction")
    ANY_ECR_TRX     = ("getAnyEcrTransaction", "Get Any ECR Transaction")
    QRIS_CIMB       = ("qrisCimb", "QRIS CIMB")
    QRIS_SHOPEEPAY  = ("qrisShopeePay", "QRIS ShopeePay")
    
    @property
    def id(self):
        return self.value[0]
    
    @property
    def label(self):
        return self.value[1]