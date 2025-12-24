import { useRef, useState } from 'react';
import { Download, Upload, FileText, Table, Wallet, Clock, Shield, AlertTriangle, Info, Sparkles, Trash2 } from 'lucide-react';
import { Plan, CalculationResult } from '@/types/debt';
import { 
  BankAccount, 
  BillItem, 
  ForecastWindow, 
  FORECAST_WINDOW_LABELS,
  calculateUpcomingForAccount,
  calculateAvailableAfterUpcoming,
} from '@/types/budget';
import { 
  exportDebtsToCSV, 
  exportScheduleToCSV, 
  parseDebtsFromCSV,
  exportPlanToJSON,
  parsePlanFromJSON,
  formatLastUpdated,
} from '@/lib/storage';
import {
  parseAccountsFromCSV,
  parseBillsFromCSV,
  generateId,
} from '@/lib/budgetStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
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

interface ExportTabProps {
  plan: Plan;
  calculationResult: CalculationResult | null;
  onImportDebts: (debts: any[]) => void;
  onImportPlan: (plan: Plan) => void;
  accounts: BankAccount[];
  bills: BillItem[];
  forecastWindow: ForecastWindow;
  showSampleBanner?: boolean;
  hasActiveUserData?: boolean;
  onLoadSampleData?: () => void;
  onClearSampleData?: () => void;
  onImportAccounts?: (accounts: BankAccount[]) => void;
  onImportBills?: (bills: BillItem[]) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const ExportTab = ({ 
  plan, 
  calculationResult, 
  onImportDebts,
  onImportPlan,
  accounts,
  bills,
  forecastWindow,
  showSampleBanner,
  hasActiveUserData,
  onLoadSampleData,
  onClearSampleData,
  onImportAccounts,
  onImportBills,
}: ExportTabProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const planFileInputRef = useRef<HTMLInputElement>(null);
  const accountsFileInputRef = useRef<HTMLInputElement>(null);
  const billsFileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importWarningOpen, setImportWarningOpen] = useState(false);
  const [pendingImportPlan, setPendingImportPlan] = useState<Plan | null>(null);
  const [accountsImportResult, setAccountsImportResult] = useState<string | null>(null);
  const [billsImportResult, setBillsImportResult] = useState<string | null>(null);

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Plan Export/Import
  const handleExportPlan = () => {
    const json = exportPlanToJSON(plan);
    const safeName = plan.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    downloadFile(json, `${safeName}-plan.json`, 'application/json');
    toast({
      title: 'Plan exported',
      description: `Your plan has been exported. Version: ${plan.version || '1.0'}`,
    });
  };

  const handleImportPlanClick = () => {
    planFileInputRef.current?.click();
  };

  const handlePlanFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const { plan: importedPlan, error } = parsePlanFromJSON(text);

      if (error || !importedPlan) {
        toast({
          title: 'Import failed',
          description: error || 'Could not parse the plan file.',
          variant: 'destructive',
        });
        return;
      }

      // Compare timestamps to warn about older plans
      const importedDate = new Date(importedPlan.lastUpdatedAt || importedPlan.updatedAt);
      const currentDate = new Date(plan.lastUpdatedAt || plan.updatedAt);

