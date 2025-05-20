'use client';

import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { IconExternalLink, IconTrash, IconArrowsDiff } from "@tabler/icons-react";
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { patchTransaction, getTransferById } from '@/lib/api';

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export default function TransferSummaryPopover({ 
  transfer_id,
  trigger = null,
  className,
  transaction
}) {
  const queryClient = useQueryClient();

  const { data: transfer, isLoading } = useQuery({
    queryKey: ['transfer', transfer_id],
    queryFn: () => getTransferById(transfer_id),
    enabled: !!transfer_id
  });

  const handleRemoveAssignment = async () => {
    try {
      await patchTransaction(transaction.id, {
        expense_id: null,
        income_id: null,
        transfer_id: null,
      });
      await queryClient.invalidateQueries(['transactions']);
    } catch (error) {
      console.error('Failed to remove category assignment:', error);
    }
  };

  if (!transfer_id || isLoading) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger || (
          <Button 
            variant="ghost" 
            size="sm"
            className={cn("text-blue-600 hover:text-blue-700", className)}
          >
            <IconArrowsDiff className="h-4 w-4" />
            {transfer?.name || 'Loading...'}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{transfer?.name}</h4>
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
                <a href="/transfers" className="hover:underline flex items-center gap-1">
                  View Transfers
                  <IconExternalLink size={14} />
                </a>
              </span>
            </div>
          </div>

          {transfer?.description && transfer.description !== transfer.name && (
            <p className="text-sm text-muted-foreground">
              {transfer.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">From Account</span>
              <p className="font-medium">{transfer?.from_account.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">To Account</span>
              <p className="font-medium">{transfer?.to_account.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Amount</span>
              <p className="font-medium">
                {transfer?.payoff_balance ? 'Card Balance' : formatCurrency(transfer?.amount)}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Date</span>
              <p className="font-medium">{formatDate(transfer?.start_date)}</p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 