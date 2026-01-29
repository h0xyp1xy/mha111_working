"""
Admin panel views for analytics and content management
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Avg, Q
from .models import (
    ConversationSession, Message, EmotionalState,
    CBTContent, CBTProgress, Analytics, CrisisResource
)
from .serializers import (
    CBTContentSerializer, CrisisResourceSerializer
)
from typing import Dict, List


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard(request):
    """Admin dashboard with comprehensive analytics"""
    days = int(request.query_params.get('days', 30))
    start_date = timezone.now() - timedelta(days=days)
    
    # User statistics
    total_users = User.objects.count()
    active_users = User.objects.filter(
        sessions__started_at__gte=start_date
    ).distinct().count()
    new_users = User.objects.filter(date_joined__gte=start_date).count()
    
    # Session statistics
    total_sessions = ConversationSession.objects.filter(started_at__gte=start_date).count()
    active_sessions = ConversationSession.objects.filter(is_active=True).count()
    
    # Calculate average session duration
    completed_sessions = ConversationSession.objects.filter(
        started_at__gte=start_date,
        ended_at__isnull=False
    )
    avg_duration_seconds = None
    if completed_sessions.exists():
        durations = []
        for session in completed_sessions:
            if session.ended_at:
                duration = (session.ended_at - session.started_at).total_seconds()
                durations.append(duration)
        if durations:
            avg_duration_seconds = sum(durations) / len(durations)
    
    # Message statistics
    total_messages = Message.objects.filter(created_at__gte=start_date).count()
    user_messages = Message.objects.filter(
        created_at__gte=start_date,
        sender='user'
    )
    avg_sentiment = user_messages.aggregate(
        avg=Avg('sentiment_score')
    )['avg'] or 0
    
    # Risk detection
    high_risk_messages = Message.objects.filter(
        created_at__gte=start_date,
        risk_level__gte=7
    ).count()
    crisis_users = User.objects.filter(
        messages__risk_level__gte=7,
        messages__created_at__gte=start_date
    ).distinct().count()
    
    # Emotional state statistics
    emotional_states = EmotionalState.objects.filter(recorded_at__gte=start_date)
    mood_distribution = emotional_states.values('mood').annotate(
        count=Count('id')
    ).order_by('-count')
    avg_intensity = emotional_states.aggregate(avg=Avg('intensity'))['avg'] or 0
    
    # CBT progress
    cbt_progress = CBTProgress.objects.filter(last_accessed__gte=start_date)
    completed_lessons = cbt_progress.filter(completed=True).count()
    total_progress = cbt_progress.count()
    
    # Daily activity (last 7 days)
    daily_activity = []
    for i in range(7):
        date = timezone.now() - timedelta(days=i)
        day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        daily_activity.append({
            'date': day_start.isoformat(),
            'sessions': ConversationSession.objects.filter(
                started_at__gte=day_start,
                started_at__lt=day_end
            ).count(),
            'messages': Message.objects.filter(
                created_at__gte=day_start,
                created_at__lt=day_end
            ).count(),
            'users': User.objects.filter(
                sessions__started_at__gte=day_start,
                sessions__started_at__lt=day_end
            ).distinct().count(),
        })
    
    daily_activity.reverse()  # Oldest to newest
    
    # User engagement ranking
    top_users = User.objects.annotate(
        session_count=Count('sessions', filter=Q(sessions__started_at__gte=start_date)),
        message_count=Count('messages', filter=Q(messages__created_at__gte=start_date)),
    ).order_by('-message_count')[:10]
    
    user_engagement = [
        {
            'username': user.username,
            'sessions': user.session_count,
            'messages': user.message_count,
            'email': user.email,
        }
        for user in top_users
    ]
    
    return Response({
        'overview': {
            'total_users': total_users,
            'active_users': active_users,
            'new_users': new_users,
            'total_sessions': total_sessions,
            'active_sessions': active_sessions,
            'avg_session_duration_minutes': round(avg_duration_seconds / 60, 1) if avg_duration_seconds else None,
            'total_messages': total_messages,
            'avg_sentiment': round(avg_sentiment, 3) if avg_sentiment else 0,
        },
        'risk_metrics': {
            'high_risk_messages': high_risk_messages,
            'crisis_users': crisis_users,
        },
        'emotional_metrics': {
            'mood_distribution': list(mood_distribution),
            'avg_intensity': avg_intensity,
            'total_entries': emotional_states.count(),
        },
        'cbt_metrics': {
            'completed_lessons': completed_lessons,
            'total_progress': total_progress,
        },
        'daily_activity': daily_activity,
        'user_engagement': user_engagement,
        'period_days': days,
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_user_analytics(request, user_id):
    """Detailed analytics for a specific user"""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    days = int(request.query_params.get('days', 30))
    start_date = timezone.now() - timedelta(days=days)
    
    # User sessions
    sessions = ConversationSession.objects.filter(
        user=user,
        started_at__gte=start_date
    )
    
    # Messages
    messages = Message.objects.filter(
        session__user=user,
        created_at__gte=start_date
    )
    
    # Emotional states
    emotional_states = EmotionalState.objects.filter(
        user=user,
        recorded_at__gte=start_date
    )
    
    # Risk analysis
    high_risk_messages = messages.filter(risk_level__gte=7)
    
    # Sentiment analysis
    user_messages = messages.filter(sender='user')
    sentiment_scores = [m.sentiment_score for m in user_messages if m.sentiment_score is not None]
    avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0
    
    # Timeline
    timeline = []
    for state in emotional_states.order_by('recorded_at'):
        timeline.append({
            'date': state.recorded_at.isoformat(),
            'mood': state.mood,
            'intensity': state.intensity,
        })
    
    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'date_joined': user.date_joined.isoformat(),
        },
        'statistics': {
            'total_sessions': sessions.count(),
            'total_messages': messages.count(),
            'total_emotional_states': emotional_states.count(),
            'avg_sentiment': avg_sentiment,
            'high_risk_count': high_risk_messages.count(),
        },
        'timeline': timeline,
        'risk_messages': [
            {
                'id': m.id,
                'content': m.content[:100],
                'risk_level': m.risk_level,
                'created_at': m.created_at.isoformat(),
            }
            for m in high_risk_messages.order_by('-created_at')[:10]
        ],
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def admin_cbt_content(request):
    """Manage CBT content"""
    if request.method == 'GET':
        content = CBTContent.objects.all().order_by('category', 'order')
        serializer = CBTContentSerializer(content, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = CBTContentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAdminUser])
def admin_cbt_content_detail(request, content_id):
    """Manage specific CBT content"""
    try:
        content = CBTContent.objects.get(id=content_id)
    except CBTContent.DoesNotExist:
        return Response({'error': 'Content not found'}, status=404)
    
    if request.method == 'GET':
        serializer = CBTContentSerializer(content)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = CBTContentSerializer(content, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    
    elif request.method == 'DELETE':
        content.delete()
        return Response({'message': 'Content deleted'}, status=204)


@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def admin_crisis_resources(request):
    """Manage crisis resources"""
    if request.method == 'GET':
        resources = CrisisResource.objects.all().order_by('is_emergency', 'order')
        serializer = CrisisResourceSerializer(resources, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = CrisisResourceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAdminUser])
def admin_crisis_resources_detail(request, resource_id):
    """Manage specific crisis resource"""
    try:
        resource = CrisisResource.objects.get(id=resource_id)
    except CrisisResource.DoesNotExist:
        return Response({'error': 'Resource not found'}, status=404)
    
    if request.method == 'GET':
        serializer = CrisisResourceSerializer(resource)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = CrisisResourceSerializer(resource, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    
    elif request.method == 'DELETE':
        resource.delete()
        return Response({'message': 'Resource deleted'}, status=204)

