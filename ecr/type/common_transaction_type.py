from enum import Enum
from .transaction_type import TransactionType


class CommonTransactionType(TransactionType, Enum):
    """Common transaction types shared by all modes."""

    SALE_REGULAR        = ("saleRegular", "Sale (Regular)")
    SALE_INSTALLMENT    = ("saleInstallment", "Sale Installment")

    VOID_REGULAR        = ("voidRegular", "Void (Regular)")
    SETTLEMENT          = ("settlement", "Settlement")

    LAST_ECR_TRX        = ("getLastEcrTransaction", "Get Last ECR Transaction")
    ANY_ECR_TRX         = ("getAnyEcrTransaction", "Get Any ECR Transaction")

    ECHO_TEST           = ("echoTest", "Echo Test")
    CHECK_CONNECTION    = ("checkConnection", "Check Connection")
    CHECK_VERSION       = ("checkVersion", "Check Version")