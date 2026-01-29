from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from collections import defaultdict, Counter
import logging
import os
import html

# SECURITY: Rate limiting is mandatory - fail if not available
try:
    from django_ratelimit.core import is_ratelimited
    RATELIMIT_AVAILABLE = True
except ImportError:
    RATELIMIT_AVAILABLE = False
    logger.error("SECURITY WARNING: django-ratelimit is not installed! Rate limiting is disabled.")
    logger.error("Install it with: pip install django-ratelimit")
    # SECURITY: In production, fail if rate limiting is not available
    if not settings.DEBUG:
        raise ImportError("django-ratelimit is required in production for security. Install it with: pip install django-ratelimit")
    # Fallback function if django-ratelimit is not installed (development only)
    def is_ratelimited(request, group=None, key='ip', rate=None, increment=False):
        logger.warning("Rate limiting is disabled - django-ratelimit not installed")
        return False

logger = logging.getLogger('api')
from .models import (
    ConversationSession, Message, EmotionalState,
    CBTContent, CBTProgress, Analytics, CrisisResource, Subscription
)
from .serializers import (
    ConversationSessionSerializer, MessageSerializer, EmotionalStateSerializer,
    CBTContentSerializer, CBTProgressSerializer, AnalyticsSerializer,
    CrisisResourceSerializer, VoiceInputSerializer, UserSerializer, RegisterSerializer,
    SubscriptionSerializer
)
from .services import SentimentAnalyzer, TherapistResponseGenerator
from .subscription_utils import (
    get_user_subscription, is_premium_user, can_access_premium_feature,
    get_premium_feature_limits
)


class ConversationSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for conversation sessions"""
    serializer_class = ConversationSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ConversationSession.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Check session limit for free users
        if not self.request.user.is_staff:
            limits = get_premium_feature_limits(self.request.user)
            if limits['max_sessions_per_month'] is not None:
                # Count sessions created this month
                now = timezone.now()
                start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                sessions_this_month = ConversationSession.objects.filter(
                    user=self.request.user,
                    started_at__gte=start_of_month
                ).count()
                
                if sessions_this_month >= limits['max_sessions_per_month']:
                    from rest_framework.exceptions import ValidationError
                    raise ValidationError(
                        f'Лимит сессий достигнут ({limits["max_sessions_per_month"]} в месяц). '
                        'Обновитесь до Премиум для неограниченного количества сессий.'
                    )
        
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def end_session(self, request, pk=None):
        """End an active session"""
        session = self.get_object()
        # SECURITY: Verify user owns the session
        if session.user != request.user:
            logger.warning(f'⚠ Unauthorized session access attempt: user {request.user.id} tried to end session {session.id}')
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        session.is_active = False
        session.ended_at = timezone.now()
        session.save()
        return Response({'status': 'session ended'})
    
    @action(detail=True, methods=['post'])
    def complete_with_summary(self, request, pk=None):
        """Complete session and generate summary/statistics"""
        from .services import TherapistResponseGenerator
        
        session = self.get_object()
        if session.user != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get all messages from this session
        messages = Message.objects.filter(session=session).order_by('created_at')
        conversation_history = [
            {
                'sender': msg.sender,
                'content': msg.content,
                'sentiment_score': msg.sentiment_score,
                'sentiment_label': msg.sentiment_label,
                'risk_level': msg.risk_level,
            }
            for msg in messages
        ]
        
        # Generate summary using AI model
        response_generator = TherapistResponseGenerator()
        summary = response_generator.generate_session_summary(conversation_history)
        
        # End session
        session.is_active = False
        session.ended_at = timezone.now()
        session.save()
        
        # Update analytics
        try:
            analytics, _ = Analytics.objects.get_or_create(user=request.user)
            # Analytics will be recalculated on next dashboard request
        except:
            pass
        
        return Response({
            'status': 'session completed',
            'summary': summary,
            'message': 'Сессия завершена. Статистика обновлена в разделе "Мой прогресс".'
        })
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active session"""
        session = ConversationSession.objects.filter(
            user=request.user, is_active=True
        ).first()
        if session:
            serializer = self.get_serializer(session)
            return Response(serializer.data)
        return Response(None)


