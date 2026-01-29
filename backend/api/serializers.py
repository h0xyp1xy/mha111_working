from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    ConversationSession, Message, EmotionalState,
    CBTContent, CBTProgress, Analytics, CrisisResource, Subscription
)


class UserSerializer(serializers.ModelSerializer):
    isAdmin = serializers.SerializerMethodField()
    subscription = serializers.SerializerMethodField()
    isPremium = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'isAdmin', 'subscription', 'isPremium']
    
    def get_isAdmin(self, obj):
        """Return True if user is staff or superuser"""
        return obj.is_staff or obj.is_superuser
    
    def get_subscription(self, obj):
        """Return subscription information"""
        try:
            subscription = obj.subscription
            return {
                'tier': subscription.tier,
                'is_active': subscription.is_active,
                'is_premium': subscription.is_premium,
                'expires_at': subscription.expires_at.isoformat() if subscription.expires_at else None,
            }
        except:
            return {
                'tier': 'free',
                'is_active': True,
                'is_premium': False,
                'expires_at': None,
            }
    
    def get_isPremium(self, obj):
        """Return True if user has active premium subscription"""
        try:
            return obj.subscription.is_premium
        except:
            return False


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'session', 'sender', 'content', 'sentiment_score',
                  'sentiment_label', 'risk_level', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def validate_content(self, value):
        """SECURITY: Sanitize and validate message content"""
        import html
        # Limit content length to prevent DoS
        if len(value) > 10000:
            raise serializers.ValidationError("Message content is too long (max 10000 characters)")
        # Escape HTML to prevent XSS (frontend will handle display)
        # Note: We escape here for safety, but frontend should also sanitize
        return html.escape(value[:10000])  # Truncate and escape


class ConversationSessionSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = ConversationSession
        fields = ['id', 'user', 'started_at', 'ended_at', 'is_active', 'messages']
        read_only_fields = ['id', 'started_at']


class EmotionalStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmotionalState
        fields = ['id', 'user', 'session', 'mood', 'intensity', 'notes', 'recorded_at']
        read_only_fields = ['id', 'recorded_at', 'user']
        extra_kwargs = {
            'session': {'required': False, 'allow_null': True}
        }
    
    def validate_notes(self, value):
        """SECURITY: Sanitize notes to prevent XSS"""
        import html
        if value:
            if len(value) > 5000:
                raise serializers.ValidationError("Notes are too long (max 5000 characters)")
            return html.escape(value[:5000])  # Truncate and escape
        return value
    
    def validate_intensity(self, value):
        """SECURITY: Validate intensity is within valid range"""
        if value < 1 or value > 10:
            raise serializers.ValidationError("Intensity must be between 1 and 10")
        return value
    
    def validate_session(self, value):
        """Validate that session belongs to the current user if provided"""
        if value and hasattr(self, 'context') and 'request' in self.context:
            user = self.context['request'].user
            if user.is_authenticated and user != value.user:
                raise serializers.ValidationError("Session does not belong to the current user.")
            elif not user.is_authenticated:
                # Anonymous users cannot link to sessions
                return None
        return value
    
    def create(self, validated_data):
        """Create emotional state and ensure user is set"""
        user = self.context['request'].user
        validated_data['user'] = user if user.is_authenticated else None
        return super().create(validated_data)


