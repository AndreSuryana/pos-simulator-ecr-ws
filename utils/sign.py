import json
import base64
from typing import Dict
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend


class ECDSASigner:
    """
    Provides ECDSA (SHA-256) signing for JSON-compatible dictionaries.

    This class is used to generate Base64-encoded DER signatures from a given
    EC private key in PEM format. It is intended for signing outbound payloads
    such as WebSocket API messages or pairing requests.

    Parameters
    ----------
    private_key : str
        The EC private key in PEM format (beginning with
        "-----BEGIN EC PRIVATE KEY-----").
    """

    def __init__(self, private_key: str):
        pem = private_key.strip()

        # Validate PEM format
        if not pem.startswith("-----BEGIN EC PRIVATE KEY-----") or not pem.endswith("-----END EC PRIVATE KEY-----"):
            raise ValueError("Invalid EC private key PEM format")

        try:
            self._private_key = serialization.load_pem_private_key(
                pem.encode("utf-8"),
                password=None,
                backend=default_backend()
            )
        except Exception as e:
            raise ValueError(f"Failed to load EC private key: {e}")

    def sign(self, data: Dict) -> str:
        """
        Signs the provided dictionary using ECDSA with SHA-256.

        The input dictionary is first serialized into a compact (minified)
        JSON string, then signed, and the resulting DER-encoded signature
        is Base64-encoded.

        Parameters
        ----------
        data : dict
            Dictionary containing the message to sign.

        Returns
        -------
        str
            Base64-encoded DER signature.
        """
        if not isinstance(data, dict):
            raise TypeError("Data to sign must be a dictionary")

        # Serialize dictionary to minified JSON
        message = json.dumps(data, separators=(",", ":")).encode("utf-8")

        # Sign the message with ECDSA (DER encoding)
        signature_der = self._private_key.sign(message, ec.ECDSA(hashes.SHA256()))

        # Encode to Base64 for transport
        return base64.b64encode(signature_der).decode("utf-8")
