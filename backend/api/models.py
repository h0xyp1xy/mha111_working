from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class ConversationSession(models.Model):
    """Represents a therapeutic conversation session"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-started_at']
    
    def __str__(self):
        return f"Session {self.id} - {self.user.username}"


class Message(models.Model):
    """Individual messages in a conversation"""
    SENDER_CHOICES = [
        ('user', 'User'),
        ('therapist', 'Therapist'),
    ]
    
    session = models.ForeignKey(ConversationSession, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    content = models.TextField()
    sentiment_score = models.FloatField(null=True, blank=True)  # -1 to 1
    sentiment_label = models.CharField(max_length=20, null=True, blank=True)  # positive, negative, neutral
    risk_level = models.IntegerField(default=0)  # 0-10, 10 being highest risk
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.sender}: {self.content[:50]}..."


class EmotionalState(models.Model):
    """Tracks user's emotional state at different points"""
    MOOD_CHOICES = [
        ('very_happy', 'Very Happy'),
        ('happy', 'Happy'),
        ('neutral', 'Neutral'),
        ('sad', 'Sad'),
        ('very_sad', 'Very Sad'),
        ('anxious', 'Anxious'),
        ('angry', 'Angry'),
        ('calm', 'Calm'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='emotional_states', null=True, blank=True)
    session = models.ForeignKey(ConversationSession, on_delete=models.CASCADE, related_name='emotional_states', null=True, blank=True)
    mood = models.CharField(max_length=20, choices=MOOD_CHOICES)
    intensity = models.IntegerField(default=5)  # 1-10
    notes = models.TextField(blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-recorded_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.mood} ({self.intensity}/10)"


class CBTContent(models.Model):
    """CBT library content"""
    CATEGORY_CHOICES = [
        ('foundations', 'CBT Foundations'),
        ('techniques', 'Therapeutic Techniques'),
        ('conditions', 'Condition-Specific Modules'),
        ('exercises', 'Interactive Exercises'),
    ]
    
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    content = models.TextField()
    audio_url = models.URLField(blank=True, null=True)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='lessons')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['category', 'order']
    
    def __str__(self):
        return self.title


class CBTProgress(models.Model):
    """Tracks user progress through CBT content"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cbt_progress')
    content = models.ForeignKey(CBTContent, on_delete=models.CASCADE, related_name='progress_records')
    completed = models.BooleanField(default=False)
    progress_percentage = models.IntegerField(default=0)
    last_accessed = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['user', 'content']
    
    def __str__(self):
        return f"{self.user.username} - {self.content.title} ({self.progress_percentage}%)"


class Analytics(models.Model):
    """Stores analytics data for dashboard"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analytics')
    date = models.DateField(default=timezone.now)
    total_sessions = models.IntegerField(default=0)
    total_messages = models.IntegerField(default=0)
    average_sentiment = models.FloatField(null=True, blank=True)
    dominant_themes = models.JSONField(default=list)
    risk_events = models.IntegerField(default=0)
    
    class Meta:
        unique_together = ['user', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.user.username} - {self.date}"


class CrisisResource(models.Model):
    """Emergency resources and crisis support information"""
    title = models.CharField(max_length=200)
    description = models.TextField()
    phone_number = models.CharField(max_length=20, blank=True)
    website_url = models.URLField(blank=True)
    is_emergency = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['is_emergency', 'order']
    
    def __str__(self):
        return self.title


class Subscription(models.Model):
    """User subscription model"""
    SUBSCRIPTION_TIERS = [
        ('free', 'Free'),
        ('premium', 'Premium'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='subscription')
    tier = models.CharField(max_length=20, choices=SUBSCRIPTION_TIERS, default='free')
    stripe_subscription_id = models.CharField(max_length=200, blank=True, null=True)
    stripe_customer_id = models.CharField(max_length=200, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    started_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    cancel_at_period_end = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.tier}"
    
    @property
    def is_premium(self):
        """Check if subscription is premium and active"""
        if self.tier == 'premium' and self.is_active:
            if self.expires_at is None:
                return True
            return timezone.now() < self.expires_at
        return False
    
    @property
    def is_expired(self):
        """Check if subscription is expired"""
        if self.expires_at is None:
            return False
        return timezone.now() >= self.expires_at



