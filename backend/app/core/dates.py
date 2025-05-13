from datetime import date, timedelta
from typing import Generator


def date_range(start_date: date, end_date: date) -> Generator[date, None, None]:
    """
    Generate a range of dates between start_date and end_date.

    Args:
        start_date: The start date.
        end_date: The end date.

    Returns:
        A generator of dates.
    """

    current_date = start_date
    while current_date <= end_date:
        yield current_date
        current_date += timedelta(days=1)
