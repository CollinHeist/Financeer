from io import StringIO

import pandas as pd

from app.models.upload import Upload
from app.schemas.balance import NewBalanceSchema
from app.schemas.transaction import NewTransactionSchema


def parse_iccu_upload(
    upload: Upload
) -> tuple[list[NewBalanceSchema], list[NewTransactionSchema]]:
    """
    Parse an ICCU upload into a list of Balances and Transactions to add
    to the database.

    Args:
        upload: The Upload to parse.

    Returns:
        A tuple of lists of NewBalanceSchemas and NewTransactionSchemas.
    """

    # Parse the raw Upload data into a CSV stream
    file_stream = StringIO(upload.data.decode('utf-8'))
    df = pd.read_csv(file_stream)

    # Convert the posting date column to a datetime object
    df['Posting Date'] = pd.to_datetime(df['Posting Date'], format='%m/%d/%Y')

    def clean_spaces(text):
        if pd.isnull(text):
            return text
        return ' '.join(text.strip().split())

    # Set the extended description to '' if it matches the description
    # Replace multiple spaces with a single space
    df['Description'] = df['Description'].apply(clean_spaces)
    df['Extended Description'] = df['Extended Description'].apply(clean_spaces)
    df.loc[
        df['Description'] == df['Extended Description'],
        'Extended Description'
    ] = ''

    return (
        [
            NewBalanceSchema(
                account_id=upload.account_id,
                date=date,
                # Transactions are listed in reverse chronological 
                # order, so the most recent EOD balance is the first
                # balance in the list
                balance=df.loc[df['Posting Date'] == date, 'Balance'].iloc[0],
            )
            for date in df['Posting Date'].unique()
        ],
        [
            NewTransactionSchema(
                date=row['Posting Date'],
                description=row['Description'],
                note=row['Extended Description'],
                amount=row['Amount'],
                account_id=upload.account_id,
            )
            for _, row in df.iterrows()
        ]
    )
