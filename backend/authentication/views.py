"""
Authentication views for user registration and login.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import IntegrityError
from django.core.mail import send_mail
from django.conf import settings
from django.utils.crypto import get_random_string
from django.utils import timezone
from datetime import timedelta
import hashlib
import re

def validate_password_strength(password):
    """
    Validate password strength.
    """
    errors = []
    
    if len(password) < 8:
        errors.append("Şifre en az 8 karakter olmalıdır")
    
    if not re.search(r'[A-Z]', password):
        errors.append("Şifre en az bir büyük harf içermelidir")
    
    if not re.search(r'[a-z]', password):
        errors.append("Şifre en az bir küçük harf içermelidir")
    
    if not re.search(r'\d', password):
        errors.append("Şifre en az bir rakam içermelidir")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("Şifre en az bir özel karakter içermelidir")
    
    return errors

def validate_email(email):
    """
    Validate email format.
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Register a new user with optional email verification.
    """
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    
    if not username or not email or not password:
        return Response({
            'error': 'Username, email and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate email format
    if not validate_email(email):
        return Response({
            'error': 'Geçersiz e-posta formatı'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate password strength
    password_errors = validate_password_strength(password)
    if password_errors:
        return Response({
            'error': 'Şifre güvenlik gereksinimleri karşılanmıyor',
            'details': password_errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if username or email already exists
    if User.objects.filter(username=username).exists():
        return Response({
            'error': 'Bu kullanıcı adı zaten kullanılıyor'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(email=email).exists():
        return Response({
            'error': 'Bu e-posta adresi zaten kayıtlı'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_active=False  # Her zaman e-posta doğrulama gerekli
        )
        
        # E-posta doğrulama ile kayıt - 6 haneli kod sistemi
        import random
        verification_code = str(random.randint(100000, 999999))  # 6 haneli kod
        user.profile.verification_token = verification_code
        user.profile.verification_token_sent_at = timezone.now()
        user.profile.save()
        
        # Send verification email with code
        try:
            send_mail(
                'E-posta Doğrulama Kodu',
                f'E-posta adresinizi doğrulamak için aşağıdaki kodu kullanın:\n\n'
                f'Doğrulama Kodu: {verification_code}\n\n'
                f'Bu kod 3 dakika geçerlidir.\n'
                f'Kodu uygulamada ilgili alana girin.',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            email_sent = True
        except Exception as email_error:
            print(f"E-posta gönderme hatası: {email_error}")
            email_sent = False
        
        return Response({
            'message': 'Kayıt başarılı! E-posta doğrulama kodu gönderildi.' if email_sent else 'Kayıt başarılı! E-posta gönderilemedi, lütfen daha sonra tekrar deneyin.',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_active': user.is_active,
            },
            'email_sent': email_sent
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': f'Kayıt sırasında hata oluştu: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """
    Verify user email with 6-digit code.
    """
    code = request.data.get('code')
    email = request.data.get('email')
    
    if not code:
        return Response({
            'error': 'Doğrulama kodu gerekli'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not email:
        return Response({
            'error': 'E-posta adresi gerekli'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Debug: Gelen verileri yazdır
        print(f"DEBUG: Gelen kod: {code}")
        print(f"DEBUG: Gelen email: {email}")
        
        # Find user by email and verification code
        user = User.objects.get(email=email, profile__verification_token=code)
        print(f"DEBUG: Kullanıcı bulundu: {user.username}")
        
        if user.is_active:
            return Response({
                'message': 'E-posta adresi zaten doğrulanmış'
            }, status=status.HTTP_200_OK)
        
        # Activate user
        user.is_active = True
        user.save()
        
        # Clear verification code
        user.profile.verification_token = None
        user.profile.save()
        
        print(f"DEBUG: Kullanıcı aktifleştirildi: {user.username}")
        
        return Response({
            'message': 'E-posta adresi başarıyla doğrulandı! Artık giriş yapabilirsiniz.'
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        print(f"DEBUG: Kullanıcı bulunamadı - email: {email}, kod: {code}")
        return Response({
            'error': 'Geçersiz doğrulama kodu veya e-posta adresi'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': f'Doğrulama sırasında hata oluştu: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification_code(request):
    """
    Resend verification code for email verification.
    """
    email = request.data.get('email')
    
    if not email:
        return Response({
            'error': 'E-posta adresi gerekli'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        
        # Check if user is already active
        if user.is_active:
            return Response({
                'error': 'Bu e-posta adresi zaten doğrulanmış'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate new verification code
        import random
        verification_code = str(random.randint(100000, 999999))  # 6 haneli kod
        user.profile.verification_token = verification_code
        user.profile.verification_token_sent_at = timezone.now()
        user.profile.save()
        
        # Send verification email with new code
        try:
            send_mail(
                'E-posta Doğrulama Kodu (Yeniden)',
                f'E-posta adresinizi doğrulamak için aşağıdaki kodu kullanın:\n\n'
                f'Doğrulama Kodu: {verification_code}\n\n'
                f'Bu kod 3 dakika geçerlidir.\n'
                f'Kodu uygulamada ilgili alana girin.',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            email_sent = True
        except Exception as email_error:
            print(f"E-posta gönderme hatası: {email_error}")
            email_sent = False
        
        return Response({
            'message': 'Yeni doğrulama kodu gönderildi!' if email_sent else 'Kod gönderilemedi, lütfen daha sonra tekrar deneyin.',
            'email_sent': email_sent
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({
            'error': 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': f'Kod gönderme sırasında hata oluştu: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """
    Request password reset email.
    """
    print("DEBUG: request_password_reset fonksiyonu çağrıldı")
    email = request.data.get('email')
    print(f"DEBUG: Gelen e-posta: {email}")
    print(f"DEBUG: E-posta tipi: {type(email)}")
    
    # Eğer email bir dictionary ise, içindeki değeri al
    if isinstance(email, dict):
        email = email.get('email', '')
        print(f"DEBUG: Dictionary'den alınan e-posta: {email}")
    
    if not email:
        print("DEBUG: E-posta adresi boş")
        return Response({
            'error': 'E-posta adresi gerekli'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        print(f"DEBUG: Şifre sıfırlama isteği - email: {email}")
        
        # Generate 6-digit reset code
        import random
        reset_code = str(random.randint(100000, 999999))  # 6 haneli kod
        print(f"DEBUG: Üretilen sıfırlama kodu: {reset_code}")
        
        # Store reset code
        user.profile.reset_token = reset_code
        user.profile.reset_token_expires = timezone.now() + timedelta(minutes=3)  # 3 dakika geçerli
        user.profile.save()
        
        # Send reset email with code
        send_mail(
            'Şifre Sıfırlama Kodu',
            f'Şifrenizi sıfırlamak için aşağıdaki kodu kullanın:\n\n'
            f'Sıfırlama Kodu: {reset_code}\n\n'
            f'Bu kod 3 dakika geçerlidir.\n'
            f'Kodu uygulamada ilgili alana girin.',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        print(f"DEBUG: Şifre sıfırlama e-postası gönderildi: {email}")
        
        return Response({
            'message': 'Şifre sıfırlama kodu e-posta adresinize gönderildi.'
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        print(f"DEBUG: E-posta adresi bulunamadı: {email}")
        # Don't reveal if email exists or not for security
        return Response({
            'message': 'E-posta adresi kayıtlıysa, şifre sıfırlama bağlantısı gönderilecektir.'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': f'Şifre sıfırlama talebi sırasında hata oluştu: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """
    Reset password with 6-digit code.
    """
    code = request.data.get('code')
    email = request.data.get('email')
    new_password = request.data.get('new_password')
    
    if not code or not email or not new_password:
        return Response({
            'error': 'Kod, e-posta adresi ve yeni şifre gerekli'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate password strength
    password_errors = validate_password_strength(new_password)
    if password_errors:
        return Response({
            'error': 'Şifre güvenlik gereksinimleri karşılanmıyor',
            'details': password_errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        print(f"DEBUG: Şifre sıfırlama - kod: {code}, email: {email}")
        
        user = User.objects.get(
            email=email,
            profile__reset_token=code,
            profile__reset_token_expires__gt=timezone.now()
        )
        print(f"DEBUG: Kullanıcı bulundu: {user.username}")
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        # Clear reset token
        user.profile.reset_token = None
        user.profile.reset_token_expires = None
        user.profile.save()
        
        print(f"DEBUG: Şifre sıfırlandı: {user.username}")
        
        return Response({
            'message': 'Şifre başarıyla sıfırlandı! Artık yeni şifrenizle giriş yapabilirsiniz.'
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        print(f"DEBUG: Kullanıcı bulunamadı - email: {email}, kod: {code}")
        return Response({
            'error': 'Geçersiz kod, e-posta adresi veya kodun süresi dolmuş'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': f'Şifre sıfırlama sırasında hata oluştu: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Authenticate user and return JWT tokens.
    """
    print("DEBUG: login fonksiyonu çağrıldı")
    username = request.data.get('username')
    password = request.data.get('password')
    print(f"DEBUG: Username: {username}")
    print(f"DEBUG: Password length: {len(password) if password else 0}")
    
    if not username or not password:
        print("DEBUG: Username veya password boş")
        return Response({
            'error': 'Username and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(username=username, password=password)
    print(f"DEBUG: User authenticate sonucu: {user}")
    
    # Eğer authenticate None döndürürse, kullanıcıyı manuel olarak kontrol et
    if not user:
        try:
            user = User.objects.get(username=username)
            # Şifreyi manuel olarak kontrol et
            if user.check_password(password):
                print(f"DEBUG: User bulundu (manuel kontrol): {user.username}, is_active: {user.is_active}")
                # Check if email is verified
                if not user.is_active:
                    # Check if verification code exists and is still valid
                    verification_code = user.profile.verification_token
                    code_expired = not user.profile.is_verification_token_valid()
                    
                    return Response({
                        'error': 'E-posta adresinizi doğrulamanız gerekiyor. Lütfen e-posta kutunuzu kontrol edin.',
                        'email_verification_required': True,
                        'email': user.email,
                        'code_expired': code_expired,
                        'has_verification_code': bool(verification_code)
                    }, status=status.HTTP_401_UNAUTHORIZED)
            else:
                print("DEBUG: Şifre yanlış")
                return Response({
                    'error': 'Geçersiz kullanıcı adı veya şifre'
                }, status=status.HTTP_401_UNAUTHORIZED)
        except User.DoesNotExist:
            print("DEBUG: Kullanıcı bulunamadı")
            return Response({
                'error': 'Geçersiz kullanıcı adı veya şifre'
            }, status=status.HTTP_401_UNAUTHORIZED)
    else:
        print(f"DEBUG: User bulundu: {user.username}, is_active: {user.is_active}")
        # Check if email is verified
        if not user.is_active:
            # Check if verification code exists and is still valid
            verification_code = user.profile.verification_token
            code_expired = not user.profile.is_verification_token_valid()
            
            return Response({
                'error': 'E-posta adresinizi doğrulamanız gerekiyor. Lütfen e-posta kutunuzu kontrol edin.',
                'email_verification_required': True,
                'email': user.email,
                'code_expired': code_expired,
                'has_verification_code': bool(verification_code)
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    """
    Refresh JWT access token using refresh token.
    """
    refresh_token = request.data.get('refresh')
    
    if not refresh_token:
        return Response({
            'error': 'Refresh token is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        refresh = RefreshToken(refresh_token)
        access_token = refresh.access_token
        
        return Response({
            'access': str(access_token),
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': 'Invalid refresh token'
        }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
def logout(request):
    """
    Logout user (token will expire naturally).
    """
    try:
        return Response({
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': 'Logout failed'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile(request):
    """
    Get or update user profile information.
    """
    print(f"DEBUG: profile endpoint çağrıldı - Method: {request.method}")
    print(f"DEBUG: User: {request.user.username if request.user else 'Anonymous'}")
    user = request.user
    
    if request.method == 'GET':
        print(f"DEBUG: Profile GET - User: {user.username}, Email: {user.email}")
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_active': user.is_active,
            'date_joined': user.date_joined,
        }, status=status.HTTP_200_OK)
    
    elif request.method == 'PUT':
        # Update profile
        username = request.data.get('username')
        email = request.data.get('email')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        
        # Validate email format if provided
        if email and not validate_email(email):
            return Response({
                'error': 'Geçersiz e-posta formatı'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if username is already taken by another user
        if username and username != user.username:
            if User.objects.filter(username=username).exists():
                return Response({
                    'error': 'Bu kullanıcı adı zaten kullanılıyor'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if email is already taken by another user
        if email and email != user.email:
            if User.objects.filter(email=email).exists():
                return Response({
                    'error': 'Bu e-posta adresi zaten kayıtlı'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Update user fields
            if username:
                user.username = username
            if email:
                user.email = email
            if first_name is not None:
                user.first_name = first_name
            if last_name is not None:
                user.last_name = last_name
            
            user.save()
            
            return Response({
                'message': 'Profil başarıyla güncellendi',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'is_active': user.is_active,
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Profil güncellenirken hata oluştu: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change user password.
    """
    user = request.user
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    
    if not current_password or not new_password:
        return Response({
            'error': 'Mevcut şifre ve yeni şifre gerekli'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify current password
    if not user.check_password(current_password):
        return Response({
            'error': 'Mevcut şifre yanlış'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate new password strength
    password_errors = validate_password_strength(new_password)
    if password_errors:
        return Response({
            'error': 'Yeni şifre güvenlik gereksinimleri karşılanmıyor',
            'details': password_errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': 'Şifre başarıyla değiştirildi'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Şifre değiştirilirken hata oluştu: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)
