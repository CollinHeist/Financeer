'use client';

import { useCallback, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createLinkToken, exchangePublicToken, getPlaidAccounts, getStoredAccessToken } from '@/lib/api/plaid';
import { createAccount } from '@/lib/api/accounts';

export default function PlaidLink() {
  const [token, setToken] = useState(null);
  const queryClient = useQueryClient();

  // Get link token
  const { data: linkToken, isLoading: isLinkTokenLoading } = useQuery({
    queryKey: ['plaidLinkToken'],
    queryFn: createLinkToken,
    enabled: !token,
  });

  // Get stored access token
  const { data: accessToken, isLoading: isAccessTokenLoading } = useQuery({
    queryKey: ['plaidAccessToken'],
    queryFn: getStoredAccessToken,
  });

  // Exchange public token mutation
  const exchangeTokenMutation = useMutation({
    mutationFn: exchangePublicToken,
    onSuccess: async (accessToken) => {
      // Get accounts from Plaid
      const plaidAccounts = await getPlaidAccounts(accessToken);
      
      // Create accounts in our system
      for (const account of plaidAccounts) {
        await createAccount({
          name: account.name,
          type: account.type.toLowerCase(),
          account_number: account.mask,
          balance: {
            date: new Date().toISOString().split('T')[0],
            balance: account.balances.current || 0
          }
        });
      }

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['plaidAccessToken']);
    }
  });

  const onSuccess = useCallback(async (publicToken) => {
    await exchangeTokenMutation.mutateAsync(publicToken);
  }, [exchangeTokenMutation]);

  const config = {
    token: linkToken,
    onSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  if (isLinkTokenLoading || isAccessTokenLoading) {
    return <Button disabled>Loading...</Button>;
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={() => open()}
        disabled={!ready}
        className="w-full"
      >
        Connect a Bank Account
      </Button>

      {/* {accessToken && <PlaidTransactions accessToken={accessToken} />} */}
    </div>
  );
} 