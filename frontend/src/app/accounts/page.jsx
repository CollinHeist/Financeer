import { Suspense } from "react";

import AccountList from "@/components/AccountList";
import PlaidLink from "@/components/PlaidLink";

export const metadata = {
  title: 'Accounts',
  description: 'Accounts',
}

export default function AccountPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Account Summary</h1>
        <PlaidLink />
      </div>
      
      <Suspense fallback={<div>Loading...</div>}>
        <AccountList />
      </Suspense>
    </div>
  );
};
