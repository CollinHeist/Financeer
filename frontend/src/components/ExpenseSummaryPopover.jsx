'use client';

import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { IconExternalLink, IconTrash } from "@tabler/icons-react";
import { useQueryClient } from '@tanstack/react-query';
import { patchTransaction } from '@/lib/api';

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

export default function ExpenseSummaryPopover({ 
  expense,
  trigger = null,
  className,
  transaction
}) {
  const queryClient = useQueryClient();

  const handleRemoveAssignment = async () => {
    try {
      await patchTransaction(transaction.id, {
        expense_id: null,
        income_id: null,
      });
      await queryClient.invalidateQueries(['transactions']);
    } catch (error) {
      console.error('Failed to remove category assignment:', error);
    }
  };

  if (!expense) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger || (
          <Button 
            variant="ghost" 
            size="sm"
            className={cn("text-red-600 hover:text-red-700", className)}
          >
            {expense.name}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{expense.name}</h4>
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
                <a href="/expenses" className="hover:underline flex items-center gap-1">
                  View Expenses
                  <IconExternalLink size={14} />
                </a>
              </span>
            </div>
          </div>

          {expense.description && expense.description !== expense.name && (
            <p className="text-sm text-muted-foreground">
              {expense.description}
            </p>
          )}

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className={cn(
                "font-medium",
                new Date(expense.end_date) > new Date() || !expense.end_date
                  ? "text-green-600"
                  : "text-red-600"
              )}>
                {new Date(expense.end_date) > new Date() || !expense.end_date
                  ? "Active"
                  : "Inactive"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Date:</span>
              <span>{formatDate(expense.start_date)}</span>
            </div>

            {expense.end_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">End Date:</span>
                <span>{formatDate(expense.end_date)}</span>
              </div>
            )}
          </div>

          {expense.amount && (
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className="text-lg font-semibold text-red-600">
                  {formatCurrency(expense.amount)}
                </span>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
} 