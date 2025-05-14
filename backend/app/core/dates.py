from datetime import date, timedelta
from typing import Generator

from app.schemas.income import FrequencyDict


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


def date_meets_frequency(
    date: date,
    start_date: date,
    frequency: FrequencyDict,
) -> bool:
    """
    Check if the given date is "aligned" with the given frequency.

    Args:
        date: The date to check.
        start_date: The start date of the frequency.
        frequency: The frequency.

    Returns:
        True if the date is aligned with the frequency, False otherwise.
    """

    unit, value = frequency['unit'], frequency['value']

    if unit == 'days' and (date - start_date).days % value != 0:
        return False

    if unit == 'weeks' and (date - start_date).days % (value * 7) != 0:
        return False

    if (unit == 'months'
        and (
            date.day != start_date.day
            or (date.month - start_date.month) % value != 0
        )):
        return False

    if (unit == 'years'
        and (
            date.day != start_date.day
            or date.month != start_date.month
            or (date.year - start_date.year) % value != 0
        )):
        return False

    return True
