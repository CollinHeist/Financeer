import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllBudgets } from '@/lib/api';
import BudgetCard from './BudgetCard';
import CreateBudgetDialog from './CreateBudgetDialog';
import { Button } from '@/components/ui/button';

export default function Budgets() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: getAllBudgets,
  });

  const { mutate: refetchBudgets } = useMutation({
    mutationFn: getAllBudgets,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const handleCreateBudget = () => {
    setIsCreateDialogOpen(true);
  };

  const handleBudgetCreated = () => {
    setIsCreateDialogOpen(false);
    refetchBudgets();
    toast({
      title: "Success",
      description: "Budget created successfully",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
        <Button onClick={handleCreateBudget}>
          <Plus className="h-4 w-4 mr-2" />
          Create Budget
        </Button>
      </div>

      {budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
          <h2 className="text-xl font-semibold text-muted-foreground mb-2">
            No budgets created yet
          </h2>
          <p className="text-muted-foreground mb-4">
            Create your first budget to start tracking your expenses
          </p>
          <Button onClick={handleCreateBudget}>
            <Plus className="h-4 w-4 mr-2" />
            Create Budget
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onUpdate={refetchBudgets}
            />
          ))}
        </div>
      )}

      <CreateBudgetDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreated={handleBudgetCreated}
      />
    </div>
  );
} 