class MessageViewSet(viewsets.ModelViewSet):
    """ViewSet for messages"""
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # SECURITY: Only return user's own messages
        return Message.objects.filter(session__user=self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        """SECURITY: Additional check to ensure user owns the message"""
        instance = self.get_object()
        if instance.session.user != request.user:
            logger.warning(f'⚠ Unauthorized message access attempt: user {request.user.id} tried to access message {instance.id}')
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not have permission to access this message.')
        return super().retrieve(request, *args, **kwargs)


class VoiceInputViewSet(viewsets.ViewSet):
    """Handle voice input processing"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def process(self, request):
        """Process voice input and generate response"""
        serializer = VoiceInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        text = serializer.validated_data['text']
        session_id = serializer.validated_data.get('session_id')
        
        # Get or create session
        if session_id:
            try:
                session = ConversationSession.objects.get(id=session_id, user=request.user)
            except ConversationSession.DoesNotExist:
                # Check session limit before creating new session
                if not request.user.is_staff:
                    limits = get_premium_feature_limits(request.user)
                    if limits['max_sessions_per_month'] is not None:
                        now = timezone.now()
                        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                        sessions_this_month = ConversationSession.objects.filter(
                            user=request.user,
                            started_at__gte=start_of_month
                        ).count()
                        
                        if sessions_this_month >= limits['max_sessions_per_month']:
                            return Response(
                                {
                                    'error': 'Лимит сессий достигнут',
                                    'message': f'Вы использовали все доступные сессии ({limits["max_sessions_per_month"]} в месяц). Обновитесь до Премиум для неограниченного количества сессий.',
                                    'upgrade_url': '/subscription',
                                    'limit_reached': True
                                },
                                status=status.HTTP_403_FORBIDDEN
                            )
                session = ConversationSession.objects.create(user=request.user)
        else:
            session = ConversationSession.objects.filter(
                user=request.user, is_active=True
            ).first()
            if not session:
                # Check session limit before creating new session
                if not request.user.is_staff:
                    limits = get_premium_feature_limits(request.user)
                    if limits['max_sessions_per_month'] is not None:
                        now = timezone.now()
                        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                        sessions_this_month = ConversationSession.objects.filter(
                            user=request.user,
                            started_at__gte=start_of_month
                        ).count()
                        
                        if sessions_this_month >= limits['max_sessions_per_month']:
                            return Response(
                                {
                                    'error': 'Лимит сессий достигнут',
                                    'message': f'Вы использовали все доступные сессии ({limits["max_sessions_per_month"]} в месяц). Обновитесь до Премиум для неограниченного количества сессий.',
                                    'upgrade_url': '/subscription',
                                    'limit_reached': True
                                },
                                status=status.HTTP_403_FORBIDDEN
                            )
                session = ConversationSession.objects.create(user=request.user)
        
        # Check if this is an assessment (contains assessment keywords)
        is_assessment = any(keyword in text.lower() for keyword in [
            'тестирование', 'прохожу тест', 'мои ответы', 'вот мои ответы'
        ])
        
        # Analyze sentiment and risk
        analyzer = SentimentAnalyzer()
        analysis = analyzer.analyze(text)
        
        # If this is an assessment, enhance risk analysis
        if is_assessment:
            # Assessments might indicate higher need for support
            # Check for distress indicators in assessment
            distress_keywords = ['плохо', 'трудно', 'сложно', 'беспокоит', 'тревож', 'грустн', 'плохое']
            if any(keyword in text.lower() for keyword in distress_keywords):
                analysis['risk_level'] = min(analysis['risk_level'] + 1, 10)
        
        # Save user message
        user_message = Message.objects.create(
            session=session,
            sender='user',
            content=text,
            sentiment_score=analysis['sentiment_score'],
            sentiment_label=analysis['sentiment_label'],
            risk_level=analysis['risk_level']
        )
        
        # Link to most recent emotional state if exists (within last hour)
        recent_state = EmotionalState.objects.filter(
            user=request.user,
            recorded_at__gte=timezone.now() - timedelta(hours=1)
        ).order_by('-recorded_at').first()
        
        if recent_state and not recent_state.session:
            recent_state.session = session
            recent_state.save()
        
        # Get conversation history for context (last 10 messages)
        previous_messages = Message.objects.filter(
            session=session
        ).order_by('-created_at')[:10]
        
        # Prepare history for response generator
        conversation_history = [
            {
                'sender': msg.sender,
                'content': msg.content,
                'sentiment_score': msg.sentiment_score,
                'sentiment_label': msg.sentiment_label,
                'risk_level': msg.risk_level,
            }
            for msg in reversed(previous_messages)  # Reverse to get chronological order
        ]
        
        # Generate therapist response with context
        try:
            response_generator = TherapistResponseGenerator()
            therapist_response = response_generator.generate_response(
                text, 
                analysis['sentiment_label'], 
                analysis['risk_level'],
                conversation_history=conversation_history,
                is_assessment=is_assessment
            )
            
            # Ensure we have a response
            if not therapist_response or len(therapist_response.strip()) == 0:
                # Fallback response
                if analysis['risk_level'] >= 7:
                    therapist_response = "Я понимаю, что тебе сейчас трудно. Я здесь, чтобы помочь. Хочешь поговорить о том, что тебя беспокоит?"
                elif analysis['sentiment_label'] == 'positive':
                    therapist_response = "Это замечательно! Расскажи мне больше об этом."
                elif analysis['sentiment_label'] == 'negative':
                    therapist_response = "Понимаю тебя. Это важно обсудить. Расскажи мне больше."
                else:
                    therapist_response = "Расскажи мне больше о том, что происходит."
        except Exception as e:
            logger.error(f"Error generating therapist response: {e}", exc_info=True)
            # Fallback response on error
            if analysis['risk_level'] >= 7:
                therapist_response = "Я понимаю, что тебе сейчас трудно. Я здесь, чтобы помочь."
            elif analysis['sentiment_label'] == 'positive':
                therapist_response = "Это замечательно! Расскажи мне больше."
            elif analysis['sentiment_label'] == 'negative':
                therapist_response = "Понимаю тебя. Расскажи мне больше."
            else:
                therapist_response = "Расскажи мне больше о том, что происходит."
        
        # Save therapist message
        therapist_message = Message.objects.create(
            session=session,
            sender='therapist',
            content=therapist_response
        )
        
        # Check if response contains lesson recommendation
        recommended_category = None
        if '/практики' in therapist_response.lower() or 'практики' in therapist_response.lower():
            topic = response_generator._analyze_topic(text)
            category_map = {
                'anxiety': 'conditions',
                'depression': 'conditions',
                'work': 'techniques',
                'sleep': 'conditions',
            }
            recommended_category = category_map.get(topic)
        
        response_data = {
            'session_id': session.id,
            'user_message': MessageSerializer(user_message).data,
            'therapist_message': MessageSerializer(therapist_message).data,
            'analysis': analysis,
            'risk_detected': analysis['risk_level'] >= 7,
        }
        
        if recommended_category:
            response_data['recommended_category'] = recommended_category
        
        return Response(response_data, status=status.HTTP_200_OK)


class EmotionalStateViewSet(viewsets.ModelViewSet):
    """ViewSet for emotional states"""
    serializer_class = EmotionalStateSerializer
    
    def get_permissions(self):
        # SECURITY: Require authentication for all actions
        # Removed AllowAny() to prevent anonymous data creation
        return [IsAuthenticated()]
    
    def get_queryset(self):
        # SECURITY: Only return user's own emotional states
        return EmotionalState.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # SECURITY: Always require authentication
        if not self.request.user.is_authenticated:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Authentication required to create emotional states')

        # Try to link to active session if exists
        active_session = ConversationSession.objects.filter(
            user=self.request.user,
            is_active=True
        ).first()
        
        # If no active session, create one for assessment flow
        if not active_session:
            # Check session limit before creating new session
            if not self.request.user.is_staff:
                limits = get_premium_feature_limits(self.request.user)
                if limits['max_sessions_per_month'] is not None:
                    now = timezone.now()
                    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                    sessions_this_month = ConversationSession.objects.filter(
                        user=self.request.user,
                        started_at__gte=start_of_month
                    ).count()
                    
                    if sessions_this_month >= limits['max_sessions_per_month']:
                        from rest_framework.exceptions import ValidationError
                        raise ValidationError(
                            f'Лимит сессий достигнут ({limits["max_sessions_per_month"]} в месяц). '
                            'Обновитесь до Премиум для неограниченного количества сессий.'
                        )
            
            active_session = ConversationSession.objects.create(
                user=self.request.user,
                is_active=True
            )
        
        serializer.save(user=self.request.user, session=active_session)
    
    @action(detail=False, methods=['get'])
    def timeline(self, request):
        """Get emotional state timeline with enhanced data"""
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        states = EmotionalState.objects.filter(
            user=request.user,
            recorded_at__gte=start_date
        ).order_by('recorded_at')
        
        # Enhance with related session data
        enhanced_data = []
        for state in states:
            data = {
                'id': state.id,
                'mood': state.mood,
                'intensity': state.intensity,
                'notes': state.notes,
                'recorded_at': state.recorded_at.isoformat(),
                'session_id': state.session.id if state.session else None
            }
            
            # Add related messages if session exists
            if state.session:
                related_messages = Message.objects.filter(
                    session=state.session,
                    created_at__gte=state.recorded_at - timedelta(hours=2),
                    created_at__lte=state.recorded_at + timedelta(hours=2)
                )
                if related_messages.exists():
                    user_msgs = related_messages.filter(sender='user')
                    if user_msgs.exists():
                        sentiments = [m.sentiment_score for m in user_msgs if m.sentiment_score is not None]
                        if sentiments:
                            data['related_sentiment'] = sum(sentiments) / len(sentiments)
                            data['related_message_count'] = user_msgs.count()
            
            enhanced_data.append(data)
        
        return Response(enhanced_data)


class CBTContentViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for CBT content (read-only for users)"""
    serializer_class = CBTContentSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        # Return all programs (practices), serializer will mark locked ones
        # This allows frontend to show locked programs with upgrade prompts
        queryset = CBTContent.objects.filter(is_active=True, parent__isnull=True).order_by('category', 'order')
        
        # For unauthenticated users, return empty queryset
        if not self.request.user.is_authenticated:
            queryset = CBTContent.objects.none()
        
        return queryset
    
    def get_serializer_context(self):
        """Pass request to serializer for subscription checks"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def retrieve(self, request, *args, **kwargs):
        """Check if user can access specific content"""
        instance = self.get_object()
        
        # SECURITY: Require authentication to view content
        if not request.user.is_authenticated:
            from rest_framework.exceptions import AuthenticationRequired
            raise AuthenticationRequired('Authentication required to view content.')
        
        # Check if content is locked for free users
        if not request.user.is_staff:
            limits = get_premium_feature_limits(request.user)
            if limits['max_cbt_programs'] is not None:
                # Get program (either the instance itself or its parent)
                program = instance if not instance.parent else instance.parent
                
                # Check if program is in allowed list
                allowed_programs = list(CBTContent.objects.filter(
                    is_active=True, parent__isnull=True
                ).order_by('category', 'order')[:limits['max_cbt_programs']])
                allowed_ids = [p.id for p in allowed_programs]
                
                if program.id not in allowed_ids:
                    return Response(
                        {
                            'error': 'Доступ к этому контенту ограничен.',
                            'message': 'Обновитесь до Премиум для полного доступа ко всем программам.',
                            'upgrade_url': '/subscription'
                        },
                        status=status.HTTP_403_FORBIDDEN
                    )
        
        return super().retrieve(request, *args, **kwargs)


class CBTProgressViewSet(viewsets.ModelViewSet):
    """ViewSet for CBT progress tracking"""
    serializer_class = CBTProgressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CBTProgress.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Update progress for a CBT content item"""
        progress = self.get_object()
        progress_percentage = request.data.get('progress_percentage', 0)
        completed = request.data.get('completed', False)
        
        progress.progress_percentage = progress_percentage
        if completed and not progress.completed:
            progress.completed = True
            progress.completed_at = timezone.now()
        elif not completed:
            progress.completed = False
            progress.completed_at = None
        progress.save()
        
        serializer = self.get_serializer(progress)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def create_or_update(self, request):
        """Create or update progress for a CBT content item"""
        from .models import CBTContent
        
        content_id = request.data.get('content_id')
        progress_percentage = request.data.get('progress_percentage', 0)
        completed = request.data.get('completed', False)
        
        if not content_id:
            return Response({'error': 'content_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            content = CBTContent.objects.get(id=content_id)
        except CBTContent.DoesNotExist:
            return Response({'error': 'Content not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get or create progress
        progress, created = CBTProgress.objects.get_or_create(
            user=request.user,
            content=content,
            defaults={
                'progress_percentage': progress_percentage,
                'completed': completed,
            }
        )
        
        if not created:
            # Update existing progress
            progress.progress_percentage = progress_percentage
            if completed and not progress.completed:
                progress.completed = True
                progress.completed_at = timezone.now()
            elif not completed:
                progress.completed = False
                progress.completed_at = None
            progress.save()
        
        serializer = self.get_serializer(progress)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def reset_all(self, request):
        """Reset all progress for the current user"""
        deleted_count, _ = CBTProgress.objects.filter(user=request.user).delete()
        return Response({
            'message': f'All progress has been reset. {deleted_count} record(s) deleted.',
            'deleted_count': deleted_count
        }, status=status.HTTP_200_OK)


class AnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for analytics data"""
    serializer_class = AnalyticsSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Analytics.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get comprehensive dashboard data with improved analytics"""
        # Check if user has access to advanced analytics
        limits = get_premium_feature_limits(request.user)
        is_premium = can_access_premium_feature(request.user, 'advanced_analytics')
        
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # Free tier: limit to 7 days only
        if not is_premium and days > 7:
            days = 7
            start_date = timezone.now() - timedelta(days=7)
        
        # Get sessions
        sessions = ConversationSession.objects.filter(
            user=request.user,
            started_at__gte=start_date
        )
        
        # Get messages
        messages = Message.objects.filter(
            session__user=request.user,
            created_at__gte=start_date
        )
        
        # Get emotional states
        emotional_states = EmotionalState.objects.filter(
            user=request.user,
            recorded_at__gte=start_date
        )
        
        # Get CBT progress
        cbt_progress = CBTProgress.objects.filter(
            user=request.user,
            last_accessed__gte=start_date
        )
        
        # Calculate basic metrics
        total_sessions = sessions.count()
        total_messages = messages.count()
        total_mood_entries = emotional_states.count()
        total_cbt_completed = cbt_progress.filter(completed=True).count()
        
        # Calculate average sentiment from messages (weighted by recency)
        user_messages = messages.filter(sender='user')
        if user_messages.exists():
            sentiment_scores = [m.sentiment_score for m in user_messages if m.sentiment_score is not None]
            if sentiment_scores:
                avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
                # Calculate sentiment trend (recent vs older)
                recent_messages = user_messages.filter(created_at__gte=timezone.now() - timedelta(days=7))
                if recent_messages.exists():
                    recent_scores = [m.sentiment_score for m in recent_messages if m.sentiment_score is not None]
                    if recent_scores:
                        recent_avg = sum(recent_scores) / len(recent_scores)
                        sentiment_trend = recent_avg - avg_sentiment
                    else:
                        sentiment_trend = 0
                else:
                    sentiment_trend = 0
            else:
                avg_sentiment = None
                sentiment_trend = None
        else:
            avg_sentiment = None
            sentiment_trend = None
        
        # Calculate average mood intensity (weighted)
        if emotional_states.exists():
            mood_intensities = [state.intensity for state in emotional_states]
            avg_mood_intensity = sum(mood_intensities) / len(mood_intensities)
            
            # Mood distribution
            mood_counts = {}
            mood_intensity_sum = {}
            for state in emotional_states:
                mood = state.mood
                mood_counts[mood] = mood_counts.get(mood, 0) + 1
                mood_intensity_sum[mood] = mood_intensity_sum.get(mood, 0) + state.intensity
            
            # Calculate average intensity per mood
            mood_avg_intensity = {
                mood: mood_intensity_sum[mood] / mood_counts[mood]
                for mood in mood_counts.keys()
            }
            
            # Most common mood
            most_common_mood = max(mood_counts.items(), key=lambda x: x[1])[0] if mood_counts else None
            
            # Mood trend (comparing first half vs second half of period)
            mid_date = start_date + timedelta(days=days/2)
            early_states = emotional_states.filter(recorded_at__lt=mid_date)
            late_states = emotional_states.filter(recorded_at__gte=mid_date)
            
            if early_states.exists() and late_states.exists():
                early_avg = sum(s.intensity for s in early_states) / early_states.count()
                late_avg = sum(s.intensity for s in late_states) / late_states.count()
                mood_trend = late_avg - early_avg
            else:
                mood_trend = 0
        else:
            avg_mood_intensity = None
            mood_counts = {}
            mood_avg_intensity = {}
            most_common_mood = None
            mood_trend = None
        
        # Risk events
        risk_events = messages.filter(risk_level__gte=7).count()
        high_risk_messages = messages.filter(risk_level__gte=7)
        
        # Calculate comprehensive wellness score (0-100)
        # Combines: mood intensity, sentiment, engagement, progress
        wellness_score = None
        if emotional_states.exists() or user_messages.exists():
            score_components = []
            
            # Mood component (0-40 points): higher intensity of positive moods = higher score
            if emotional_states.exists():
                mood_scores_map = {
                    'very_happy': 10, 'happy': 8, 'calm': 7,
                    'neutral': 5, 'sad': 3, 'anxious': 2,
                    'angry': 2, 'very_sad': 1
                }
                mood_component = 0
                for state in emotional_states:
                    base_score = mood_scores_map.get(state.mood, 5)
                    # Weight by intensity (1-10 scale)
                    weighted_score = base_score * (state.intensity / 10)
                    mood_component += weighted_score
                mood_component = (mood_component / emotional_states.count()) * 4  # Scale to 0-40
                score_components.append(mood_component)
            
            # Sentiment component (0-30 points): positive sentiment = higher score
            if avg_sentiment is not None:
                # Convert -1 to 1 range to 0-30
                sentiment_component = ((avg_sentiment + 1) / 2) * 30
                score_components.append(sentiment_component)
            
            # Engagement component (0-20 points): more sessions and messages = higher score
            engagement_score = min(total_sessions * 2 + total_messages * 0.5, 20)
            score_components.append(engagement_score)
            
            # Progress component (0-10 points): CBT completion = higher score
            progress_score = min(total_cbt_completed * 2, 10)
            score_components.append(progress_score)
            
            # Risk penalty: subtract points for high risk events
            risk_penalty = min(risk_events * 5, 20)
            
            wellness_score = max(0, min(100, sum(score_components) - risk_penalty))
        
        # Correlation: mood vs sentiment
        # Find days where both mood and messages exist
        correlation_data = []
        if emotional_states.exists() and user_messages.exists():
            # Group by date
            daily_moods = defaultdict(list)
            daily_sentiments = defaultdict(list)
            
            for state in emotional_states:
                date_key = state.recorded_at.date()
                daily_moods[date_key].append(state.intensity)
            
            for msg in user_messages:
                if msg.sentiment_score is not None:
                    date_key = msg.created_at.date()
                    daily_sentiments[date_key].append(msg.sentiment_score)
            
            # Find overlapping dates
            common_dates = set(daily_moods.keys()) & set(daily_sentiments.keys())
            if common_dates:
                for date in common_dates:
                    avg_mood = sum(daily_moods[date]) / len(daily_moods[date])
                    avg_sent = sum(daily_sentiments[date]) / len(daily_sentiments[date])
                    correlation_data.append({
                        'date': date.isoformat(),
                        'mood_intensity': avg_mood,
                        'sentiment': avg_sent
                    })
        
        # Emotional timeline with enhanced data
        emotional_timeline = []
        for state in emotional_states.order_by('recorded_at'):
            # Find related session if exists
            related_session = None
            if state.session:
                related_session = state.session.id
            
            # Find messages around the same time (within 1 hour)
            related_messages = messages.filter(
                created_at__gte=state.recorded_at - timedelta(hours=1),
                created_at__lte=state.recorded_at + timedelta(hours=1)
            )
            related_sentiment = None
            if related_messages.exists():
                user_related = related_messages.filter(sender='user')
                if user_related.exists():
                    sentiments = [m.sentiment_score for m in user_related if m.sentiment_score is not None]
                    if sentiments:
                        related_sentiment = sum(sentiments) / len(sentiments)
            
            emotional_timeline.append({
                'date': state.recorded_at.isoformat(),
                'mood': state.mood,
                'intensity': state.intensity,
                'notes': state.notes,
                'related_session_id': related_session,
                'related_sentiment': related_sentiment
            })
        
        # Dominant themes from messages (simplified keyword extraction)
        dominant_themes = []
        if user_messages.exists():
            theme_keywords = {
                'тревога': ['тревож', 'беспоко', 'волную', 'страх', 'паник'],
                'грусть': ['груст', 'печал', 'плохо', 'подавлен'],
                'радость': ['рад', 'счастлив', 'хорошо', 'отлично', 'замечательно'],
                'гнев': ['зло', 'злой', 'раздражен', 'злюсь'],
                'спокойствие': ['спокоен', 'умиротворен', 'расслаблен'],
                'работа': ['работа', 'проект', 'задача', 'дедлайн'],
                'отношения': ['друг', 'семья', 'любов', 'отношен'],
                'здоровье': ['здоров', 'болезн', 'боль', 'симптом']
            }
            
            theme_counts = Counter()
            for msg in user_messages:
                content_lower = msg.content.lower()
                for theme, keywords in theme_keywords.items():
                    if any(keyword in content_lower for keyword in keywords):
                        theme_counts[theme] += 1
            
            dominant_themes = [{'theme': theme, 'count': count} 
                             for theme, count in theme_counts.most_common(5)]
        
        response_data = {
            'total_sessions': total_sessions,
            'total_messages': total_messages,
            'total_mood_entries': total_mood_entries,
            'total_cbt_completed': total_cbt_completed,
            'average_sentiment': avg_sentiment,
            'average_mood_intensity': avg_mood_intensity,
            'mood_distribution': mood_counts,
            'most_common_mood': most_common_mood,
            'risk_events': risk_events,
            'period_days': days,
            'is_premium': is_premium
        }
        
        # Premium features
        if is_premium:
            response_data.update({
                'sentiment_trend': sentiment_trend,
                'mood_trend': mood_trend,
                'mood_avg_intensity': mood_avg_intensity,
                'wellness_score': wellness_score,
                'correlation_data': correlation_data,
                'dominant_themes': dominant_themes,
                'emotional_timeline': emotional_timeline,
            })
        else:
            response_data['upgrade_message'] = 'Обновитесь до Премиум для доступа к расширенной аналитике'
        
        return Response(response_data)


class CrisisResourceViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for crisis resources"""
    serializer_class = CrisisResourceSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        return CrisisResource.objects.filter(is_active=True).order_by('-is_emergency', 'order')


# Authentication views
@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """User registration - rate limited to prevent abuse"""
    # SECURITY: Don't log sensitive data (passwords)
    logger.info(f'Registration attempt for email: {request.data.get("email", "unknown")}')
    # Rate limiting: 30 attempts per hour per IP (increased for testing)
    if RATELIMIT_AVAILABLE and is_ratelimited(request, group='register', key='ip', rate='30/h', increment=True):
        logger.warning(
            f'⚠ Rate limit exceeded for registration attempt from IP: {request.META.get("REMOTE_ADDR")}'
        )
        return Response(
            {'error': 'Too many registration attempts. Please try again later.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )
    
    try:
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()
                login(request, user)
                logger.info(f'✓ New user registered: {user.username} (ID: {user.id})')
                return Response({
                    'user': UserSerializer(user).data,
                    'message': 'Registration successful'
                }, status=status.HTTP_201_CREATED)
            except Exception as save_error:
                # Check if error is due to existing user (from serializer.create())
                error_str = str(save_error).lower()
                if 'уже зарегистрирован' in error_str or 'already exists' in error_str:
                    # User already exists - try to authenticate with provided credentials
                    email = request.data.get('email', '')
                    password = request.data.get('password', '')
                    
                    if email and password:
                        # Try to find user by email
                        try:
                            existing_user = User.objects.get(email=email)
                            # Verify password is correct
                            if existing_user.check_password(password):
                                # Password is correct - log them in
                                login(request, existing_user)
                                logger.info(f'✓ User logged in via registration (existing account): {existing_user.username} (ID: {existing_user.id})')
                                return Response({
                                    'user': UserSerializer(existing_user).data,
                                    'message': 'Account already exists. You have been logged in.'
                                }, status=status.HTTP_200_OK)
                        except User.DoesNotExist:
                            pass
                        except Exception as auth_error:
                            logger.warning(f'Error during auto-login attempt: {str(auth_error)}')
                
                # Re-raise the original error so it gets handled as validation error
                raise save_error
        
        # Check if validation failed due to existing user (from serializer errors)
        errors = serializer.errors
        error_messages = []
        for field, field_errors in errors.items():
            if isinstance(field_errors, list):
                error_messages.extend([str(err) for err in field_errors])
            else:
                error_messages.append(str(field_errors))
        
        # Check if any error mentions existing user
        has_existing_user_error = any('уже зарегистрирован' in msg.lower() or 'already exists' in msg.lower() for msg in error_messages)
        
        # If error indicates existing user, try to authenticate with provided credentials
        if has_existing_user_error:
            email = request.data.get('email', '')
            password = request.data.get('password', '')
            
            if email and password:
                # Try to find user by email
                try:
                    existing_user = User.objects.get(email=email)
                    # Verify password is correct
                    if existing_user.check_password(password):
                        # Password is correct - log them in
                        login(request, existing_user)
                        logger.info(f'✓ User logged in via registration (existing account): {existing_user.username} (ID: {existing_user.id})')
                        return Response({
                            'user': UserSerializer(existing_user).data,
                            'message': 'Account already exists. You have been logged in.'
                        }, status=status.HTTP_200_OK)
                except User.DoesNotExist:
                    pass
                except Exception as auth_error:
                    logger.warning(f'Error during auto-login attempt: {str(auth_error)}')
        
        # Log validation errors
        logger.warning(f'✗ Registration validation failed: {serializer.errors}')
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        # SECURITY: Don't expose internal error details in production
        logger.error(f'✗ Registration error: {str(e)}', exc_info=True)
        error_message = 'An error occurred during registration. Please try again later.'
        if settings.DEBUG:
            error_message = f'Registration error: {str(e)}'
        return Response({
            'error': error_message
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """User login - rate limited to prevent brute force attacks"""
    # SECURITY: Don't log sensitive data (passwords)
    logger.info(f'Login attempt for username/email: {request.data.get("username", "unknown")}')
    # Rate limiting: 60 attempts per minute per IP (increased for testing)
    if RATELIMIT_AVAILABLE and is_ratelimited(request, group='login', key='ip', rate='60/m', increment=True):
        logger.warning(
            f'Rate limit exceeded for login attempt from IP: {request.META.get("REMOTE_ADDR")}'
        )
        return Response(
            {'error': 'Too many login attempts. Please try again later.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )
    
    try:
        username = request.data.get('username', '').strip()
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'error': 'Username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f'Login attempt for username/email: {username}')

        # SECURITY: Removed hardcoded admin credentials - use create_admin management command instead
        # Try to authenticate with username first
        user = authenticate(request, username=username, password=password)
        logger.info(f'Direct auth attempt result: {user.username if user else "None"}')

        # If that fails, try finding user by email and authenticate with their username
        if user is None:
            try:
                # Try to find user by email
                user_by_email = User.objects.get(email=username)
                logger.info(f'Found user by email: {user_by_email.email}, username: {user_by_email.username}')

                # Try authenticating with the user's actual username
                user = authenticate(request, username=user_by_email.username, password=password)
                logger.info(f'Auth with username result: {user.username if user else "None"}')

                # If still None, try with email directly (in case username is set to email)
                if user is None:
                    user = authenticate(request, username=user_by_email.email, password=password)
                    logger.info(f'Auth with email as username result: {user.username if user else "None"}')

            except User.DoesNotExist:
                logger.warning(f'User not found by username or email: {username}')
                user = None
            except User.MultipleObjectsReturned:
                logger.error(f'Multiple users found with email: {username}')
                user = None
        
        if user is not None:
            # SECURITY: Regenerate session to prevent session fixation
            request.session.cycle_key()
            login(request, user)
            logger.info(f'✓ Successful login: {user.username} (ID: {user.id}) from IP: {request.META.get("REMOTE_ADDR")}')
            return Response({
                'user': UserSerializer(user).data,
                'message': 'Login successful'
            })
        else:
            # SECURITY: Generic error message to prevent user enumeration
            # Log failed login attempt with more details
            logger.warning(
                f'✗ Failed login attempt: {username} from IP: {request.META.get("REMOTE_ADDR")}'
            )
            # Use generic message to prevent user enumeration
            return Response(
                {'error': 'Invalid username or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )
    except Exception as e:
        logger.error(f'Login error: {str(e)}', exc_info=True)
        return Response({
            'error': 'An error occurred during login',
            'detail': str(e) if settings.DEBUG else 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """User logout"""
    logout(request)
    return Response({'message': 'Logout successful'})


@api_view(['GET'])
@permission_classes([AllowAny])
def current_user_view(request):
    """Get current authenticated user"""
    if not request.user.is_authenticated:
        return Response(None, status=status.HTTP_200_OK)
    return Response(UserSerializer(request.user).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def csrf_token_view(request):
    """Get CSRF token - Django sets it in cookie automatically"""
    # SECURITY: CSRF token endpoint is safe - it only returns the token
    # Django's CSRF middleware handles the actual token generation and validation
    # This endpoint is needed for frontend to get the token for API calls
    from django.middleware.csrf import get_token
    return Response({'csrfToken': get_token(request)})


# Subscription views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subscription_status_view(request):
    """Get current user's subscription status"""
    subscription = get_user_subscription(request.user)
    serializer = SubscriptionSerializer(subscription)
    limits = get_premium_feature_limits(request.user)
    return Response({
        'subscription': serializer.data,
        'limits': limits,
        'is_premium': subscription.is_premium
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upgrade_to_premium_view(request):
    """Upgrade user to premium subscription"""
    subscription = get_user_subscription(request.user)
    
    if subscription.is_premium:
        return Response({
            'message': 'У вас уже активна премиум подписка',
            'subscription': SubscriptionSerializer(subscription).data
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # SECURITY: Require payment verification
    payment_token = request.data.get('payment_token')
    payment_intent_id = request.data.get('payment_intent_id')
    
    # In production, verify payment with Stripe/Payment provider
    # For now, require payment_token to be provided
    if not payment_token and not payment_intent_id:
        return Response({
            'error': 'Payment verification required. Please provide payment_token or payment_intent_id.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # SECURITY: In production, verify payment with payment provider
    # For development/testing, check if payment_token is a valid test token
    is_test_mode = os.getenv('PAYMENT_TEST_MODE', 'True').lower() == 'true'
    if is_test_mode and payment_token == 'test_token_allow':
        # Allow test token only in test mode
        pass
    elif not is_test_mode:
        # In production, verify with payment provider (Stripe, etc.)
        # This is a placeholder - implement actual payment verification
        logger.warning(f'⚠ Payment verification not implemented for user {request.user.username}')
        return Response({
            'error': 'Payment verification not yet implemented. Please contact support.'
        }, status=status.HTTP_501_NOT_IMPLEMENTED)
    
    # Only activate premium after payment verification
    from datetime import timedelta
    subscription.tier = 'premium'
    subscription.is_active = True
    subscription.expires_at = timezone.now() + timedelta(days=30)
    subscription.cancel_at_period_end = False
    subscription.save()
    
    logger.info(f'✓ User {request.user.username} upgraded to premium')
    
    return Response({
        'message': 'Подписка успешно обновлена до Премиум',
        'subscription': SubscriptionSerializer(subscription).data,
        'limits': get_premium_feature_limits(request.user)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_subscription_view(request):
    """Cancel premium subscription (will expire at period end)"""
    subscription = get_user_subscription(request.user)
    
    if subscription.tier != 'premium':
        return Response({
            'error': 'У вас нет активной премиум подписки'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    subscription.cancel_at_period_end = True
    subscription.save()
    
    logger.info(f'✓ User {request.user.username} canceled premium subscription')
    
    return Response({
        'message': 'Подписка будет отменена в конце текущего периода',
        'subscription': SubscriptionSerializer(subscription).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def feature_limits_view(request):
    """Get feature limits for current user"""
    limits = get_premium_feature_limits(request.user)
    subscription = get_user_subscription(request.user)
    return Response({
        'limits': limits,
        'subscription_tier': subscription.tier,
        'is_premium': subscription.is_premium
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_account_view(request):
    """SECURITY: Delete user account and all associated data"""
    password = request.data.get('password')
    
    if not password:
        return Response(
            {'error': 'Password is required to delete account'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify password
    user = authenticate(request, username=request.user.username, password=password)
    if not user:
        logger.warning(f'⚠ Account deletion failed: incorrect password for user {request.user.username} from IP: {request.META.get("REMOTE_ADDR")}')
        return Response(
            {'error': 'Incorrect password'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Log account deletion
    logger.warning(f'⚠ Account deletion requested by user {request.user.username} (ID: {request.user.id}) from IP: {request.META.get("REMOTE_ADDR")}')
    
    # Delete user (this will cascade delete related data based on model CASCADE settings)
    username = request.user.username
    user_id = request.user.id
    request.user.delete()
    
    logger.warning(f'✓ Account deleted: {username} (ID: {user_id})')
    
    # Logout user
    logout(request)
    
    return Response({
        'message': 'Account deleted successfully'
    }, status=status.HTTP_200_OK)

