import { useState } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import { Debt, DEBT_TYPES, DebtType, FeeFrequency, FEE_FREQUENCY_LABELS, calculateUtilizationRate, calculateAvailableBalance, getUtilizationColor } from '@/types/debt';
import { calculateMonthlyInterest, checkInterestOnlyRisk } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface DebtsTabProps {
  debts: Debt[];
  onAddDebt: (debt: Omit<Debt, 'id' | 'active'>) => void;
  onUpdateDebt: (debtId: string, updates: Partial<Debt>) => void;
  onDeleteDebt: (debtId: string) => void;
}

interface DebtFormData {
  name: string;
  balance: string;
  apr: string;
  minPayment: string;
  customRank: string;
  creditLimit: string;
  type: DebtType | '';
  feeAmount: string;
  feeFrequency: FeeFrequency;
}

const initialFormData: DebtFormData = {
  name: '',
  balance: '',
  apr: '',
  minPayment: '',
  customRank: '',
  creditLimit: '',
  type: '',
  feeAmount: '',
  feeFrequency: 'MONTHLY',
};

export const DebtsTab = ({
  debts,
  onAddDebt,
  onUpdateDebt,
  onDeleteDebt,
}: DebtsTabProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [deleteDebtId, setDeleteDebtId] = useState<string | null>(null);
  const [formData, setFormData] = useState<DebtFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof DebtFormData, string>>>({});
  const [warnings, setWarnings] = useState<Partial<Record<keyof DebtFormData, string>>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0);
  const totalMinPayments = debts.filter(d => d.active).reduce((sum, d) => sum + d.minPayment, 0);

  // Calculate utilization for form display
  const formBalance = parseFloat(formData.balance) || 0;
  const formCreditLimit = parseFloat(formData.creditLimit) || 0;
  const formUtilization = formCreditLimit > 0 ? calculateUtilizationRate(formBalance, formCreditLimit) : null;
  const formAvailableBalance = formCreditLimit > 0 ? calculateAvailableBalance(formBalance, formCreditLimit) : null;

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof DebtFormData, string>> = {};
    const newWarnings: Partial<Record<keyof DebtFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    const balance = parseFloat(formData.balance);
    if (isNaN(balance) || balance < 0) {
      newErrors.balance = 'Balance must be >= 0';
    }

    const apr = parseFloat(formData.apr);
    if (isNaN(apr) || apr < 0 || apr > 100) {
      newErrors.apr = 'APR must be 0-100%';
    }

    const minPayment = parseFloat(formData.minPayment);
    if (isNaN(minPayment) || minPayment < 0) {
      newErrors.minPayment = 'Min payment must be >= 0';
    }

    if (formData.customRank && isNaN(parseInt(formData.customRank))) {
      newErrors.customRank = 'Must be a number';
    }

    // Credit limit validation
    const creditLimit = formData.creditLimit ? parseFloat(formData.creditLimit) : null;
    if (creditLimit !== null && creditLimit < 0) {
      newErrors.creditLimit = 'Credit limit must be >= 0';
    }
    if (creditLimit !== null && !isNaN(balance) && creditLimit < balance) {
      newWarnings.creditLimit = 'Credit limit is less than balance (over limit)';
    }

    // Fees validation
    const feeAmount = formData.feeAmount ? parseFloat(formData.feeAmount) : null;
    if (feeAmount !== null && feeAmount < 0) {
      newErrors.feeAmount = 'Fee amount must be >= 0';
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const debtData = {
      name: formData.name.trim(),
      balance: parseFloat(formData.balance),
      apr: parseFloat(formData.apr) / 100,
      minPayment: parseFloat(formData.minPayment),
      customRank: formData.customRank ? parseInt(formData.customRank) : undefined,
      creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : null,
      type: formData.type || null,
      feeAmount: formData.feeAmount ? parseFloat(formData.feeAmount) : null,
      feeFrequency: formData.feeAmount ? formData.feeFrequency : null,
    };

    if (editingDebt) {
      onUpdateDebt(editingDebt.id, debtData);
    } else {
      onAddDebt(debtData);
    }

    handleCloseDialog();
  };

  const handleOpenAdd = () => {
    setEditingDebt(null);
    setFormData(initialFormData);
    setErrors({});
    setWarnings({});
    setShowAdvanced(false);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (debt: Debt) => {
    setEditingDebt(debt);
    setFormData({
      name: debt.name,
      balance: debt.balance.toString(),
      apr: (debt.apr * 100).toString(),
      minPayment: debt.minPayment.toString(),
      customRank: debt.customRank?.toString() || '',
      creditLimit: debt.creditLimit?.toString() || '',
      type: debt.type || '',
      feeAmount: debt.feeAmount?.toString() || '',
      feeFrequency: debt.feeFrequency || 'MONTHLY',
    });
    setErrors({});
    setWarnings({});
    setShowAdvanced(!!(debt.creditLimit || debt.type || debt.feeAmount));
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingDebt(null);
    setFormData(initialFormData);
    setErrors({});
    setWarnings({});
    setShowAdvanced(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const UtilizationBar = ({ rate }: { rate: number | null }) => {
    if (rate === null) return null;
    const color = getUtilizationColor(rate);
    
    return (
      <div className="flex items-center gap-2">
        <Progress 
          value={rate} 
          className={cn(
            "h-2 flex-1",
            color === 'green' && '[&>div]:bg-emerald-500',
            color === 'yellow' && '[&>div]:bg-amber-500',
            color === 'red' && '[&>div]:bg-red-500'
          )}
        />
        <span className={cn(
          "text-xs font-mono font-medium",
          color === 'green' && 'text-emerald-600',
          color === 'yellow' && 'text-amber-600',
          color === 'red' && 'text-red-600'
        )}>
          {rate.toFixed(1)}%
        </span>
      </div>
    );
  };

  const activeDebtsCount = debts.filter(d => d.active && d.balance > 0).length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero Summary Section */}
      <div className="gradient-hero rounded-2xl p-5 shadow-hero inner-glow">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-primary-foreground">Debt Overview</h2>
            <p className="text-sm text-primary-foreground/70">See the full picture of what you owe</p>
          </div>
          <div className="p-2.5 rounded-xl bg-primary-foreground/15 backdrop-blur-sm">
            <CreditCard className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-xs text-primary-foreground/70 mb-1">Total Balance</p>
            <p className="text-lg font-bold text-primary-foreground font-mono">{formatCurrency(totalBalance)}</p>
          </div>
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-xs text-primary-foreground/70 mb-1">Min. Payments</p>
            <p className="text-lg font-bold text-primary-foreground font-mono">{formatCurrency(totalMinPayments)}</p>
          </div>
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-xs text-primary-foreground/70 mb-1">Active Debts</p>
            <p className="text-lg font-bold text-primary-foreground">{activeDebtsCount}</p>
          </div>
        </div>
      </div>

      {/* Add Debt Button */}
      <Button onClick={handleOpenAdd} className="w-full gap-2 shadow-card hover-lift">
        <Plus className="w-4 h-4" />
        Add Debt
      </Button>

      {/* Debts List */}
      <div className="space-y-3">
        {debts.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                No debts added yet. Tap "Add Debt" to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          debts.map((debt) => {
            const monthlyInterest = calculateMonthlyInterest(debt.balance, debt.apr);
            const hasRisk = checkInterestOnlyRisk(debt);
            const utilization = calculateUtilizationRate(debt.balance, debt.creditLimit);
            const availableBalance = calculateAvailableBalance(debt.balance, debt.creditLimit);

            return (
              <Card
                key={debt.id}
                className={cn(
                  'shadow-soft transition-all duration-200',
                  !debt.active && 'opacity-60'
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base truncate">{debt.name}</CardTitle>
                        {debt.type && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {debt.type}
                          </span>
                        )}
                      </div>
                      {debt.customRank && (
                        <span className="text-xs text-muted-foreground">
                          Rank: {debt.customRank}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(debt)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteDebtId(debt.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Balance</p>
                      <p className="font-semibold font-mono">{formatCurrency(debt.balance)}</p>
                      {availableBalance !== null && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Avail: {formatCurrency(availableBalance)}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">APR</p>
                      <p className="font-semibold font-mono">{(debt.apr * 100).toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Min Payment</p>
                      <p className="font-semibold font-mono">{formatCurrency(debt.minPayment)}</p>
                    </div>
                  </div>

                  {/* Utilization bar for credit limit debts */}
                  {utilization !== null && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-1">Utilization</p>
                      <UtilizationBar rate={utilization} />
                    </div>
                  )}

                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Monthly Interest</span>
                      <span className="font-mono font-medium">{formatCurrency(monthlyInterest)}</span>
                    </div>
                    {debt.feeAmount && debt.feeAmount > 0 && (
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-muted-foreground">
                          {debt.feeFrequency === 'ANNUAL' ? 'Annual' : 'Monthly'} Fees (info only)
                        </span>
                        <div className="text-right">
                          <span className="font-mono font-medium text-muted-foreground">
                            {formatCurrency(debt.feeAmount)}
                          </span>
                          {debt.feeFrequency === 'ANNUAL' && (
                            <span className="text-muted-foreground/70 ml-1">
                              ≈ {formatCurrency(debt.feeAmount / 12)}/mo
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {hasRisk && (
                      <div className="flex items-center gap-1 mt-2 text-warning">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-xs font-medium">
                          Payment less than interest - balance will grow!
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDebt ? 'Edit Debt' : 'Add New Debt'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Core fields */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Credit Card"
                className={cn(errors.name && 'border-destructive')}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="balance">Balance ($)</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                min="0"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                placeholder="0.00"
                className={cn(errors.balance && 'border-destructive')}
              />
              {errors.balance && (
                <p className="text-xs text-destructive">{errors.balance}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apr">APR (%)</Label>
              <Input
                id="apr"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.apr}
                onChange={(e) => setFormData({ ...formData, apr: e.target.value })}
                placeholder="0.00"
                className={cn(errors.apr && 'border-destructive')}
              />
              {errors.apr && (
                <p className="text-xs text-destructive">{errors.apr}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="minPayment">Minimum Payment ($)</Label>
              <Input
                id="minPayment"
                type="number"
                step="0.01"
                min="0"
                value={formData.minPayment}
                onChange={(e) => setFormData({ ...formData, minPayment: e.target.value })}
                placeholder="0.00"
                className={cn(errors.minPayment && 'border-destructive')}
              />
              {errors.minPayment && (
                <p className="text-xs text-destructive">{errors.minPayment}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="customRank">Custom Rank (optional)</Label>
              <Input
                id="customRank"
                type="number"
                value={formData.customRank}
                onChange={(e) => setFormData({ ...formData, customRank: e.target.value })}
                placeholder="1, 2, 3..."
                className={cn(errors.customRank && 'border-destructive')}
              />
              {errors.customRank && (
                <p className="text-xs text-destructive">{errors.customRank}</p>
              )}
            </div>

            {/* Advanced/Metadata Fields */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between px-0 hover:bg-transparent">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <CreditCard className="w-4 h-4" />
                    Additional Details
                  </span>
                  {showAdvanced ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Debt Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as DebtType })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {DEBT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creditLimit">Credit Limit ($)</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                    placeholder="Leave empty if N/A"
                    className={cn(errors.creditLimit && 'border-destructive', warnings.creditLimit && 'border-warning')}
                  />
                  {errors.creditLimit && (
                    <p className="text-xs text-destructive">{errors.creditLimit}</p>
                  )}
                  {warnings.creditLimit && !errors.creditLimit && (
                    <p className="text-xs text-warning">{warnings.creditLimit}</p>
                  )}
                </div>

                {/* Auto-calculated fields */}
                {formCreditLimit > 0 && (
                  <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Utilization Rate</span>
                      <span className={cn(
                        "font-mono font-medium",
                        getUtilizationColor(formUtilization) === 'green' && 'text-emerald-600',
                        getUtilizationColor(formUtilization) === 'yellow' && 'text-amber-600',
                        getUtilizationColor(formUtilization) === 'red' && 'text-red-600'
                      )}>
                        {formUtilization?.toFixed(1)}%
                      </span>
                    </div>
                    <UtilizationBar rate={formUtilization} />
                    <div className="flex justify-between text-sm pt-1">
                      <span className="text-muted-foreground">Available Balance</span>
                      <span className="font-mono font-medium">
                        {formAvailableBalance !== null ? formatCurrency(formAvailableBalance) : '-'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="feeAmount">Fees</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        id="feeAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.feeAmount}
                        onChange={(e) => setFormData({ ...formData, feeAmount: e.target.value })}
                        placeholder="0.00"
                        className={cn(errors.feeAmount && 'border-destructive')}
                      />
                    </div>
                    <Select
                      value={formData.feeFrequency}
                      onValueChange={(value) => setFormData({ ...formData, feeFrequency: value as FeeFrequency })}
                    >
                      <SelectTrigger className="w-28 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(FEE_FREQUENCY_LABELS) as FeeFrequency[]).map((freq) => (
                          <SelectItem key={freq} value={freq}>
                            {FEE_FREQUENCY_LABELS[freq]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.feeAmount && (
                    <p className="text-xs text-destructive">{errors.feeAmount}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Informational only — fees are not included in payoff calculations
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingDebt ? 'Update' : 'Add Debt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDebtId} onOpenChange={() => setDeleteDebtId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Debt?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The debt will be permanently removed from your plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteDebtId) {
                  onDeleteDebt(deleteDebtId);
                  setDeleteDebtId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
