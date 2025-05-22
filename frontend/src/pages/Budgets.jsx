import { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Button,
    Grid,
    Box,
    CircularProgress,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useApi } from '../hooks/useApi';
import BudgetCard from '../components/budget/BudgetCard';
import CreateBudgetDialog from '../components/budget/CreateBudgetDialog';

export default function Budgets() {
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const { get } = useApi();

    const fetchBudgets = async () => {
        try {
            const response = await get('/budget');
            setBudgets(response.data);
        } catch (error) {
            console.error('Error fetching budgets:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBudgets();
    }, []);

    const handleCreateBudget = () => {
        setIsCreateDialogOpen(true);
    };

    const handleBudgetCreated = () => {
        setIsCreateDialogOpen(false);
        fetchBudgets();
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" component="h1">
                    Budgets
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleCreateBudget}
                >
                    Create Budget
                </Button>
            </Box>

            {budgets.length === 0 ? (
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    minHeight="200px"
                    textAlign="center"
                >
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No budgets created yet
                    </Typography>
                    <Typography color="text.secondary" paragraph>
                        Create your first budget to start tracking your expenses
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleCreateBudget}
                    >
                        Create Budget
                    </Button>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {budgets.map((budget) => (
                        <Grid item xs={12} sm={6} md={4} key={budget.id}>
                            <BudgetCard
                                budget={budget}
                                onUpdate={fetchBudgets}
                            />
                        </Grid>
                    ))}
                </Grid>
            )}

            <CreateBudgetDialog
                open={isCreateDialogOpen}
                onClose={() => setIsCreateDialogOpen(false)}
                onCreated={handleBudgetCreated}
            />
        </Container>
    );
} 