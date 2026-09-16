# Forums

Forums extend campus collaboration without changing private student study groups.
These are campus-wide spaces: any signed-in student or staff member can discover
an open forum and join it. They are not limited to a course or academic period.

## Usage

- Staff/admin: open **Forums**, choose **Create forum**, enter a name and purpose.
  The creator becomes its first forum admin.
- Students/staff: open a forum and choose **Join forum**. Post messages, reply to
  earlier messages, and optionally attach a document or image.
- Platform admin: open a forum; use **Make forum admin** beside a member, or
  **Add admin** with an existing user's external ID. Appointments also join that
  user to the forum. Students can be appointed as forum admins.
- Forum admins: delete inappropriate messages (including their replies), or
  close/reopen discussion. Closing prevents new joins/posts but retains reading.
- Messages are plain text, safely rendered without executing HTML. Attachments
  use the configured content storage engine and existing upload size limit.

## Deployment

Run `python manage.py migrate` for content migrations `0011_forums` and
`0012_forum_attachment_metadata`.
Serve the backend through its Channels ASGI application and proxy WebSocket
upgrades for `/ws/forums/<uuid>/`. In multi-worker production deployments,
configure the existing Redis channel layer so events reach all workers.
The browser uses `VITE_API_BASE_URL` for REST and WebSocket endpoints.
WebSockets authenticate with the existing portal session cookie, not URL tokens.
Production must allow the frontend origin through `CORS_ALLOWED_ORIGINS` or
`CSRF_TRUSTED_ORIGINS`; existing session-cookie cross-site rules still apply.
The UI reconnects with backoff and refreshes every 30 seconds as a fallback.

REST API: `/api/content/forums/`, `<id>/`, `<id>/join/`, `<id>/admins/`,
`<id>/posts/`, `<id>/posts/<post-id>/`. Post listing supports a `before` UUID
cursor and a validated `limit` (1–500, default 50). The UI expands its recent
history using cursor-based pages, without a 500-message history cutoff.

Tests: `python manage.py test learning_resources.content.test_forums`.
