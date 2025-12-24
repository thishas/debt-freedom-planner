import { Debt, Plan } from '@/types/debt';
import { BankAccount, BillItem, BudgetData } from '@/types/budget';
import { generateId, generatePlanIdentifier } from './storage';
import { generateId as generateBudgetId } from './budgetStorage';

// Storage key for tracking sample data
const SAMPLE_DATA_KEY = 'truebalance-has-sample-data';

/** Check if sample data is currently active */
export const hasSampleData = (): boolean => {
  try {
    return localStorage.getItem(SAMPLE_DATA_KEY) === 'true';
  } catch {
    return false;
  }
};

/** Mark sample data as active */
export const setSampleDataActive = (active: boolean): void => {
  try {
    if (active) {
      localStorage.setItem(SAMPLE_DATA_KEY, 'true');
    } else {
      localStorage.removeItem(SAMPLE_DATA_KEY);
    }
  } catch (e) {
    console.error('Failed to set sample data flag:', e);
  }
};

/** Generate sample debts with realistic values */
export const generateSampleDebts = (): Debt[] => {
  return [
    {
      id: generateId(),
      name: 'Chase Sapphire Card',
      balance: 3247.82,
      apr: 0.2249, // 22.49%
      minPayment: 95,
      active: true,
      creditLimit: 6000,
      type: 'Credit Card',
      feeAmount: null,
      feeFrequency: null,
    },
    {
      id: generateId(),
      name: 'Capital One Quicksilver',
      balance: 1423.55,
      apr: 0.1799, // 17.99%
      minPayment: 45,
      active: true,
      creditLimit: 4500,
      type: 'Credit Card',
      feeAmount: null,
      feeFrequency: null,
    },
    {
      id: generateId(),
      name: 'Toyota Auto Loan',
      balance: 9847.00,
      apr: 0.0599, // 5.99%
      minPayment: 275,
      active: true,
      creditLimit: null,
      type: 'Auto Loan',
      feeAmount: null,
      feeFrequency: null,
    },
    {
      id: generateId(),
      name: 'Federal Student Loan',
      balance: 14523.67,
      apr: 0.0455, // 4.55%
      minPayment: 180,
      active: true,
      creditLimit: null,
      type: 'Student Loan',
      feeAmount: null,
      feeFrequency: null,
    },
  ];
};

/** Generate a complete sample plan */
export const generateSamplePlan = (): Plan => {
  const now = new Date();
  const balanceDate = now.toISOString().split('T')[0];
  const timestamp = now.toISOString();

  return {
    id: generateId(),
    name: 'Sample Debt Plan',
    balanceDate,
    monthlyBudget: 850,
    strategy: 'SNOWBALL_LOWEST_BALANCE',
    debts: generateSampleDebts(),
    createdAt: timestamp,
    updatedAt: timestamp,
    lastUpdatedAt: timestamp,
    version: '1.0',
    planIdentifier: generatePlanIdentifier(),
  };
};

/** Generate sample bank accounts */
export const generateSampleAccounts = (): BankAccount[] => {
  return [
    {
      id: generateBudgetId(),
      name: 'Central Checking',
      institution: 'Chase Bank',
      currentBalance: 3247.50,
      notes: 'Primary checking account',
      isPrimary: true,
    },
    {
      id: generateBudgetId(),
      name: 'Secondary Savings',
      institution: 'Ally Bank',
      currentBalance: 1450.00,
      notes: 'Emergency fund starter',
      isPrimary: false,
    },
  ];
};

/** Generate sample bills - needs account IDs and optionally debt IDs */
export const generateSampleBills = (
  primaryAccountId: string,
  debtIds?: { chaseCard?: string; capitalOneCard?: string; autoLoan?: string; studentLoan?: string }
): BillItem[] => {
  return [
    {
      id: generateBudgetId(),
      label: 'Rent',
      amount: 1200,
      dueDay: 1,
      dueDate: null,
      frequency: 'MONTHLY',
      category: 'Rent',
      linkedDebtId: null,
      payFromAccountId: primaryAccountId,
      status: 'PLANNED',
      autopay: false,
      notes: 'Monthly rent payment',
    },
    {
      id: generateBudgetId(),
      label: 'Electric Bill',
      amount: 85,
      dueDay: 15,
      dueDate: null,
      frequency: 'MONTHLY',
      category: 'Utilities',
      linkedDebtId: null,
      payFromAccountId: primaryAccountId,
      status: 'PLANNED',
      autopay: true,
      notes: null,
    },
    {
      id: generateBudgetId(),
      label: 'Internet Service',
      amount: 65,
      dueDay: 20,
      dueDate: null,
      frequency: 'MONTHLY',
      category: 'Utilities',
      linkedDebtId: null,
      payFromAccountId: primaryAccountId,
      status: 'PLANNED',
      autopay: true,
      notes: 'Fiber internet',
    },
    {
      id: generateBudgetId(),
      label: 'Chase Card Payment',
      amount: 95,
      dueDay: 18,
      dueDate: null,
      frequency: 'MONTHLY',
      category: 'Credit Card',
      linkedDebtId: debtIds?.chaseCard || null,
      payFromAccountId: primaryAccountId,
      status: 'PLANNED',
      autopay: true,
      notes: 'Minimum payment',
    },
    {
      id: generateBudgetId(),
      label: 'Capital One Payment',
      amount: 45,
      dueDay: 22,
      dueDate: null,
      frequency: 'MONTHLY',
      category: 'Credit Card',
      linkedDebtId: debtIds?.capitalOneCard || null,
      payFromAccountId: primaryAccountId,
      status: 'PLANNED',
      autopay: true,
      notes: 'Minimum payment',
    },
    {
      id: generateBudgetId(),
      label: 'Auto Loan Payment',
      amount: 275,
      dueDay: 5,
      dueDate: null,
      frequency: 'MONTHLY',
      category: 'Loan',
      linkedDebtId: debtIds?.autoLoan || null,
      payFromAccountId: primaryAccountId,
      status: 'PLANNED',
      autopay: true,
      notes: null,
    },
    {
      id: generateBudgetId(),
      label: 'Netflix',
      amount: 15.99,
      dueDay: 12,
      dueDate: null,
      frequency: 'MONTHLY',
      category: 'Subscriptions',
      linkedDebtId: null,
      payFromAccountId: primaryAccountId,
      status: 'PLANNED',
      autopay: true,
      notes: null,
    },
  ];
};

/** Generate complete sample budget data */
export const generateSampleBudgetData = (debtIds?: {
  chaseCard?: string;
  capitalOneCard?: string;
  autoLoan?: string;
  studentLoan?: string;
}): BudgetData => {
  const accounts = generateSampleAccounts();
  const primaryAccount = accounts.find(a => a.isPrimary) || accounts[0];
  const bills = generateSampleBills(primaryAccount.id, debtIds);

  return {
    accounts,
    bills,
    forecastWindow: 'this_month',
  };
};

/** Calculate total sample debt balance */
export const getSampleDebtTotal = (): number => {
  return 3247.82 + 1423.55 + 9847.00 + 14523.67; // ~$29,042
};

/** Calculate sample minimum payments total */
export const getSampleMinPayments = (): number => {
  return 95 + 45 + 275 + 180; // $595
};
