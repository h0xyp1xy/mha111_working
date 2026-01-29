from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Subscription


class Command(BaseCommand):
    help = 'Create free subscriptions for all users without subscriptions'

    def handle(self, *args, **options):
        users_without_subscription = User.objects.filter(subscription__isnull=True)
        count = 0
        
        for user in users_without_subscription:
            Subscription.objects.create(
                user=user,
                tier='free',
                is_active=True
            )
            count += 1
            self.stdout.write(self.style.SUCCESS(f'Created subscription for user: {user.username}'))
        
        self.stdout.write(self.style.SUCCESS(f'Created {count} subscriptions'))
