import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Calendar, DollarSign, TrendingDown } from 'lucide-react';
import { CalculationResult, Debt } from '@/types/debt';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface ScheduleTabProps {
  calculationResult: CalculationResult | null;
  debts: Debt[];
}

const ITEMS_PER_PAGE = 12;

export const ScheduleTab = ({ calculationResult, debts }: ScheduleTabProps) => {
  const [filterDebtId, setFilterDebtId] = useState<string>('all');
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const filteredSchedule = useMemo(() => {
    if (!calculationResult) return [];
    if (filterDebtId === 'all') return calculationResult.schedule;
    
    return calculationResult.schedule.filter(row =>
      row.debtDetails.some(d => d.debtId === filterDebtId && d.endingBalance >= 0)
    );
  }, [calculationResult, filterDebtId]);

  const totalPages = Math.ceil(filteredSchedule.length / ITEMS_PER_PAGE);
  const paginatedSchedule = filteredSchedule.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleMonth = (monthNumber: number) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(monthNumber)) {
      newExpanded.delete(monthNumber);
    } else {
      newExpanded.add(monthNumber);
    }
    setExpandedMonths(newExpanded);
  };

  if (!calculationResult || calculationResult.schedule.length === 0) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Card className="shadow-soft">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              No schedule to display. Add debts and configure your strategy to see the payoff schedule.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary Cards - matches DebtsTab hero styling */}
      <div className="gradient-hero rounded-2xl p-5 shadow-hero inner-glow">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-primary-foreground">Payoff Summary</h2>
            <p className="text-sm text-primary-foreground/70">Your projected debt-free timeline</p>
          </div>
          <div className="p-2.5 rounded-xl bg-primary-foreground/15 backdrop-blur-sm">
            <Calendar className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-2 md:p-3 min-w-0">
            <p className="text-xs text-primary-foreground/70 mb-1">Total Interest</p>
            <p className="text-sm md:text-lg font-bold text-primary-foreground font-mono truncate">
              {formatCurrency(calculationResult.totalInterestPaid)}
            </p>
          </div>
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-2 md:p-3 min-w-0">
            <p className="text-xs text-primary-foreground/70 mb-1">Months</p>
            <p className="text-sm md:text-lg font-bold text-primary-foreground font-mono">
              {calculationResult.monthsToPayoff}
            </p>
          </div>
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-2 md:p-3 min-w-0">
            <p className="text-xs text-primary-foreground/70 mb-1">Debt-Free</p>
            <p className="text-sm md:text-lg font-bold text-primary-foreground font-mono truncate">
              {format(parseISO(calculationResult.payoffDate), 'MMM yy')}
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Show:</span>
        <Select value={filterDebtId} onValueChange={setFilterDebtId}>
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Debts</SelectItem>
            {debts.filter(d => d.active).map((debt) => (
              <SelectItem key={debt.id} value={debt.id}>
                {debt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Schedule List */}
      <div className="space-y-2">
        {paginatedSchedule.map((row) => {
          const isExpanded = expandedMonths.has(row.monthNumber);
          const relevantDetails = filterDebtId === 'all'
            ? row.debtDetails
            : row.debtDetails.filter(d => d.debtId === filterDebtId);

          return (
            <Collapsible
              key={row.monthNumber}
              open={isExpanded}
              onOpenChange={() => toggleMonth(row.monthNumber)}
            >
              <Card className={cn('shadow-soft transition-all', isExpanded && 'ring-1 ring-primary/20')}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="py-3 px-4 cursor-pointer hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium text-sm">Month {row.monthNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(row.date), 'MMM yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-medium text-sm">
                          {formatCurrency(row.totalPayment)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Bal: {formatCurrency(row.totalRemainingBalance)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-3 px-4">
                    <div className="border-t border-border pt-3 space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Baseline</span>
                        <span className="font-mono">{formatCurrency(row.baselinePayment)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Extra/Snowball</span>
                        <span className="font-mono text-primary">
                          +{formatCurrency(row.snowballExtra)}
                        </span>
                      </div>
                      <div className="border-t border-border pt-3 space-y-2">
                        {relevantDetails.map((detail) => (
                          <div
                            key={detail.debtId}
                            className="bg-secondary/30 rounded-lg p-2 text-xs"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium truncate max-w-[50%]">
                                {detail.debtName}
                              </span>
                              <span
                                className={cn(
                                  'font-mono font-medium',
                                  detail.endingBalance === 0 && 'text-success'
                                )}
                              >
                                {detail.endingBalance === 0
                                  ? 'PAID OFF!'
                                  : formatCurrency(detail.endingBalance)}
                              </span>
                            </div>
                            <div className="flex gap-4 text-muted-foreground">
                              <span>Int: {formatCurrency(detail.interest)}</span>
                              <span>Pay: {formatCurrency(detail.payment)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
