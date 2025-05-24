from sqlalchemy import and_, func, or_, true, false
from sqlalchemy.orm import Query, Session
from sqlalchemy.sql.elements import ColumnElement

from app.models.bill import Bill
from app.models.income import Income
from app.models.expense import Expense
from app.models.transfer import Transfer
from app.models.transaction import Transaction
from app.schemas.core import TransactionFilter


def _get_account_filter(
    model: Bill | Expense | Income | Transfer,
) -> ColumnElement[bool]:
    """
    Get the SQLAlchemy filter clause for the Account of a given
    Bill/Expense/Income/Transfer.
    """

    if isinstance(model, Transfer):
        return or_(
            Transaction.account_id == model.from_account_id,
            Transaction.account_id == model.to_account_id,
        )

    return Transaction.account_id == model.account_id


def _get_transaction_filters(
    filters: list[list[TransactionFilter]]
) -> ColumnElement[bool]:
    """
    Get the SQLAlchemy filter clause for a given list of Transaction
    Filters.

    Args:
        filters: A list of lists of TransactionFilters.

    Returns:
        A SQLAlchemy filter clause. The top level filters are ORed
        together, inner filters are ANDed together.
    """

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
    return or_(*[
        and_(*[get_filter_clause(filter) for filter in filter_group])
        for filter_group in filters
    ])


def _get_date_filter(
    model: Bill | Expense | Income | Transfer,
) -> ColumnElement[bool]:
    """
    Get the SQLAlchemy filter clause for the date range of a given
    Bill/Expense/Income/Transfer.
    """

    if isinstance(model, Expense):
        return Expense.is_active.is_(True)

    return and_(
        Transaction.date >= model.start_date,
        (
            true()
            if model.end_date is None
            else Transaction.date <= model.end_date
        )
    )


def _get_unassociated_filter(
    model: Bill | Expense | Income | Transfer,
    include_currently_selected: bool,
) -> ColumnElement[bool]:
    """
    Get the SQLAlchemy filter clause for the unassociated Transactions
    of a given Bill/Expense/Income/Transfer. This filters out
    Transactions which are already associated with any model.
    """

    # Determine the filter fields based on the model type
    if isinstance(model, Bill):
        associated_field = Transaction.bill_id
    elif isinstance(model, Expense):
        associated_field = Transaction.expense_id
    elif isinstance(model, Income):
        associated_field = Transaction.income_id
    elif isinstance(model, Transfer):
        associated_field = Transaction.transfer_id

    # Deteremine filter condition for unassociated other field types
    fields = {
        Transaction.bill_id,
        Transaction.expense_id,
        Transaction.income_id,
        Transaction.transfer_id,
    }
    unassociated_fields = and_(*[
        field.is_(None) for field in fields - {associated_field}
    ])

    return and_(
        (
            true()
            if include_currently_selected
            else associated_field.is_(None)
        ),
        # Must not be associated with a model of the other type
        unassociated_fields,
    )


def apply_transaction_filters(
    model: Bill | Expense | Income | Transfer,
    filters: list[list[TransactionFilter]],
    db: Session,
    *,
    include_currently_selected: bool = False,
) -> Query[Transaction]:
    """
    Apply the given Bill/Expense/Income/Transfer's filters to all
    Transctions in the database.

    Args:
        model: The item whose filters are being applied.
        filters: The filters to apply to the item.
        db: The database session.
        include_currently_selected Whether to include Transactions which
            are already associated with this item.

    Returns:
        A query of Transactions which meet the filter criteria.
    """

    if not filters:
        return db.query(Transaction).filter(false())

    return (
        db.query(Transaction)
            .filter(
                # Apply Bill Transaction filters
                _get_transaction_filters(filters),
                # Transactions must be from the correct Account
                _get_account_filter(model),
                # Transactions must be active on this date
                _get_date_filter(model),
                # May not be already associated with a model of the same type
                _get_unassociated_filter(model, include_currently_selected),
            )
    )
