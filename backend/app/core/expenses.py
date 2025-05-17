from sqlalchemy import and_, func, or_, true, false
from sqlalchemy.orm import Query, Session
from sqlalchemy.sql.elements import ColumnElement

from app.models.expense import Expense
from app.models.income import Income
from app.models.transaction import Transaction
from app.schemas.core import TransactionFilter


def apply_transaction_filters(
    model: Expense | Income,
    filters: list[list[TransactionFilter]],
    db: Session,
    *,
    include_currently_selected: bool = False,
) -> Query[Transaction]:
    """
    Apply the given filters to the given Expense/Income.

    Args:
        model: The Expense/Income whose filters are being applied.
        filters: The filters to apply to the expense.
        db: The database session.
        include_currently_selected Whether to include Transactions which
            are already associated with this Expense.

    Returns:
        A query of Transactions which meet the filter criteria.
    """

    if not filters:
        return db.query(Transaction).filter(false())

    def get_filter_clause(filter: TransactionFilter, /) -> ColumnElement[bool]:
        field = (
            Transaction.description
            if filter.on == 'description'
            else Transaction.note
        )
        if filter.type == 'regex':
            return func.regex_match(field, filter.value)

        return field.contains(filter.value)

    # Top level filters are ORed together, inner filters are ANDed together
    filter_clauses = or_(*[
        and_(*[get_filter_clause(filter) for filter in filter_group])
        for filter_group in filters
    ])

    if isinstance(model, Expense):
        account_id = model.from_account_id
        start_date = model.start_date
        end_date = model.end_date
        associated_field = Transaction.expense_id
        other_field = Transaction.income_id
    else:
        account_id = model.account_id
        start_date = model.start_date
        end_date = model.end_date
        associated_field = Transaction.income_id
        other_field = Transaction.expense_id

    return (
        db.query(Transaction)
            .filter(
                # Apply Expense Transaction filters
                filter_clauses,
                # Transactions must be from the correct Account
                Transaction.account_id == account_id,
                # May not be already associated with a model of the same type
                (
                    true()
                    if include_currently_selected
                    else associated_field.is_(None)
                ),
                # Must not be associated with a model of the other type
                other_field.is_(None),
                # Only apply to Transactions occurring after the start date
                Transaction.date >= start_date,
                # Only apply to Transactions occurring before the end date
                true() if end_date is None else Transaction.date <= end_date,
            )
    )
