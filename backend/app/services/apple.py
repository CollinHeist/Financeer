from io import StringIO

import pandas as pd

from app.models.upload import Upload
from app.schemas.transaction import NewTransactionSchema


def parse_apple_upload(upload: Upload) -> list[NewTransactionSchema]:
    """
    Parse an Apple Card Upload into a list of NewTransactionSchemas.

    Args:
        upload: The Upload to parse.

    Returns:
        A list of NewTransactionSchemas.
    """

    # Parse the raw Upload data into a CSV stream
    file_stream = StringIO(upload.data.decode('utf-8'))
    df = pd.read_csv(file_stream)

    # Convert the posting date column to a datetime object
    df['Transaction Date'] = pd.to_datetime(df['Transaction Date'], format='%m/%d/%Y')

    # Convert the Amount column to floats - convert NaN to 0 and then remove
    df['Amount (USD)'] = df['Amount (USD)'].fillna(0).astype(float)
    df = df.loc[(df['Amount (USD)'] != 0)]

    return [
        NewTransactionSchema(
            date=row['Transaction Date'],
            description=row['Description'],
            note=f'{row["Merchant"]} - {row["Category"]}',
            # Apple lists purchases as positive, and payments as negative
            amount=-row['Amount (USD)'],
            account_id=upload.account_id,
        )
        for _, row in df.iterrows()
    ]
