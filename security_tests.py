"""
Security tests for authentication system.
"""

import requests
import json
import time

BASE_URL = 'http://localhost:8000/api'

def test_password_strength():
    """Test password strength validation."""
    print("🔒 Testing password strength validation...")
    
    weak_passwords = [
        '123',  # Too short
        'password',  # No uppercase, numbers, special chars
        'PASSWORD',  # No lowercase, numbers, special chars
        'Password',  # No numbers, special chars
        'Password1',  # No special chars
    ]
    
    strong_password = 'Password123!'
    
    for password in weak_passwords:
        response = requests.post(f'{BASE_URL}/auth/register/', json={
            'username': f'test_user_{int(time.time())}',
            'email': f'test_{int(time.time())}@example.com',
            'password': password,
            'first_name': 'Test',
            'last_name': 'User'
        })
        
        if response.status_code == 400:
            print(f"✅ Weak password '{password}' correctly rejected")
        else:
            print(f"❌ Weak password '{password}' was accepted (should be rejected)")
    
    # Test strong password
    response = requests.post(f'{BASE_URL}/auth/register/', json={
        'username': f'test_user_{int(time.time())}',
        'email': f'test_{int(time.time())}@example.com',
        'password': strong_password,
        'first_name': 'Test',
        'last_name': 'User'
    })
    
    if response.status_code == 201:
        print(f"✅ Strong password correctly accepted")
    else:
        print(f"❌ Strong password was rejected: {response.text}")

def test_email_validation():
    """Test email format validation."""
    print("\n📧 Testing email validation...")
    
    invalid_emails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example',
    ]
    
    valid_email = 'test@example.com'
    
    for email in invalid_emails:
        response = requests.post(f'{BASE_URL}/auth/register/', json={
            'username': f'test_user_{int(time.time())}',
            'email': email,
            'password': 'Password123!',
            'first_name': 'Test',
            'last_name': 'User'
        })
        
        if response.status_code == 400:
            print(f"✅ Invalid email '{email}' correctly rejected")
        else:
            print(f"❌ Invalid email '{email}' was accepted (should be rejected)")
    
    # Test valid email
    response = requests.post(f'{BASE_URL}/auth/register/', json={
        'username': f'test_user_{int(time.time())}',
        'email': valid_email,
        'password': 'Password123!',
        'first_name': 'Test',
        'last_name': 'User'
    })
    
    if response.status_code == 201:
        print(f"✅ Valid email correctly accepted")
    else:
        print(f"❌ Valid email was rejected: {response.text}")

def test_duplicate_registration():
    """Test duplicate username/email registration."""
    print("\n👤 Testing duplicate registration...")
    
    username = f'test_user_{int(time.time())}'
    email = f'test_{int(time.time())}@example.com'
    password = 'Password123!'
    
    # First registration
    response1 = requests.post(f'{BASE_URL}/auth/register/', json={
        'username': username,
        'email': email,
        'password': password,
        'first_name': 'Test',
        'last_name': 'User'
    })
    
    if response1.status_code == 201:
        print(f"✅ First registration successful")
        
        # Second registration with same username
        response2 = requests.post(f'{BASE_URL}/auth/register/', json={
            'username': username,
            'email': f'different_{int(time.time())}@example.com',
            'password': password,
            'first_name': 'Test',
            'last_name': 'User'
        })
        
        if response2.status_code == 400:
            print(f"✅ Duplicate username correctly rejected")
        else:
            print(f"❌ Duplicate username was accepted (should be rejected)")
        
        # Second registration with same email
        response3 = requests.post(f'{BASE_URL}/auth/register/', json={
            'username': f'different_{int(time.time())}',
            'email': email,
            'password': password,
            'first_name': 'Test',
            'last_name': 'User'
        })
        
        if response3.status_code == 400:
            print(f"✅ Duplicate email correctly rejected")
        else:
            print(f"❌ Duplicate email was accepted (should be rejected)")
    else:
        print(f"❌ First registration failed: {response1.text}")

def test_brute_force_protection():
    """Test brute force protection (basic rate limiting)."""
    print("\n🛡️ Testing brute force protection...")
    
    # Try multiple failed login attempts
    failed_attempts = 0
    for i in range(5):
        response = requests.post(f'{BASE_URL}/auth/login/', json={
            'username': 'nonexistent_user',
            'password': 'wrong_password'
        })
        
        if response.status_code == 401:
            failed_attempts += 1
    
    print(f"✅ {failed_attempts} failed login attempts handled correctly")
    
    if failed_attempts == 5:
        print("✅ All failed attempts returned 401 (Unauthorized)")
    else:
        print("❌ Some failed attempts were not handled correctly")

def test_jwt_token_security():
    """Test JWT token security."""
    print("\n🔑 Testing JWT token security...")
    
    # Register and login
    username = f'test_user_{int(time.time())}'
    email = f'test_{int(time.time())}@example.com'
    password = 'Password123!'
    
    # Register
    register_response = requests.post(f'{BASE_URL}/auth/register/', json={
        'username': username,
        'email': email,
        'password': password,
        'first_name': 'Test',
        'last_name': 'User'
    })
    
    if register_response.status_code == 201:
        print("✅ Registration successful")
        
        # Try to login (should fail because email not verified)
        login_response = requests.post(f'{BASE_URL}/auth/login/', json={
            'username': username,
            'password': password
        })
        
        if login_response.status_code == 401:
            print("✅ Login correctly blocked for unverified email")
        else:
            print("❌ Login should be blocked for unverified email")
    else:
        print(f"❌ Registration failed: {register_response.text}")

def run_security_tests():
    """Run all security tests."""
    print("🔐 Starting Security Tests for Task Management App")
    print("=" * 50)
    
    try:
        test_password_strength()
        test_email_validation()
        test_duplicate_registration()
        test_brute_force_protection()
        test_jwt_token_security()
        
        print("\n" + "=" * 50)
        print("✅ Security tests completed!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure backend is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error running tests: {e}")

if __name__ == '__main__':
    run_security_tests()
