import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBudget } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

export default function EditBudgetDialog({ open, onClose, onUpdated, budget }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    allow_rollover: false,
    max_rollover_amount: '',
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (budget) {
      setFormData({
        name: budget.name,
        description: budget.description,
        amount: budget.amount.toString(),
        allow_rollover: budget.allow_rollover,
        max_rollover_amount: budget.max_rollover_amount?.toString() || '',
      });
    }
  }, [budget]);

  const { mutate: handleSubmit, isPending } = useMutation({
    mutationFn: () => updateBudget(budget.id, {
      ...formData,
      amount: parseFloat(formData.amount),
      max_rollover_amount: formData.max_rollover_amount
        ? parseFloat(formData.max_rollover_amount)
        : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      onUpdated();
    },
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Budget</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter budget name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Enter budget description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              placeholder="Enter budget amount"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="allow_rollover"
              checked={formData.allow_rollover}
              onCheckedChange={(checked) => handleChange('allow_rollover', checked)}
            />
            <Label htmlFor="allow_rollover">Allow Rollover</Label>
          </div>

          {formData.allow_rollover && (
            <div className="space-y-2">
              <Label htmlFor="max_rollover_amount">Max Rollover Amount</Label>
              <Input
                id="max_rollover_amount"
                type="number"
                value={formData.max_rollover_amount}
                onChange={(e) => handleChange('max_rollover_amount', e.target.value)}
                placeholder="Enter max rollover amount"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 