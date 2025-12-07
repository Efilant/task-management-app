"""
Script to make a user admin.
Run with: python manage.py shell < make_admin.py
Or better: python manage.py shell, then paste commands one by one
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'taskmanager_project.settings')
django.setup()

from django.contrib.auth.models import User
from authentication.models import UserProfile

username = 'ecesu'

try:
    user = User.objects.get(username=username)
    if not hasattr(user, 'profile'):
        UserProfile.objects.create(user=user, role='admin')
        print(f"User {username} profile created and set as admin!")
    else:
        user.profile.role = 'admin'
        user.profile.save()
        print(f"User {username} is now admin!")
except User.DoesNotExist:
    print(f"User {username} not found!")
    print("Available users:")
    for u in User.objects.all():
        print(f"  - {u.username}")
