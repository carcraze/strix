import redis.asyncio as redis
from app.core.config import settings

redis_client = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, decode_responses=True)

class RedisStart:
    @staticmethod
    async def publish_event(scan_id: str, event_type: str, data: dict):
        channel = f"zentinel:scan_{scan_id}"
        message = {"type": event_type, "data": data}
        # In a real implementation this would serialize message to JSON
        import json
        await redis_client.publish(channel, json.dumps(message))

redis_service = RedisStart()
