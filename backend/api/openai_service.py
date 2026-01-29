"""
OpenAI API integration for enhanced AI chat responses
Falls back to rule-based responses if API is unavailable
"""
import os
import requests
from typing import Optional, List, Dict
import json


class OpenAIService:
    """Service for OpenAI API integration"""
    
    def __init__(self):
        # Try to get API key from environment, but it's optional
        self.api_key = os.getenv('OPENAI_API_KEY', '')
        self.base_url = 'https://api.openai.com/v1/chat/completions'
        self.enabled = bool(self.api_key)
    
    def generate_response(
        self, 
        user_message: str, 
        conversation_history: List[Dict],
        sentiment: str,
        risk_level: int,
        context: Optional[Dict] = None
    ) -> Optional[str]:
        """
        Generate AI response using OpenAI API
        Returns None if API is unavailable or fails
        """
        if not self.enabled:
            return None
        
        try:
            # Build conversation context
            messages = [
                {
                    "role": "system",
                    "content": """Ты профессиональный психолог-консультант, работающий с русскоязычными клиентами. 
Твоя задача - оказывать поддержку, задавать уточняющие вопросы, давать конструктивные советы.
Будь эмпатичным, но профессиональным. Используй технику активного слушания.
Отвечай кратко и по делу (максимум 2-3 предложения).
Если видишь признаки кризисной ситуации (высокий уровень риска), проявляй больше заботы и предлагай обратиться за профессиональной помощью."""
                }
            ]
            
            # Add conversation history
            for msg in conversation_history[-5:]:  # Last 5 messages for context
                if msg.get('sender') == 'user':
                    messages.append({
                        "role": "user",
                        "content": msg.get('content', '')
                    })
                elif msg.get('sender') == 'therapist':
                    messages.append({
                        "role": "assistant",
                        "content": msg.get('content', '')
                    })
            
            # Add current message
            messages.append({
                "role": "user",
                "content": user_message
            })
            
            # Add context hints
            if context:
                context_hint = ""
                if risk_level >= 7:
                    context_hint += " [ВЫСОКИЙ РИСК - будь особенно внимателен]"
                if sentiment == 'negative':
                    context_hint += " [Клиент в негативном настроении]"
                if sentiment == 'positive':
                    context_hint += " [Клиент в позитивном настроении]"
                
                if context_hint:
                    messages[-1]["content"] += context_hint
            
            # Make API request
            response = requests.post(
                self.base_url,
                headers={
                    'Authorization': f'Bearer {self.api_key}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': 'gpt-3.5-turbo',
                    'messages': messages,
                    'temperature': 0.7,
                    'max_tokens': 200,
                },
                timeout=10  # 10 second timeout
            )
            
            if response.status_code == 200:
                data = response.json()
                ai_response = data.get('choices', [{}])[0].get('message', {}).get('content', '')
                if ai_response:
                    return ai_response.strip()
            
            return None
            
        except Exception as e:
            print(f"OpenAI API error: {e}")
            return None


# Global instance
openai_service = OpenAIService()

