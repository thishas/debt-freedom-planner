import { useMemo } from 'react';
import { ListOrdered, Info, Target } from 'lucide-react';
import { Strategy, Debt, STRATEGY_LABELS, STRATEGY_DESCRIPTIONS } from '@/types/debt';
import { getPayoffOrder } from '@/lib/calculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PayoffOrderTabProps {
  debts: Debt[];
  strategy: Strategy;
}

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

  if (activeDebts.length === 0) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Card className="shadow-soft">
          <CardContent className="py-12 text-center">
            <ListOrdered className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Debts to Order</h3>
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
      {/* Strategy Context */}
      <Card className="shadow-soft bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm text-foreground">
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
      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-primary" />
            Payoff Order
          </CardTitle>
        </CardHeader>
        <CardContent>
          {strategy === 'NO_SNOWBALL' ? (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50">
              <Info className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">No Snowball Active</p>
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
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isFirst 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'bg-secondary/50'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center shrink-0 ${
                      isFirst 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{debt.name}</p>
                        {isFirst && (
                          <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-0">
                            Current Target
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-muted-foreground">
                          Balance: {formatCurrency(debt.balance)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          APR: {(debt.apr * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Interest: {formatCurrency(monthlyInterest)}/mo
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
      <Card className="shadow-soft">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm text-foreground">Why this order?</p>
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
