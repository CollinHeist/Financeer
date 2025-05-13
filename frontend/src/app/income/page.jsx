import { Suspense } from "react";
import { title } from "@/components/primitives";
import IncomesByAccount from "@/components/IncomesByAccount";

export default function IncomePage() {
  return (
    <div>
      <h1 className={title()}>Income</h1>
      <div className="space-y-8">
        <Suspense fallback={<div>Loading...</div>}>
          <IncomesByAccount />
        </Suspense>
      </div>
    </div>
  );
}
