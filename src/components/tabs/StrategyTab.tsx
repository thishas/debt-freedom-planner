import { useMemo } from 'react';
import { CalendarDays, DollarSign, Target, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Strategy, Debt, STRATEGY_LABELS, STRATEGY_DESCRIPTIONS } from '@/types/debt';
import { validateMonthlyBudget } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface StrategyTabProps {
  debts: Debt[];
  strategy: Strategy;
  monthlyBudget: number;
  balanceDate: string;
  onStrategyChange: (strategy: Strategy) => void;
  onMonthlyBudgetChange: (budget: number) => void;
  onBalanceDateChange: (date: string) => void;
}

export const StrategyTab = ({
  debts,
  strategy,
  monthlyBudget,
  balanceDate,
  onStrategyChange,
  onMonthlyBudgetChange,
  onBalanceDateChange,
}: StrategyTabProps) => {
  const activeDebts = debts.filter(d => d.active && d.balance > 0);
  const validation = useMemo(
    () => validateMonthlyBudget(monthlyBudget, debts),
    [monthlyBudget, debts]
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const parsedDate = balanceDate ? parseISO(balanceDate) : new Date();

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Balance Date */}
      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            Balance Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {format(parsedDate, 'MMMM d, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={parsedDate}
                onSelect={(date) => {
                  if (date) {
                    onBalanceDateChange(format(date, 'yyyy-MM-dd'));
                  }
                }}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-muted-foreground mt-2">
            The starting date for your debt payoff calculation.
          </p>
        </CardContent>
      </Card>

      {/* Monthly Budget */}
      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            Monthly Budget
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={monthlyBudget}
              onChange={(e) => onMonthlyBudgetChange(parseFloat(e.target.value) || 0)}
              className="pl-7 font-mono"
            />
          </div>

          {/* Validation Status */}
          {activeDebts.length > 0 && (
            <div
              className={cn(
                'flex items-start gap-2 p-3 rounded-lg text-sm',
                validation.valid
                  ? 'bg-success/10 text-success'
                  : 'bg-destructive/10 text-destructive'
              )}
            >
              {validation.valid ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Budget is sufficient</p>
                    <p className="text-xs opacity-80">
                      Initial snowball: {formatCurrency(validation.initialSnowball)}/month
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Insufficient budget</p>
                    <p className="text-xs opacity-80">{validation.message}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strategy Selection */}
      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Payoff Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={strategy} onValueChange={(v) => onStrategyChange(v as Strategy)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STRATEGY_LABELS) as Strategy[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STRATEGY_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {STRATEGY_DESCRIPTIONS[strategy]}
          </p>
        </CardContent>
      </Card>

    </div>
  );
};
