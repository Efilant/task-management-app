"""
Script to make a user admin.
Usage: python manage.py shell < scripts/make_admin.py
Or: python manage.py shell
>>> from authentication.models import UserProfile
>>> user = User.objects.get(username='admin')
>>> user.profile.role = 'admin'
>>> user.profile.save()
"""

from django.contrib.auth.models import User
from authentication.models import UserProfile

def make_admin(username):
    """Make a user admin"""
    try:
        user = User.objects.get(username=username)
        if not hasattr(user, 'profile'):
            UserProfile.objects.create(user=user, role='admin')
        else:
            user.profile.role = 'admin'
            user.profile.save()
        print(f"User {username} is now an admin!")
        return True
    except User.DoesNotExist:
        print(f"User {username} not found!")
        return False

# Example usage:
# make_admin('admin')
