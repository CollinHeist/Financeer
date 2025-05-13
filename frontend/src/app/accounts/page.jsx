import { title } from "@/components/primitives";
import { Suspense } from "react";
import AccountList from "@/components/AccountList";

export const metadata = {
  title: 'Accounts',
  description: 'Accounts',
}

export default function AccountPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Account Summary</h1>
      
      <Suspense fallback={<div>Loading...</div>}>
        <AccountList />
      </Suspense>
    </div>
  );
};
