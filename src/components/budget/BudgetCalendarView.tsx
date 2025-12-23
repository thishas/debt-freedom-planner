import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, AlertTriangle, Zap, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BankAccount, 
  BillItem, 
  BillStatus,
  getEffectiveDueDay,
} from '@/types/budget';
import { Debt } from '@/types/debt';
import { cn } from '@/lib/utils';

interface BudgetCalendarViewProps {
  accounts: BankAccount[];
  bills: BillItem[];
  debts: Debt[];
  onUpdateBill: (id: string, updates: Partial<BillItem>) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Get account color based on index
const getAccountColor = (index: number): string => {
  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-cyan-500',
  ];
  return colors[index % colors.length];
};

const getAccountTextColor = (index: number): string => {
  const colors = [
    'text-blue-600 dark:text-blue-400',
    'text-emerald-600 dark:text-emerald-400',
    'text-purple-600 dark:text-purple-400',
    'text-orange-600 dark:text-orange-400',
    'text-pink-600 dark:text-pink-400',
    'text-cyan-600 dark:text-cyan-400',
  ];
  return colors[index % colors.length];
};

interface DayBill extends BillItem {
  accountIndex: number;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  bills: DayBill[];
}

interface RunningBalance {
  accountId: string;
  date: Date;
  balance: number;
  isNegative: boolean;
}

