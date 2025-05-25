from io import StringIO

import numpy as np
import pandas as pd

from app.models.upload import Upload
from app.schemas.transaction import NewTransactionSchema


def get_note(category: str, memo: str) -> str:
    """Get a note for a transaction from a category and memo."""

    if category and memo:
        return f'{memo} - {category}'
    if not category and not memo:
        return ''
    return category or memo


def parse_chase_upload(upload: Upload) -> list[NewTransactionSchema]:
    """
    Parse an Chase Bank Card Upload into a list of new Transactions.

    Args:
        upload: The Upload to parse.

    Returns:
        A list of NewTransactionSchemas.
    """

    # Parse the raw Upload data into a CSV stream
    file_stream = StringIO(upload.data.decode('utf-8'))
    df = pd.read_csv(file_stream).replace({np.nan: None})

    # Convert the posting date column to a datetime object
    df['Transaction Date'] = pd.to_datetime(
        df['Transaction Date'],
        format='%m/%d/%Y'
    )

    # Convert the Amount column to floats - convert NaN to 0 and then remove
    df['Amount'] = df['Amount'].fillna(0).astype(float)
    df = df.loc[(df['Amount'] != 0)]

    return [
        NewTransactionSchema(
            date=row['Transaction Date'],
            description=row['Description'],
            note=get_note(row['Category'], row['Memo']),
            amount=row['Amount'],
            account_id=upload.account_id,
        )
        for _, row in df.iterrows()
    ]