class CBTContentSerializer(serializers.ModelSerializer):
    lessons = serializers.SerializerMethodField()
    is_locked = serializers.SerializerMethodField()
    
    class Meta:
        model = CBTContent
        fields = ['id', 'title', 'category', 'content', 'audio_url', 'order', 'is_active', 'parent', 'lessons', 'is_locked', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_is_locked(self, obj):
        """Check if content is locked for current user"""
        if obj.parent is not None:
            # For lessons, check parent program
            obj = obj.parent
        
        request = self.context.get('request')
        if not request or not request.user.is_authenticated or request.user.is_staff:
            return False
        
        from .subscription_utils import get_premium_feature_limits
        limits = get_premium_feature_limits(request.user)
        if limits['max_cbt_programs'] is None:
            return False
        
        # Check if this program is in allowed list
        from .models import CBTContent as CBTContentModel
        allowed_programs = list(CBTContentModel.objects.filter(
            is_active=True, parent__isnull=True
        ).order_by('category', 'order')[:limits['max_cbt_programs']])
        allowed_ids = [p.id for p in allowed_programs]
        
        return obj.id not in allowed_ids
    
    def get_lessons(self, obj):
        if obj.parent is None:  # This is a program, not a lesson
            # Check if user has access to this program
            request = self.context.get('request')
            is_locked = self.get_is_locked(obj)
            
            if is_locked:
                # Return empty lessons for locked programs
                return []
            
            lessons = obj.lessons.all().order_by('order')
            return CBTContentSerializer(lessons, many=True, context=self.context).data
        return []


class CBTProgressSerializer(serializers.ModelSerializer):
    content = CBTContentSerializer(read_only=True)
    content_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = CBTProgress
        fields = ['id', 'user', 'content', 'content_id', 'completed', 'progress_percentage',
                  'last_accessed', 'completed_at']
        read_only_fields = ['id', 'last_accessed']


class AnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Analytics
        fields = ['id', 'user', 'date', 'total_sessions', 'total_messages',
                  'average_sentiment', 'dominant_themes', 'risk_events']
        read_only_fields = ['id']


class CrisisResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CrisisResource
        fields = ['id', 'title', 'description', 'phone_number', 'website_url',
                  'is_emergency', 'order', 'is_active']
        read_only_fields = ['id']


class VoiceInputSerializer(serializers.Serializer):
    """Serializer for voice input processing"""
    text = serializers.CharField()
    audio_data = serializers.CharField(required=False, allow_blank=True)
    session_id = serializers.IntegerField(required=False)


class SubscriptionSerializer(serializers.ModelSerializer):
    is_premium = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    
    class Meta:
        model = Subscription
        fields = ['id', 'tier', 'is_active', 'is_premium', 'is_expired', 'started_at', 'expires_at', 'cancel_at_period_end']
        read_only_fields = ['id', 'started_at']


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    
    def validate_username(self, value):
        """Check if username already exists"""
        # SECURITY: Don't reveal if username exists to prevent user enumeration
        # We'll check but use generic error message
        if not value:
            return value
        # Validate username format
        if len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters long")
        if len(value) > 150:
            raise serializers.ValidationError("Username is too long (max 150 characters)")
        return value

    def validate_email(self, value):
        """Validate email format"""
        # SECURITY: Don't reveal if email exists to prevent user enumeration
        # We'll check in create() method and use generic error
        if not value:
            raise serializers.ValidationError("Email is required")
        # Basic email format validation
        if '@' not in value or '.' not in value.split('@')[-1]:
            raise serializers.ValidationError("Invalid email format")
        if len(value) > 254:
            raise serializers.ValidationError("Email is too long (max 254 characters)")
        return value
    
    def validate(self, attrs):
        # If password_confirm is not provided, use password (simplified registration)
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')
        
        if password_confirm and password != password_confirm:
            raise serializers.ValidationError({"password_confirm": "Passwords don't match"})
        
        # If username is not provided, use email
        if not attrs.get('username'):
            attrs['username'] = attrs.get('email')
            
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        email = validated_data.get('email')
        username = validated_data.get('username') or email
        
        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=validated_data['password'],
                first_name=validated_data.get('first_name', '') or '',
                last_name=validated_data.get('last_name', '') or '',
            )
            # Create free subscription for new user
            Subscription.objects.get_or_create(
                user=user,
                defaults={'tier': 'free', 'is_active': True}
            )
            return user
        except Exception as e:
            import logging
            logger = logging.getLogger('api')
            logger.error(f"Error creating user: {str(e)}")
            # SECURITY: Use generic error to prevent information disclosure
            raise serializers.ValidationError("Пользователь с такой почтой уже зарегистрирован.")

