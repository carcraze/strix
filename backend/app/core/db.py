from supabase import create_client, Client
from app.core.config import settings

class SupabaseDB:
    def __init__(self):
        self.client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

    def create_scan(self, tenant_id: str, target: str, model: str = "vertex_ai/gemini-2.5-pro"):
        data = {
            "tenant_id": tenant_id,
            "target_url": target,
            "status": "queued",
            "model_used": model
        }
        response = self.client.table("scans").insert(data).execute()
        return response.data[0] if response.data else None

    def update_scan_status(self, scan_id: str, status: str):
        self.client.table("scans").update({"status": status}).eq("id", scan_id).execute()

    def add_vulnerability(self, scan_id: str, tenant_id: str, title: str, severity: str, description: str):
        data = {
            "scan_id": scan_id,
            "tenant_id": tenant_id,
            "title": title,
            "severity": severity,
            "description": description
        }
        self.client.table("vulnerabilities").insert(data).execute()

db = SupabaseDB()
