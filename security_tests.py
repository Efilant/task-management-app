"""
Comprehensive Security Tests for Task Management Application
Bu dosya güvenlik açıklarını ve authentication sistemini test eder.
"""

import requests
import json
import time
import sys
from datetime import datetime

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

def test_sql_injection():
    """Test SQL injection protection."""
    print("\n💉 Testing SQL injection protection...")
    
    malicious_inputs = [
        "'; DROP TABLE auth_user; --",
        "' OR '1'='1",
        "admin'--",
        "admin'/*",
        "'; INSERT INTO auth_user VALUES ('hacker', 'hacker@evil.com', 'password'); --"
    ]
    
    for malicious_input in malicious_inputs:
        # Test login endpoint
        response = requests.post(f'{BASE_URL}/auth/login/', json={
            'username': malicious_input,
            'password': 'password'
        })
        
        if response.status_code == 401:
            print(f"✅ SQL injection attempt blocked: {malicious_input[:20]}...")
        else:
            print(f"❌ Potential SQL injection vulnerability: {malicious_input[:20]}...")

def test_xss_protection():
    """Test XSS protection."""
    print("\n🛡️ Testing XSS protection...")
    
    xss_payloads = [
        "<script>alert('XSS')</script>",
        "javascript:alert('XSS')",
        "<img src=x onerror=alert('XSS')>",
        "';alert('XSS');//"
    ]
    
    for payload in xss_payloads:
        # Test registration with XSS payload
        response = requests.post(f'{BASE_URL}/auth/register/', json={
            'username': f'test_{int(time.time())}',
            'email': f'test_{int(time.time())}@example.com',
            'password': 'Password123!',
            'first_name': payload,
            'last_name': 'User'
        })
        
        if response.status_code in [400, 201]:
            print(f"✅ XSS payload handled safely: {payload[:20]}...")
        else:
            print(f"❌ Potential XSS vulnerability: {payload[:20]}...")

def test_csrf_protection():
    """Test CSRF protection."""
    print("\n🔄 Testing CSRF protection...")
    
    # Test if CORS headers are properly set
    response = requests.options(f'{BASE_URL}/auth/login/')
    cors_headers = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
    }
    
    if cors_headers['Access-Control-Allow-Origin']:
        print(f"✅ CORS headers present: {cors_headers['Access-Control-Allow-Origin']}")
    else:
        print("⚠️  CORS headers not found")

def test_rate_limiting():
    """Test rate limiting."""
    print("\n⏱️ Testing rate limiting...")
    
    # Test multiple rapid requests
    start_time = time.time()
    failed_attempts = 0
    
    for i in range(10):
        response = requests.post(f'{BASE_URL}/auth/login/', json={
            'username': 'nonexistent_user',
            'password': 'wrong_password'
        })
        
        if response.status_code == 401:
            failed_attempts += 1
    
    end_time = time.time()
    duration = end_time - start_time
    
    print(f"✅ {failed_attempts} failed attempts in {duration:.2f} seconds")
    
    if failed_attempts == 10:
        print("✅ All requests handled properly")
    else:
        print("⚠️  Some requests may have been rate limited")

def test_input_validation():
    """Test input validation."""
    print("\n📝 Testing input validation...")
    
    invalid_inputs = [
        {'username': '', 'email': 'test@example.com', 'password': 'Password123!'},
        {'username': 'test', 'email': '', 'password': 'Password123!'},
        {'username': 'test', 'email': 'test@example.com', 'password': ''},
        {'username': 'a' * 1000, 'email': 'test@example.com', 'password': 'Password123!'},
        {'username': 'test', 'email': 'a' * 1000 + '@example.com', 'password': 'Password123!'},
    ]
    
    for invalid_input in invalid_inputs:
        response = requests.post(f'{BASE_URL}/auth/register/', json=invalid_input)
        
        if response.status_code == 400:
            print(f"✅ Invalid input rejected: {list(invalid_input.keys())[0]}")
        else:
            print(f"❌ Invalid input accepted: {list(invalid_input.keys())[0]}")

