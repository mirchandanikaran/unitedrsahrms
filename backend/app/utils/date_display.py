"""Human-readable dates for API responses and exports (DD-MMM-YY, e.g. 26-Jan-25)."""
from datetime import date, datetime
from typing import Union

DateLike = Union[date, datetime, None]

_MONTHS = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")


def format_display_date(d: DateLike) -> str:
    if d is None:
        return ""
    if isinstance(d, datetime):
        d = d.date()
    return f"{d.day:02d}-{_MONTHS[d.month - 1]}-{d.year % 100:02d}"
