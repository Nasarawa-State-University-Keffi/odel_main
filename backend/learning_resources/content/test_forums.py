from django.test import override_settings
from rest_framework.test import APITestCase
from portal_auth.models import PortalUser
from .models import Forum, ForumMembership, ForumPost
from django.core.files.uploadedfile import SimpleUploadedFile


@override_settings(CHANNEL_LAYERS={'default': {'BACKEND': 'channels.layers.InMemoryChannelLayer'}})
class ForumTests(APITestCase):
    def setUp(self):
        self.staff = PortalUser.objects.create(external_id='forum-staff', full_name='Teacher', is_staff=True)
        self.student = PortalUser.objects.create(external_id='forum-student', full_name='Student', roles=['STUDENT'])
        self.admin = PortalUser.objects.create(external_id='forum-admin', full_name='Admin', roles=['ADMIN'])
        self.forum = Forum.objects.create(name='Campus', created_by=self.staff)
        ForumMembership.objects.create(forum=self.forum, user=self.staff, is_admin=True)
        self.url = f'/api/content/forums/{self.forum.pk}/'

    def test_student_cannot_create_or_appoint_admin(self):
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.post('/api/content/forums/', {'name': 'Denied'}).status_code, 403)
        self.assertEqual(self.client.post(self.url + 'admins/', {'external_id': self.student.external_id, 'is_admin': True}).status_code, 403)

    def test_join_required_and_reply_must_be_in_same_forum(self):
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.get(self.url + 'posts/').status_code, 403)
        self.assertEqual(self.client.post(self.url + 'join/').status_code, 200)
        self.assertEqual(self.client.post(self.url + 'posts/', {'body': 'Hello'}).status_code, 201)
        other = Forum.objects.create(name='Other')
        post = ForumPost.objects.create(forum=other, author=self.staff, body='Other forum')
        self.assertEqual(self.client.post(self.url + 'posts/', {'body': 'Reply', 'parent': str(post.pk)}).status_code, 404)

    def test_admin_can_appoint_student_moderator(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post(self.url + 'admins/', {'external_id': self.student.external_id, 'is_admin': True}, format='json').status_code, 200)
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.patch(self.url, {'is_closed': True}, format='json').status_code, 200)
        self.assertEqual(self.client.post(self.url + 'posts/', {'body': 'Closed'}).status_code, 403)

    def test_staff_creation_and_moderation(self):
        self.client.force_authenticate(self.staff)
        response = self.client.post('/api/content/forums/', {'name': 'New'}, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(ForumMembership.objects.filter(forum_id=response.data['id'], user=self.staff, is_admin=True).exists())
        post = ForumPost.objects.create(forum=self.forum, author=self.student, body='Moderated')
        self.assertEqual(self.client.delete(self.url + f'posts/{post.pk}/').status_code, 204)

    def test_pagination_is_bounded_and_invalid_limits_rejected(self):
        self.client.force_authenticate(self.staff)
        ForumPost.objects.bulk_create([ForumPost(forum=self.forum, author=self.staff, body=str(i)) for i in range(55)])
        response = self.client.get(self.url + 'posts/')
        self.assertEqual(len(response.data['posts']), 50)
        self.assertTrue(response.data['has_more'])
        self.assertEqual(self.client.get(self.url + 'posts/?limit=501').status_code, 400)

    def test_executable_attachment_is_rejected(self):
        self.client.force_authenticate(self.staff)
        response = self.client.post(self.url + 'posts/', {'body': 'Unsafe', 'file': SimpleUploadedFile('script.html', b'<script>alert(1)</script>')}, format='multipart')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.forum.posts.count(), 0)

    def test_document_upload_uses_saved_key_and_absolute_url(self):
        self.client.force_authenticate(self.staff)
        with patch('learning_resources.content.forum.get_storage_engine') as storage:
            storage.return_value.save.return_value = 'saved/key.pdf'
            storage.return_value.url.return_value = '/media/saved/key.pdf'
            response = self.client.post(self.url + 'posts/', {'body': 'Notes', 'file': SimpleUploadedFile('notes.pdf', b'%PDF-1.4')}, format='multipart')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ForumPost.objects.get(pk=response.data['id']).storage_path, 'saved/key.pdf')
        self.assertEqual(response.data['document_url'], 'http://testserver/media/saved/key.pdf')

    @override_settings(CLOUDINARY_CLOUD_NAME='test', CLOUDINARY_API_KEY='key', CLOUDINARY_API_SECRET='secret')
    def test_cloudinary_document_url_and_cleanup_preserve_raw_identity(self):
        from learning_resources.storage.cloudinary import CloudinaryStorageEngine
        engine = CloudinaryStorageEngine()
        self.client.force_authenticate(self.staff)
        saved = {'public_id': 'forums/notes.docx', 'resource_type': 'raw',
                 'secure_url': 'https://res.cloudinary.com/test/raw/upload/v1/forums/notes.docx'}
        with patch('learning_resources.content.forum.get_storage_engine', return_value=engine), patch('cloudinary.uploader.upload', return_value=saved) as upload:
            response = self.client.post(self.url + 'posts/', {'body': 'Notes', 'file': SimpleUploadedFile('notes.docx', b'office document')}, format='multipart')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(upload.call_args.kwargs['resource_type'], 'raw')
        self.assertTrue(upload.call_args.kwargs['public_id'].endswith('.docx'))
        self.assertEqual(response.data['document_url'], saved['secure_url'])
        post = ForumPost.objects.get(pk=response.data['id'])
        self.assertEqual(post.resource_type, 'raw')
        with patch('learning_resources.storage.get_storage_engine', return_value=engine), patch('cloudinary.uploader.destroy', return_value={'result': 'ok'}) as destroy:
            with self.captureOnCommitCallbacks(execute=True):
                self.client.delete(self.url + f'posts/{post.pk}/')
        destroy.assert_called_once_with(saved['public_id'], resource_type='raw', invalidate=True)

    def test_cursor_pagination_reaches_history_beyond_500(self):
        self.client.force_authenticate(self.staff)
        ForumPost.objects.bulk_create([ForumPost(forum=self.forum, author=self.staff, body=str(i)) for i in range(510)])
        seen, cursor = set(), ''
        while True:
            response = self.client.get(self.url + 'posts/' + (f'?before={cursor}' if cursor else ''))
            self.assertEqual(response.status_code, 200)
            ids = [str(post['id']) for post in response.data['posts']]
            self.assertFalse(seen.intersection(ids))
            seen.update(ids)
            if not response.data['has_more']:
                break
            cursor = ids[-1]
        self.assertEqual(len(seen), 510)


