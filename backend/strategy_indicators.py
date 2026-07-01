from typing import Any, Dict, Iterable, List, Set


def _alias(value: Any) -> str:
    return (
        str(value or "")
        .strip()
        .upper()
        .replace(" ", "")
        .replace("_", "")
        .replace("-", "")
    )


INDICATOR_ALIAS_GROUPS = {
    "BB": {"BB", "BOLLINGERBANDS", "BOLLINGERBAND"},
    "STOCH": {"STOCH", "STOCHASTIC"},
    "PSAR": {"PSAR", "PARABOLICSAR"},
    "PIVOT_POINTS_HL": {"PIVOTPOINTSHL", "PIVOTPOINTS", "PIVOTPOINT"},
    "FIBONACCI": {"FIBONACCI", "FIBONACCIRETRACEMENT"},
    "EMA9_21": {"EMA921", "EMA9_21"},
}


CANONICAL_DISPLAY_KEYS = {
    "BB": "BB",
    "STOCH": "STOCH",
    "PSAR": "PSAR",
    "PIVOT_POINTS_HL": "PIVOT_POINTS_HL",
    "FIBONACCI": "FIBONACCI",
    "EMA9_21": "EMA9_21",
}


def normalize_indicator_keys(raw_keys: Iterable[Any]) -> List[str]:
    normalized: List[str] = []
    seen = set()
    for raw_key in raw_keys or []:
        key = str(raw_key or "").strip()
        if not key:
            continue
        upper_key = key.upper()
        if upper_key in seen:
            continue
        seen.add(upper_key)
        normalized.append(upper_key)
    return normalized


def choose_effective_indicator_keys(client_keys: Iterable[Any], database_keys: Iterable[Any]) -> List[str]:
    db_keys = normalize_indicator_keys(database_keys)
    if db_keys:
        return db_keys
    return normalize_indicator_keys(client_keys)


def _aliases_for_key(key: Any) -> Set[str]:
    normalized = _alias(key)
    aliases = {normalized}
    for canonical, group in INDICATOR_ALIAS_GROUPS.items():
        group_aliases = {_alias(item) for item in group}
        if normalized == _alias(canonical) or normalized in group_aliases:
            aliases.add(_alias(canonical))
            aliases.update(group_aliases)
            break
    return aliases


def _display_key(key: str) -> str:
    normalized = _alias(key)
    for canonical, display in CANONICAL_DISPLAY_KEYS.items():
        if normalized in _aliases_for_key(canonical):
            return display
    return key.upper()


def _clone_indicator(indicator: Any) -> Dict[str, Any]:
    if isinstance(indicator, dict):
        return dict(indicator)
    return {"value": indicator, "signal": "NEUTRAL"}


def _recalculate_votes(indicators: Dict[str, Any]) -> Dict[str, int]:
    votes = {"BUY": 0, "SELL": 0, "NEUTRAL": 0}
    for item in indicators.values():
        signal = str(item.get("signal") if isinstance(item, dict) else "").strip().upper()
        if signal not in votes:
            signal = "NEUTRAL"
        votes[signal] += 1
    return votes


def _recalculate_weighted_scores(indicators: Dict[str, Any]) -> Dict[str, float]:
    scores = {"buy": 0.0, "sell": 0.0, "neutral": 0.0}
    for item in indicators.values():
        if not isinstance(item, dict):
            continue
        signal = str(item.get("signal") or "NEUTRAL").strip().upper()
        try:
            weight = float(item.get("weight", 1))
        except (TypeError, ValueError):
            weight = 1.0
        if signal == "BUY":
            scores["buy"] += weight
        elif signal == "SELL":
            scores["sell"] += weight
        else:
            scores["neutral"] += weight
    return {key: round(value, 3) for key, value in scores.items()}


def align_analysis_indicators_to_strategy(analysis_data: Dict[str, Any], allowed_keys: Iterable[Any]) -> Dict[str, Any]:
    if not isinstance(analysis_data, dict):
        return analysis_data
    configured_keys = normalize_indicator_keys(allowed_keys)
    if not configured_keys:
        return analysis_data
    source = analysis_data.get("indicators")
    if not isinstance(source, dict):
        source = {}

    source_by_alias: Dict[str, Any] = {}
    for source_key, source_value in source.items():
        for alias in _aliases_for_key(source_key):
            source_by_alias.setdefault(alias, source_value)

    aligned: Dict[str, Any] = {}
    for configured_key in configured_keys:
        display_key = _display_key(configured_key)
        matched_value = None
        for alias in _aliases_for_key(configured_key):
            if alias in source_by_alias:
                matched_value = source_by_alias[alias]
                break
        if matched_value is not None:
            aligned[display_key] = _clone_indicator(matched_value)

    analysis_data["indicators"] = aligned
    analysis_data["votes"] = _recalculate_votes(aligned)
    analysis_data["weighted_scores"] = _recalculate_weighted_scores(aligned)
    return analysis_data
