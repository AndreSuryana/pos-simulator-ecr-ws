import ssl
import asyncio
import websockets
from typing import Optional, Callable

class WebSocketService:
    def __init__(self):
        self.ws = None
        self._receive_task: Optional[asyncio.Task] = None

        self.on_open: Optional[Callable[[], None]] = None
        self.on_close: Optional[Callable[[], None]] = None
        self.on_message: Optional[Callable[[str], None]] = None
        self.on_send: Optional[Callable[[str], None]] = None
        self.on_error: Optional[Callable[[Exception], None]] = None

    async def connect(self, uri: str, ping_interval: int = 60, tls: bool = False, ca_cert_path: str = None, client_cert_path: str = None, client_key_path: str = None):
        self.ping_interval = ping_interval
        self.tls = tls
        self.ca_cert_path = ca_cert_path
        self.client_cert_path = client_cert_path
        self.client_key_path = client_key_path
        
        ssl_context: Optional[ssl.SSLContext] = None
        if self.tls:
            ssl_context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH)
            if self.ca_cert_path:
                ssl_context.load_verify_locations(self.ca_cert_path)
            if self.client_cert_path and self.client_key_path:
                ssl_context.load_cert_chain(self.client_cert_path, self.client_key_path)
                
        try:
            self.ws = await websockets.connect(
                uri=uri,
                ssl=ssl_context,
                ping_interval=self.ping_interval,
                ping_timeout=self.ping_interval,
            )
            
            if self.on_open:
                self.on_open()
                
            self._receive_task = asyncio.create_task(self._receive_loop())

        except Exception as e:
            if self.on_error:
                self.on_error(e)
            raise

    async def _receive_loop(self):
        try:
            async for message in self.ws:
                if self.on_message:
                    self.on_message(message)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            if self.on_error:
                self.on_error(e)
        finally:
            if self.on_close:
                self.on_close()

    async def send(self, message: str):
        if not self.ws:
            raise RuntimeError("WebSocket not connected")
        await self.ws.send(message)
        if self.on_send:
            self.on_send(message)

    async def receive(self) -> str:
        if not self.ws:
            raise RuntimeError("WebSocket not connected")
        return await self.ws.recv()

    async def close(self):
        if self._receive_task:
            self._receive_task.cancel()
            self._receive_task = None
        if self.ws:
            await self.ws.close()
            self.ws = None
            if self.on_close:
                self.on_close()