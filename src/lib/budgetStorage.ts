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

// Helper to parse CSV values properly (handles quoted strings with commas)
const parseCSVLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim().replace(/^"|"$/g, ''));
  return values;
};

// Helper to parse number safely (strips $, commas, whitespace)
const parseNumber = (value: string): number => {
  if (!value) return 0;
  const cleaned = value.replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

export interface ImportResult<T> {
  imported: T[];
  skipped: number;
}

export const parseAccountsFromCSV = (csv: string, existingAccounts: BankAccount[] = []): ImportResult<Partial<BankAccount>> => {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return { imported: [], skipped: 0 };
  
  const accounts: Partial<BankAccount>[] = [];
  let skipped = 0;
  
  // Get existing account names for deduplication
  const existingNames = new Set(existingAccounts.map(a => a.name.toLowerCase().trim()));
  
  // Parse header to find column indices
  const headerLine = lines[0].toLowerCase();
  const headers = parseCSVLine(headerLine);
  const nameIdx = headers.findIndex(h => h === 'accountname' || h === 'name');
  const instIdx = headers.findIndex(h => h === 'institution');
  const balIdx = headers.findIndex(h => h === 'currentbalance' || h === 'balance');
  const notesIdx = headers.findIndex(h => h === 'notes');
  const primaryIdx = headers.findIndex(h => h === 'isprimary' || h === 'primary');
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      const values = parseCSVLine(line);
      
      // Required: accountName and currentBalance
      const accountName = values[nameIdx >= 0 ? nameIdx : 0]?.trim();
      const balanceStr = values[balIdx >= 0 ? balIdx : 2];
      const balance = parseNumber(balanceStr);
      
      if (!accountName || balance === 0 && !balanceStr) {
        skipped++;
        continue;
      }
      
      // Handle duplicate names
      let finalName = accountName;
      let counter = 2;
      while (existingNames.has(finalName.toLowerCase())) {
        finalName = `${accountName} (${counter})`;
        counter++;
      }
      existingNames.add(finalName.toLowerCase());
      
      accounts.push({
        name: finalName,
        institution: instIdx >= 0 ? (values[instIdx] || null) : (values[1] || null),
        currentBalance: balance,
        notes: notesIdx >= 0 ? (values[notesIdx] || null) : (values[3] || null),
        isPrimary: primaryIdx >= 0 
          ? values[primaryIdx]?.toLowerCase() === 'true'
          : values[4]?.toLowerCase() === 'true',
      });
    } catch (error) {
      skipped++;
    }
  }
  
  return { imported: accounts, skipped };
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

export const parseBillsFromCSV = (
  csv: string, 
  existingAccounts: BankAccount[] = []
): ImportResult<Partial<BillItem> & { payFromAccountName?: string }> => {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return { imported: [], skipped: 0 };
  
  const bills: (Partial<BillItem> & { payFromAccountName?: string })[] = [];
  let skipped = 0;
  
  // Parse header to find column indices
  const headerLine = lines[0].toLowerCase();
  const headers = parseCSVLine(headerLine);
  const labelIdx = headers.findIndex(h => h === 'label' || h === 'name');
  const amountIdx = headers.findIndex(h => h === 'amount');
  const payFromIdx = headers.findIndex(h => h === 'payfromaccount' || h === 'account');
  const categoryIdx = headers.findIndex(h => h === 'category');
  const dueTypeIdx = headers.findIndex(h => h === 'duetype');
  const dueDayIdx = headers.findIndex(h => h === 'dueday');
  const dueDateIdx = headers.findIndex(h => h === 'duedate');
  const frequencyIdx = headers.findIndex(h => h === 'frequency');
  const statusIdx = headers.findIndex(h => h === 'status');
  const autopayIdx = headers.findIndex(h => h === 'autopay');
  const notesIdx = headers.findIndex(h => h === 'notes');
  
  // Helper to parse date (accepts YYYY-MM-DD and MM/DD/YYYY)
  const parseDate = (value: string): string | null => {
    if (!value) return null;
    // Try YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    // Try MM/DD/YYYY
    const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
      const [, month, day, year] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return null;
  };
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      const values = parseCSVLine(line);
      
      // Required: label and amount
      const label = values[labelIdx >= 0 ? labelIdx : 0]?.trim();
      const amountStr = values[amountIdx >= 0 ? amountIdx : 1];
      const amount = parseNumber(amountStr);
      
      if (!label) {
        skipped++;
        continue;
      }
      
      // Get payFromAccount name and try to match
      const payFromAccountName = values[payFromIdx >= 0 ? payFromIdx : 2]?.trim() || '';
      const matchedAccount = existingAccounts.find(
        a => a.name.toLowerCase().trim() === payFromAccountName.toLowerCase().trim()
      );
      
      // Parse due type and day/date
      const dueType = values[dueTypeIdx >= 0 ? dueTypeIdx : 4]?.toUpperCase() || 'DAY_OF_MONTH';
      const dueDayStr = values[dueDayIdx >= 0 ? dueDayIdx : 5];
      const dueDateStr = values[dueDateIdx >= 0 ? dueDateIdx : 6];
      
      let dueDay: number | null = null;
      let dueDate: string | null = null;
      
      if (dueType === 'DAY_OF_MONTH' && dueDayStr) {
        dueDay = parseInt(dueDayStr);
        if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) dueDay = null;
      } else if (dueDateStr) {
        dueDate = parseDate(dueDateStr);
      }
      
      // Parse frequency
      const frequencyStr = values[frequencyIdx >= 0 ? frequencyIdx : 7]?.toUpperCase() || 'MONTHLY';
      const frequency: 'MONTHLY' | 'ONE_TIME' = frequencyStr === 'ONE_TIME' ? 'ONE_TIME' : 'MONTHLY';
      
      // Parse status
      const statusStr = values[statusIdx >= 0 ? statusIdx : 8]?.toUpperCase() || 'PLANNED';
      let status: 'PLANNED' | 'PAID' | 'SKIPPED' = 'PLANNED';
      if (statusStr === 'PAID') status = 'PAID';
      else if (statusStr === 'SKIPPED') status = 'SKIPPED';
      
      // Parse category
      const categoryStr = values[categoryIdx >= 0 ? categoryIdx : 3] || 'Other';
      const validCategories = ['Rent', 'Utilities', 'Subscriptions', 'Insurance', 'Credit Card', 'Loan', 'Other'];
      const category = validCategories.includes(categoryStr) ? categoryStr as import('@/types/budget').BillCategory : 'Other';
      
      // Parse autopay
      const autopayStr = values[autopayIdx >= 0 ? autopayIdx : 9]?.toLowerCase();
      const autopay = autopayStr === 'true' || autopayStr === 'yes' || autopayStr === '1';
      
      // Parse notes
      const notes = values[notesIdx >= 0 ? notesIdx : 10] || null;
      
      bills.push({
        label,
        amount,
        dueDay,
        dueDate,
        frequency,
        category,
        linkedDebtId: null,
        payFromAccountId: matchedAccount?.id || '',
        payFromAccountName: !matchedAccount && payFromAccountName ? payFromAccountName : undefined,
        status,
        autopay,
        notes,
      });
    } catch (error) {
      skipped++;
    }
  }
  
  return { imported: bills, skipped };
};
