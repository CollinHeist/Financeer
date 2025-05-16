from sqlalchemy import func, and_, or_
from sqlalchemy.orm import Query, Session
from sqlalchemy.sql.elements import ColumnElement

from app.models.transaction import Transaction
from app.schemas.expense import ExpenseFilter


def apply_expense_filters(
    filters: list[list[ExpenseFilter]],
    db: Session,
) -> Query[Transaction]:
    """
    Apply the given filters to the given Expense.

    Args:
        filters: The filters to apply to the expense.
        db: The database session.

    Returns:
        A query of Transactions which meet the filter criteria.
    """

    def get_filter_clause(filter: ExpenseFilter, /) -> ColumnElement[bool]:
        field = (
            Transaction.description
            if filter.on == 'description'
            else Transaction.note
        )
        if filter.type == 'regex':
            return func.regex_match(field, filter.value)

        return field.contains(filter.value)

    # Top level filters are ORed together, inner filters are ANDed together
    filter_clause = or_(*[
        and_(*[get_filter_clause(filter) for filter in filter_group])
        for filter_group in filters
    ])

    return db.query(Transaction).filter(filter_clause)
