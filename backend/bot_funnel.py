from typing import Any, Dict, Optional


BOT_START_EVENT = "bot_start"
QUIZ_COMPLETE_EVENT = "quiz_complete"
CHANNEL_SUBSCRIBE_EVENT = "channel_subscribe"

DEFAULT_CHANNEL_ID = -1003584421739
DEFAULT_CHANNEL_URL = "https://t.me/+sUmNRVpk63M1Y2E1"
DEFAULT_CHECK_SUBSCRIPTION_ENABLED = 1

QUIZ_STEPS = ("name", "age", "experience")
QUIZ_QUESTIONS = {
    "name": "Как вас зовут?",
    "age": "Сколько вам лет?",
    "experience": "Есть ли у вас опыт в трейдинге?",
}


def get_quiz_question(step: Optional[str]) -> str:
    normalized_step = str(step or "").strip().lower()
    return QUIZ_QUESTIONS.get(normalized_step, QUIZ_QUESTIONS["name"])


def get_next_quiz_step(step: Optional[str]) -> Optional[str]:
    normalized_step = str(step or "").strip().lower()
    if normalized_step not in QUIZ_STEPS:
        return "name"
    index = QUIZ_STEPS.index(normalized_step)
    if index + 1 >= len(QUIZ_STEPS):
        return None
    return QUIZ_STEPS[index + 1]


def normalize_quiz_answer(step: str, value: Any) -> Any:
    normalized_step = str(step or "").strip().lower()
    text = str(value or "").strip()
    if not text:
        raise ValueError("answer is required")

    if normalized_step == "name":
        return text[:255]

    if normalized_step == "age":
        try:
            age = int(text)
        except (TypeError, ValueError):
            raise ValueError("age must be a number")
        if age < 10 or age > 100:
            raise ValueError("age must be between 10 and 100")
        return age

    if normalized_step == "experience":
        return text[:255]

    raise ValueError("unknown quiz step")


def normalize_channel_id(value: Any) -> int:
    try:
        channel_id = int(str(value or "").strip())
    except (TypeError, ValueError):
        return DEFAULT_CHANNEL_ID
    return channel_id or DEFAULT_CHANNEL_ID


def normalize_bool_flag(value: Any, default: int = 0) -> int:
    if value is None:
        return 1 if default else 0
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in ("1", "true", "yes", "on", "да"):
            return 1
        if lowered in ("0", "false", "no", "off", "нет"):
            return 0
    return 1 if bool(value) else 0


def normalize_channel_settings(row: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    source = row or {}
    channel_url = str(source.get("channel_url") or "").strip() or DEFAULT_CHANNEL_URL
    support_url = str(source.get("support_url") or "").strip()
    return {
        "channel_id": normalize_channel_id(source.get("channel_id")),
        "channel_url": channel_url,
        "support_url": support_url,
        "check_subscription_enabled": normalize_bool_flag(
            source.get("check_subscription_enabled"),
            DEFAULT_CHECK_SUBSCRIPTION_ENABLED,
        ),
    }


def is_active_channel_member(status: Any) -> bool:
    return str(status or "").strip().lower() in {"member", "administrator", "creator"}
