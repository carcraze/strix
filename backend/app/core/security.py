import jwt
from jwt import PyJWKClient
from app.core.config import settings

def verify_supabase_token(token: str):
    """
    Verifies a Supabase JWT token using the JWKS endpoint (Asymmetric Keys).
    """
    try:
        jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        
        jwks_client = PyJWKClient(jwks_url)
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"], # Common asymmetric algs
            audience="authenticated",
            options={"verify_exp": True}
        )
        return payload
    except Exception as e:
        print(f"JWT Verification Failed: {e}")
        return None

from fastapi import Header, HTTPException

def get_current_user(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user = verify_supabase_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user
