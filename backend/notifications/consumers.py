import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)

class NotificationConsumer(AsyncWebsocketConsumer):
    """
    Async WebSocket consumer for real-time user in-app notifications.
    """
    async def connect(self):
        self.user = self.scope.get('user')

        if not self.user or not self.user.is_authenticated:
            logger.warning("WebSocket connection rejected: Unauthenticated user")
            await self.close(code=4001)
            return

        self.group_name = f"user_{self.user.external_id}"

        # Join personal user notification group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()
        logger.info(f"WebSocket connected for user: {self.user.external_id}")

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
            logger.info(f"WebSocket disconnected for user: {getattr(self.user, 'external_id', 'unknown')}")

    async def send_notification(self, event):
        """
        Handler for event type 'send_notification' broadcast by channel layer.
        """
        notification = event.get('notification', {})
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'data': notification
        }))
