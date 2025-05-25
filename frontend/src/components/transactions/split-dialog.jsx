import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { cn, formatAmount } from "@/lib/utils";

import { splitTransaction } from '@/lib/api/transactions';

export function SplitDialog({ transaction, open, onOpenChange, onSuccess }) {
  const [splits, setSplits] = useState([
    { note: '', amount: '' },
    { note: '', amount: '' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const remainingAmount = transaction.amount - splits.reduce((sum, split) => sum + (parseFloat(split.amount) || 0), 0);
  const hasAmountError = remainingAmount > 0.01 || remainingAmount < -0.01;

  const handleAddSplit = () => {
    setSplits([...splits, { note: '', amount: '' }]);
  };

  const handleRemoveSplit = (index) => {
    setSplits(splits.filter((_, i) => i !== index));
  };

  const handleSplitChange = (index, field, value) => {
    const newSplits = [...splits];
    newSplits[index] = { ...newSplits[index], [field]: value };
    setSplits(newSplits);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const splitData = splits.map(split => ({
        note: split.note,
        amount: parseFloat(split.amount),
      }));

      await splitTransaction(transaction.id, splitData);
      toast({
        title: 'Success',
        description: 'Transaction split successfully',
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to split transaction',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Split Transaction</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Original Amount: {formatAmount(transaction.amount.toFixed(2))}</Label>
            <div className="space-y-1">
              <Label className={cn(
                "text-sm",
                hasAmountError ? "text-destructive" : "text-muted-foreground"
              )}>
                Remaining Amount: {remainingAmount < 0 ? "-" : ""}${Math.abs(remainingAmount).toFixed(2)}
              </Label>
              {hasAmountError && (
                <p className="text-sm text-destructive">
                  Split amounts must equal the original amount
                </p>
              )}
            </div>
          </div>
          {splits.map((split, index) => (
            <div key={index} className="grid grid-cols-[2fr,1fr] gap-2">
              <div className="space-y-2">
                {index === 0 && (
                  <Label>Note</Label>
                )}
                <Input
                  value={split.note}
                  onChange={(e) => handleSplitChange(index, 'note', e.target.value)}
                  placeholder="Note"
                />
              </div>
              <div className="space-y-2">
                {index === 0 && (
                  <Label>Amount</Label>
                )}
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={split.amount}
                    onChange={(e) => handleSplitChange(index, 'amount', e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    className="w-[120px]"
                  />
                  {splits.length > 1 && (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveSplit(index)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={handleAddSplit}>
            Add Split
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || remainingAmount <= -0.01 || remainingAmount >= 0.01 || splits.some(split => !split.note || !split.amount)}
          >
            {isLoading ? 'Splitting...' : 'Split Transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
