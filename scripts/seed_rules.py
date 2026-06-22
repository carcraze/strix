"""Seed all check_rules from the Rules/ markdown files into Supabase."""
import os
import re
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://xrwgqpltogkezqcaqhck.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

if not SUPABASE_KEY:
    print("ERROR: Set SUPABASE_KEY env var (service role key)")
    exit(1)

client = create_client(SUPABASE_URL, SUPABASE_KEY)

RULES_DIR = os.path.join(os.path.dirname(__file__), "..", "Rules")

def parse_rules_md(filepath: str, rule_type: str) -> list[dict]:
    """Parse a rules markdown file into structured rule dicts.
    Format: Language, (empty), Title, (empty), Description, (empty), AutoFix, Score
    The header is: Language, (empty), Description, (empty), AutoFix, (empty), Score, (empty)
    """
    with open(filepath, "r", encoding="utf-8") as f:
        lines = [l.rstrip() for l in f.readlines()]

    rules = []
    # Skip the header (first 8 lines: Language, empty, Description, empty, AutoFix, empty, Score, empty)
    i = 8

    while i < len(lines):
        # Skip empty lines
        while i < len(lines) and not lines[i].strip():
            i += 1
        if i >= len(lines):
            break

        # Language
        language = lines[i].strip()
        i += 1

        # Skip empty
        while i < len(lines) and not lines[i].strip():
            i += 1
        if i >= len(lines):
            break

        # Title/Short description
        title = lines[i].strip()
        i += 1

        # Skip empty
        while i < len(lines) and not lines[i].strip():
            i += 1
        if i >= len(lines):
            break

        # Full description (may be multiline until we hit Yes/No line)
        desc_parts = []
        while i < len(lines):
            line = lines[i].strip()
            if line.lower() in ("yes", "no"):
                break
            if line:
                desc_parts.append(line)
            i += 1

        if i >= len(lines):
            break

        description = title + ": " + " ".join(desc_parts) if desc_parts else title

        # AutoFix (Yes/No)
        auto_fix_str = lines[i].strip().lower()
        auto_fix = auto_fix_str == "yes"
        i += 1

        # Score (Critical/High/Medium/Low) - next non-empty line
        while i < len(lines) and not lines[i].strip():
            i += 1
        if i >= len(lines):
            break

        score = lines[i].strip().lower()
        i += 1
        if score not in ("critical", "high", "medium", "low"):
            score = "medium"

        rules.append({
            "organization_id": None,
            "rule_type": rule_type,
            "language": language,
            "description": description[:500],  # cap at 500 chars
            "auto_fix": auto_fix,
            "score": score,
            "is_default": True,
            "is_enabled": True,
        })

    return rules


def main():
    all_rules = []

    # Parse each rules file
    files = [
        ("sastrules.md", "sast"),
        ("iacrules.md", "iac"),
        ("mobilerules.md", "mobile"),
    ]

    for filename, rule_type in files:
        filepath = os.path.join(RULES_DIR, filename)
        if not os.path.exists(filepath):
            print(f"  SKIP: {filepath} not found")
            continue
        rules = parse_rules_md(filepath, rule_type)
        print(f"  Parsed {len(rules)} rules from {filename}")
        all_rules.extend(rules)

    print(f"\nTotal rules to insert: {len(all_rules)}")

    # Insert in batches of 50
    batch_size = 50
    inserted = 0
    for i in range(0, len(all_rules), batch_size):
        batch = all_rules[i:i + batch_size]
        try:
            client.table("check_rules").insert(batch).execute()
            inserted += len(batch)
            print(f"  Inserted batch {i // batch_size + 1} ({len(batch)} rules)")
        except Exception as e:
            print(f"  ERROR on batch {i // batch_size + 1}: {e}")

    print(f"\nDone! Inserted {inserted} / {len(all_rules)} rules.")


if __name__ == "__main__":
    main()
