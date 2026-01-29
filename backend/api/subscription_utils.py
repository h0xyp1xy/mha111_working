"""
Utility functions for subscription and premium feature checks
"""
from django.utils import timezone
from .models import Subscription


def get_user_subscription(user):
    """Get or create subscription for user"""
    subscription, created = Subscription.objects.get_or_create(
        user=user,
        defaults={'tier': 'free', 'is_active': True}
    )
    return subscription


def is_premium_user(user):
    """Check if user has active premium subscription"""
    try:
        subscription = user.subscription
        return subscription.is_premium
    except Subscription.DoesNotExist:
        return False


def can_access_premium_feature(user, feature_name):
    """Check if user can access a specific premium feature"""
    if not user or not user.is_authenticated:
        return False
    
    # Staff/superusers always have access
    if user.is_staff or user.is_superuser:
        return True
    
    return is_premium_user(user)


def get_premium_feature_limits(user):
    """Get feature limits based on user subscription tier"""
    # Staff always has premium access
    if user.is_staff or user.is_superuser:
        return {
            'max_cbt_programs': None,  # Unlimited
            'max_sessions_per_month': None,  # Unlimited
            'advanced_analytics': True,
            'priority_support': True,
            'voice_sessions_per_month': None,  # Unlimited
        }
    
    subscription = get_user_subscription(user)
    
    if subscription.is_premium:
        return {
            'max_cbt_programs': None,  # Unlimited
            'max_sessions_per_month': None,  # Unlimited
            'advanced_analytics': True,
            'priority_support': True,
            'voice_sessions_per_month': None,  # Unlimited
        }
    else:
        return {
            'max_cbt_programs': 2,  # Free tier: 2 programs (reduced to show limitation)
            'max_sessions_per_month': 5,  # Free tier: 5 sessions (reduced to show limitation)
            'advanced_analytics': False,
            'priority_support': False,
            'voice_sessions_per_month': 3,  # Free tier: 3 voice sessions
        }
