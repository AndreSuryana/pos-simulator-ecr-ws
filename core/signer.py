import json
import base64
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend

class Signer:
    def __init__(self, private_key_pem: str):
        # Normalize PEM
        pem = private_key_pem.strip()

       # Validate PEM
        if not pem.startswith("-----BEGIN EC PRIVATE KEY-----"):
            raise ValueError("Invalid PEM: missing BEGIN EC PRIVATE KEY")
        if not pem.endswith("-----END EC PRIVATE KEY-----"):
            raise ValueError("Invalid PEM: missing END EC PRIVATE KEY")

        # Load private key
        self.sk = serialization.load_pem_private_key(
            pem.encode('utf-8'),
            password=None,
            backend=default_backend()
        )

    def sign(self, data: dict) -> str:
        """
        Sign the data dict and return a Base64-encoded DER ECDSA signature.
        Uses minified JSON without sorting keys.
        """
        # Minified JSON
        message = json.dumps(data, separators=(',', ':')).encode('utf-8')

        # Sign with DER encoding
        signature_der = self.sk.sign(message, ec.ECDSA(hashes.SHA256()))

        # Base64 encode
        return base64.b64encode(signature_der).decode('utf-8')