import json
import redis.asyncio as aioredis
import redis as sync_redis
from ..core.config import settings

# Async client for FastAPI SSE streams
redis_async_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)

# Sync client for Celery tasks
redis_sync_client = sync_redis.from_url(settings.REDIS_URL, decode_responses=True)

def publish_event(channel: str, event_type: str, data: dict):
    """
    Publish an event to a Redis channel synchronously (used by Celery worker).
    """
    message = {
        "type": event_type,
        "data": data
    }
    redis_sync_client.publish(channel, json.dumps(message))

async def subscribe_to_channel(channel: str):
    """
    Subscribe to a Redis channel asynchronously (used by FastAPI SSE streaming).
    Yields parsed JSON messages.
    """
    pubsub = redis_async_client.pubsub()
    await pubsub.subscribe(channel)
    try:
        async for msg in pubsub.listen():
            if msg['type'] == 'message':
                # Yield parsed JSON message
                yield json.loads(msg['data'])
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()
