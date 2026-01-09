from enum import Enum, auto

class LogType(Enum):
    INFO = auto()
    WARNING = auto()
    ERROR = auto()
    SENT = auto()
    RECEIVED = auto()
