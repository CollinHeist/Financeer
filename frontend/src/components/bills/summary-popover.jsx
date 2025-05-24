import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { IconReceipt2 } from "@tabler/icons-react";

import { formatAmount } from "@/lib/utils";

export default function BillSummaryPopover({ bill, transaction }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-blue-600 hover:text-blue-700"
          >
            <IconReceipt2 className="h-4 w-4" />
            {bill?.name || 'Loading...'}
          </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px]">
        <div className="space-y-2">
          <h4 className="font-medium">{bill.name}</h4>
          <div className="text-sm text-muted-foreground">{bill.description}</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Amount:</div>
            <div className="text-right">{formatAmount(bill.amount)}</div>
            <div>Type:</div>
            <div className="text-right capitalize">{bill.type}</div>
            {bill.frequency && (
              <>
                <div>Frequency:</div>
                <div className="text-right">
                  Every {bill.frequency.value} {bill.frequency.unit}
                </div>
              </>
            )}
            <div>Start Date:</div>
            <div className="text-right">
              {new Date(bill.start_date).toLocaleDateString()}
            </div>
            {bill.end_date && (
              <>
                <div>End Date:</div>
                <div className="text-right">
                  {new Date(bill.end_date).toLocaleDateString()}
                </div>
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 