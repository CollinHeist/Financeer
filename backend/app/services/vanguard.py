from io import StringIO

import numpy as np
import pandas as pd

from app.models.upload import Upload
from app.schemas.transaction import NewTransactionSchema


def get_first_row(stream: StringIO, /) -> int:
    """
    Get the first row of the CSV file that contains the header.

    Args:
        stream: The stream to read from.

    Returns:
        The first row of the CSV file that contains the header.
    """

    header_row = 0
    for line_number, line in enumerate(stream):
        columns = {col.strip() for col in line.split(',')}
        if set(['Trade Date', 'Transaction Type', 'Net Amount']) <= columns:
            header_row = line_number
            break

    # Reset the stream to the beginning
    stream.seek(0)
    return header_row


def parse_vanguard_upload(upload: Upload) -> list[NewTransactionSchema]:
    """
    Parse an Vanguard Upload into a list of new Transactions.

    Args:
        upload: The Upload to parse.

    Returns:
        A list of NewTransactionSchemas.
    """

    # Parse the raw Upload data into a CSV stream
    file_stream = StringIO(upload.data.decode('utf-8'))
    df = pd.read_csv(
        file_stream,
        # Columns are Trade Date, Transaction Type, Net Amount
        skiprows=get_first_row(file_stream),
        header=0,
        usecols=[
            'Trade Date',
            'Transaction Type',
            'Transaction Description',
            'Net Amount',
        ],
        parse_dates=['Trade Date'],
    ).replace({np.nan: None})

    # Convert the Amount column to floats - convert NaN to 0 and then remove
    df['Net Amount'] = df['Net Amount'].fillna(0).astype(float)
    df = df.loc[(df['Net Amount'] != 0)]

    # Remove non deposit/withdrawal transactions
    df = df.loc[
        # These are used for brokerage transactions
        (df['Transaction Type'] == 'Funds Received')
        | (df['Transaction Type'] == 'Withdrawal')
        # Contributions are used for ROTH IRA deposits
        | (df['Transaction Type'] == 'Contribution')
    ]

    return [
        NewTransactionSchema(
            date=row['Trade Date'],
            description=row['Transaction Description'],
            note='',
            amount=row['Net Amount'],
            account_id=upload.account_id,
        )
        for _, row in df.iterrows()
    ]
