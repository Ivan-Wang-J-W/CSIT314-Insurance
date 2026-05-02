"""
Notification controller — create, fetch, and mark notifications.
BCE layer: Control
"""

import data.store as store


def get_notifications(user_id: str) -> list:
    return store.get_notifications_by_user(user_id)


def mark_read(notif_id: str) -> dict:
    notif = store.update_notification(notif_id, {"read": True})
    if not notif:
        raise ValueError("Notification not found")
    return notif


def mark_all_read(user_id: str) -> None:
    for n in store.get_notifications_by_user(user_id):
        store.update_notification(n["id"], {"read": True})


def push_notification(user_id: str, title: str, message: str,
                      notif_type: str = "info", link: str = None) -> dict:
    return store.create_notification({
        "user_id": user_id,
        "title": title,
        "message": message,
        "notif_type": notif_type,
        "link": link,
        "read": False,
    })
