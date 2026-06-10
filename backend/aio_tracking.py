import re
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Optional
from urllib.parse import urlencode


AIO_VISIT_UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE,
)
AIO_EVENT_SLUG_RE = re.compile(r"^[a-z0-9_][a-z0-9_-]{0,63}$")
AIO_POSTBACK_BASE_URL = "https://app.aio.tech/api/v1/trigger/conversion-request"


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


def normalize_aio_event_slug(value: Optional[str]) -> Optional[str]:
    raw = str(value or "").strip().lower()
    if not raw:
        return None
    raw = raw.replace(" ", "_")
    if not AIO_EVENT_SLUG_RE.fullmatch(raw):
        return None
    return raw


def normalize_aio_revenue(value: Optional[object]) -> str:
    raw = str(value if value is not None else "0").strip().replace(",", ".")
    try:
        amount = Decimal(raw)
    except (InvalidOperation, ValueError):
        amount = Decimal("0")
    if amount < 0:
        amount = Decimal("0")
    return str(amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def build_aio_postback_url(
    aio_visit_uuid: str,
    event_slug: str,
    revenue: Optional[object] = None,
    currency: Optional[str] = None,
    unique_key: Optional[str] = None,
) -> str:
    visit_uuid = normalize_aio_visit_uuid(aio_visit_uuid)
    normalized_event_slug = normalize_aio_event_slug(event_slug)
    if not visit_uuid:
        raise ValueError("AIO visit UUID is invalid")
    if not normalized_event_slug:
        raise ValueError("AIO event slug is invalid")

    params = {
        "visit_uuid": visit_uuid,
        "conversion_type_uuid": normalized_event_slug,
        "arrived_revenue": normalize_aio_revenue(revenue),
    }
    normalized_currency = str(currency or "").strip().upper()
    if normalized_currency:
        params["currency"] = normalized_currency
    normalized_unique_key = str(unique_key or "").strip()
    if normalized_unique_key:
        params["unique"] = normalized_unique_key

    return f"{AIO_POSTBACK_BASE_URL}?{urlencode(params)}"
