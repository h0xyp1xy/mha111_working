"""
Mathematical model for AI psychologist responses
This will evolve into a full AI model in the future
"""
try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False
    # Fallback if numpy is not available
    class np:
        @staticmethod
        def mean(arr):
            return sum(arr) / len(arr) if arr else 0
        @staticmethod
        def std(arr):
            if len(arr) < 2:
                return 0
            mean_val = sum(arr) / len(arr)
            variance = sum((x - mean_val) ** 2 for x in arr) / len(arr)
            return variance ** 0.5

from typing import Dict, List, Optional, Tuple
from collections import defaultdict
from datetime import datetime, timedelta
import math
import random


class AIModel:
    """
    Base AI model for psychological analysis and response generation
    This model combines rule-based logic with statistical analysis
    """
    
    def __init__(self):
        self.mood_weights = {
            'very_happy': 0.9,
            'happy': 0.7,
            'calm': 0.6,
            'neutral': 0.5,
            'sad': -0.4,
            'anxious': -0.5,
            'angry': -0.6,
            'very_sad': -0.8,
        }
        
        self.risk_indicators = {
            'suicide': 10,
            'self_harm': 9,
            'hopelessness': 7,
            'isolation': 6,
            'extreme_anxiety': 8,
            'depression': 7,
        }
        
        self.topic_importance = {
            'work': 0.15,
            'relationships': 0.20,
            'health': 0.18,
            'anxiety': 0.17,
            'depression': 0.19,
            'sleep': 0.11,
        }
    
    def calculate_wellness_score(self, 
                                mood_history: List[Dict],
                                sentiment_scores: List[float],
                                risk_levels: List[int],
                                engagement_score: float) -> float:
        """
        Calculate comprehensive wellness score (0-100)
        
        Args:
            mood_history: List of mood entries with mood and intensity
            sentiment_scores: List of sentiment scores from messages
            risk_levels: List of risk levels
            engagement_score: Score based on session frequency
        
        Returns:
            Wellness score from 0 to 100
        """
        if not mood_history and not sentiment_scores:
            return 50.0  # Neutral baseline
        
        components = []
        
        # Mood component (0-40 points)
        if mood_history:
            mood_component = 0
            for entry in mood_history:
                mood = entry.get('mood', 'neutral')
                intensity = entry.get('intensity', 5)
                base_score = self.mood_weights.get(mood, 0) * 10
                weighted_score = base_score * (intensity / 10)
                mood_component += weighted_score
            
            mood_component = (mood_component / len(mood_history)) * 4  # Scale to 0-40
            mood_component = max(0, min(40, mood_component + 20))  # Shift to 0-40 range
            components.append(mood_component)
        
        # Sentiment component (0-30 points)
        if sentiment_scores:
            avg_sentiment = np.mean(sentiment_scores)
            sentiment_component = ((avg_sentiment + 1) / 2) * 30  # Convert -1 to 1 range to 0-30
            components.append(max(0, min(30, sentiment_component)))
        
        # Engagement component (0-20 points)
        components.append(max(0, min(20, engagement_score)))
        
        # Risk penalty
        if risk_levels:
            max_risk = max(risk_levels)
            risk_penalty = (max_risk / 10) * 20  # Up to 20 point penalty
        else:
            risk_penalty = 0
        
        # Progress component (0-10 points) - calculated separately
        progress_component = 10  # Placeholder, should be calculated from CBT progress
        
        total_score = sum(components) + progress_component - risk_penalty
        return max(0, min(100, total_score))
    
    def analyze_sentiment_trend(self, sentiment_scores: List[float], window_size: int = 5) -> Dict:
        """
        Analyze sentiment trends over time
        
        Returns:
            Dictionary with trend analysis
        """
        if len(sentiment_scores) < 2:
            return {
                'trend': 'stable',
                'slope': 0,
                'volatility': 0,
                'prediction': sentiment_scores[0] if sentiment_scores else 0
            }
        
        # Calculate moving average
        if len(sentiment_scores) >= window_size:
            recent = sentiment_scores[-window_size:]
            older = sentiment_scores[-window_size*2:-window_size] if len(sentiment_scores) >= window_size*2 else sentiment_scores[:-window_size]
        else:
            mid = len(sentiment_scores) // 2
            recent = sentiment_scores[mid:]
            older = sentiment_scores[:mid]
        
        recent_avg = np.mean(recent) if recent else 0
        older_avg = np.mean(older) if older else recent_avg
        
        # Calculate slope
        slope = recent_avg - older_avg
        
        # Calculate volatility (standard deviation)
        volatility = np.std(sentiment_scores) if len(sentiment_scores) > 1 else 0
        
        # Determine trend
        if slope > 0.1:
            trend = 'improving'
        elif slope < -0.1:
            trend = 'declining'
        else:
            trend = 'stable'
        
        # Simple prediction (linear extrapolation)
        prediction = recent_avg + slope * 0.5  # Predict half step ahead
        prediction = max(-1, min(1, prediction))
        
        return {
            'trend': trend,
            'slope': float(slope),
            'volatility': float(volatility),
            'prediction': float(prediction),
            'recent_avg': float(recent_avg),
            'older_avg': float(older_avg)
        }
    
    def detect_risk_patterns(self, messages: List[Dict], mood_history: List[Dict]) -> Dict:
        """
        Detect risk patterns in user behavior
        
        Returns:
            Dictionary with risk analysis
        """
        risk_score = 0
        risk_factors = []
        
        # Analyze message content for risk indicators
        for msg in messages:
            content = msg.get('content', '').lower()
            risk_level = msg.get('risk_level', 0)
            
            # Check for specific risk keywords
            for indicator, weight in self.risk_indicators.items():
                keywords = {
                    'suicide': ['суицид', 'покончить', 'убить себя', 'не хочу жить'],
                    'self_harm': ['навредить себе', 'порежу', 'самоповреждение'],
                    'hopelessness': ['безнадежно', 'нет смысла', 'все кончено'],
                    'isolation': ['одинок', 'никто не понимает', 'все отвернулись'],
                    'extreme_anxiety': ['паника', 'не могу дышать', 'сердце выпрыгивает'],
                    'depression': ['депрессия', 'нет сил', 'ничего не хочу'],
                }
                
                for keyword in keywords.get(indicator, []):
                    if keyword in content:
                        risk_score += weight
                        risk_factors.append(indicator)
                        break
        
        # Analyze mood trends
        if len(mood_history) >= 3:
            recent_moods = [m.get('mood') for m in mood_history[:3]]
            negative_count = sum(1 for m in recent_moods if self.mood_weights.get(m, 0) < 0)
            if negative_count >= 2:
                risk_score += 5
                risk_factors.append('persistent_negative_mood')
        
        # Normalize risk score
        normalized_risk = min(10, risk_score / 10)
        
        return {
            'risk_level': normalized_risk,
            'risk_factors': list(set(risk_factors)),
            'requires_attention': normalized_risk >= 7,
            'severity': 'high' if normalized_risk >= 8 else 'medium' if normalized_risk >= 5 else 'low'
        }
    
    def generate_response_priority(self, 
                                  current_sentiment: float,
                                  sentiment_trend: Dict,
                                  risk_analysis: Dict,
                                  conversation_length: int) -> str:
        """
        Determine response priority based on analysis
        
        Returns:
            Priority level: 'crisis', 'high', 'medium', 'low'
        """
        if risk_analysis.get('requires_attention', False):
            return 'crisis'
        
        if risk_analysis.get('risk_level', 0) >= 7:
            return 'high'
        
        if sentiment_trend.get('trend') == 'declining' and current_sentiment < -0.3:
            return 'high'
        
        if conversation_length < 3:
            return 'medium'  # Early in conversation
        
        return 'low'
    
    def calculate_topic_relevance(self, messages: List[Dict], topics: List[str]) -> Dict[str, float]:
        """
        Calculate relevance scores for different topics
        """
        topic_scores = defaultdict(float)
        
        for msg in messages:
            content = msg.get('content', '').lower()
            sentiment = msg.get('sentiment_score', 0)
            
            # Weight recent messages more
            weight = 1.0
            
            for topic in topics:
                # This is simplified - in real AI, would use embeddings
                topic_keywords = {
                    'work': ['работа', 'начальник', 'коллеги', 'проект', 'задача'],
                    'relationships': ['друг', 'семья', 'партнер', 'отношения'],
                    'health': ['здоров', 'болезн', 'боль', 'симптом'],
                    'anxiety': ['тревож', 'беспоко', 'страх', 'паник'],
                    'depression': ['груст', 'подавлен', 'нет сил', 'апати'],
                    'sleep': ['сон', 'сплю', 'бессонниц'],
                }
                
                keywords = topic_keywords.get(topic, [])
                matches = sum(1 for kw in keywords if kw in content)
                
                if matches > 0:
                    # Relevance = matches * sentiment_weight * importance_weight
                    relevance = matches * (1 + abs(sentiment)) * self.topic_importance.get(topic, 0.1) * weight
                    topic_scores[topic] += relevance
        
        # Normalize scores
        if topic_scores:
            max_score = max(topic_scores.values())
            if max_score > 0:
                topic_scores = {k: v / max_score for k, v in topic_scores.items()}
        
        return dict(topic_scores)
    
    def predict_user_needs(self, 
                          mood_history: List[Dict],
                          messages: List[Dict],
                          wellness_score: float) -> List[str]:
        """
        Predict what the user might need based on patterns
        """
        needs = []
        
        # Low wellness score
        if wellness_score < 40:
            needs.append('immediate_support')
            needs.append('crisis_resources')
        
        # Declining trend
        sentiment_scores = [m.get('sentiment_score', 0) for m in messages if m.get('sentiment_score')]
        if sentiment_scores:
            trend = self.analyze_sentiment_trend(sentiment_scores)
            if trend.get('trend') == 'declining':
                needs.append('intervention')
        
        # Sleep issues
        if any('сон' in m.get('content', '').lower() or 'sleep' in m.get('content', '').lower() for m in messages):
            needs.append('sleep_guidance')
        
        # Anxiety patterns
        anxiety_mentions = sum(1 for m in messages if any(kw in m.get('content', '').lower() for kw in ['тревож', 'беспоко', 'страх']))
        if anxiety_mentions >= 3:
            needs.append('anxiety_techniques')
        
        # Low engagement
        if len(messages) < 5 and wellness_score < 50:
            needs.append('engagement_boost')
        
        return needs


