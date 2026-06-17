import re
from typing import Any, Dict, Optional


BOT_START_EVENT = "bot_start"
QUIZ_COMPLETE_EVENT = "quiz_complete"
CHANNEL_SUBSCRIBE_EVENT = "channel_subscribe"

DEFAULT_CHANNEL_ID = -1003584421739
DEFAULT_CHANNEL_URL = "https://t.me/+sUmNRVpk63M1Y2E1"
DEFAULT_CHECK_SUBSCRIPTION_ENABLED = 1

QUIZ_STEPS = ("experience", "broker_experience", "capital")
QUIZ_AIO_FIELDS = {
    "experience": "tg_question1",
    "broker_experience": "tg_question2",
    "capital": "tg_question3",
}
QUIZ_QUESTIONS = {
    "experience": "What is your trading experience?",
    "broker_experience": "Have you worked with any of these brokers before?",
    "capital": "What is your trading capital (deposit)?\nThis helps us suggest a more relevant broker setup later.",
}
QUIZ_OPTIONS = {
    "experience": (
        "I have no experience",
        "Less than 1 year",
        "1-2 years",
        "2-5 years",
        "More than 5 years",
        "Skip",
    ),
    "broker_experience": (
        "Broker 1",
        "Broker 2",
        "Broker 3",
        "Other broker",
        "I have not worked with a broker",
        "Skip",
    ),
    "capital": (
        "Up to $100",
        "$100-$1,000",
        "$1,000-$10,000",
        "$10,000-$100,000",
        "$100,000+",
        "Skip",
    ),
}
SKIP_PHRASES = {
    "skip",
    "later",
    "not now",
    "no thanks",
    "dont want",
    "don't want",
    "do not want",
    "just send link",
    "just send the link",
    "send link",
    "send the link",
    "channel",
}


def normalize_quiz_step(step: Optional[str]) -> str:
    normalized_step = str(step or "").strip().lower()
    return normalized_step if normalized_step in QUIZ_STEPS else QUIZ_STEPS[0]


def get_quiz_question(step: Optional[str]) -> str:
    return QUIZ_QUESTIONS[normalize_quiz_step(step)]


def get_quiz_options(step: Optional[str]) -> tuple[str, ...]:
    return QUIZ_OPTIONS[normalize_quiz_step(step)]


def get_aio_question_field(step: Optional[str]) -> str:
    return QUIZ_AIO_FIELDS[normalize_quiz_step(step)]


def get_next_quiz_step(step: Optional[str]) -> Optional[str]:
    normalized_step = normalize_quiz_step(step)
    index = QUIZ_STEPS.index(normalized_step)
    if index + 1 >= len(QUIZ_STEPS):
        return None
    return QUIZ_STEPS[index + 1]


def is_skip_answer(value: Any) -> bool:
    normalized = str(value or "").strip().lower()
    if not normalized:
        return False
    normalized = re.sub(r"\s+", " ", normalized)
    if normalized in SKIP_PHRASES:
        return True
    return any(phrase in normalized for phrase in ("just send", "send me the channel", "give me the link"))


def normalize_quiz_answer(step: str, value: Any) -> str:
    text = str(value or "").strip()
    if not text:
        raise ValueError("answer is required")
    if is_skip_answer(text):
        return "Skip"
    for option in get_quiz_options(step):
        if option.lower() == text.lower():
            return option
    return text[:255]


def _extract_amount(text: str) -> Optional[float]:
    match = re.search(r"(\d[\d\s,.]*)", text)
    if not match:
        return None
    raw = match.group(1).replace(" ", "").replace(",", ".")
    try:
        return float(raw)
    except ValueError:
        return None


def map_quiz_answer_locally(step: str, value: Any) -> Optional[str]:
    normalized_step = normalize_quiz_step(step)
    text = str(value or "").strip()
    lowered = text.lower()
    if not text:
        return None
    if is_skip_answer(text):
        return "Skip"

    if normalized_step == "experience":
        if any(token in lowered for token in ("no experience", "beginner", "newbie", "novice", "never traded")):
            return "I have no experience"
        if "less" in lowered or "under" in lowered or "few month" in lowered:
            return "Less than 1 year"
        if ("1" in lowered and "2" in lowered) or "one" in lowered or "two" in lowered:
            return "1-2 years"
        if "2" in lowered and "5" in lowered:
            return "2-5 years"
        if any(token in lowered for token in ("more than 5", "over 5", "5+", "six", "seven", "expert")):
            return "More than 5 years"

    if normalized_step == "broker_experience":
        if any(token in lowered for token in ("no broker", "not worked", "never", "none", "haven't", "have not")):
            return "I have not worked with a broker"
        for option in ("Broker 1", "Broker 2", "Broker 3"):
            if option.lower() in lowered:
                return option
        if "other" in lowered or "another" in lowered:
            return "Other broker"

    if normalized_step == "capital":
        amount = _extract_amount(lowered)
        if amount is not None:
            if amount <= 100:
                return "Up to $100"
            if amount <= 1000:
                return "$100-$1,000"
            if amount <= 10000:
                return "$1,000-$10,000"
            if amount <= 100000:
                return "$10,000-$100,000"
            return "$100,000+"

    for option in get_quiz_options(normalized_step):
        if option.lower() == lowered:
            return option
    return None


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
