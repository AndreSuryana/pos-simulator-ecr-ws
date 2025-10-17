from enum import Enum


class EcrMode(Enum):
    """Enum representing available ECR modes."""
    PVS = ("PVS")
    BRI = ("BRI")