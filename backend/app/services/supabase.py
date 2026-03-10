import os
from supabase import create_client, Client
from ..core.config import settings

# For admin operations (like modifying credits), use the service role key
# Make sure to have a fallback to os.environ for robust access
supabase_url = getattr(settings, "SUPABASE_URL", os.environ.get("SUPABASE_URL"))
supabase_key = getattr(settings, "SUPABASE_KEY", os.environ.get("SUPABASE_KEY"))

if not supabase_url or not supabase_key:
    # If not defined, default to some mock or raise depending on your setup
    # In production this will throw if missing
    pass

supabase_admin: Client = create_client(supabase_url or "", supabase_key or "")
