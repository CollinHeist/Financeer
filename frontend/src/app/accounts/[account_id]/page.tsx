'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { title } from "@/components/primitives";
import { Suspense } from "react";
import AccountSummary from "@/components/AccountSummary";
import { getAccount } from '@/lib/api';


export default function AccountPage() {
  const { account_id } = useParams();
  const [accountData, setAccountData] = useState(null);

  useEffect(() => {
    async function fetchAccount() {
      const res = await getAccount(account_id);
      setAccountData(res);
    }

    if (account_id) fetchAccount();
  }, [account_id]);

  if (!accountData) return <p>Loading...</p>;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Account Details</h1>
      <AccountSummary data={accountData} />

      <h2 className="text-xl font-bold">Upcoming Expenses</h2>
    </div>
  );
};
