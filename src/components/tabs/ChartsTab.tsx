import { useState, useMemo } from 'react';
import { CalculationResult, Debt } from '@/types/debt';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChartsTabProps {
  calculationResult: CalculationResult | null;
  debts: Debt[];
}

type ChartType = 'balance' | 'debts' | 'interest';

const CHART_COLORS = [
  'hsl(174, 62%, 35%)',
  'hsl(142, 70%, 40%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 72%, 51%)',
  'hsl(262, 80%, 50%)',
  'hsl(200, 70%, 50%)',
  'hsl(320, 70%, 50%)',
  'hsl(60, 70%, 40%)',
];

export const ChartsTab = ({ calculationResult, debts }: ChartsTabProps) => {
  const [chartType, setChartType] = useState<ChartType>('balance');
  const [visibleDebts, setVisibleDebts] = useState<Set<string>>(new Set(debts.map(d => d.id)));

  const activeDebts = debts.filter(d => d.active && d.balance > 0);

  const toggleDebt = (debtId: string) => {
    const newVisible = new Set(visibleDebts);
    if (newVisible.has(debtId)) {
      newVisible.delete(debtId);
    } else {
      newVisible.add(debtId);
    }
    setVisibleDebts(newVisible);
  };

  const balanceData = useMemo(() => {
    if (!calculationResult) return [];
    
    // Sample every nth point for performance if there are many months
    const schedule = calculationResult.schedule;
    const step = schedule.length > 60 ? Math.ceil(schedule.length / 60) : 1;
    
    return schedule
      .filter((_, index) => index % step === 0 || index === schedule.length - 1)
      .map((row) => ({
        month: row.monthNumber,
        date: format(parseISO(row.date), 'MMM yy'),
        balance: row.totalRemainingBalance,
      }));
  }, [calculationResult]);

  const debtBreakdownData = useMemo(() => {
    if (!calculationResult) return [];
    
    const schedule = calculationResult.schedule;
    const step = schedule.length > 60 ? Math.ceil(schedule.length / 60) : 1;
    
    return schedule
      .filter((_, index) => index % step === 0 || index === schedule.length - 1)
      .map((row) => {
        const dataPoint: Record<string, any> = {
          month: row.monthNumber,
          date: format(parseISO(row.date), 'MMM yy'),
        };
        
        row.debtDetails.forEach((detail) => {
          if (visibleDebts.has(detail.debtId)) {
            dataPoint[detail.debtName] = detail.endingBalance;
          }
        });
        
        return dataPoint;
      });
  }, [calculationResult, visibleDebts]);

  const interestData = useMemo(() => {
    if (!calculationResult) return [];
    
    let cumulative = 0;
    const schedule = calculationResult.schedule;
    const step = schedule.length > 60 ? Math.ceil(schedule.length / 60) : 1;
    
    const allData = schedule.map((row) => {
      const monthlyInterest = row.debtDetails.reduce((sum, d) => sum + d.interest, 0);
      cumulative += monthlyInterest;
      return {
        month: row.monthNumber,
        date: format(parseISO(row.date), 'MMM yy'),
        cumulative,
      };
    });
    
    return allData.filter((_, index) => index % step === 0 || index === allData.length - 1);
  }, [calculationResult]);

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  if (!calculationResult || calculationResult.schedule.length === 0) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Card className="shadow-soft">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              No data to chart. Add debts and configure your strategy to see visualizations.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Chart Type Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'balance', label: 'Total Balance' },
          { id: 'debts', label: 'By Debt' },
          { id: 'interest', label: 'Interest Paid' },
        ].map(({ id, label }) => (
          <Button
            key={id}
            variant={chartType === id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType(id as ChartType)}
            className="whitespace-nowrap"
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Debt Toggle (for debt breakdown chart) */}
      {chartType === 'debts' && (
        <Card className="shadow-soft">
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-3">
              {activeDebts.map((debt, index) => (
                <div key={debt.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={debt.id}
                    checked={visibleDebts.has(debt.id)}
                    onCheckedChange={() => toggleDebt(debt.id)}
                  />
                  <Label
                    htmlFor={debt.id}
                    className="text-xs cursor-pointer flex items-center gap-1"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    {debt.name}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      <Card className="shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {chartType === 'balance' && 'Total Remaining Balance'}
            {chartType === 'debts' && 'Balance by Debt'}
            {chartType === 'interest' && 'Cumulative Interest Paid'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'balance' ? (
                <AreaChart data={balanceData}>
                  <defs>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(174, 62%, 35%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(174, 62%, 35%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={50}
                  />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Balance']}
                    contentStyle={{
                      backgroundColor: 'hsl(0, 0%, 100%)',
                      border: '1px solid hsl(210, 20%, 90%)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="hsl(174, 62%, 35%)"
                    strokeWidth={2}
                    fill="url(#balanceGradient)"
                  />
                </AreaChart>
              ) : chartType === 'debts' ? (
                <LineChart data={debtBreakdownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={50}
                  />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toFixed(2)}`]}
                    contentStyle={{
                      backgroundColor: 'hsl(0, 0%, 100%)',
                      border: '1px solid hsl(210, 20%, 90%)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '10px' }}
                    iconType="circle"
                    iconSize={8}
                  />
                  {activeDebts
                    .filter((d) => visibleDebts.has(d.id))
                    .map((debt, index) => (
                      <Line
                        key={debt.id}
                        type="monotone"
                        dataKey={debt.name}
                        stroke={CHART_COLORS[index % CHART_COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                </LineChart>
              ) : (
                <AreaChart data={interestData}>
                  <defs>
                    <linearGradient id="interestGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={50}
                  />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Total Interest']}
                    contentStyle={{
                      backgroundColor: 'hsl(0, 0%, 100%)',
                      border: '1px solid hsl(210, 20%, 90%)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke="hsl(0, 72%, 51%)"
                    strokeWidth={2}
                    fill="url(#interestGradient)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