from asgiref.sync import async_to_sync
from channels.testing import WebsocketCommunicator
from django.test import SimpleTestCase
from unittest.mock import AsyncMock, patch
from .forum import ForumConsumer


@override_settings(CHANNEL_LAYERS={'default': {'BACKEND': 'channels.layers.InMemoryChannelLayer'}})
class ForumSocketTests(SimpleTestCase):
    def test_authenticated_nonmember_socket_rejected(self):
        async def scenario():
            socket = WebsocketCommunicator(ForumConsumer.as_asgi(), '/ws/forums/test/')
            socket.scope['url_route'] = {'kwargs': {'pk': 'test'}}
            socket.scope['user'] = type('User', (), {'is_authenticated': True})()
            with patch.object(ForumConsumer, 'allowed', new=AsyncMock(return_value=False)):
                connected, code = await socket.connect()
                self.assertFalse(connected)
                self.assertEqual(code, 4003)
                await socket.disconnect()
        async_to_sync(scenario)()

    def test_unauthenticated_socket_rejected(self):
        async def scenario():
            socket = WebsocketCommunicator(ForumConsumer.as_asgi(), '/ws/forums/test/')
            socket.scope['url_route'] = {'kwargs': {'pk': 'test'}}
            connected, code = await socket.connect()
            self.assertFalse(connected)
            self.assertEqual(code, 4003)
            await socket.disconnect()
        async_to_sync(scenario)()

    def test_member_receives_live_event(self):
        async def scenario():
            from channels.layers import get_channel_layer
            socket = WebsocketCommunicator(ForumConsumer.as_asgi(), '/ws/forums/test/')
            socket.scope['url_route'] = {'kwargs': {'pk': 'test'}}
            socket.scope['user'] = type('User', (), {'is_authenticated': True})()
            with patch.object(ForumConsumer, 'allowed', new=AsyncMock(return_value=True)):
                connected, _ = await socket.connect()
                self.assertTrue(connected)
                await get_channel_layer().group_send('forum_test', {'type': 'forum.changed'})
                self.assertEqual(await socket.receive_json_from(), {'type': 'forum.changed'})
                await socket.disconnect()
        async_to_sync(scenario)()
