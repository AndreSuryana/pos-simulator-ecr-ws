class TransactionType:
    """Base mixin for transaction enums."""
    @property
    def id(self):
        return self.value[0]

    @property
    def label(self):
        return self.value[1]