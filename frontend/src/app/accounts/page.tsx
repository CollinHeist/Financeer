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
      <h1 className={title()}>Accounts</h1>
      <div className="space-y-8"></div>

      <Suspense fallback={<div>Loading...</div>}>
        <AccountList />
      </Suspense>
    </div>
  );
};
