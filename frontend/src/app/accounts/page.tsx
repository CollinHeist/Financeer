import { title } from "@/components/primitives";
import {Card, CardHeader, CardBody, CardFooter} from "@heroui/card";
import { Suspense } from "react";
import AccountList from "@/components/account";

export const metadata = {
  title: 'Accounts',
  description: 'Accounts',
}


export default function AccountPage() {
  return (
    <div>
      <h1 className={title()}>Accounts</h1>
      <div className="space-y-8"> 

      <Suspense fallback={<div>Loading...</div>}>
        <AccountList />
      </Suspense>
      </div>
    </div>
  );
}
