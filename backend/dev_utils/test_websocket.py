import asyncio
import json
import websockets


async def main():
    uri = "ws://127.0.0.1:8001/ws/pose"
    async with websockets.connect(uri) as ws:
        await ws.send(json.dumps({"type": "reset"}))
        msg = await ws.recv()
        print(msg)


if __name__ == "__main__":
    asyncio.run(main())
