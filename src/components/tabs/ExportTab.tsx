import { useRef, useState } from 'react';
import { Download, Upload, FileText, Table, Wallet } from 'lucide-react';
import { Plan, CalculationResult } from '@/types/debt';
import { 
  BankAccount, 
  BillItem, 
  ForecastWindow, 
  FORECAST_WINDOW_LABELS,
  calculateUpcomingForAccount,
  calculateAvailableAfterUpcoming,
} from '@/types/budget';
import { exportDebtsToCSV, exportScheduleToCSV, parseDebtsFromCSV } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

interface ExportTabProps {
  plan: Plan;
  calculationResult: CalculationResult | null;
  onImportDebts: (debts: any[]) => void;
  accounts: BankAccount[];
  bills: BillItem[];
  forecastWindow: ForecastWindow;
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
  accounts,
  bills,
  forecastWindow,
}: ExportTabProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

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
          description: `${debts.length} debt(s) imported.`,
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
    const template = 'name,balance,apr,minPayment,customRank\n"Credit Card",5000,0.195,150,1\n"Auto Loan",15000,0.059,350,2';
    downloadFile(template, 'debt-import-template.csv', 'text/csv');
    toast({
      title: 'Template downloaded',
      description: 'Fill in the template and import it.',
    });
  };

  return (
    <div className="space-y-4 animate-fade-in">
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

      {/* Import Section */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            Import Debts
          </CardTitle>
          <CardDescription>
            Import debts from a CSV file.
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
          
          <Separator className="my-2" />
          
          <p className="text-xs text-muted-foreground">Budget Templates</p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs text-muted-foreground"
              onClick={downloadAccountsTemplate}
            >
              Accounts Template
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs text-muted-foreground"
              onClick={downloadBillsTemplate}
            >
              Bills Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CSV Format Info */}
      <Card className="shadow-soft bg-secondary/30">
        <CardContent className="p-4">
          <h4 className="font-medium text-sm mb-2">Debts CSV Format</h4>
          <p className="text-xs text-muted-foreground mb-2">
            Your CSV should have these columns:
          </p>
          <div className="bg-background rounded p-2 font-mono text-xs overflow-x-auto">
            name,balance,apr,minPayment,customRank
          </div>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>• <strong>name</strong>: Debt name (text)</li>
            <li>• <strong>balance</strong>: Current balance (number)</li>
            <li>• <strong>apr</strong>: Annual rate as decimal (e.g., 0.195 for 19.5%)</li>
            <li>• <strong>minPayment</strong>: Minimum payment (number)</li>
            <li>• <strong>customRank</strong>: Optional priority rank (integer)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
