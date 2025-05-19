from io import StringIO

import pandas as pd

from app.models.upload import Upload
from app.schemas.transaction import NewTransactionSchema


def parse_capital_one_upload(upload: Upload) -> list[NewTransactionSchema]:
    """
    Parse an Capital One Upload into a list of NewTransactionSchemas.

    Args:
        upload: The Upload to parse.

    Returns:
        A list of NewTransactionSchemas.
    """

    # Parse the raw Upload data into a CSV stream
    file_stream = StringIO(upload.data.decode('utf-8'))
    df = pd.read_csv(file_stream)

    # Convert the posting date column to a datetime object
    df['Transaction Date'] = pd.to_datetime(
        df['Transaction Date'],
        format='%m/%d/%Y'
    )

    # Convert the Debit and Credit columns to floats - convert NaN to 0
    # remove rows where both are 0
    df['Debit'] = df['Debit'].fillna(0).astype(float)
    df['Credit'] = df['Credit'].fillna(0).astype(float)
    df = df.loc[(df['Debit'] != 0) | (df['Credit'] != 0)]

    return [
        NewTransactionSchema(
            date=row['Date'],
            description=f'{row["Description"]} ({row["Category"]})',
            # Purchases and payments are both positive
            amount=(-row['Debit'] or row['Credit']),
            account_id=upload.account_id,
        )
        for _, row in df.iterrows()
    ]
