import re
from typing import Optional


AIO_VISIT_UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE,
)


def normalize_aio_visit_uuid(value: Optional[str]) -> Optional[str]:
    raw = str(value or "").strip()
    if not raw:
        return None
    if not AIO_VISIT_UUID_RE.fullmatch(raw):
        return None
    return raw.lower()


def extract_aio_visit_uuid_from_start_text(text: Optional[str]) -> Optional[str]:
    raw = str(text or "").strip()
    if not raw:
        return None

    parts = raw.split(maxsplit=1)
    if parts and parts[0].lower().startswith("/start"):
        payload = parts[1] if len(parts) > 1 else ""
    else:
        payload = raw

    return normalize_aio_visit_uuid(payload)