class AIModelResponseGenerator(AIModel):
    """
    Enhanced response generator using AI model predictions
    """
    
    def __init__(self):
        super().__init__()
        self.response_templates = {
            'crisis': [
                "Я очень обеспокоен тем, что вы сейчас чувствуете. Важно знать, что помощь доступна, и вы не одни.",
                "Понимаю, что вам сейчас очень тяжело. Давайте обсудим, как мы можем помочь вам прямо сейчас.",
            ],
            'high_priority': [
                "Я вижу, что вам сейчас непросто. Это нормально просить о помощи, и я здесь, чтобы поддержать вас.",
                "Ваши чувства важны. Давайте вместе разберемся, что можно сделать, чтобы улучшить ситуацию.",
            ],
            'improving': [
                "Замечаю, что у вас становится лучше. Это отличный прогресс! Что помогает вам чувствовать себя лучше?",
                "Приятно видеть позитивные изменения. Продолжайте в том же духе!",
            ],
            'declining': [
                "Я замечаю, что вам становится тяжелее. Это важный момент для обсуждения. Расскажите, что изменилось?",
                "Понимаю, что ситуация усложняется. Давайте поговорим о том, как мы можем помочь.",
            ],
        }
    
    def generate_contextual_response(self,
                                    user_message: str,
                                    context: Dict) -> str:
        """
        Generate response using AI model analysis
        """
        try:
            priority = context.get('priority', 'medium')
            trend = context.get('sentiment_trend', {})
            if isinstance(trend, dict):
                trend_type = trend.get('trend', 'stable')
            else:
                trend_type = 'stable'
            risk = context.get('risk_analysis', {})
            topic_relevance = context.get('topic_relevance', {})
            
            # Select template based on priority
            if priority == 'crisis':
                templates = self.response_templates.get('crisis', ["Я понимаю, что тебе сейчас трудно. Я здесь, чтобы помочь."])
                base_response = templates[0] if templates else "Я понимаю, что тебе сейчас трудно. Я здесь, чтобы помочь."
            elif priority == 'high':
                templates = self.response_templates.get('high_priority', ["Я вижу, что тебе сейчас непросто. Я здесь, чтобы поддержать тебя."])
                base_response = templates[0] if templates else "Я вижу, что тебе сейчас непросто. Я здесь, чтобы поддержать тебя."
            elif trend_type == 'improving':
                templates = self.response_templates.get('improving', ["Замечаю, что у тебя становится лучше. Продолжай в том же духе!"])
                base_response = templates[0] if templates else "Замечаю, что у тебя становится лучше. Продолжай в том же духе!"
            elif trend_type == 'declining':
                templates = self.response_templates.get('declining', ["Я замечаю, что тебе становится тяжелее. Это важно обсудить."])
                base_response = templates[0] if templates else "Я замечаю, что тебе становится тяжелее. Это важно обсудить."
            else:
                base_response = "Расскажи мне больше о том, что происходит."
            
            # Add topic-specific guidance
            if topic_relevance and len(topic_relevance) > 0:
                try:
                    top_topic = max(topic_relevance.items(), key=lambda x: x[1])
                    if top_topic[1] > 0.5:
                        topic_guidance = self._get_topic_guidance(top_topic[0])
                        if topic_guidance:
                            base_response += f" {topic_guidance}"
                except Exception:
                    pass  # Continue without topic guidance if error
            
            return base_response
        except Exception as e:
            print(f"Error in generate_contextual_response: {e}")
            return "Расскажи мне больше о том, что происходит. Я здесь, чтобы помочь."
    
    def _get_topic_guidance(self, topic: str) -> Optional[str]:
        """Get topic-specific guidance"""
        guidance = {
            'work': "Рабочий стресс может быть очень тяжелым. Давайте обсудим техники управления стрессом.",
            'relationships': "Отношения с близкими могут вызывать сильные эмоции. Расскажите подробнее.",
            'anxiety': "Тревога - это нормальная реакция. Есть техники, которые могут помочь снизить её.",
            'depression': "Депрессия - серьезное состояние, и важно работать над её преодолением.",
            'sleep': "Проблемы со сном могут влиять на все аспекты жизни. Давайте обсудим это.",
        }
        return guidance.get(topic)

