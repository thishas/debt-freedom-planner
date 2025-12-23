import { useMemo } from 'react';
import { ListOrdered, Info, Target, Snowflake, TrendingDown, Shuffle, Pause } from 'lucide-react';
import { Strategy, Debt, STRATEGY_LABELS, STRATEGY_DESCRIPTIONS } from '@/types/debt';
import { getPayoffOrder } from '@/lib/calculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PayoffOrderTabProps {
  debts: Debt[];
  strategy: Strategy;
}

const STRATEGY_VISUALS: Record<Strategy, { 
  icon: typeof Snowflake;
  gradientClass: string;
  accentClass: string;
  badgeClass: string;
}> = {
  SNOWBALL_LOWEST_BALANCE: {
    icon: Snowflake,
    gradientClass: 'gradient-snowball',
    accentClass: 'text-strategy-snowball',
    badgeClass: 'bg-strategy-snowball/20 text-strategy-snowball border-strategy-snowball/30',
  },
  AVALANCHE_HIGHEST_APR: {
    icon: TrendingDown,
    gradientClass: 'gradient-avalanche',
    accentClass: 'text-strategy-avalanche',
    badgeClass: 'bg-strategy-avalanche/20 text-strategy-avalanche border-strategy-avalanche/30',
  },
  ORDER_ENTERED: {
    icon: ListOrdered,
    gradientClass: 'gradient-neutral',
    accentClass: 'text-strategy-neutral',
    badgeClass: 'bg-strategy-neutral/20 text-strategy-neutral border-strategy-neutral/30',
  },
  NO_SNOWBALL: {
    icon: Pause,
    gradientClass: 'gradient-neutral',
    accentClass: 'text-strategy-neutral',
    badgeClass: 'bg-strategy-neutral/20 text-strategy-neutral border-strategy-neutral/30',
  },
  CUSTOM_HIGHEST_FIRST: {
    icon: Shuffle,
    gradientClass: 'gradient-custom',
    accentClass: 'text-strategy-custom',
    badgeClass: 'bg-strategy-custom/20 text-strategy-custom border-strategy-custom/30',
  },
  CUSTOM_LOWEST_FIRST: {
    icon: Shuffle,
    gradientClass: 'gradient-custom',
    accentClass: 'text-strategy-custom',
    badgeClass: 'bg-strategy-custom/20 text-strategy-custom border-strategy-custom/30',
  },
};

