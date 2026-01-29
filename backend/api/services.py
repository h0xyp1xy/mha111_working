"""
Service layer for sentiment analysis and risk detection
"""
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import re
from typing import Dict, Tuple, List, Optional
from collections import defaultdict
import math
import random
from .ai_model import AIModelResponseGenerator
try:
    from .openai_service import openai_service
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


class SentimentAnalyzer:
    """Analyzes sentiment and detects risk in user input"""
    
    def __init__(self):
        self.analyzer = SentimentIntensityAnalyzer()
        self.risk_keywords = [
            # English
            'suicide', 'kill myself', 'end my life', 'want to die',
            'hurt myself', 'self harm', 'no reason to live',
            'better off dead', 'give up', 'hopeless',
            # Russian
            'суицид', 'покончить', 'убить себя', 'не хочу жить',
            'лучше умереть', 'нет смысла', 'безнадежно',
            'навредить себе', 'все кончено', 'все безнадежно',
            'сдаюсь', 'не выдержу', 'больше не могу'
        ]
    
    def analyze(self, text: str) -> Dict:
        """Analyze sentiment and risk level from text"""
        # Get sentiment scores
        scores = self.analyzer.polarity_scores(text)
        compound = scores['compound']
        
        # Determine sentiment label
        if compound >= 0.05:
            sentiment_label = 'positive'
        elif compound <= -0.05:
            sentiment_label = 'negative'
        else:
            sentiment_label = 'neutral'
        
        # Calculate risk level
        risk_level = self._calculate_risk(text, compound)
        
        return {
            'sentiment_score': compound,
            'sentiment_label': sentiment_label,
            'risk_level': risk_level,
            'scores': scores
        }
    
    def _calculate_risk(self, text: str, sentiment_score: float) -> int:
        """Calculate risk level from 0-10"""
        risk = 0
        text_lower = text.lower()
        
        # Check for risk keywords
        for keyword in self.risk_keywords:
            if keyword in text_lower:
                risk += 3
        
        # Adjust based on sentiment
        if sentiment_score < -0.5:
            risk += 2
        elif sentiment_score < -0.3:
            risk += 1
        
        # Check for intensity words
        intensity_words = ['very', 'extremely', 'completely', 'totally', 'absolutely']
        for word in intensity_words:
            if word in text_lower:
                risk += 1
        
        return min(risk, 10)


