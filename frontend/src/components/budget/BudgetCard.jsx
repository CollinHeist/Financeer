import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { getBudgetStatus, deleteBudget } from '@/lib/api';
import EditBudgetDialog from './EditBudgetDialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

export default function BudgetCard({ budget, onUpdate }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: status } = useQuery({
    queryKey: ['budget-status', budget.id],
    queryFn: () => getBudgetStatus(budget.id),
  });

  const { mutate: handleDelete } = useMutation({
    mutationFn: () => deleteBudget(budget.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };

  const handleBudgetUpdated = () => {
    setIsEditDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['budget-status', budget.id] });
    onUpdate();
  };

  const utilizationPercentage = status?.utilization_percentage || 0;
  const progressColor = utilizationPercentage > 100 ? 'destructive' : 'default';

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold">{budget.name}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this budget?')) {
                      handleDelete();
                    }
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-muted-foreground mt-1">{budget.description}</p>

          <div className="mt-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Budget: ${budget.amount.toFixed(2)}
            </p>
            {status && (
              <>
                <p className="text-sm text-muted-foreground">
                  Spent: ${status.spent_amount.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Remaining: ${status.remaining_amount.toFixed(2)}
                </p>
                <div className="space-y-1">
                  <Progress value={Math.min(utilizationPercentage, 100)} className={progressColor} />
                  <p className="text-xs text-muted-foreground">
                    {utilizationPercentage.toFixed(1)}% utilized
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this budget?')) {
                handleDelete();
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </CardFooter>
      </Card>

      <EditBudgetDialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onUpdated={handleBudgetUpdated}
        budget={budget}
      />
    </>
  );
} 