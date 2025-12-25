from passlib.context import CryptContext
import hashlib

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    print(f"Original Password: {password}")
    password_bytes = password.encode("utf-8")
    sha256 = hashlib.sha256(password_bytes).hexdigest()
    print(f"SHA256 Hex: {sha256}")
    print(f"Length: {len(sha256)}")
    
    try:
        hashed = pwd_context.hash(sha256)
        print(f"Bcrypt Hash Success: {hashed}")
        return hashed
    except Exception as e:
        print(f"Bcrypt Hash Failed: {e}")
        raise e

# Test with a short password
print("--- Test 1: Short Password ---")
get_password_hash("password123")

# Test with a long password (should still work due to pre-hashing)
print("\n--- Test 2: Long Password ---")
long_pw = "a" * 100
get_password_hash(long_pw)
