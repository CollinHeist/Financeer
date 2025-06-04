import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { IconReceipt2, IconExternalLink, IconTrash } from "@tabler/icons-react";
import { useQueryClient } from '@tanstack/react-query';

import { formatAmount, formatDate } from "@/lib/utils";
import { patchTransaction } from '@/lib/api/transactions';
import { toast } from "sonner";

export default function BillSummaryPopover({ bill, transaction }) {
  const queryClient = useQueryClient();

  const handleRemoveAssignment = async () => {
    try {
      await patchTransaction(transaction.id, {bill_id: null});
      await queryClient.invalidateQueries(['transactions']);
    } catch (error) {
      toast.error('Failed to remove bill assignment');
    }
  };

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{bill.name}</h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-600 hover:bg-destructive hover:text-destructive-foreground"
                onClick={handleRemoveAssignment}
              >
                <IconTrash className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                <a href="/bills" className="hover:underline flex items-center gap-1">
                  View Bills
                  <IconExternalLink size={14} />
                </a>
              </span>
            </div>
          </div>
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
              {formatDate(bill.start_date)}
            </div>
            {bill.end_date && (
              <>
                <div>End Date:</div>
                <div className="text-right">
                  {formatDate(bill.end_date)}
                </div>
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 