class TherapistResponseGenerator(AIModelResponseGenerator):
    """Generates empathetic therapist responses based on context and history"""
    
    def __init__(self):
        super().__init__()
        self.responses = {
            'greeting': [
                "Привет, как ты себя чувствуешь сегодня?",
                "Здравствуй! Расскажи, что у тебя на душе?",
                "Привет! Как дела? Чем могу помочь?",
            ],
            'positive': [
                "Отлично! Это здорово слышать. Расскажи мне, что помогло тебе почувствовать себя лучше?",
                "Рад это слышать! Что происходит в твоей жизни, что дарит тебе такие хорошие эмоции?",
                "Прекрасно! Вижу, что у тебя всё складывается хорошо. Хочешь поделиться, чем именно?",
                "Это замечательно! Расскажи больше о том, что вызывает у тебя такие позитивные эмоции.",
            ],
            'negative': [
                "Понимаю, что тебе непросто. Ты можешь рассказать мне подробнее, что именно тебя беспокоит?",
                "Я здесь, чтобы выслушать и помочь. Что происходит? Что именно вызывает у тебя такие чувства?",
                "Важно, что ты делишься своими переживаниями. Расскажи мне больше - что случилось?",
                "Вижу, что тебе тяжело. Давай разберемся вместе. Что именно вызывает у тебя негативные эмоции?",
            ],
            'neutral': [
                "Расскажи мне, как дела? Как ты себя чувствуешь сегодня?",
                "Привет! Как настроение? Что происходит в твоей жизни?",
                "Здравствуй! Расскажи, как проходит твой день? Что на душе?",
                "Давай начнем наш разговор. Как ты себя чувствуешь? Что тебя беспокоит или радует?",
            ],
            'assessment': [
                "Спасибо за то, что поделился своими ответами. Я вижу, что ты уделяешь внимание своему состоянию - это важно.",
                "Я проанализировал твои ответы. Давай обсудим, что мы можем улучшить.",
                "Понял твою ситуацию. Давай поговорим о том, как я могу тебе помочь.",
            ],
            'encouraging': [
                "Ты делаешь важную работу, делясь своими чувствами.",
                "Я горжусь тобой за то, что ты открываешься.",
                "Ты не один в этом. Я здесь, чтобы поддержать тебя.",
                "Каждый шаг к самопониманию - это прогресс.",
            ],
            'crisis': [
                "Я понимаю, что ты переживаешь очень трудные времена. Важно помнить, что помощь доступна.",
                "Твои чувства важны, и я здесь, чтобы помочь. Давай обсудим, что происходит.",
                "Я вижу, что тебе нужна поддержка. Ты не один. Давай поговорим о том, как помочь тебе сейчас.",
            ],
            'follow_up': [
                "Расскажи мне больше об этом.",
                "Это интересно. Продолжай.",
                "Я слушаю. Что еще ты хочешь сказать?",
                "Понятно. А что ты об этом думаешь?",
            ],
        }
        
        # Keywords for topic detection
        self.topic_keywords = {
            'work': ['работа', 'работе', 'начальник', 'коллеги', 'проект', 'задача', 'дедлайн', 'офис'],
            'relationships': ['друг', 'друзья', 'семья', 'родители', 'партнер', 'отношения', 'любовь', 'расставание'],
            'anxiety': ['тревож', 'беспоко', 'страх', 'паник', 'волную', 'нервнича', 'боюсь'],
            'depression': ['груст', 'подавлен', 'плохо', 'нет сил', 'ничего не хочу', 'устал', 'апати'],
            'health': ['здоров', 'болезн', 'боль', 'симптом', 'врач', 'лечени'],
            'sleep': ['сон', 'сплю', 'бессонниц', 'не могу уснуть', 'усталость'],
            'self_esteem': ['неуверен', 'не нравлюсь', 'недостоин', 'ничего не получается', 'неудач'],
        }
    
    def _analyze_topic(self, text: str) -> Optional[str]:
        """Detect main topic in the text"""
        text_lower = text.lower()
        topic_scores = defaultdict(int)
        
        for topic, keywords in self.topic_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    topic_scores[topic] += 1
        
        if topic_scores:
            return max(topic_scores.items(), key=lambda x: x[1])[0]
        return None
    
    def _analyze_conversation_history(self, messages: List[Dict]) -> Dict:
        """Analyze conversation history to understand context"""
        if not messages:
            return {
                'avg_sentiment': 0,
                'sentiment_trend': 0,
                'dominant_topics': [],
                'conversation_length': 0,
                'risk_history': [],
            }
        
        user_messages = [m for m in messages if m.get('sender') == 'user']
        sentiment_scores = [m.get('sentiment_score', 0) for m in user_messages if m.get('sentiment_score') is not None]
        risk_levels = [m.get('risk_level', 0) for m in user_messages]
        
        # Calculate average sentiment
        avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0
        
        # Calculate sentiment trend (comparing last half to first half)
        if len(sentiment_scores) >= 4:
            mid = len(sentiment_scores) // 2
            early_avg = sum(sentiment_scores[:mid]) / mid
            late_avg = sum(sentiment_scores[mid:]) / len(sentiment_scores[mid:])
            sentiment_trend = late_avg - early_avg
        else:
            sentiment_trend = 0
        
        # Detect dominant topics
        topic_counts = defaultdict(int)
        for msg in user_messages:
            topic = self._analyze_topic(msg.get('content', ''))
            if topic:
                topic_counts[topic] += 1
        
        dominant_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        
        return {
            'avg_sentiment': avg_sentiment,
            'sentiment_trend': sentiment_trend,
            'dominant_topics': [t[0] for t in dominant_topics],
            'conversation_length': len(user_messages),
            'risk_history': risk_levels,
            'last_risk_level': risk_levels[-1] if risk_levels else 0,
        }
    
    def _generate_contextual_response(self, user_message: str, sentiment: str, risk_level: int, 
                                     history_context: Dict, is_assessment: bool = False) -> str:
        """Generate response based on context and history"""
        
        # Crisis/high risk response
        if risk_level >= 7:
            return self.responses['crisis'][0] + " Хочешь поговорить о том, что тебя беспокоит?"
        
        # Assessment response
        if is_assessment:
            response = "Спасибо за твои ответы! Я внимательно их изучил. "
            
            # Check if there are "other" answers that need follow-up
            if 'ВАЖНО:' in user_message and 'Другое:' in user_message:
                response += "Вижу, что ты выбрал 'Другое' в некоторых вопросах. Это интересно! Давай обсудим это подробнее в нашем разговоре - я задам несколько уточняющих вопросов. "
            
            # Analyze answers to create a work plan
            # Extract key information from assessment
            topics_detected = []
            if 'работа' in user_message.lower() or 'work' in user_message.lower():
                topics_detected.append('работа')
            if 'тревож' in user_message.lower() or 'anxiety' in user_message.lower():
                topics_detected.append('тревога')
            if 'плохо' in user_message.lower() or 'груст' in user_message.lower() or 'плохо' in user_message.lower():
                topics_detected.append('настроение')
            if 'сон' in user_message.lower() or 'sleep' in user_message.lower():
                topics_detected.append('сон')
            
            # Add personalized insight based on sentiment
            if sentiment == 'negative':
                response += "Я вижу, что тебе сейчас непросто. Это нормально просить о помощи, и ты уже сделал важный шаг."
            elif sentiment == 'positive':
                response += "Приятно видеть, что ты в хорошем настроении."
            
            # Create personalized work plan
            if topics_detected:
                response += f" На основе твоих ответов я вижу, что стоит обратить внимание на: {', '.join(topics_detected)}. "
            
            # Add topic-specific advice if detected with lesson recommendations
            topic = self._analyze_topic(user_message)
            if topic == 'anxiety':
                response += "Если ты чувствуешь тревогу, рекомендую пройти курс в разделе 'Практики' → 'Модули по состояниям'. Там есть специальные техники для снижения тревоги."
            elif topic == 'depression':
                response += "Если тебе тяжело, важно знать, что это временно. Начни с основ CBT в разделе 'Практики' → 'Основы CBT' - это поможет справиться с депрессией."
            elif topic == 'sleep':
                response += "Проблемы со сном могут влиять на все аспекты жизни. Посмотри 'Практики' → 'Модули по состояниям' для техник улучшения сна."
            else:
                response += "Рекомендую изучить материалы в разделе 'Практики' - там много полезных техник для работы над собой."
            
            response += " Теперь давай начнем наш разговор - я готов задать уточняющие вопросы и составить для тебя индивидуальный план работы. Что бы ты хотел обсудить в первую очередь?"
            
            return response
        
        # Regular conversation response based on sentiment
        if sentiment == 'positive':
            base_response = random.choice(self.responses['positive'])
            
            # If positive trend, encourage continuation
            sentiment_trend_val = history_context.get('sentiment_trend', {})
            if isinstance(sentiment_trend_val, dict):
                trend_val = sentiment_trend_val.get('trend') == 'improving' or sentiment_trend_val.get('slope', 0) > 0.1
            else:
                trend_val = sentiment_trend_val > 0.1 if isinstance(sentiment_trend_val, (int, float)) else False
            
            if trend_val:
                base_response += " Замечаю, что у тебя становится лучше. Продолжай в том же духе!"
            
            return base_response
        
        elif sentiment == 'negative':
            base_response = random.choice(self.responses['negative'])
            
            # If negative trend, show more concern
            sentiment_trend_val = history_context.get('sentiment_trend', {})
            if isinstance(sentiment_trend_val, dict):
                trend_val = sentiment_trend_val.get('trend') == 'declining' or sentiment_trend_val.get('slope', 0) < -0.1
            else:
                trend_val = sentiment_trend_val < -0.1 if isinstance(sentiment_trend_val, (int, float)) else False
            
            if trend_val:
                base_response += " Я замечаю, что тебе становится тяжелее. Это важно обсудить."
            
            # Add topic-specific empathy and lesson recommendations
            topic = self._analyze_topic(user_message)
            if topic == 'work':
                base_response += " Рабочий стресс действительно может быть очень тяжелым и выматывающим. Я понимаю, как это может давить. Есть техники, которые помогают справляться с такими ситуациями - посмотри в разделе 'Практики' → 'Техники терапии', там найдешь упражнения по управлению стрессом."
            elif topic == 'relationships':
                base_response += " Отношения с близкими людьми действительно могут вызывать очень сильные и противоречивые эмоции. Это нормально. Расскажи, что именно происходит? А пока можешь посмотреть техники для работы с эмоциями в разделе 'Практики'."
            elif topic == 'anxiety':
                base_response += " Тревога - это нормальная реакция, но когда она становится слишком сильной, с ней нужно работать. Ты не один в этом. В разделе 'Практики' → 'Модули по состояниям' есть специальные упражнения для работы с тревогой, которые могут помочь."
            elif topic == 'depression':
                base_response += " Депрессия - это серьезное состояние, но важно помнить, что с ней можно работать и становится лучше. Я вижу, что тебе тяжело. В разделе 'Практики' есть модули, которые помогут справиться с этим. Начни с основ CBT - это может дать хорошие результаты."
            elif topic == 'sleep':
                base_response += " Проблемы со сном действительно могут влиять на все аспекты жизни - настроение, энергию, концентрацию. Это серьезная проблема. Давай обсудим, что происходит. А еще посмотри в 'Практики' → 'Модули по состояниям' - там есть техники для улучшения сна."
            elif topic == 'self_esteem':
                base_response += " Низкая самооценка может сильно влиять на нашу жизнь. Важно понимать, что ты достоин хорошего отношения, в том числе и к себе. Давай обсудим это подробнее. В разделе 'Практики' есть материалы, которые могут помочь с этим."
            
            return base_response
        
        else:  # neutral
            # If conversation is starting, ask open question
            if history_context.get('conversation_length', 0) <= 2:
                return random.choice(self.responses['neutral'])
            
            # If longer conversation, show follow-up
            topic = self._analyze_topic(user_message)
            if topic:
                return random.choice(self.responses['follow_up']) + f" Это важная тема для обсуждения."
            
            return random.choice(self.responses['neutral'])
    
    def generate_response(self, user_message: str, sentiment: str, risk_level: int, 
                         conversation_history: Optional[List[Dict]] = None, 
                         is_assessment: bool = False) -> str:
        """Generate appropriate therapist response based on context"""
        try:
            # Analyze conversation history
            history_context = self._analyze_conversation_history(conversation_history or [])
            
            # Try OpenAI API first if available
            if OPENAI_AVAILABLE and openai_service.enabled:
                try:
                    ai_response = openai_service.generate_response(
                        user_message,
                        conversation_history or [],
                        sentiment,
                        risk_level,
                        history_context
                    )
                    if ai_response:
                        return ai_response
                except Exception as e:
                    print(f"OpenAI API error, falling back to rule-based: {e}")
            
            # Use AI model for enhanced analysis
            sentiment_scores = [m.get('sentiment_score', 0) for m in conversation_history or [] 
                              if m.get('sender') == 'user' and m.get('sentiment_score') is not None]
            mood_history = []  # Will be populated from EmotionalState if needed
            
            # Try to use AI model for enhanced analysis
            try:
                # Analyze sentiment trend using AI model
                if sentiment_scores:
                    trend = self.analyze_sentiment_trend(sentiment_scores)
                    history_context['sentiment_trend'] = trend
                
                # Detect risk patterns using AI model
                risk_analysis = self.detect_risk_patterns(conversation_history or [], mood_history)
                history_context['risk_analysis'] = risk_analysis
                
                # Calculate priority
                sentiment_trend_dict = history_context.get('sentiment_trend', {}) if isinstance(history_context.get('sentiment_trend'), dict) else {'trend': 'stable'}
                priority = self.generate_response_priority(
                    float(history_context.get('avg_sentiment', 0)),
                    sentiment_trend_dict,
                    risk_analysis,
                    history_context.get('conversation_length', 0)
                )
                history_context['priority'] = priority
                
                # Calculate topic relevance
                topics = ['work', 'relationships', 'health', 'anxiety', 'depression', 'sleep']
                topic_relevance = self.calculate_topic_relevance(conversation_history or [], topics)
                history_context['topic_relevance'] = topic_relevance
                
                # Use AI model for response generation if conversation is long enough
                if len(conversation_history or []) > 3:
                    try:
                        response = self.generate_contextual_response(user_message, history_context)
                        if response and len(response.strip()) > 0:
                            return response
                    except Exception as e:
                        print(f"Error in AI contextual response: {e}")
                        pass  # Fallback to original method
            except Exception as e:
                print(f"Error in AI model analysis: {e}")
                # Continue with fallback method
            
            # Generate contextual response (fallback - always works)
            response = self._generate_contextual_response(
                user_message, sentiment, risk_level, history_context, is_assessment
            )
            
            # Ensure response is not empty and has proper length
            if not response or len(response.strip()) < 10:
                # Very short fallback
                if sentiment == 'positive':
                    response = "Отлично! Расскажи мне больше об этом."
                elif sentiment == 'negative':
                    response = "Понимаю. Расскажи подробнее, что тебя беспокоит?"
                else:
                    response = "Понял тебя. Что еще ты хотел бы обсудить?"
            
            return response
            
        except Exception as e:
            print(f"Error in generate_response: {e}")
            # Ultimate fallback - simple response based on sentiment
            if risk_level >= 7:
                return self.responses.get('crisis', ['Я понимаю, что тебе сейчас трудно. Я здесь, чтобы помочь.'])[0]
            elif sentiment == 'positive':
                return self.responses.get('positive', ['Это замечательно! Расскажи мне больше.'])[0]
            elif sentiment == 'negative':
                return self.responses.get('negative', ['Понимаю тебя. Расскажи мне больше об этом.'])[0]
            else:
                return self.responses.get('neutral', ['Расскажи мне больше о том, что происходит.'])[0]
    
    def generate_session_summary(self, conversation_history: List[Dict]) -> str:
        """Generate a summary of the conversation session"""
        if not conversation_history:
            return "Сессия завершена. Данные сохранены."
        
        # Analyze conversation
        history_context = self._analyze_conversation_history(conversation_history)
        
        # Calculate key metrics
        total_messages = len(conversation_history)
        user_messages = [m for m in conversation_history if m.get('sender') == 'user']
        avg_sentiment = history_context.get('avg_sentiment', 0)
        avg_risk = sum(m.get('risk_level', 0) for m in user_messages) / len(user_messages) if user_messages else 0
        
        # Generate summary text
        summary_parts = [
            f"Сессия завершена. Всего сообщений: {total_messages}.",
        ]
        
        if avg_sentiment > 0.1:
            summary_parts.append("Общий эмоциональный тон: положительный.")
        elif avg_sentiment < -0.1:
            summary_parts.append("Общий эмоциональный тон: требует внимания.")
        else:
            summary_parts.append("Общий эмоциональный тон: нейтральный.")
        
        if avg_risk >= 7:
            summary_parts.append("Обнаружены признаки повышенного риска. Рекомендуется обратиться к специалисту.")
        elif avg_risk >= 4:
            summary_parts.append("Замечены некоторые тревожные сигналы. Продолжайте работу над собой.")
        else:
            summary_parts.append("Уровень риска в норме.")
        
        # Add topic information
        dominant_topics = history_context.get('dominant_topics', [])
        if dominant_topics:
            topic_names = {
                'work': 'работа',
                'relationships': 'отношения',
                'anxiety': 'тревога',
                'depression': 'депрессия',
                'health': 'здоровье',
                'sleep': 'сон',
                'self_esteem': 'самооценка'
            }
            topics_str = ', '.join([topic_names.get(t, t) for t in dominant_topics[:3]])
            summary_parts.append(f"Основные темы обсуждения: {topics_str}.")
        
        summary_parts.append("Все данные сохранены и отражены в разделе 'Мой прогресс'.")
        
        return " ".join(summary_parts)

