import { BudgetData, BankAccount, BillItem } from '@/types/budget';

const BUDGET_STORAGE_KEY = 'debt-reduction-budget';

export const saveBudgetData = (data: BudgetData): void => {
  try {
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save budget data:', error);
  }
};

export const loadBudgetData = (): BudgetData => {
  try {
    const data = localStorage.getItem(BUDGET_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        accounts: parsed.accounts || [],
        bills: parsed.bills || [],
        forecastWindow: parsed.forecastWindow || 'this_month',
      };
    }
  } catch (error) {
    console.error('Failed to load budget data:', error);
  }
  return { accounts: [], bills: [], forecastWindow: 'this_month' };
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// CSV Export/Import for Accounts
export const exportAccountsToCSV = (accounts: BankAccount[]): string => {
  const headers = ['name', 'institution', 'currentBalance', 'notes', 'isPrimary'];
  const rows = accounts.map(a => [
    `"${a.name}"`,
    a.institution ? `"${a.institution}"` : '',
    a.currentBalance.toString(),
    a.notes ? `"${a.notes}"` : '',
    a.isPrimary ? 'true' : 'false',
  ].join(','));
  
  return [headers.join(','), ...rows].join('\n');
};

export const parseAccountsFromCSV = (csv: string): Partial<BankAccount>[] => {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  
  const accounts: Partial<BankAccount>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    
    if (values.length >= 3) {
      accounts.push({
        name: values[0] || `Account ${i}`,
        institution: values[1] || null,
        currentBalance: parseFloat(values[2]) || 0,
        notes: values[3] || null,
        isPrimary: values[4]?.toLowerCase() === 'true',
      });
    }
  }
  
  return accounts;
};

// CSV Export/Import for Bills
export const exportBillsToCSV = (bills: BillItem[]): string => {
  const headers = ['label', 'amount', 'dueDay', 'dueDate', 'frequency', 'category', 'linkedDebtId', 'payFromAccountId', 'status', 'autopay', 'notes'];
  const rows = bills.map(b => [
    `"${b.label}"`,
    b.amount.toString(),
    b.dueDay?.toString() || '',
    b.dueDate || '',
    b.frequency,
    b.category,
    b.linkedDebtId || '',
    b.payFromAccountId,
    b.status,
    b.autopay ? 'true' : 'false',
    b.notes ? `"${b.notes}"` : '',
  ].join(','));
  
  return [headers.join(','), ...rows].join('\n');
};

export const parseBillsFromCSV = (csv: string): Partial<BillItem>[] => {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  
  const bills: Partial<BillItem>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    
    if (values.length >= 8) {
      bills.push({
        label: values[0] || `Bill ${i}`,
        amount: parseFloat(values[1]) || 0,
        dueDay: values[2] ? parseInt(values[2]) : null,
        dueDate: values[3] || null,
        frequency: (values[4] as 'MONTHLY' | 'ONE_TIME') || 'MONTHLY',
        category: (values[5] as import('@/types/budget').BillCategory) || 'Other',
        linkedDebtId: values[6] || null,
        payFromAccountId: values[7],
        status: (values[8] as 'PLANNED' | 'PAID' | 'SKIPPED') || 'PLANNED',
        autopay: values[9]?.toLowerCase() === 'true',
        notes: values[10] || null,
      });
    }
  }
  
  return bills;
};
