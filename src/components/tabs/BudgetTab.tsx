import { useState, useMemo, useEffect } from 'react';
import { Plus, Building2, CreditCard, Wallet, AlertTriangle, Pencil, Trash2, Zap, Link2, List, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  BankAccount, 
  BillItem, 
  BillCategory, 
  BillFrequency, 
  BillStatus,
  ForecastWindow,
  BILL_CATEGORIES, 
  FORECAST_WINDOW_LABELS,
  calculateUpcomingForAccount,
  calculateAvailableAfterUpcoming,
} from '@/types/budget';
import { Debt } from '@/types/debt';
import { cn } from '@/lib/utils';
import { BudgetCalendarView } from '@/components/budget/BudgetCalendarView';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type BudgetViewMode = 'list' | 'calendar';

const BUDGET_VIEW_KEY = 'budget-view-mode';

interface BudgetTabProps {
  accounts: BankAccount[];
  bills: BillItem[];
  debts: Debt[];
  forecastWindow: ForecastWindow;
  onAddAccount: (account: Omit<BankAccount, 'id'>) => void;
  onUpdateAccount: (id: string, updates: Partial<BankAccount>) => void;
  onDeleteAccount: (id: string) => void;
  onAddBill: (bill: Omit<BillItem, 'id'>) => void;
  onUpdateBill: (id: string, updates: Partial<BillItem>) => void;
  onDeleteBill: (id: string) => void;
  onSetForecastWindow: (window: ForecastWindow) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Account Card Component
const AccountCard = ({
  account,
  bills,
  forecastWindow,
  onEdit,
  onDelete,
}: {
  account: BankAccount;
  bills: BillItem[];
  forecastWindow: ForecastWindow;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const upcomingTotal = useMemo(() => 
    calculateUpcomingForAccount(account.id, bills, forecastWindow),
    [account.id, bills, forecastWindow]
  );
  
  const availableAfter = useMemo(() => 
    calculateAvailableAfterUpcoming(account, bills, forecastWindow),
    [account, bills, forecastWindow]
  );

  const isNegative = availableAfter < 0;

  return (
    <Card className={cn(
      "transition-all",
      isNegative && "border-destructive/50 bg-destructive/5"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">{account.name}</h4>
              {account.institution && (
                <p className="text-xs text-muted-foreground">{account.institution}</p>
              )}
            </div>
            {account.isPrimary && (
              <Badge variant="secondary" className="text-xs">Primary</Badge>
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Balance</p>
            <p className="font-semibold">{formatCurrency(account.currentBalance)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Upcoming</p>
            <p className="font-medium text-warning">{formatCurrency(upcomingTotal)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Available</p>
            <p className={cn(
              "font-semibold",
              isNegative ? "text-destructive" : "text-success"
            )}>
              {formatCurrency(availableAfter)}
            </p>
          </div>
        </div>

        {isNegative && (
          <div className="mt-3 flex items-center gap-2 text-xs text-destructive">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Not enough funds for planned payments</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Bill Item Component
const BillItemRow = ({
  bill,
  debts,
  onUpdate,
  onDelete,
}: {
  bill: BillItem;
  debts: Debt[];
  onUpdate: (updates: Partial<BillItem>) => void;
  onDelete: () => void;
}) => {
  const linkedDebt = debts.find(d => d.id === bill.linkedDebtId);

  const statusColors: Record<BillStatus, string> = {
    PLANNED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    SKIPPED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };

  const cycleStatus = () => {
    const statuses: BillStatus[] = ['PLANNED', 'PAID', 'SKIPPED'];
    const currentIndex = statuses.indexOf(bill.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    onUpdate({ status: nextStatus });
  };

  return (
    <div className="flex items-center justify-between py-3 px-2 hover:bg-muted/50 rounded-lg transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={cycleStatus}
          className={cn(
            "px-2 py-1 rounded text-xs font-medium transition-colors",
            statusColors[bill.status]
          )}
        >
          {bill.status}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{bill.label}</p>
            {bill.autopay && (
              <Badge variant="outline" className="text-xs gap-1">
                <Zap className="w-3 h-3" />
                Auto
              </Badge>
            )}
            {linkedDebt && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Link2 className="w-3 h-3" />
                Linked
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{bill.category}</span>
            <span>•</span>
            <span>
              {bill.frequency === 'MONTHLY' 
                ? `Due day ${bill.dueDay}` 
                : bill.dueDate 
                  ? new Date(bill.dueDate).toLocaleDateString()
                  : 'No date'
              }
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p className="font-semibold">{formatCurrency(bill.amount)}</p>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

export const BudgetTab = ({
  accounts,
  bills,
  debts,
  forecastWindow,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onAddBill,
  onUpdateBill,
  onDeleteBill,
  onSetForecastWindow,
}: BudgetTabProps) => {
  const [viewMode, setViewMode] = useState<BudgetViewMode>(() => {
    const saved = localStorage.getItem(BUDGET_VIEW_KEY);
    return (saved === 'calendar' || saved === 'list') ? saved : 'list';
  });
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  // Persist view mode
  useEffect(() => {
    localStorage.setItem(BUDGET_VIEW_KEY, viewMode);
  }, [viewMode]);

  // Account form state
  const [accountName, setAccountName] = useState('');
  const [accountInstitution, setAccountInstitution] = useState('');
  const [accountBalance, setAccountBalance] = useState('');
  const [accountIsPrimary, setAccountIsPrimary] = useState(false);

  // Bill form state
  const [billLabel, setBillLabel] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billDueDay, setBillDueDay] = useState('');
  const [billFrequency, setBillFrequency] = useState<BillFrequency>('MONTHLY');
  const [billCategory, setBillCategory] = useState<BillCategory>('Other');
  const [billAccountId, setBillAccountId] = useState('');
  const [billLinkedDebtId, setBillLinkedDebtId] = useState('');
  const [billAutopay, setBillAutopay] = useState(false);

  // Generate from debts state
  const [selectedDebts, setSelectedDebts] = useState<string[]>([]);
  const [generateAccountId, setGenerateAccountId] = useState('');

  const resetAccountForm = () => {
    setAccountName('');
    setAccountInstitution('');
    setAccountBalance('');
    setAccountIsPrimary(false);
    setEditingAccount(null);
  };

  const resetBillForm = () => {
    setBillLabel('');
    setBillAmount('');
    setBillDueDay('');
    setBillFrequency('MONTHLY');
    setBillCategory('Other');
    setBillAccountId(accounts[0]?.id || '');
    setBillLinkedDebtId('');
    setBillAutopay(false);
  };

  const handleSaveAccount = () => {
    const balance = parseFloat(accountBalance) || 0;
    
    if (editingAccount) {
      onUpdateAccount(editingAccount.id, {
        name: accountName,
        institution: accountInstitution || null,
        currentBalance: balance,
        isPrimary: accountIsPrimary,
      });
    } else {
      onAddAccount({
        name: accountName,
        institution: accountInstitution || null,
        currentBalance: balance,
        isPrimary: accountIsPrimary,
      });
    }
    
    setAccountDialogOpen(false);
    resetAccountForm();
  };

  const handleEditAccount = (account: BankAccount) => {
    setEditingAccount(account);
    setAccountName(account.name);
    setAccountInstitution(account.institution || '');
    setAccountBalance(account.currentBalance.toString());
    setAccountIsPrimary(account.isPrimary || false);
    setAccountDialogOpen(true);
  };

  const handleSaveBill = () => {
    const amount = parseFloat(billAmount) || 0;
    const dueDay = parseInt(billDueDay) || 1;
    
    onAddBill({
      label: billLabel,
      amount,
      dueDay: billFrequency === 'MONTHLY' ? Math.min(Math.max(dueDay, 1), 31) : null,
      dueDate: null,
      frequency: billFrequency,
      category: billCategory,
      linkedDebtId: billLinkedDebtId || null,
      payFromAccountId: billAccountId,
      status: 'PLANNED',
      autopay: billAutopay,
    });
    
    setBillDialogOpen(false);
    resetBillForm();
  };

  const handleLinkDebt = (debtId: string) => {
    if (debtId === 'none') {
      setBillLinkedDebtId('');
      return;
    }
    const debt = debts.find(d => d.id === debtId);
    if (debt) {
      setBillLinkedDebtId(debtId);
      setBillLabel(`${debt.name} Minimum`);
      setBillAmount(debt.minPayment.toString());
      setBillCategory('Credit Card');
    }
  };

  const handleGenerateFromDebts = () => {
    if (!generateAccountId || selectedDebts.length === 0) return;
    
    selectedDebts.forEach(debtId => {
      const debt = debts.find(d => d.id === debtId);
      if (debt && debt.minPayment > 0) {
        onAddBill({
          label: `${debt.name} Minimum`,
          amount: debt.minPayment,
          dueDay: 1,
          dueDate: null,
          frequency: 'MONTHLY',
          category: debt.type === 'Credit Card' ? 'Credit Card' : 'Loan',
          linkedDebtId: debt.id,
          payFromAccountId: generateAccountId,
          status: 'PLANNED',
          autopay: false,
        });
      }
    });
    
    setGenerateDialogOpen(false);
    setSelectedDebts([]);
    setGenerateAccountId('');
  };

  // Group bills by account
  const billsByAccount = useMemo(() => {
    const grouped: Record<string, BillItem[]> = {};
    accounts.forEach(a => {
      grouped[a.id] = bills
        .filter(b => b.payFromAccountId === a.id)
        .sort((a, b) => (a.dueDay || 0) - (b.dueDay || 0));
    });
    return grouped;
  }, [accounts, bills]);

  // Calculate totals
  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const totalUpcoming = bills
    .filter(b => b.status === 'PLANNED')
    .reduce((sum, b) => sum + b.amount, 0);
  const totalAvailable = totalBalance - totalUpcoming;

  return (
    <div className="space-y-6">
      {/* Summary Header with View Toggle */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">View</span>
            <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as BudgetViewMode)}>
              <ToggleGroupItem value="list" aria-label="List view" className="gap-1.5">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="calendar" aria-label="Calendar view" className="gap-1.5">
                <CalendarDays className="h-4 w-4" />
                <span className="hidden sm:inline">Calendar</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Total Balance</p>
              <p className="text-lg font-bold">{formatCurrency(totalBalance)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Upcoming</p>
              <p className="text-lg font-bold text-warning">{formatCurrency(totalUpcoming)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Available</p>
              <p className={cn(
                "text-lg font-bold",
                totalAvailable < 0 ? "text-destructive" : "text-success"
              )}>
                {formatCurrency(totalAvailable)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      {viewMode === 'calendar' ? (
        <BudgetCalendarView
          accounts={accounts}
          bills={bills}
          debts={debts}
          onUpdateBill={onUpdateBill}
        />
      ) : (
        <>
          {/* Forecast Window Selector */}
          <div className="flex items-center justify-between">
            <Label className="text-sm">Forecast Period</Label>
            <Select value={forecastWindow} onValueChange={(v) => onSetForecastWindow(v as ForecastWindow)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FORECAST_WINDOW_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

      {/* Accounts Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Accounts
          </h3>
          <Dialog open={accountDialogOpen} onOpenChange={(open) => {
            setAccountDialogOpen(open);
            if (!open) resetAccountForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                <Plus className="w-4 h-4" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingAccount ? 'Edit Account' : 'Add Account'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Account Name *</Label>
                  <Input
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="e.g., Central Checking"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Institution</Label>
                  <Input
                    value={accountInstitution}
                    onChange={(e) => setAccountInstitution(e.target.value)}
                    placeholder="e.g., Chase, US Bank"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Balance *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isPrimary"
                    checked={accountIsPrimary}
                    onCheckedChange={(checked) => setAccountIsPrimary(!!checked)}
                  />
                  <Label htmlFor="isPrimary" className="text-sm">Primary Account</Label>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSaveAccount} disabled={!accountName || !accountBalance}>
                  {editingAccount ? 'Save Changes' : 'Add Account'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {accounts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              <Wallet className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No accounts yet. Add your first account to start tracking.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {accounts.map(account => (
              <AccountCard
                key={account.id}
                account={account}
                bills={bills}
                forecastWindow={forecastWindow}
                onEdit={() => handleEditAccount(account)}
                onDelete={() => onDeleteAccount(account.id)}
              />
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Bills Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Bills & Payments
          </h3>
          <div className="flex gap-2">
            {debts.length > 0 && accounts.length > 0 && (
              <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary" className="gap-1">
                    <Link2 className="w-4 h-4" />
                    From Debts
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate from Debt Minimums</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Pay From Account *</Label>
                      <Select value={generateAccountId} onValueChange={setGenerateAccountId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Select Debts</Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {debts.filter(d => d.minPayment > 0).map(debt => (
                          <div key={debt.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`debt-${debt.id}`}
                              checked={selectedDebts.includes(debt.id)}
                              onCheckedChange={(checked) => {
                                setSelectedDebts(prev => 
                                  checked 
                                    ? [...prev, debt.id]
                                    : prev.filter(id => id !== debt.id)
                                );
                              }}
                            />
                            <Label htmlFor={`debt-${debt.id}`} className="text-sm flex-1">
                              {debt.name} ({formatCurrency(debt.minPayment)})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button 
                      onClick={handleGenerateFromDebts} 
                      disabled={!generateAccountId || selectedDebts.length === 0}
                    >
                      Generate {selectedDebts.length} Bills
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Dialog open={billDialogOpen} onOpenChange={(open) => {
              setBillDialogOpen(open);
              if (!open) resetBillForm();
              else if (accounts.length > 0) setBillAccountId(accounts[0].id);
            }}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1" disabled={accounts.length === 0}>
                  <Plus className="w-4 h-4" />
                  Add Bill
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Bill / Payment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Pay From Account *</Label>
                    <Select value={billAccountId} onValueChange={setBillAccountId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {debts.length > 0 && (
                    <div className="space-y-2">
                      <Label>Link to Debt (Optional)</Label>
                      <Select value={billLinkedDebtId} onValueChange={handleLinkDebt}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select debt to link" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {debts.map(d => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name} (Min: {formatCurrency(d.minPayment)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Label *</Label>
                    <Input
                      value={billLabel}
                      onChange={(e) => setBillLabel(e.target.value)}
                      placeholder="e.g., Electric Bill, Netflix"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Amount *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={billAmount}
                        onChange={(e) => setBillAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Due Day (1-31)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        value={billDueDay}
                        onChange={(e) => setBillDueDay(e.target.value)}
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select value={billFrequency} onValueChange={(v) => setBillFrequency(v as BillFrequency)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                          <SelectItem value="ONE_TIME">One-Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={billCategory} onValueChange={(v) => setBillCategory(v as BillCategory)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BILL_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="autopay"
                      checked={billAutopay}
                      onCheckedChange={(checked) => setBillAutopay(!!checked)}
                    />
                    <Label htmlFor="autopay" className="text-sm">Autopay enabled</Label>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleSaveBill} disabled={!billLabel || !billAmount || !billAccountId}>
                    Add Bill
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {accounts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Add an account first to start tracking bills.</p>
            </CardContent>
          </Card>
        ) : bills.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No bills yet. Add bills to track your payments.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {accounts.map(account => {
              const accountBills = billsByAccount[account.id] || [];
              if (accountBills.length === 0) return null;
              
              return (
                <Collapsible key={account.id} defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <span className="font-medium text-sm">{account.name}</span>
                    <Badge variant="secondary">{accountBills.length} bills</Badge>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 divide-y divide-border">
                      {accountBills.map(bill => (
                        <BillItemRow
                          key={bill.id}
                          bill={bill}
                          debts={debts}
                          onUpdate={(updates) => onUpdateBill(bill.id, updates)}
                          onDelete={() => onDeleteBill(bill.id)}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};
