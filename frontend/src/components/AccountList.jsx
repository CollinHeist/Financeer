'use client';

import { useQuery } from '@tanstack/react-query';
import {Card, CardHeader, CardBody, Link} from "@heroui/react";
import { getAccounts } from '@/lib/api';

// This is a Client Component that fetches data using React Query
export default function AccountList() {
  const { data: accounts, isLoading, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts
  });

  if (isLoading) {
    return <div className="text-center p-4">Loading accounts...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">Error loading accounts: {error.message}</div>;
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-500">No Accounts found.</p>
        <Link href="/accounts/new" className="mt-4 inline-block text-blue-600 hover:underline">
          Create a new Account
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {accounts.map((account) => {
        return (
          <Link key={account.id} href={`/accounts/${account.id}`} className="block">
            <Card className="py-4 hover:shadow-md transition-shadow">
              <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                <p className="text-tiny uppercase font-bold">{account.type}</p>
                <small className="text-default-500">Account #{account.account_number}</small>
                <h4 className="font-bold text-large">{account.name}</h4>
              </CardHeader>
              <CardBody className="overflow-visible py-2">
                <p className="text-sm">Interest Rate: {account.interest}%</p>
              </CardBody>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
