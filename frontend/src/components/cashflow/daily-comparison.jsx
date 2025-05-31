import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { ChartContainer } from '@/components/ui/chart';

import { getAverageDailyExpenses } from '@/lib/api/cashflow';

const chartConfig = {
  historical: {
    label: 'Historical Average',
    theme: {
      light: 'rgb(75, 192, 192)',
      dark: 'rgb(75, 192, 192)',
    },
  },
  current: {
    label: 'Current Month',
    theme: {
      light: 'rgb(255, 99, 132)',
      dark: 'rgb(255, 99, 132)',
    },
  },
};

export default function DailyComparison({ accountId, startDate, endDate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dailyData = await getAverageDailyExpenses(
          accountId,
          format(startDate, 'yyyy-MM-dd'),
          format(endDate, 'yyyy-MM-dd')
        );

        // Aggregate daily totals
        const aggregatedData = dailyData.map((day, index) => {
          const previousDays = dailyData.slice(0, index + 1);
          return {
            day_of_month: day.day_of_month,
            historical_average: previousDays.reduce((sum, d) => sum + d.historical_average, 0),
            current_month: previousDays.reduce((sum, d) => sum + (d.current_month || 0), 0),
          };
        });

        setData(aggregatedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accountId, startDate, endDate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!data) {
    return <div>No data available</div>;
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="w-full p-4">
      <ChartContainer config={chartConfig}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="day_of_month" 
            label={{ value: 'Day of Month', position: 'bottom' }}
          />
          <YAxis tickFormatter={formatCurrency} />
          {/* <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => formatCurrency(value)}
              />
            }
          /> */}
          <Line
            type="monotone"
            dataKey="historical_average"
            name="historical"
            stroke="var(--color-historical)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="current_month"
            name="current"
            stroke="var(--color-current)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
