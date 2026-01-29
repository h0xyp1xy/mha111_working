from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ConversationSessionViewSet, MessageViewSet, VoiceInputViewSet,
    EmotionalStateViewSet, CBTContentViewSet, CBTProgressViewSet,
    AnalyticsViewSet, CrisisResourceViewSet,
    register_view, login_view, logout_view, current_user_view, csrf_token_view,
    subscription_status_view, upgrade_to_premium_view, cancel_subscription_view, feature_limits_view,
    delete_account_view
)
from .admin_views import (
    admin_dashboard, admin_user_analytics,
    admin_cbt_content, admin_cbt_content_detail,
    admin_crisis_resources, admin_crisis_resources_detail
)

router = DefaultRouter()
router.register(r'sessions', ConversationSessionViewSet, basename='session')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'voice', VoiceInputViewSet, basename='voice')
router.register(r'emotional-states', EmotionalStateViewSet, basename='emotional-state')
router.register(r'cbt-content', CBTContentViewSet, basename='cbt-content')
router.register(r'cbt-progress', CBTProgressViewSet, basename='cbt-progress')
router.register(r'analytics', AnalyticsViewSet, basename='analytics')
router.register(r'crisis-resources', CrisisResourceViewSet, basename='crisis-resource')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', register_view, name='register'),
    path('auth/login/', login_view, name='login'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/current-user/', current_user_view, name='current-user'),
    path('auth/csrf-token/', csrf_token_view, name='csrf-token'),
    path('auth/delete-account/', delete_account_view, name='delete-account'),
    # Subscription routes
    path('subscription/status/', subscription_status_view, name='subscription-status'),
    path('subscription/upgrade/', upgrade_to_premium_view, name='upgrade-premium'),
    path('subscription/cancel/', cancel_subscription_view, name='cancel-subscription'),
    path('subscription/limits/', feature_limits_view, name='feature-limits'),
    # Admin panel routes
    path('admin/dashboard/', admin_dashboard, name='admin-dashboard'),
    path('admin/users/<int:user_id>/analytics/', admin_user_analytics, name='admin-user-analytics'),
    path('admin/cbt-content/', admin_cbt_content, name='admin-cbt-content'),
    path('admin/cbt-content/<int:content_id>/', admin_cbt_content_detail, name='admin-cbt-content-detail'),
    path('admin/crisis-resources/', admin_crisis_resources, name='admin-crisis-resources'),
    path('admin/crisis-resources/<int:resource_id>/', admin_crisis_resources_detail, name='admin-crisis-resources-detail'),
]