      if (importedDate < currentDate) {
        // Show warning - imported plan is older
        setPendingImportPlan(importedPlan);
        setImportWarningOpen(true);
      } else {
        // Import directly - imported plan is newer or same
        confirmImportPlan(importedPlan);
      }
    } catch (error) {
      toast({
        title: 'Import failed',
        description: 'Could not read the plan file.',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
      if (planFileInputRef.current) {
        planFileInputRef.current.value = '';
      }
    }
  };

  const confirmImportPlan = (planToImport: Plan) => {
    onImportPlan(planToImport);
    toast({
      title: 'Plan imported',
      description: `Successfully imported "${planToImport.name}" with ${planToImport.debts.length} debt(s).`,
    });
    setImportWarningOpen(false);
    setPendingImportPlan(null);
  };

  const handleExportDebts = () => {
    if (plan.debts.length === 0) {
      toast({
        title: 'No debts to export',
        description: 'Add some debts first before exporting.',
        variant: 'destructive',
      });
      return;
    }

    const csv = exportDebtsToCSV(plan);
    downloadFile(csv, `${plan.name}-debts.csv`, 'text/csv');
    toast({
      title: 'Debts exported',
      description: 'Your debts have been exported to CSV.',
    });
  };

  const handleExportSchedule = () => {
    if (!calculationResult || calculationResult.schedule.length === 0) {
      toast({
        title: 'No schedule to export',
        description: 'Calculate a payoff schedule first.',
        variant: 'destructive',
      });
      return;
    }

    const csv = exportScheduleToCSV(calculationResult.schedule);
    downloadFile(csv, `${plan.name}-schedule.csv`, 'text/csv');
    toast({
      title: 'Schedule exported',
      description: 'Your payment schedule has been exported to CSV.',
    });
  };

  const handleExportSummary = () => {
    if (!calculationResult) {
      toast({
        title: 'No summary to export',
        description: 'Calculate a payoff schedule first.',
        variant: 'destructive',
      });
      return;
    }

    const summary = `
DEBT REDUCTION SUMMARY
======================
Plan: ${plan.name}
Plan ID: ${plan.planIdentifier || 'N/A'}
Version: ${plan.version || '1.0'}
Last Updated: ${formatLastUpdated(plan.lastUpdatedAt || plan.updatedAt)}
Generated: ${new Date().toLocaleDateString()}

DEBTS
-----
${plan.debts.map(d => `• ${d.name}: $${d.balance.toFixed(2)} @ ${(d.apr * 100).toFixed(2)}% APR`).join('\n')}

STRATEGY
--------
Monthly Budget: $${plan.monthlyBudget.toFixed(2)}
Strategy: ${plan.strategy.replace(/_/g, ' ')}

RESULTS
-------
Total Interest Paid: $${calculationResult.totalInterestPaid.toFixed(2)}
Months to Payoff: ${calculationResult.monthsToPayoff}
Debt-Free Date: ${calculationResult.payoffDate}

PAYOFF ORDER
------------
${calculationResult.payoffOrder.map((id, i) => {
  const debt = plan.debts.find(d => d.id === id);
  const payoffDate = calculationResult.payoffDatePerDebt[id];
  return `${i + 1}. ${debt?.name || 'Unknown'} - Paid off: ${payoffDate}`;
}).join('\n')}
    `.trim();

    downloadFile(summary, `${plan.name}-summary.txt`, 'text/plain');
    toast({
      title: 'Summary exported',
      description: 'Your plan summary has been exported.',
    });
  };

  // Budget Export Functions
  const handleExportBudgetAccounts = () => {
    if (accounts.length === 0) {
      toast({
        title: 'No accounts to export',
        description: 'Add some accounts first before exporting.',
        variant: 'destructive',
      });
      return;
    }

    const headers = [
      'accountId',
      'accountName',
      'institution',
      'currentBalance',
      'upcomingAmount',
      'availableAfterUpcoming',
      'isPrimary',
      'notes',
    ];

    const rows = accounts.map(account => {
      const upcomingAmount = calculateUpcomingForAccount(account.id, bills, forecastWindow);
      const availableAfter = calculateAvailableAfterUpcoming(account, bills, forecastWindow);
      
      return [
        account.id,
        `"${account.name}"`,
        account.institution ? `"${account.institution}"` : '',
        account.currentBalance.toFixed(2),
        upcomingAmount.toFixed(2),
        availableAfter.toFixed(2),
        account.isPrimary ? 'true' : 'false',
        account.notes ? `"${account.notes}"` : '',
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    downloadFile(csv, `budget-accounts.csv`, 'text/csv');
    toast({
      title: 'Accounts exported',
      description: 'Your budget accounts have been exported to CSV.',
    });
  };

  const handleExportBudgetBills = () => {
    if (bills.length === 0) {
      toast({
        title: 'No bills to export',
        description: 'Add some bills first before exporting.',
        variant: 'destructive',
      });
      return;
    }

    const headers = [
      'billId',
      'label',
      'amount',
      'payFromAccount',
      'category',
      'dueType',
      'dueDay',
      'dueDate',
      'frequency',
      'status',
      'autopay',
      'linkedDebtName',
      'notes',
    ];

    const rows = bills.map(bill => {
      const account = accounts.find(a => a.id === bill.payFromAccountId);
      const linkedDebt = plan.debts.find(d => d.id === bill.linkedDebtId);
      const dueType = bill.dueDate ? 'EXACT_DATE' : 'DAY_OF_MONTH';
      
      return [
        bill.id,
        `"${bill.label}"`,
        bill.amount.toFixed(2),
        account ? `"${account.name}"` : '',
        bill.category,
        dueType,
        bill.dueDay?.toString() || '',
        bill.dueDate || '',
        bill.frequency,
        bill.status,
        bill.autopay ? 'true' : 'false',
        linkedDebt ? `"${linkedDebt.name}"` : '',
        bill.notes ? `"${bill.notes}"` : '',
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    downloadFile(csv, `budget-bills.csv`, 'text/csv');
    toast({
      title: 'Bills exported',
      description: 'Your budget bills have been exported to CSV.',
    });
  };

  const handleExportBudgetSummary = () => {
    if (accounts.length === 0) {
      toast({
        title: 'No budget data to export',
        description: 'Add some accounts first before exporting.',
        variant: 'destructive',
      });
      return;
    }

    const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);
    const plannedBills = bills.filter(b => b.status === 'PLANNED');
    const totalUpcoming = plannedBills.reduce((sum, b) => sum + b.amount, 0);
    const totalAvailable = totalBalance - totalUpcoming;

    // Sort bills by due date/day for upcoming section
    const sortedBills = [...bills].sort((a, b) => {
      const aDay = a.dueDay || (a.dueDate ? new Date(a.dueDate).getDate() : 0);
      const bDay = b.dueDay || (b.dueDate ? new Date(b.dueDate).getDate() : 0);
      return aDay - bDay;
    });

    const summary = `
BUDGET SUMMARY
==============
Generated: ${new Date().toLocaleDateString()}
Forecast Period: ${FORECAST_WINDOW_LABELS[forecastWindow]}

OVERVIEW
--------
Total Accounts: ${accounts.length}
Total Planned Bills: ${plannedBills.length}
Total Balance: ${formatCurrency(totalBalance)}
Total Upcoming: ${formatCurrency(totalUpcoming)}
Available After Payments: ${formatCurrency(totalAvailable)}

ACCOUNTS
--------
${accounts.map(account => {
  const upcomingAmount = calculateUpcomingForAccount(account.id, bills, forecastWindow);
  const availableAfter = calculateAvailableAfterUpcoming(account, bills, forecastWindow);
  const accountBills = bills.filter(b => b.payFromAccountId === account.id);
  
  return `${account.name}${account.institution ? ` (${account.institution})` : ''}
  Balance: ${formatCurrency(account.currentBalance)}
  Upcoming Payments: ${formatCurrency(upcomingAmount)}
  Available After: ${formatCurrency(availableAfter)}
  Bills: ${accountBills.length}`;
}).join('\n\n')}

UPCOMING BILLS (Sorted by Due Date)
-----------------------------------
${sortedBills.map(bill => {
  const account = accounts.find(a => a.id === bill.payFromAccountId);
  const dueInfo = bill.dueDate 
    ? new Date(bill.dueDate).toLocaleDateString()
    : `Day ${bill.dueDay}`;
  
  return `• ${bill.label}
  Amount: ${formatCurrency(bill.amount)}
  Due: ${dueInfo}
  Account: ${account?.name || 'Unknown'}
  Status: ${bill.status}`;
}).join('\n\n')}
    `.trim();

    downloadFile(summary, `budget-summary.txt`, 'text/plain');
    toast({
      title: 'Budget summary exported',
      description: 'Your budget summary has been exported.',
    });
  };

  const downloadAccountsTemplate = () => {
    const template = 'accountName,institution,currentBalance,notes,isPrimary\n"Central Checking","Chase Bank",5000.00,"Main account",true\n"Savings","US Bank",10000.00,"Emergency fund",false';
    downloadFile(template, 'budget-accounts-template.csv', 'text/csv');
    toast({
      title: 'Template downloaded',
      description: 'Fill in the template and import it.',
    });
  };

  const downloadBillsTemplate = () => {
    const template = 'label,amount,payFromAccount,category,dueType,dueDay,dueDate,frequency,status,autopay,notes\n"Electric Bill",150.00,"Central Checking","Utilities","DAY_OF_MONTH",15,,"MONTHLY","PLANNED",true,"Monthly electric"\n"Rent",1200.00,"Central Checking","Rent","DAY_OF_MONTH",1,,"MONTHLY","PLANNED",false,""';
    downloadFile(template, 'budget-bills-template.csv', 'text/csv');
    toast({
      title: 'Template downloaded',
      description: 'Fill in the template and import it.',
    });
  };

  // Accounts Import
  const handleImportAccountsClick = () => {
    accountsFileInputRef.current?.click();
  };

  const handleAccountsFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setAccountsImportResult(null);
    try {
      const text = await file.text();
      const { imported, skipped } = parseAccountsFromCSV(text, accounts);

      if (imported.length === 0) {
        setAccountsImportResult('No valid accounts found.');
      } else {
        // Convert to full BankAccount objects with IDs
        const newAccounts: BankAccount[] = imported.map(acc => ({
          id: generateId(),
          name: acc.name || 'Unnamed Account',
          institution: acc.institution || undefined,
          currentBalance: acc.currentBalance || 0,
          notes: acc.notes || undefined,
          isPrimary: acc.isPrimary || false,
        }));
        
        onImportAccounts?.(newAccounts);
        const resultMsg = `Replaced with ${imported.length} account${imported.length !== 1 ? 's' : ''}${skipped > 0 ? `, skipped ${skipped} row${skipped !== 1 ? 's' : ''} (invalid format)` : ''}`;
        setAccountsImportResult(resultMsg);
      }
    } catch (error) {
      setAccountsImportResult('Could not parse CSV file.');
    } finally {
      setImporting(false);
      if (accountsFileInputRef.current) {
        accountsFileInputRef.current.value = '';
      }
    }
  };

  // Bills Import
  const handleImportBillsClick = () => {
    billsFileInputRef.current?.click();
  };

  const handleBillsFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setBillsImportResult(null);
    try {
      const text = await file.text();
      const { imported, skipped } = parseBillsFromCSV(text, accounts);

      if (imported.length === 0) {
        setBillsImportResult('No valid bills found.');
      } else {
        // Convert to full BillItem objects with IDs
        const newBills: BillItem[] = imported.map(bill => ({
          id: generateId(),
          label: bill.label || 'Unnamed Bill',
          amount: bill.amount || 0,
          dueDay: bill.dueDay,
          dueDate: bill.dueDate,
          frequency: bill.frequency || 'MONTHLY',
          category: bill.category || 'Other',
          linkedDebtId: bill.linkedDebtId,
          payFromAccountId: bill.payFromAccountId || '',
          status: bill.status || 'PLANNED',
          autopay: bill.autopay || false,
          notes: bill.notes,
        }));
        
        onImportBills?.(newBills);
        
        // Count unlinked accounts
        const unlinkedCount = imported.filter(b => !b.payFromAccountId && b.payFromAccountName).length;
        let resultMsg = `Replaced with ${imported.length} bill${imported.length !== 1 ? 's' : ''}`;
        if (skipped > 0) {
          resultMsg += `, skipped ${skipped} row${skipped !== 1 ? 's' : ''} (invalid format)`;
        }
        if (unlinkedCount > 0) {
          resultMsg += `. ${unlinkedCount} bill${unlinkedCount !== 1 ? 's have' : ' has'} unlinked account${unlinkedCount !== 1 ? 's' : ''}.`;
        }
        setBillsImportResult(resultMsg);
      }
    } catch (error) {
      setBillsImportResult('Could not parse CSV file.');
    } finally {
      setImporting(false);
      if (billsFileInputRef.current) {
        billsFileInputRef.current.value = '';
      }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const debts = parseDebtsFromCSV(text);

      if (debts.length === 0) {
        toast({
          title: 'Import failed',
          description: 'No valid debts found in the CSV file.',
          variant: 'destructive',
        });
      } else {
        onImportDebts(debts);
        toast({
          title: 'Import successful',
          description: `${debts.length} debt(s) imported, replacing existing debts.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Import failed',
        description: 'Could not parse the CSV file.',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadTemplate = () => {
    const template = 'name,balance,apr,minPayment,customRank,creditLimit\n"Credit Card",5000,0.195,150,1,10000\n"Auto Loan",15000,0.059,350,2,';
    downloadFile(template, 'debt-import-template.csv', 'text/csv');
    toast({
      title: 'Template downloaded',
      description: 'Fill in the template and import it.',
    });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Plan Info & Manual Sync Section */}
      <Card className="gradient-hero shadow-hero border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-primary-foreground">
            <Shield className="w-5 h-5" />
            Export & Import (Manual Sync)
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            TrueBalance Planner does not use accounts or cloud sync.
            You control when and where your data is shared.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plan Metadata */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-xs text-primary-foreground/70 mb-1">Plan ID</div>
              <div className="font-mono text-sm font-semibold text-primary-foreground">
                {plan.planIdentifier || 'TBP-0000'}
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-xs text-primary-foreground/70 mb-1">Version</div>
              <div className="font-mono text-sm font-semibold text-primary-foreground">
                v{plan.version || '1.0'}
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="text-xs text-primary-foreground/70 mb-1">Debts</div>
              <div className="text-sm font-semibold text-primary-foreground">
                {plan.debts.length}
              </div>
            </div>
          </div>

          {/* Last Updated Timestamp */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3">
            <Clock className="w-4 h-4 text-primary-foreground/70" />
            <div>
              <div className="text-xs text-primary-foreground/70">Last updated on this device</div>
              <div className="text-sm font-medium text-primary-foreground">
                {formatLastUpdated(plan.lastUpdatedAt || plan.updatedAt)}
              </div>
            </div>
          </div>

          {/* Export/Import Plan Buttons */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1 bg-white/20 text-primary-foreground border-white/30 hover:bg-white/30"
              onClick={handleExportPlan}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Plan
            </Button>
            <input
              ref={planFileInputRef}
              type="file"
              accept=".json"
              onChange={handlePlanFileChange}
              className="hidden"
            />
            <Button
              variant="secondary"
              className="flex-1 bg-white/20 text-primary-foreground border-white/30 hover:bg-white/30"
              onClick={handleImportPlanClick}
              disabled={importing}
            >
              <Upload className="w-4 h-4 mr-2" />
              {importing ? 'Importing...' : 'Import Plan'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Card className="shadow-soft bg-accent/10 border-accent/20">
        <CardContent className="p-4 flex gap-3">
          <Info className="w-5 h-5 text-accent-secondary-DEFAULT shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">Privacy-first approach:</strong> Your data stays on your device. 
            Use Export to save a backup file, and Import to restore or transfer to another device.
          </div>
        </CardContent>
      </Card>

      {/* Export Debts Section */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="w-4 h-4 text-primary" />
            Export Debt Data
          </CardTitle>
          <CardDescription>
            Download your debt data and payment schedule.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={handleExportDebts}
          >
            <Table className="w-4 h-4" />
            Export Debts (CSV)
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={handleExportSchedule}
            disabled={!calculationResult}
          >
            <Table className="w-4 h-4" />
            Export Schedule (CSV)
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={handleExportSummary}
            disabled={!calculationResult}
          >
            <FileText className="w-4 h-4" />
            Export Summary (TXT)
          </Button>
        </CardContent>
      </Card>

      {/* Export Budget Section */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            Export Budget
          </CardTitle>
          <CardDescription>
            Download your budget accounts, bills, and summary.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={handleExportBudgetAccounts}
            disabled={accounts.length === 0}
          >
            <Table className="w-4 h-4" />
            Export Budget Accounts (CSV)
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={handleExportBudgetBills}
            disabled={bills.length === 0}
          >
            <Table className="w-4 h-4" />
            Export Budget Bills (CSV)
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={handleExportBudgetSummary}
            disabled={accounts.length === 0}
          >
            <FileText className="w-4 h-4" />
            Export Budget Summary (TXT)
          </Button>
        </CardContent>
      </Card>

      {/* Import Debts Section */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            Import Debts
          </CardTitle>
          <CardDescription>
            Import debts from a CSV file (this will replace all existing debts).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={handleImportClick}
            disabled={importing}
          >
            <Upload className="w-4 h-4" />
            {importing ? 'Importing...' : 'Import from CSV'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={downloadTemplate}
          >
            Download Debts CSV Template
          </Button>
        </CardContent>
      </Card>

      {/* Import Accounts Section */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            Import Accounts
          </CardTitle>
          <CardDescription>
            Import accounts from a CSV file (this will replace all existing accounts).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={accountsFileInputRef}
            type="file"
            accept=".csv"
            onChange={handleAccountsFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={handleImportAccountsClick}
            disabled={importing || !onImportAccounts}
          >
            <Upload className="w-4 h-4" />
            {importing ? 'Importing...' : 'Import Accounts from CSV'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={downloadAccountsTemplate}
          >
            Accounts Template
          </Button>
          {accountsImportResult && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
              {accountsImportResult}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Import Bills Section */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            Import Bills
          </CardTitle>
          <CardDescription>
            Import bills from a CSV file (this will replace all existing bills).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={billsFileInputRef}
            type="file"
            accept=".csv"
            onChange={handleBillsFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={handleImportBillsClick}
            disabled={importing || !onImportBills}
          >
            <Upload className="w-4 h-4" />
            {importing ? 'Importing...' : 'Import Bills from CSV'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={downloadBillsTemplate}
          >
            Bills Template
          </Button>
          {billsImportResult && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
              {billsImportResult}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Data Management Section */}
      <Card className="shadow-soft border-dashed border-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-secondary-DEFAULT" />
            Data Management
          </CardTitle>
          <CardDescription>
            Load sample data to explore the app, or clear all data to start fresh.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Load Sample Plan - only available when no user data exists */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={onLoadSampleData}
            disabled={hasActiveUserData || showSampleBanner}
          >
            <Sparkles className="w-4 h-4" />
            {showSampleBanner ? 'Sample Data Loaded' : 'Load Sample Plan'}
          </Button>
          
          {/* Show message if user has data and tries to load sample */}
          {hasActiveUserData && !showSampleBanner && (
            <p className="text-xs text-muted-foreground px-1">
              Clear your current plan to load the sample plan.
            </p>
          )}
          
          {/* Clear All Data - available for BOTH sample and empty plan users */}
          {hasActiveUserData && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onClearSampleData}
            >
              <Trash2 className="w-4 h-4" />
              {showSampleBanner ? 'Clear Sample Data' : 'Clear All Data'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* CSV Format Info */}
      <Card className="shadow-soft bg-secondary/30">
        <CardContent className="p-4 space-y-4">
          {/* Debts Format */}
          <div>
            <h4 className="font-medium text-sm mb-2">Debts CSV Format</h4>
            <div className="bg-background rounded p-2 font-mono text-xs overflow-x-auto">
              name,balance,apr,minPayment,customRank,creditLimit
            </div>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>• <strong>name</strong>: Debt name (text)</li>
              <li>• <strong>balance</strong>: Current balance (number)</li>
              <li>• <strong>apr</strong>: Annual rate (e.g., 19.5 or 0.195 for 19.5%)</li>
              <li>• <strong>minPayment</strong>: Minimum payment (number)</li>
              <li>• <strong>customRank</strong>: Optional priority rank (integer)</li>
              <li>• <strong>creditLimit</strong>: Optional credit limit (number)</li>
            </ul>
            <p className="mt-1 text-xs text-muted-foreground italic">
              Note: creditLimit is optional. If omitted, Utilization will display N/A.
            </p>
          </div>
          
          <Separator />
          
          {/* Accounts Format */}
          <div>
            <h4 className="font-medium text-sm mb-2">Accounts CSV Format</h4>
            <div className="bg-background rounded p-2 font-mono text-xs overflow-x-auto">
              accountName,institution,currentBalance,notes,isPrimary
            </div>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>• <strong>accountName</strong>: Account name (required)</li>
              <li>• <strong>institution</strong>: Bank name (optional)</li>
              <li>• <strong>currentBalance</strong>: Balance (required, number)</li>
              <li>• <strong>notes</strong>: Notes (optional)</li>
              <li>• <strong>isPrimary</strong>: TRUE/FALSE (optional, default FALSE)</li>
            </ul>
          </div>
          
          <Separator />
          
          {/* Bills Format */}
          <div>
            <h4 className="font-medium text-sm mb-2">Bills CSV Format</h4>
            <div className="bg-background rounded p-2 font-mono text-xs overflow-x-auto whitespace-nowrap">
              label,amount,payFromAccount,category,dueType,dueDay,dueDate,frequency,status,autopay,notes
            </div>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>• <strong>label</strong>: Bill name (required)</li>
              <li>• <strong>amount</strong>: Amount (required)</li>
              <li>• <strong>payFromAccount</strong>: Account name to match (optional)</li>
              <li>• <strong>category</strong>: Rent, Utilities, Subscriptions, Insurance, Credit Card, Loan, Other</li>
              <li>• <strong>dueType</strong>: DAY_OF_MONTH or EXACT_DATE</li>
              <li>• <strong>dueDay</strong>: 1-31 for monthly bills</li>
              <li>• <strong>dueDate</strong>: YYYY-MM-DD or MM/DD/YYYY for one-time</li>
              <li>• <strong>frequency</strong>: MONTHLY or ONE_TIME</li>
              <li>• <strong>status</strong>: PLANNED, PAID, or SKIPPED</li>
              <li>• <strong>autopay</strong>: TRUE/FALSE (optional)</li>
              <li>• <strong>notes</strong>: Notes (optional)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Import Warning Modal */}
      <AlertDialog open={importWarningOpen} onOpenChange={setImportWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              Older Plan Detected
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  The plan you're importing appears to be older than your current plan.
                </p>
                {pendingImportPlan && (
                  <div className="bg-muted rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Imported plan:</span>
                      <span className="font-medium">
                        {formatLastUpdated(pendingImportPlan.lastUpdatedAt || pendingImportPlan.updatedAt)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Your current plan:</span>
                      <span className="font-medium">
                        {formatLastUpdated(plan.lastUpdatedAt || plan.updatedAt)}
                      </span>
                    </div>
                  </div>
                )}
                <p className="text-amber-600 font-medium">
                  Importing will replace your newer data with this older version.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel Import</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => pendingImportPlan && confirmImportPlan(pendingImportPlan)}
            >
              Import Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
