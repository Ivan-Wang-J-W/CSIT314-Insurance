"""
User Stories: SA-09
BCE layer: Control
Editor: BeiRui
"""

import data.store as store

ALLOWED_KEYS = frozenset({
    "max_campaign_goal",
    "min_campaign_duration_days",
    "platform_fee_percent",
})


def get_config() -> dict:
    """SA-09: retrieve all platform configuration settings."""
    return store.get_config()


def update_config(key: str, value) -> dict:
    """SA-09: update a single configuration value."""
    if key not in ALLOWED_KEYS:
        raise ValueError(f"Unknown config key '{key}'. Allowed: {sorted(ALLOWED_KEYS)}")
    try:
        value = float(value)
    except (TypeError, ValueError):
        raise ValueError(f"Config value for '{key}' must be a number")
    if value < 0:
        raise ValueError("Config value must be non-negative")
    return store.set_config_value(key, value)
