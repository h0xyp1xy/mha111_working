from django.contrib import admin
from .models import (
    ConversationSession, Message, EmotionalState,
    CBTContent, CBTProgress, Analytics, CrisisResource
)


@admin.register(ConversationSession)
class ConversationSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'started_at', 'ended_at', 'is_active']
    list_filter = ['is_active', 'started_at']
    search_fields = ['user__username']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'sender', 'content_preview', 'sentiment_label', 'risk_level', 'created_at']
    list_filter = ['sender', 'sentiment_label', 'risk_level', 'created_at']
    search_fields = ['content']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'


@admin.register(EmotionalState)
class EmotionalStateAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'mood', 'intensity', 'recorded_at']
    list_filter = ['mood', 'recorded_at']
    search_fields = ['user__username']


@admin.register(CBTContent)
class CBTContentAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'category', 'order', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['title', 'content']


@admin.register(CBTProgress)
class CBTProgressAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'content', 'progress_percentage', 'completed', 'last_accessed']
    list_filter = ['completed', 'last_accessed']
    search_fields = ['user__username', 'content__title']


@admin.register(Analytics)
class AnalyticsAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'date', 'total_sessions', 'total_messages', 'risk_events']
    list_filter = ['date']
    search_fields = ['user__username']


@admin.register(CrisisResource)
class CrisisResourceAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'is_emergency', 'order', 'is_active']
    list_filter = ['is_emergency', 'is_active']
    search_fields = ['title', 'description']

