import { useRef, useState } from 'react';
import { Download, Upload, FileText, Table, CheckCircle2 } from 'lucide-react';
import { Plan, CalculationResult } from '@/types/debt';
import { exportDebtsToCSV, exportScheduleToCSV, parseDebtsFromCSV } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface ExportTabProps {
  plan: Plan;
  calculationResult: CalculationResult | null;
  onImportDebts: (debts: any[]) => void;
}

export const ExportTab = ({ plan, calculationResult, onImportDebts }: ExportTabProps) => {
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
      {/* Export Section */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="w-4 h-4 text-primary" />
            Export Data
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
            Download CSV Template
          </Button>
        </CardContent>
      </Card>

      {/* CSV Format Info */}
      <Card className="shadow-soft bg-secondary/30">
        <CardContent className="p-4">
          <h4 className="font-medium text-sm mb-2">CSV Format</h4>
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