export const PayoffOrderTab = ({ debts, strategy }: PayoffOrderTabProps) => {
  const activeDebts = debts.filter(d => d.active && d.balance > 0);
  const payoffOrder = useMemo(() => getPayoffOrder(debts, strategy), [debts, strategy]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const calculateMonthlyInterest = (balance: number, apr: number) => {
    return balance * (apr / 12);
  };

  const totalBalance = activeDebts.reduce((sum, d) => sum + d.balance, 0);
  const totalMinPayment = activeDebts.reduce((sum, d) => sum + d.minPayment, 0);
  const visuals = STRATEGY_VISUALS[strategy];
  const StrategyIcon = visuals.icon;

  if (activeDebts.length === 0) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Card className="shadow-card border-border/50">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
              <ListOrdered className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Debts to Order</h3>
            <p className="text-sm text-muted-foreground">
              Add debts to see your payoff order.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero Section */}
      <div className="gradient-hero rounded-2xl p-5 shadow-hero inner-glow">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-primary-foreground">Payoff Order</h2>
            <p className="text-sm text-primary-foreground/70">Your path to debt freedom</p>
          </div>
          <div className="p-2.5 rounded-xl bg-primary-foreground/15 backdrop-blur-sm">
            <StrategyIcon className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-xs text-primary-foreground/70 mb-1">Total Debt</p>
            <p className="text-lg font-bold text-primary-foreground">{formatCurrency(totalBalance)}</p>
          </div>
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-xs text-primary-foreground/70 mb-1">Min. Payments</p>
            <p className="text-lg font-bold text-primary-foreground">{formatCurrency(totalMinPayment)}</p>
          </div>
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-xs text-primary-foreground/70 mb-1">Active Debts</p>
            <p className="text-lg font-bold text-primary-foreground">{activeDebts.length}</p>
          </div>
        </div>
      </div>

      {/* Strategy Context */}
      <Card className={cn("shadow-card border-border/50 hover-lift", visuals.gradientClass)}>
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-xl", visuals.gradientClass.includes('snowball') ? 'bg-strategy-snowball/15' : visuals.gradientClass.includes('avalanche') ? 'bg-strategy-avalanche/15' : visuals.gradientClass.includes('custom') ? 'bg-strategy-custom/15' : 'bg-muted')}>
              <StrategyIcon className={cn("w-5 h-5", visuals.accentClass)} />
            </div>
            <div>
              <p className={cn("font-semibold text-sm", visuals.accentClass)}>
                {STRATEGY_LABELS[strategy]}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {STRATEGY_DESCRIPTIONS[strategy]}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payoff Order List */}
      <Card className="shadow-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <ListOrdered className="w-4 h-4 text-primary" />
            </div>
            Payoff Sequence
          </CardTitle>
        </CardHeader>
        <CardContent>
          {strategy === 'NO_SNOWBALL' ? (
            <div className="flex items-start gap-3 p-4 rounded-xl gradient-neutral border border-border/30">
              <div className="p-2 rounded-xl bg-muted">
                <Info className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">No Snowball Active</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Each debt pays only its minimum payment. Extra funds are not redistributed when debts are paid off.
                </p>
              </div>
            </div>
          ) : (
            <ol className="space-y-3">
              {payoffOrder.map((debt, index) => {
                const monthlyInterest = calculateMonthlyInterest(debt.balance, debt.apr);
                const isFirst = index === 0;
                
                return (
                  <li
                    key={debt.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-all hover-lift",
                      isFirst 
                        ? cn(visuals.gradientClass, 'border-2', visuals.badgeClass.split(' ')[2])
                        : 'bg-muted/50 border border-border/30'
                    )}
                  >
                    <span className={cn(
                      "w-9 h-9 rounded-xl text-sm font-bold flex items-center justify-center shrink-0 transition-colors",
                      isFirst 
                        ? 'bg-primary text-primary-foreground shadow-glow' 
                        : 'bg-card text-muted-foreground border border-border'
                    )}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={cn("font-semibold text-sm truncate", isFirst && "text-foreground")}>
                          {debt.name}
                        </p>
                        {isFirst && (
                          <Badge className={cn("text-xs border", visuals.badgeClass)}>
                            Current Target
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">{formatCurrency(debt.balance)}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(debt.apr * 100).toFixed(1)}% APR
                        </p>
                        <p className="text-xs text-warning font-medium">
                          {formatCurrency(monthlyInterest)}/mo interest
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Why This Order Helper */}
      <Card className="shadow-card border-border/50 gradient-card-cyan">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-accent-secondary/10">
              <Info className="w-5 h-5 text-accent-secondary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Why this order?</p>
              <p className="text-xs text-muted-foreground mt-1">
                {strategy === 'SNOWBALL_LOWEST_BALANCE' && 
                  'Debts are ordered from lowest to highest balance. Paying off smaller debts first gives you quick wins and builds momentum.'}
                {strategy === 'AVALANCHE_HIGHEST_APR' && 
                  'Debts are ordered from highest to lowest APR. Targeting high-interest debts first minimizes the total interest you pay.'}
                {strategy === 'ORDER_ENTERED' && 
                  'Debts are paid in the order you entered them. This gives you full control over prioritization.'}
                {strategy === 'CUSTOM_HIGHEST_FIRST' && 
                  'Debts are ordered by your custom rank, highest first. Adjust rankings in the Debts tab.'}
                {strategy === 'CUSTOM_LOWEST_FIRST' && 
                  'Debts are ordered by your custom rank, lowest first. Adjust rankings in the Debts tab.'}
                {strategy === 'NO_SNOWBALL' && 
                  'All debts receive only their minimum payment with no extra redistribution.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
