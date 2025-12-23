// Budget Types - Separate from debt payoff calculations

export type BillFrequency = 'MONTHLY' | 'ONE_TIME';

export type BillStatus = 'PLANNED' | 'PAID' | 'SKIPPED';

export type BillCategory = 
  | 'Rent'
  | 'Utilities'
  | 'Subscriptions'
  | 'Insurance'
  | 'Credit Card'
  | 'Loan'
  | 'Other';

export const BILL_CATEGORIES: BillCategory[] = [
  'Rent',
  'Utilities',
  'Subscriptions',
  'Insurance',
  'Credit Card',
  'Loan',
  'Other',
];

export type ForecastWindow = 'this_month' | 'next_30_days' | 'next_month';

export const FORECAST_WINDOW_LABELS: Record<ForecastWindow, string> = {
  this_month: 'This Month',
  next_30_days: 'Next 30 Days',
  next_month: 'Next Month',
};

export interface BankAccount {
  id: string;
  name: string;
  institution?: string | null;
  currentBalance: number;
  notes?: string | null;
  isPrimary?: boolean;
}

export interface BillItem {
  id: string;
  label: string;
  amount: number;
  dueDay?: number | null; // 1-31
  dueDate?: string | null; // ISO date for one-time
  frequency: BillFrequency;
  category: BillCategory;
  linkedDebtId?: string | null;
  payFromAccountId: string;
  status: BillStatus;
  autopay?: boolean;
  notes?: string | null;
}

export interface BudgetData {
  accounts: BankAccount[];
  bills: BillItem[];
  forecastWindow: ForecastWindow;
}

// Helper functions
export const round2 = (n: number): number => Math.round(n * 100) / 100;

export const calculateUpcomingForAccount = (
  accountId: string,
  bills: BillItem[],
  forecastWindow: ForecastWindow
): number => {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return bills
    .filter(bill => {
      if (bill.payFromAccountId !== accountId) return false;
      if (bill.status !== 'PLANNED') return false;

      // Check if bill is in forecast window
      if (bill.frequency === 'ONE_TIME' && bill.dueDate) {
        const dueDate = new Date(bill.dueDate);
        return isDateInWindow(dueDate, forecastWindow, now);
      }

      if (bill.frequency === 'MONTHLY' && bill.dueDay) {
        // For monthly bills, check if dueDay falls within window
        return isDayInWindow(bill.dueDay, forecastWindow, now);
      }

      return false;
    })
    .reduce((sum, bill) => sum + bill.amount, 0);
};

const isDateInWindow = (date: Date, window: ForecastWindow, now: Date): boolean => {
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  switch (window) {
    case 'this_month':
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    case 'next_30_days':
      const thirtyDaysFromNow = new Date(now);
      thirtyDaysFromNow.setDate(now.getDate() + 30);
      return date >= now && date <= thirtyDaysFromNow;
    case 'next_month':
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      return date.getMonth() === nextMonth && date.getFullYear() === nextMonthYear;
    default:
      return false;
  }
};

const isDayInWindow = (dueDay: number, window: ForecastWindow, now: Date): boolean => {
  const currentDay = now.getDate();

  switch (window) {
    case 'this_month':
      // Include all monthly bills for this month
      return true;
    case 'next_30_days':
      // Include if dueDay is within next 30 days
      // Simplified: include if dueDay >= currentDay or dueDay <= (currentDay + 30) % daysInMonth
      return true; // Simplify to include all monthly bills
    case 'next_month':
      // Include all monthly bills for next month
      return true;
    default:
      return false;
  }
};

export const calculateAvailableAfterUpcoming = (
  account: BankAccount,
  bills: BillItem[],
  forecastWindow: ForecastWindow
): number => {
  const upcoming = calculateUpcomingForAccount(account.id, bills, forecastWindow);
  return round2(account.currentBalance - upcoming);
};

export const getEffectiveDueDay = (dueDay: number, month: number, year: number): number => {
  // Handle invalid due days (e.g., Feb 31 -> Feb 28/29)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Math.min(dueDay, daysInMonth);
};
