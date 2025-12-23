import { useMemo } from 'react';
import { CalendarDays, DollarSign, Target, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Strategy, Debt, STRATEGY_LABELS, STRATEGY_DESCRIPTIONS } from '@/types/debt';
import { Lightbulb } from 'lucide-react';

const STRATEGY_GUIDANCE: Record<Strategy, { title: string; description: string; worksWell: string[] }> = {
  SNOWBALL_LOWEST_BALANCE: {
    title: 'Best if you want momentum.',
    description: 'Paying off smaller balances first helps you see progress quickly and stay motivated.',
    worksWell: [
      'You feel overwhelmed by multiple balances',
      'Motivation matters more than math',
      'You want fast, visible wins',
    ],
  },
  AVALANCHE_HIGHEST_APR: {
    title: 'Best if you want to save the most money.',
    description: 'This strategy minimizes interest paid over time, even if progress feels slower at first.',
    worksWell: [
      "You're comfortable staying patient",
      'You want the most efficient payoff',
      'Interest rates vary widely',
    ],
  },
  ORDER_ENTERED: {
    title: 'Best if you have personal priorities.',
    description: 'You control the order, regardless of balance or interest rate.',
    worksWell: [
      'Certain debts feel more urgent',
      'You want full control',
      "Your priorities aren't purely financial",
    ],
  },
  NO_SNOWBALL: {
    title: 'Best for short-term stability.',
    description: "You'll pay only the minimum on each debt without accelerating payoff.",
    worksWell: [
      'Cash flow is tight',
      "You're in a temporary holding phase",
      'Flexibility matters more than speed',
    ],
  },
  CUSTOM_HIGHEST_FIRST: {
    title: 'Best if your situation is unique.',
    description: 'You manually rank debts based on what matters most to you.',
    worksWell: [
      'You want flexibility',
      "You're managing special circumstances",
      "You're comfortable setting ranks yourself",
    ],
  },
  CUSTOM_LOWEST_FIRST: {
    title: 'Best if your situation is unique.',
    description: 'You manually rank debts based on what matters most to you.',
    worksWell: [
      'You want flexibility',
      "You're managing special circumstances",
      "You're comfortable setting ranks yourself",
    ],
  },
};
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

          {/* Strategy Guidance */}
          <div className="mt-4 p-3 rounded-lg bg-muted/50 space-y-2">
            <p className="text-sm font-medium text-foreground">
              {STRATEGY_GUIDANCE[strategy].title}
            </p>
            <p className="text-xs text-muted-foreground">
              {STRATEGY_GUIDANCE[strategy].description}
            </p>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Works well when:</p>
              <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                {STRATEGY_GUIDANCE[strategy].worksWell.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tip Callout */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
        <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Tip</p>
          <p>
            The best strategy is the one you can stick with.
            Snowball helps with motivation. Avalanche saves the most money.
            You can switch strategies anytime.
          </p>
        </div>
      </div>

    </div>
  );
};
