import jwt
from jwt import PyJWKClient
from app.core.config import settings
import uuid
import logging

logger = logging.getLogger(__name__)

def validate_uuid(value: str, field_name: str = "ID") -> str:
    """
    Validates that a string is a valid UUID.
    Prevents SQL injection and invalid data.

    Args:
        value: String to validate
        field_name: Field name for error messages

    Returns:
        str: The validated UUID string

    Raises:
        HTTPException: If UUID is invalid
    """
    from fastapi import HTTPException

    try:
        uuid.UUID(value)
        return value
    except ValueError:
        logger.warning(f"Invalid UUID format for {field_name}: {value}")
        raise HTTPException(400, f"Invalid {field_name} format")

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
    except jwt.ExpiredSignatureError:
        logger.warning("JWT token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.error(f"JWT validation failed: {type(e).__name__}")
        return None
    except Exception as e:
        logger.error(f"Unexpected JWT verification error: {type(e).__name__}")
        return None

from fastapi import Header, HTTPException

def get_current_user(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user = verify_supabase_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user

def verify_organization_access(user_id: str, organization_id: str) -> bool:
    """
    Verifies that a user has access to an organization.

    Args:
        user_id: User's UUID from JWT
        organization_id: Organization UUID to check

    Returns:
        bool: True if user has access, False otherwise
    """
    from app.services.supabase import supabase_admin

    # Validate UUIDs first
    validate_uuid(user_id, "user_id")
    validate_uuid(organization_id, "organization_id")

    try:
        member = supabase_admin.table("organization_members") \
            .select("id") \
            .eq("user_id", user_id) \
            .eq("organization_id", organization_id) \
            .execute()

        return len(member.data) > 0
    except Exception as e:
        logger.error(f"Organization access check failed: {e}")
        return False