export const BudgetCalendarView = ({
  accounts,
  bills,
  debts,
  onUpdateBill,
}: BudgetCalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterAccountId, setFilterAccountId] = useState<string>('all');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get the first and last day of the current month view
  const { firstDay, lastDay, calendarDays } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Start from the Sunday of the week containing the first day
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // End on the Saturday of the week containing the last day
    const endDate = new Date(lastDayOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days: CalendarDay[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayDate = new Date(current);
      const isCurrentMonth = dayDate.getMonth() === month;
      const isToday = dayDate.toDateString() === today.toDateString();
      
      // Get bills for this day
      const dayBills: DayBill[] = bills
        .filter(bill => {
          if (filterAccountId !== 'all' && bill.payFromAccountId !== filterAccountId) {
            return false;
          }
          
          if (bill.frequency === 'ONE_TIME' && bill.dueDate) {
            const dueDate = new Date(bill.dueDate);
            return dueDate.toDateString() === dayDate.toDateString();
          }
          
          if (bill.frequency === 'MONTHLY' && bill.dueDay) {
            const effectiveDay = getEffectiveDueDay(bill.dueDay, dayDate.getMonth(), dayDate.getFullYear());
            return dayDate.getDate() === effectiveDay && isCurrentMonth;
          }
          
          return false;
        })
        .map(bill => ({
          ...bill,
          accountIndex: accounts.findIndex(a => a.id === bill.payFromAccountId),
        }));
      
      days.push({
        date: dayDate,
        isCurrentMonth,
        isToday,
        bills: dayBills,
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return {
      firstDay: firstDayOfMonth,
      lastDay: lastDayOfMonth,
      calendarDays: days,
    };
  }, [currentDate, bills, accounts, filterAccountId, today]);

  // Calculate running balances for warning indicators
  const runningBalances = useMemo(() => {
    const balances: Map<string, RunningBalance[]> = new Map();
    
    accounts.forEach(account => {
      const accountBills = bills
        .filter(b => b.payFromAccountId === account.id && b.status === 'PLANNED')
        .map(bill => {
          let dueDate: Date;
          if (bill.frequency === 'ONE_TIME' && bill.dueDate) {
            dueDate = new Date(bill.dueDate);
          } else if (bill.frequency === 'MONTHLY' && bill.dueDay) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const effectiveDay = getEffectiveDueDay(bill.dueDay, month, year);
            dueDate = new Date(year, month, effectiveDay);
          } else {
            return null;
          }
          return { bill, dueDate };
        })
        .filter(Boolean)
        .sort((a, b) => a!.dueDate.getTime() - b!.dueDate.getTime()) as { bill: BillItem; dueDate: Date }[];
      
      let runningBalance = account.currentBalance;
      const accountBalances: RunningBalance[] = [];
      
      accountBills.forEach(({ bill, dueDate }) => {
        runningBalance -= bill.amount;
        accountBalances.push({
          accountId: account.id,
          date: dueDate,
          balance: runningBalance,
          isNegative: runningBalance < 0,
        });
      });
      
      balances.set(account.id, accountBalances);
    });
    
    return balances;
  }, [accounts, bills, currentDate]);

  // Check if a date has a negative balance warning
  const hasNegativeBalance = (date: Date): boolean => {
    for (const [, balances] of runningBalances) {
      for (const rb of balances) {
        if (rb.date.toDateString() === date.toDateString() && rb.isNegative) {
          return true;
        }
      }
    }
    return false;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get bills for selected date with account info
  const selectedDateBills = useMemo(() => {
    if (!selectedDate) return [];
    
    return bills
      .filter(bill => {
        if (filterAccountId !== 'all' && bill.payFromAccountId !== filterAccountId) {
          return false;
        }
        
        if (bill.frequency === 'ONE_TIME' && bill.dueDate) {
          const dueDate = new Date(bill.dueDate);
          return dueDate.toDateString() === selectedDate.toDateString();
        }
        
        if (bill.frequency === 'MONTHLY' && bill.dueDay) {
          const effectiveDay = getEffectiveDueDay(bill.dueDay, selectedDate.getMonth(), selectedDate.getFullYear());
          return selectedDate.getDate() === effectiveDay;
        }
        
        return false;
      })
      .map(bill => ({
        ...bill,
        account: accounts.find(a => a.id === bill.payFromAccountId),
        accountIndex: accounts.findIndex(a => a.id === bill.payFromAccountId),
        linkedDebt: debts.find(d => d.id === bill.linkedDebtId),
      }));
  }, [selectedDate, bills, accounts, debts, filterAccountId]);

  // Group selected date bills by account
  const billsByAccountForDate = useMemo(() => {
    const grouped: Map<string, typeof selectedDateBills> = new Map();
    
    selectedDateBills.forEach(bill => {
      const key = bill.payFromAccountId;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(bill);
    });
    
    return grouped;
  }, [selectedDateBills]);

  const statusColors: Record<BillStatus, string> = {
    PLANNED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    SKIPPED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };

  const cycleStatus = (bill: BillItem) => {
    const statuses: BillStatus[] = ['PLANNED', 'PAID', 'SKIPPED'];
    const currentIndex = statuses.indexOf(bill.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    onUpdateBill(bill.id, { status: nextStatus });
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold min-w-[140px] text-center">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
        
        <Select value={filterAccountId} onValueChange={setFilterAccountId}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            {accounts.map(a => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Account Legend */}
      {accounts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {accounts.map((account, index) => (
            <div key={account.id} className="flex items-center gap-1.5 text-xs">
              <div className={cn("w-3 h-3 rounded-full", getAccountColor(index))} />
              <span className="text-muted-foreground">{account.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-2 sm:p-4">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const hasWarning = hasNegativeBalance(day.date);
              const billCount = day.bills.length;
              
              return (
                <button
                  key={index}
                  onClick={() => day.isCurrentMonth && setSelectedDate(day.date)}
                  disabled={!day.isCurrentMonth}
                  className={cn(
                    "relative aspect-square p-1 rounded-lg transition-all text-sm",
                    "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary",
                    day.isCurrentMonth ? "bg-card" : "bg-muted/30 text-muted-foreground",
                    day.isToday && "ring-2 ring-primary",
                    hasWarning && day.isCurrentMonth && "bg-destructive/10",
                    !day.isCurrentMonth && "cursor-not-allowed opacity-50"
                  )}
                >
                  <span className={cn(
                    "absolute top-1 left-1 text-xs font-medium",
                    day.isToday && "text-primary font-bold"
                  )}>
                    {day.date.getDate()}
                  </span>
                  
                  {/* Bill indicators */}
                  {billCount > 0 && day.isCurrentMonth && (
                    <div className="absolute bottom-1 left-1 right-1 flex gap-0.5 justify-center flex-wrap">
                      {billCount <= 3 ? (
                        day.bills.slice(0, 3).map((bill, i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-2 h-2 rounded-full",
                              getAccountColor(bill.accountIndex)
                            )}
                          />
                        ))
                      ) : (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                          {billCount}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Warning indicator */}
                  {hasWarning && day.isCurrentMonth && (
                    <AlertTriangle className="absolute top-1 right-1 w-3 h-3 text-destructive" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Detail Sheet */}
      <Sheet open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <SheetContent side="bottom" className="h-[70vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {selectedDate?.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })}
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-4 space-y-4">
            {selectedDateBills.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No bills due on this date
              </p>
            ) : (
              Array.from(billsByAccountForDate.entries()).map(([accountId, accountBills]) => {
                const account = accounts.find(a => a.id === accountId);
                const accountIndex = accounts.findIndex(a => a.id === accountId);
                
                if (!account) return null;
                
                // Calculate totals for this account on this date
                const dayTotal = accountBills.reduce((sum, b) => sum + b.amount, 0);
                const plannedTotal = accountBills
                  .filter(b => b.status === 'PLANNED')
                  .reduce((sum, b) => sum + b.amount, 0);
                
                // Get running balance after these bills
                const accountBalances = runningBalances.get(accountId) || [];
                const balanceAfter = accountBalances.find(
                  rb => selectedDate && rb.date.toDateString() === selectedDate.toDateString()
                );
                
                return (
                  <div key={accountId} className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", getAccountColor(accountIndex))} />
                        <span className="font-medium">{account.name}</span>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">
                          Due: {formatCurrency(dayTotal)}
                        </p>
                        {balanceAfter && (
                          <p className={cn(
                            "font-medium",
                            balanceAfter.isNegative ? "text-destructive" : "text-success"
                          )}>
                            After: {formatCurrency(balanceAfter.balance)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {accountBills.map(bill => (
                        <div 
                          key={bill.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-card border"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <button
                              onClick={() => cycleStatus(bill)}
                              className={cn(
                                "px-2 py-1 rounded text-xs font-medium transition-colors shrink-0",
                                statusColors[bill.status]
                              )}
                            >
                              {bill.status}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">{bill.label}</p>
                                {bill.autopay && (
                                  <Badge variant="outline" className="text-xs gap-1 shrink-0">
                                    <Zap className="w-3 h-3" />
                                    Auto
                                  </Badge>
                                )}
                                {bill.linkedDebt && (
                                  <Badge variant="secondary" className="text-xs gap-1 shrink-0">
                                    <Link2 className="w-3 h-3" />
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{bill.category}</p>
                            </div>
                          </div>
                          <p className="font-semibold shrink-0">{formatCurrency(bill.amount)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
