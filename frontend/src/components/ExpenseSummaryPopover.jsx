'use client';

import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { IconExternalLink } from "@tabler/icons-react";
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
  className
}) {
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
            <h4 className="font-medium text-red-600">{expense.name}</h4>
            <span className="text-sm text-muted-foreground">
              <a href="/expenses" className="hover:underline flex items-center gap-1">
                View Expenses
                <IconExternalLink size={14} />
              </a>
            </span>
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