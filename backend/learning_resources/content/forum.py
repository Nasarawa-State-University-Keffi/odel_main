"""Community forum REST API and session-authenticated live invalidations."""
from pathlib import Path
from uuid import uuid4
import logging

from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.layers import get_channel_layer
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from portal_auth.models import PortalUser
from learning_resources.storage import get_storage_engine
from .models import Forum, ForumMembership, ForumPost
from .serializers import StudyGroupMaterialCreateSerializer

logger = logging.getLogger(__name__)


def platform_admin(user):
    return bool({str(r).upper() for r in user.roles} & {'ADMIN', 'SUPER_ADMIN', 'PORTAL_ADMIN', 'PORTAL_ADMINS'})


def moderator(user, forum):
    return platform_admin(user) or ForumMembership.objects.filter(forum=forum, user=user, is_admin=True).exists()


def member(user, forum):
    return platform_admin(user) or ForumMembership.objects.filter(forum=forum, user=user).exists()


def changed(forum):
    def broadcast():
        layer = get_channel_layer()
        if layer:
            try:
                async_to_sync(layer.group_send)(f'forum_{forum.pk}', {'type': 'forum.changed'})
            except Exception:
                logger.exception('Forum live update failed; clients will refresh through REST.')
    transaction.on_commit(broadcast)


class ForumSerializer(serializers.ModelSerializer):
    is_member = serializers.SerializerMethodField()
    can_moderate = serializers.SerializerMethodField()
    can_assign_admins = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Forum
        fields = ['id', 'name', 'description', 'is_closed', 'created_at', 'is_member', 'can_moderate', 'can_assign_admins', 'member_count']
        read_only_fields = ['id', 'created_at']

    def get_is_member(self, obj):
        return member(self.context['request'].user, obj)

    def get_can_moderate(self, obj):
        return moderator(self.context['request'].user, obj)

    def get_can_assign_admins(self, obj):
        return platform_admin(self.context['request'].user)

    def get_member_count(self, obj):
        return obj.memberships.count()


class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', default='Former member', read_only=True)
    author_id = serializers.CharField(source='author.external_id', default='', read_only=True)
    document_url = serializers.SerializerMethodField()

    class Meta:
        model = ForumPost
        fields = ['id', 'body', 'parent', 'author_name', 'author_id', 'document_url', 'filename', 'created_at']

    def get_document_url(self, obj):
        if not obj.storage_path:
            return ''
        url = obj.attachment_url or get_storage_engine(obj.storage_backend).url(obj.storage_path)
        request = self.context.get('request')
        return request.build_absolute_uri(url) if request else url


class ForumsAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'can_create': request.user.is_staff or platform_admin(request.user),
                         'forums': ForumSerializer(Forum.objects.all(), many=True, context={'request': request}).data})

    def post(self, request):
        if not (request.user.is_staff or platform_admin(request.user)):
            raise PermissionDenied('Only staff and platform admins can create forums.')
        serializer = ForumSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            forum = serializer.save(created_by=request.user)
            ForumMembership.objects.create(forum=forum, user=request.user, is_admin=True)
        return Response(ForumSerializer(forum, context={'request': request}).data, status=201)


class ForumAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        forum = get_object_or_404(Forum, pk=pk)
        data = dict(ForumSerializer(forum, context={'request': request}).data)
        if member(request.user, forum):
            data['members'] = list(forum.memberships.values('user__external_id', 'user__full_name', 'is_admin'))
        return Response(data)

    def patch(self, request, pk):
        forum = get_object_or_404(Forum, pk=pk)
        if not moderator(request.user, forum):
            raise PermissionDenied('Only forum admins can edit this forum.')
        serializer = ForumSerializer(forum, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        changed(forum)
        return Response(serializer.data)


class ForumJoinAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        with transaction.atomic():
            forum = get_object_or_404(Forum.objects.select_for_update(), pk=pk)
            if forum.is_closed:
                raise PermissionDenied('This forum is closed.')
            ForumMembership.objects.get_or_create(forum=forum, user=request.user)
            changed(forum)
        return Response(ForumSerializer(forum, context={'request': request}).data)


class ForumAdminsAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not platform_admin(request.user):
            raise PermissionDenied('Only platform admins can appoint forum admins.')
        forum = get_object_or_404(Forum, pk=pk)
        class Appointment(serializers.Serializer):
            external_id = serializers.CharField()
            is_admin = serializers.BooleanField()
        serializer = Appointment(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = get_object_or_404(PortalUser, external_id=serializer.validated_data['external_id'], is_active=True)
        ForumMembership.objects.update_or_create(forum=forum, user=user, defaults={'is_admin': serializer.validated_data['is_admin']})
        changed(forum)
        return Response({'detail': 'Forum administrator updated.'})


class ForumPostsAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get_forum(self, request, pk):
        forum = get_object_or_404(Forum, pk=pk)
        if not member(request.user, forum):
            raise PermissionDenied('Join the forum before viewing discussions.')
        return forum

    def get(self, request, pk):
        forum = self.get_forum(request, pk)
        # Cursor pagination keeps a long-running discussion bounded.
        posts = forum.posts.select_related('author').order_by('-created_at', '-id')
        cursor = request.query_params.get('before')
        if cursor:
            anchor = get_object_or_404(ForumPost, forum=forum, pk=cursor)
            from django.db.models import Q
            posts = posts.filter(Q(created_at__lt=anchor.created_at) | Q(created_at=anchor.created_at, id__lt=anchor.id))
        class Page(serializers.Serializer):
            limit = serializers.IntegerField(min_value=1, max_value=500, default=50)
        params = Page(data=request.query_params)
        params.is_valid(raise_exception=True)
        limit = params.validated_data['limit']
        page = list(posts[:limit + 1])
        return Response({'posts': PostSerializer(page[:limit], many=True, context={'request': request}).data, 'has_more': len(page) > limit})

    def post(self, request, pk):
        forum = self.get_forum(request, pk)
        if forum.is_closed:
            raise PermissionDenied('This forum is closed for posting.')
        class Draft(serializers.Serializer):
            body = serializers.CharField(max_length=10000)
            parent = serializers.UUIDField(required=False)
            file = serializers.FileField(required=False)
        draft = Draft(data=request.data)
        draft.is_valid(raise_exception=True)
        values = draft.validated_data
        parent = get_object_or_404(ForumPost, pk=values['parent'], forum=forum) if values.get('parent') else None
        file = values.get('file')
        path, backend, filename = '', 'local', ''
        attachment_url, resource_type = '', ''
        if file:
            validation = StudyGroupMaterialCreateSerializer(data={'file': file})
            validation.is_valid(raise_exception=True)
            engine = get_storage_engine()
            filename = Path(file.name).name
            if len(filename) > 255 or Path(filename).suffix.lower() not in {'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.png', '.jpg', '.jpeg'}:
                raise serializers.ValidationError({'file': 'Upload a PDF, Office document, text file, or image with a filename under 256 characters.'})
            path = f'forums/{forum.pk}/{uuid4().hex}_{filename}'
            backend = engine.__class__.__name__.replace('StorageEngine', '').lower()
            if backend == 'cloudinary':
                saved = engine.save_document(file, path)
                path, attachment_url, resource_type = saved['path'], saved['url'], saved['resource_type']
            else:
                path = engine.save(file, path)
        try:
            post = ForumPost.objects.create(forum=forum, author=request.user, body=values['body'], parent=parent,
                                            storage_path=path, storage_backend=backend, filename=filename,
                                            attachment_url=attachment_url, resource_type=resource_type)
        except Exception:
            if path:
                engine = get_storage_engine(backend)
                if backend == 'cloudinary' and resource_type:
                    engine.delete_document(path, resource_type)
                else:
                    engine.delete(path)
            raise
        changed(forum)
        return Response(PostSerializer(post, context={'request': request}).data, status=201)


class ForumPostAPI(ForumPostsAPI):
    http_method_names = ['delete', 'options']

    def delete(self, request, pk, post_id):
        forum = self.get_forum(request, pk)
        if not moderator(request.user, forum):
            raise PermissionDenied('Only forum admins can moderate posts.')
        get_object_or_404(ForumPost, forum=forum, pk=post_id).delete()
        changed(forum)
        return Response(status=204)


class ForumConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get('user')
        self.forum_id = self.scope['url_route']['kwargs']['pk']
        if not user or not user.is_authenticated or not await self.allowed(user):
            await self.close(code=4003)
            return
        self.group_name = f'forum_{self.forum_id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    @database_sync_to_async
    def allowed(self, user):
        forum = Forum.objects.filter(pk=self.forum_id).first()
        return bool(forum and PortalUser.objects.filter(pk=user.pk, is_active=True).exists() and member(user, forum))

    async def disconnect(self, code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def forum_changed(self, event):
        if not await self.allowed(self.scope['user']):
            await self.close(code=4003)
            return
        await self.send_json({'type': 'forum.changed'})
