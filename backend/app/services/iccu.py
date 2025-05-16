from io import StringIO

import pandas as pd

from app.models.upload import Upload
from app.schemas.transaction import NewTransactionSchema


def parse_iccu_upload(upload: Upload) -> list[NewTransactionSchema]:
    """
    Parse an ICCU upload into a list of NewTransactionSchemas.

    Args:
        upload: The Upload to parse.

    Returns:
        A list of NewTransactionSchemas.
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

    return [
        NewTransactionSchema(
            date=row['Posting Date'],
            description=row['Description'],
            note=row['Extended Description'],
            amount=row['Amount'],
            account_id=upload.account_id,
        )
        for _, row in df.iterrows()
    ]
