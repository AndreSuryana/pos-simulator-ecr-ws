import json
import ssl
import websockets


class WebSocketClient:
    def __init__(self, url: str, ca_cert=None, client_cert=None, client_key=None):
        self.url = url
        self.ws = None
        self.ca_cert = ca_cert
        self.client_cert = client_cert
        self.client_key = client_key

    async def connect(self):
        ssl_context = None

        # Only build SSL context if we have certs
        if self.ca_cert or self.client_cert or self.client_key:
            ssl_context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH)

            if self.ca_cert:
                ssl_context.load_verify_locations(self.ca_cert)

            if self.client_cert and self.client_key:
                ssl_context.load_cert_chain(certfile=self.client_cert, keyfile=self.client_key)

        self.ws = await websockets.connect(
            uri=self.url,
            ssl=ssl_context,
            ping_interval=None,  # FIXME: Temporary, move me to config tab!
            ping_timeout=None    # FIXME: Temporary, move me to config tab!
        )

    async def send(self, message: str):
        if self.ws is None:
            raise Exception("WebSocket not connected")
        await self.ws.send(message)

    async def receive(self):
        if self.ws is None:
            raise Exception("WebSocket not connected")
        return await self.ws.recv()

    async def close(self):
        if self.ws:
            await self.ws.close()
            self.ws = None
