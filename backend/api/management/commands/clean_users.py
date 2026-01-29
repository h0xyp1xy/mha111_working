"""
Management command to clean all users except admin.
Usage: python manage.py clean_users
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import (
    ConversationSession, Message, EmotionalState,
    CBTProgress, Analytics
)


class Command(BaseCommand):
    help = 'Delete all users except admin and their related data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--keep-admin',
            action='store_true',
            help='Keep admin user (default: True)',
        )

    def handle(self, *args, **options):
        keep_admin = options.get('keep_admin', True)
        
        # Get admin user if exists
        admin_user = None
        if keep_admin:
            try:
                admin_user = User.objects.get(username='admin')
                self.stdout.write(self.style.SUCCESS(f'✓ Admin user found: {admin_user.username}'))
            except User.DoesNotExist:
                self.stdout.write(self.style.WARNING('⚠ Admin user does not exist'))

        # Count users to delete
        users_to_delete = User.objects.exclude(username='admin') if keep_admin else User.objects.all()
        user_count = users_to_delete.count()
        
        if user_count == 0:
            self.stdout.write(self.style.SUCCESS('✓ No users to delete'))
            return

        self.stdout.write(self.style.WARNING(f'⚠ Found {user_count} user(s) to delete'))
        
        # Delete related data
        deleted_data = {
            'sessions': 0,
            'messages': 0,
            'emotional_states': 0,
            'cbt_progress': 0,
            'analytics': 0,
        }

        for user in users_to_delete:
            # Delete related data
            sessions = ConversationSession.objects.filter(user=user)
            session_count = sessions.count()
            deleted_data['sessions'] += session_count
            
            messages_count = Message.objects.filter(session__user=user).count()
            deleted_data['messages'] += messages_count
            Message.objects.filter(session__user=user).delete()
            sessions.delete()
            
            deleted_data['emotional_states'] += EmotionalState.objects.filter(user=user).delete()[0]
            deleted_data['cbt_progress'] += CBTProgress.objects.filter(user=user).delete()[0]
            deleted_data['analytics'] += Analytics.objects.filter(user=user).delete()[0]
            
            # Delete user
            user.delete()

        # Summary
        self.stdout.write(self.style.SUCCESS(f'\n✓ Successfully deleted {user_count} user(s)'))
        self.stdout.write(self.style.SUCCESS(f'  - Sessions: {deleted_data["sessions"]}'))
        self.stdout.write(self.style.SUCCESS(f'  - Messages: {deleted_data["messages"]}'))
        self.stdout.write(self.style.SUCCESS(f'  - Emotional States: {deleted_data["emotional_states"]}'))
        self.stdout.write(self.style.SUCCESS(f'  - CBT Progress: {deleted_data["cbt_progress"]}'))
        self.stdout.write(self.style.SUCCESS(f'  - Analytics: {deleted_data["analytics"]}'))
        
        if keep_admin and admin_user:
            self.stdout.write(self.style.SUCCESS(f'\n✓ Admin user preserved: {admin_user.username}'))

