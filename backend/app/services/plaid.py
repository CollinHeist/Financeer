from datetime import datetime, timedelta
from typing import List, TypedDict

import plaid
from plaid.api import plaid_api
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.transactions_get_request_options import TransactionsGetRequestOptions

from app.core.config import settings


class Transaction(TypedDict):
    id: str
    account_id: str
    amount: float
    date: datetime
    name: str
    merchant_name: str


class PlaidService:
    def __init__(self):
        # Initialize Plaid client
        configuration = plaid.Configuration(
            host=plaid.Environment.Production,  # Change to Production for live environment
            api_key={
                'clientId': settings.PLAID_CLIENT_ID,
                'secret': settings.PLAID_SECRET,
                'plaid-version': '2020-09-14'
            }
        )
        self.client = plaid_api.PlaidApi(plaid.ApiClient(configuration))


    def create_link_token(self, user_id: str) -> str:
        """
        Create a link token for initializing Plaid Link.
        
        Args:
            user_id: The unique identifier for the user
            
        Returns:
            The link token string
        """

        request = LinkTokenCreateRequest(
            user=LinkTokenCreateRequestUser(
                client_user_id=user_id
            ),
            client_name='Financeer',
            products=[Products("transactions")],
            country_codes=[CountryCode('US')],
            language='en'
        )

        response = self.client.link_token_create(request)
        return response.link_token


    def exchange_public_token(self, public_token: str) -> str:
        """
        Exchange a public token for an access token.
        
        Args:
            public_token: The public token received from Plaid Link
            
        Returns:
            The access token string
        """

        request = ItemPublicTokenExchangeRequest(
            public_token=public_token
        )

        return self.client.item_public_token_exchange(request).access_token


    def get_accounts(self, access_token: str) -> List[dict]:
        """
        Get account information for a given access token.
        
        Args:
            access_token: The access token for the item
            
        Returns:
            List of account information
        """

        request = AccountsGetRequest(access_token=access_token)

        response = self.client.accounts_get(request)

        return [
            {
                "id": account.account_id,
                "name": account.name,
                "type": account.type,
                "subtype": account.subtype,
                "mask": account.mask,
                "balances": {
                    "available": account.balances.available,
                    "current": account.balances.current,
                    "limit": account.balances.limit,
                }
            }
            for account in response.accounts
        ]


    def get_transactions(
        self,
        access_token: str,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        account_ids: list[str] | None = None,
        count: int = 100,
    ) -> list[Transaction]:
        """
        Get all transactions for a given access token between the two
        dates.

        Args:
            access_token: The access token for the item
            start_date: Start date for transactions
            end_date: End date for transactions.
            account_ids: List of account IDs to filter by.
            count: Number of transactions per API call.

        Returns:
            List of transaction data.
        """

        start_date = start_date or datetime.now() - timedelta(days=30)
        end_date = end_date or datetime.now()

        all_transactions, current_offset, total_transactions = [], 0, None
        while True:
            options = TransactionsGetRequestOptions(
                account_ids=account_ids,
                count=count,
                offset=current_offset
            )

            request = TransactionsGetRequest(
                access_token=access_token,
                start_date=start_date.date(),
                end_date=end_date.date(),
                options=options
            )
            response = self.client.transactions_get(request)

            # Store total transactions on first iteration
            if total_transactions is None:
                total_transactions = response.total_transactions

            # Add transactions from this batch
            all_transactions.extend([
                Transaction(
                    id=transaction.transaction_id,
                    account_id=transaction.account_id,
                    amount=-transaction.amount,
                    date=transaction.date,
                    name=transaction.name,
                    merchant_name=transaction.merchant_name,
                )
                for transaction in response.transactions
            ])

            # Break if we've fetched all transactions
            if len(all_transactions) >= total_transactions:
                break

            # Update offset for next batch
            current_offset += count

        return all_transactions