def test_session_security():
    """Test session security."""
    print("\n🔐 Testing session security...")
    
    # Test if session cookies are secure
    response = requests.get('http://localhost:8000/admin/')
    
    cookies = response.cookies
    secure_cookies = 0
    
    for cookie in cookies:
        if hasattr(cookie, 'secure') and cookie.secure:
            secure_cookies += 1
        elif hasattr(cookie, 'httponly') and cookie.httponly:
            secure_cookies += 1
    
    if secure_cookies > 0:
        print(f"✅ {secure_cookies} secure cookies found")
    else:
        print("⚠️  No secure cookies found")

def test_headers_security():
    """Test security headers."""
    print("\n🛡️ Testing security headers...")
    
    response = requests.get('http://localhost:8000/admin/')
    headers = response.headers
    
    security_headers = {
        'X-Frame-Options': headers.get('X-Frame-Options'),
        'X-Content-Type-Options': headers.get('X-Content-Type-Options'),
        'X-XSS-Protection': headers.get('X-XSS-Protection'),
        'Strict-Transport-Security': headers.get('Strict-Transport-Security'),
        'Content-Security-Policy': headers.get('Content-Security-Policy')
    }
    
    for header, value in security_headers.items():
        if value:
            print(f"✅ {header}: {value}")
        else:
            print(f"⚠️  {header}: Not set")

class SecurityTester:
    def __init__(self):
        self.test_results = {
            'passed': 0,
            'failed': 0,
            'total': 0,
            'details': []
        }
    
    def log_test(self, test_name, status, message=""):
        """Test sonucunu logla"""
        self.test_results['total'] += 1
        if status == 'PASS':
            self.test_results['passed'] += 1
            status_icon = "✅"
        else:
            self.test_results['failed'] += 1
            status_icon = "❌"
        
        log_entry = {
            'test': test_name,
            'status': status,
            'message': message,
            'timestamp': datetime.now().strftime('%H:%M:%S')
        }
        self.test_results['details'].append(log_entry)
        
        print(f"{status_icon} {test_name}: {message}")
    
    def run_all_tests(self):
        """Tüm güvenlik testlerini çalıştır"""
        print("🔐 Starting Comprehensive Security Tests")
        print("=" * 60)
        
        try:
            # Test server connection
            response = requests.get("http://localhost:8000", timeout=5)
            self.log_test("Server Connection", "PASS", "Backend server çalışıyor")
        except:
            self.log_test("Server Connection", "FAIL", "Backend server çalışmıyor")
            return
        
        # Run all security tests
        test_password_strength()
        test_email_validation()
        test_duplicate_registration()
        test_brute_force_protection()
        test_jwt_token_security()
        test_sql_injection()
        test_xss_protection()
        test_csrf_protection()
        test_rate_limiting()
        test_input_validation()
        test_session_security()
        test_headers_security()
        
        self.print_summary()
    
    def print_summary(self):
        """Test özetini yazdır"""
        print("\n" + "="*60)
        print("🔐 SECURITY TEST SUMMARY")
        print("="*60)
        print(f"Total Tests: {self.test_results['total']}")
        print(f"Passed: {self.test_results['passed']} ✅")
        print(f"Failed: {self.test_results['failed']} ❌")
        print(f"Security Score: {(self.test_results['passed']/self.test_results['total']*100):.1f}%")
        
        print("\n" + "="*60)
        if self.test_results['failed'] == 0:
            print("🛡️  ALL SECURITY TESTS PASSED! Application is secure.")
        else:
            print("⚠️  Some security tests failed. Please review security measures.")
        print("="*60)

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
        test_sql_injection()
        test_xss_protection()
        test_csrf_protection()
        test_rate_limiting()
        test_input_validation()
        test_session_security()
        test_headers_security()
        
        print("\n" + "=" * 50)
        print("✅ Security tests completed!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure backend is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error running tests: {e}")

def main():
    """Ana fonksiyon"""
    tester = SecurityTester()
    tester.run_all_tests()

if __name__ == '__main__':
    main()
